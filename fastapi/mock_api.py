import os
import shutil
from pathlib import Path
from collections import Counter
import hashlib

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

UPLOAD_DIR = Path("./temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"}
ALLOWED_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/pjpeg",
    "image/x-png",
    "application/dicom",
    "application/dicom+json",
    "application/x-dicom",
    "application/octet-stream",
}

df = pd.read_csv("./data/dataset.csv")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

all_codes = []
label_counts_per_image = []

for entry in df["ao_classification"].fillna(""):
    codes = [c.strip() for c in str(entry).split(";") if c.strip()]
    all_codes.extend(codes)
    label_counts_per_image.append(len(codes))

class_counts = Counter(all_codes)
max_class_count = max(class_counts.values()) if class_counts else 1
avg_labels_per_image = (
    np.mean(label_counts_per_image) if label_counts_per_image else 1.0
)


def get_family(code: str) -> str:
    code = str(code).strip()
    if len(code) >= 3:
        return code[:3]
    return code


family_counts = Counter(get_family(code) for code in all_codes)
max_family_count = max(family_counts.values()) if family_counts else 1


def stable_noise(key: str, low: float = -0.015, high: float = 0.015) -> float:
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16) / 0xFFFFFFFF
    return low + (high - low) * value


def mock_confidence(code: str, num_labels: int, filename_key: str) -> float:
    code = str(code).strip()

    class_freq_ratio = class_counts.get(code, 1) / max_class_count
    family = get_family(code)
    family_freq_ratio = family_counts.get(family, 1) / max_family_count

    confidence = 0.68
    confidence += class_freq_ratio * 0.16
    confidence -= family_freq_ratio * 0.06
    confidence -= max(0, num_labels - 1) * 0.05

    if num_labels > avg_labels_per_image:
        confidence -= 0.02

    confidence += stable_noise(f"{filename_key}|{code}")
    confidence = max(0.52, min(confidence, 0.92))
    return round(confidence, 2)


@app.get("/")
def root():
    return {"message": "FrACT API is running!"}


@app.get("/health")
def health():
    return {"status": "ok"}


# Legacy filestem prediction route intentionally removed for image-only workflow



@app.post("/predict-upload")
async def predict_upload(image: UploadFile = File(...)):
    filename = image.filename or "uploaded_image"
    filename = Path(filename).name
    suffix = Path(filename).suffix.lower()

    print("Received filename:", filename)
    print("Received content type:", image.content_type)

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image. Please upload only X-rays, MRIs, or CT scans.",
        )

    content_type = image.content_type or ""
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload JPG, PNG, TIFF, or DICOM images.",
        )

    save_path = UPLOAD_DIR / filename

    with save_path.open("wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        mock_predictions = [{"code": "23A", "confidence": 0.91}]

        return {
            "filename": filename,
            "predictions": mock_predictions,
            "num_labels": len(mock_predictions),
        }

    finally:
        if save_path.exists():
            os.remove(save_path)
