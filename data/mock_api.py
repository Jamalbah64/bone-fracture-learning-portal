# This is where the mock API will be until we have the actual API ready.
# This will allow us to ensure that our frontend can communicate with the backend.

import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import Counter
from pathlib import Path


app = FastAPI(title="mock_api")
df = pd.read_csv('./data/dataset.csv')

app.add_middleware( # Allows CORS to connect frontend and backend during development
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint to verify API is running
@app.get("/")
def root():
    return {"message": "FrACT API is running!"}

# Health check for API
@app.get("/health")
def health():
    return {"status": "ok"}

# Endpoint to list all classes and their counts in the dataset
@app.get("/classes")
def list_classes():
    codes = []
    for entry in df['ao_classification'].dropna():
        codes.extend([c.strip() for c in entry.split(';') if c.strip()])
    counts = Counter(codes)
    items = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    return {"classes": [{"code": c, "count": n} for c, n in items]}

# Count how many codes per image
@app.get("/multiplicity")
def multiplicity():
    mult = df['ao_classification'].fillna('').apply(
        lambda x: len([c for c in x.split(';') if c.strip()])
    ).value_counts().sort_index().to_dict()
    return {"multiplicity": mult}

# Look up metadata from the dataset for a given filestem
@app.get("/image/{filestem}")
def image_metadata(filestem: str):
    row = df[df["filestem"] == filestem] # Look up the row in the dataset that matches the filestem
    if row.empty: # If a row is not found, return a 404 error
        raise HTTPException(status_code=404, detail="Image wasn't found")
    record = row.iloc[0].replace([np.inf, -np.inf], np.nan)
    
    # Convert row to dict and replace NaN with None for JSON serialization
    clean_data = record.astype(object).where(pd.notna(record), None).to_dict()
    
    return clean_data

# Predict endpoint that returns the AO classification codes for a given image filestem
class PredictRequest(BaseModel):
    filestem: str

# Looks up the AO classification from the dataset based on filestem.
@app.post("/predict")
def predict(req: PredictRequest):
    row = df[df["filestem"] == req.filestem]
    if row.empty:
        raise HTTPException(status_code=404, detail="Image not found")
    labels = str(row.iloc[0]["ao_classification"])
    codes = [c.strip() for c in labels.split(';') if c.strip()] if labels and labels.lower() != "nan" else []
    return {
        "filestem": req.filestem,
        "predictions": [{"code": c, "confidence": 1.0} for c in codes],
        "num_labels": len(codes)
    }


# To run api: uvicorn scripts.mock_api:app --reload --port 8000
# URL should look like this: http://127.0.0.1:8000/
