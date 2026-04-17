import pandas as pd
import numpy as np
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import Counter


app = FastAPI(title="mock_api")
df = pd.read_csv("./data/dataset.csv")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Precompute dataset statistics

all_codes = []
label_counts_per_image = []

for entry in df["ao_classification"].fillna(""):
    codes = [c.strip() for c in str(entry).split(";") if c.strip()]
    all_codes.extend(codes)
    label_counts_per_image.append(len(codes))

class_counts = Counter(all_codes)
max_class_count = max(class_counts.values()) if class_counts else 1
avg_labels_per_image = np.mean(
    label_counts_per_image) if label_counts_per_image else 1.0


def get_family(code: str) -> str:
    """
    Returns a broader AO family like:
    31A1 -> 31A
    31B2 -> 31B
    """
    code = str(code).strip()
    if len(code) >= 3:
        return code[:3]
    return code


family_counts = Counter(get_family(code) for code in all_codes)
max_family_count = max(family_counts.values()) if family_counts else 1


def stable_noise(key: str, low: float = -0.015, high: float = 0.015) -> float:
    """
    Creates deterministic pseudo-random noise based on a string key.
    This keeps mock results stable for the same filestem/code pair.
    """
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16) / 0xFFFFFFFF
    return low + (high - low) * value


def mock_confidence(code: str, num_labels: int, filestem: str) -> float:
    """
    Produce more realistic mock confidence values.

    Factors:
    - Common classes get a slight boost
    - Multi-label cases reduce confidence
    - Dense families (many similar nearby labels) reduce confidence a bit
    - Small deterministic variation prevents every score from looking identical
    """
    code = str(code).strip()

    # Class frequency score: 0.0 -> 1.0
    class_freq_ratio = class_counts.get(code, 1) / max_class_count

    # Family frequency score: common family can imply ambiguity among similar labels
    family = get_family(code)
    family_freq_ratio = family_counts.get(family, 1) / max_family_count

    # Start from a realistic baseline
    confidence = 0.68

    # More common exact classes tend to get better confidence
    confidence += class_freq_ratio * 0.16

    # If the family is very crowded, reduce slightly
    confidence -= family_freq_ratio * 0.06

    # Penalize multi-label predictions
    confidence -= max(0, num_labels - 1) * 0.05

    # Slight extra penalty if image has more labels than average
    if num_labels > avg_labels_per_image:
        confidence -= 0.02

    # Deterministic tiny variation
    confidence += stable_noise(f"{filestem}|{code}")

    # Clamp to realistic range
    confidence = max(0.52, min(confidence, 0.92))
    return round(confidence, 2)


# Basic endpoints
@app.get("/")
def root():
    return {"message": "FrACT API is running!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/classes")
def list_classes():
    items = sorted(class_counts.items(), key=lambda kv: kv[1], reverse=True)
    return {"classes": [{"code": c, "count": n} for c, n in items]}


@app.get("/multiplicity")
def multiplicity():
    mult = (
        df["ao_classification"]
        .fillna("")
        .apply(lambda x: len([c for c in str(x).split(";") if c.strip()]))
        .value_counts()
        .sort_index()
        .to_dict()
    )
    return {"multiplicity": mult}

# Metadata lookup


@app.get("/image/{filestem}")
def image_metadata(filestem: str):
    """
    Returns metadata for a given image filestem.
    Also allows patient_id lookup if needed.
    """
    normalized_value = filestem.strip()

    row = df[df["filestem"].astype(str).str.strip() == normalized_value]

    if row.empty and "patient_id" in df.columns:
        row = df[df["patient_id"].astype(str).str.strip() == normalized_value]

    if row.empty:
        raise HTTPException(
            status_code=404, detail="Image or patient not found")

    record = row.iloc[0].replace([np.inf, -np.inf], np.nan)
    clean_data = record.astype(object).where(pd.notna(record), None).to_dict()

    return clean_data

# Prediction endpoint


class PredictRequest(BaseModel):
    filestem: str


@app.post("/predict")
def predict(req: PredictRequest):
    normalized_filestem = req.filestem.strip()

    row = df[df["filestem"].astype(str).str.strip() == normalized_filestem]
    if row.empty:
        raise HTTPException(status_code=404, detail="Image not found")

    record = row.iloc[0]

    labels = str(record["ao_classification"])
    codes = (
        [c.strip() for c in labels.split(";") if c.strip()]
        if labels and labels.lower() != "nan"
        else []
    )

    patient_id = None
    if "patient_id" in df.columns:
        patient_id = record["patient_id"]
        if pd.isna(patient_id):
            patient_id = None
        elif not isinstance(patient_id, str):
            patient_id = str(patient_id)

    predictions = [
        {
            "code": c,
            "confidence": mock_confidence(c, len(codes), normalized_filestem)
        }
        for c in codes
    ]

    return {
        "filestem": normalized_filestem,
        "patient_id": patient_id,
        "predictions": predictions,
        "num_labels": len(codes),
    }


# To run:
# uvicorn scripts.mock_api:app --reload --port 8000
