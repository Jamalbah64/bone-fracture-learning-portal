import os
import shutil
import tempfile
from pathlib import Path
from typing import List

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

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

# MODEL CONFIGURATION

# UPDATE THESE PATHS TO YOUR ACTUAL MODEL WEIGHTS
MODEL_PATHS = {
    "model_u": "/content/drive/MyDrive/FracDetectYolo/FCE-YOLOv8/runs/model_u_augmented/weights/best.pt",
    "model_a": "/content/drive/MyDrive/FracDetectYolo/FCE-YOLOv8/runs/model_a_aug/weights/best.pt",
    "model_b": "/content/drive/MyDrive/FracDetectYolo/FCE-YOLOv8/runs/model_b_aug/weights/best.pt",
}

# Fracture class mappings (from your notebook)
FRACTURE_CLASSES = {
    0: "23r-M/2.1",
    1: "23r-M/3.1",
    2: "23-M/3.1",
    3: "23-M/2.1",
    4: "23r-E/2.1",
    5: "22r-D/2.1",
    6: "23r-E/1",
    7: "22-D/2.1",
}

# LOAD MODELS AT STARTUP

LOADED_MODELS = {}


def load_models():
    """Load YOLO models at startup."""
    for model_name, model_path in MODEL_PATHS.items():
        try:
            if os.path.exists(model_path):
                print(f"Loading {model_name} from {model_path}...")
                LOADED_MODELS[model_name] = YOLO(model_path)
                print(f"{model_name} loaded successfully")
            else:
                print(f" {model_name} not found at {model_path}")
        except Exception as e:
            print(f"✗ Failed to load {model_name}: {e}")


# Load models on startup
load_models()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve temporary uploaded/annotated images
from fastapi.staticfiles import StaticFiles

app.mount("/temp_uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="temp_uploads")

# HELPER FUNCTIONS


def read_image(file_path: str) -> np.ndarray:
    """Read image from file path."""
    image = cv2.imread(file_path)
    if image is None:
        raise ValueError(f"Could not read image: {file_path}")
    return image


def extract_predictions_from_yolo(
    results, model_name: str, confidence_threshold: float = 0.25
) -> List[dict]:
    """
    Extract predictions from YOLO results.
    """
    predictions = []

    if not results or len(results) == 0:
        return predictions

    result = results[0]  # First (only) image

    if result.boxes is None or len(result.boxes) == 0:
        return predictions  # No detections

    # Extract detections
    for i in range(len(result.boxes)):
        conf = float(result.boxes.conf[i])

        # Skip the low confidence detections
        if conf < confidence_threshold:
            continue

        class_id = int(result.boxes.cls[i])
        ao_code = FRACTURE_CLASSES.get(class_id, f"UNKNOWN_{class_id}")

        # Get bounding box (normalized coordinates: x1, y1, x2, y2)
        bbox_xyxy = result.boxes.xyxyn[i]  # normalized [0-1]
        x1, y1, x2, y2 = bbox_xyxy

        # Convert to center-based format
        bbox_center = [
            float((x1 + x2) / 2),
            float((y1 + y2) / 2),
            float(x2 - x1),
            float(y2 - y1),
        ]

        predictions.append(
            {
                "code": ao_code,
                "confidence": round(float(conf), 4),
                "bbox": bbox_center,
                "model": model_name,
            }
        )

    return predictions


def run_inference(image_path: str, model_name: str = "model_u") -> List[dict]:

    if model_name not in LOADED_MODELS:
        raise ValueError(f"Model '{model_name}' not loaded")

    model = LOADED_MODELS[model_name]

    # Run inference with confidence threshold
    results = model.predict(
        source=image_path,
        conf=0.25,  # Confidence threshold
        iou=0.45,  # IOU threshold for NMS
        imgsz=640,  # Image size
        verbose=False,
    )

    # Extract predictions
    predictions = extract_predictions_from_yolo(results, model_name)

    return predictions


# API ENDPOINTS


@app.get("/")
def root():
    return {
        "message": "FrACT API is running!",
        "models_loaded": list(LOADED_MODELS.keys()),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": list(LOADED_MODELS.keys()),
        "num_models": len(LOADED_MODELS),
    }


@app.post("/predict-upload")
async def predict_upload(image: UploadFile = File(...), model: str | None = None):
    """
    Predict fracture classification from an uploaded medical image.
    """
    filename = image.filename or "uploaded_image"
    filename = Path(filename).name
    suffix = Path(filename).suffix.lower()

    print(f"[PREDICT] Received: {filename}")

    # Validate file type
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

    # Save uploaded file temporarily
    save_path = UPLOAD_DIR / filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        print(f"[PREDICT] Saved to: {save_path}")

        # Check if models are loaded
        if not LOADED_MODELS:
            raise HTTPException(
                status_code=503,
                detail="No models loaded. Check server logs.",
            )

        # Run inference with the requested model if provided, otherwise use the unified model
        model_name = model or "model_u"
        predictions = run_inference(str(save_path), model_name=model_name)

        print(f"[PREDICT] Found {len(predictions)} predictions")

        return {
            "filename": filename,
            "predictions": predictions,
            "num_labels": len(predictions),
            "model": model_name,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[ERROR] Inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
    finally:
        if save_path.exists():
            os.remove(save_path)


@app.post("/predict-with-visualization")
async def predict_with_visualization(
    image: UploadFile = File(...), model: str | None = None
):
    """
    Predict and return image with detection boxes drawn.
    """
    filename = image.filename or "uploaded_image"
    filename = Path(filename).name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type")

    save_path = UPLOAD_DIR / filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded")

        # Run inference with the requested model if provided
        model_name = model or "model_u"
        if model_name not in LOADED_MODELS:
            raise HTTPException(
                status_code=400, detail=f"Model '{model_name}' not available"
            )

        model = LOADED_MODELS[model_name]
        results = model.predict(str(save_path), conf=0.25, iou=0.45)

        # Draw boxes on image
        annotated_image = results[0].plot()

        # Save annotated image
        output_name = f"annotated_{filename}"
        output_path = UPLOAD_DIR / output_name
        cv2.imwrite(str(output_path), annotated_image)

        # Extract predictions
        predictions = extract_predictions_from_yolo(results, "model_u")

        return {
            "filename": filename,
            "predictions": predictions,
            "num_labels": len(predictions),
            "annotated_image_url": f"/temp_uploads/{output_name}",
            "model": model_name,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if save_path.exists():
            os.remove(save_path)


@app.post("/predict-models")
async def predict_multiple_models(image: UploadFile = File(...)):
    """
    Run inference on all available models for comparison.
    Useful for clinical validation.
    """
    filename = image.filename or "uploaded_image"
    filename = Path(filename).name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type")

    save_path = UPLOAD_DIR / filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded")

        # Run on all models
        all_predictions = {}
        for model_name in LOADED_MODELS.keys():
            try:
                preds = run_inference(str(save_path), model_name=model_name)
                all_predictions[model_name] = preds
            except Exception as e:
                print(f"[ERROR] {model_name} failed: {e}")
                all_predictions[model_name] = []

        return {
            "filename": filename,
            "models": all_predictions,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if save_path.exists():
            os.remove(save_path)
