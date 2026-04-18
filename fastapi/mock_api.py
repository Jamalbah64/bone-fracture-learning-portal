import os
import shutil
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    import cv2
except ImportError:
    cv2 = None

YOLO = None

logger = logging.getLogger("mock_api")
logging.basicConfig(level=logging.INFO)

app = FastAPI()

UPLOAD_DIR = Path("./temp_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/temp_uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="temp_uploads")

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

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

MODEL_DIRS = {
    "model_u": DATA_DIR / "Model_U",
    "model_a": DATA_DIR / "Model_A",
    "model_b": DATA_DIR / "Model_B",
    "model_fce": DATA_DIR / "FCE_Model",
}

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

LOADED_MODELS: Dict[str, Any] = {}


def _find_weight_file(model_dir: Path) -> Optional[str]:
    if not model_dir.exists():
        return None

    for candidate in ("best.pt", "last.pt"):
        weight_path = model_dir / candidate
        if weight_path.exists():
            return str(weight_path.resolve())

    return None


def _load_model(weight_path: str, model_name: str) -> None:
    global YOLO

    if YOLO is None:
        from ultralytics import YOLO as UltralyticsYOLO

        YOLO = UltralyticsYOLO

    model = YOLO(weight_path)
    LOADED_MODELS[model_name] = model
    logger.info("%s loaded from %s", model_name, weight_path)


def load_models() -> None:
    for model_name, model_dir in MODEL_DIRS.items():
        try:
            if model_dir.exists() and any(p.is_dir() for p in model_dir.iterdir()):
                for sub_dir in sorted([p for p in model_dir.iterdir() if p.is_dir()]):
                    sub_model_name = f"{model_name}_{sub_dir.name.lower()}"
                    weight_path = _find_weight_file(sub_dir)

                    if not weight_path:
                        logger.info(
                            "No weight file found for %s in %s", sub_model_name, sub_dir
                        )
                        continue

                    _load_model(weight_path, sub_model_name)
                continue

            weight_path = _find_weight_file(model_dir)

            if not weight_path:
                logger.info("No weight file found for %s in %s", model_name, model_dir)
                continue

            _load_model(weight_path, model_name)

        except Exception as e:
            logger.warning("Failed to load %s: %s", model_name, e)


load_models()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_predictions_from_yolo(
    results: Any, model_name: str, confidence_threshold: float = 0.25
) -> List[Dict[str, Any]]:
    predictions: List[Dict[str, Any]] = []

    if not results:
        return predictions

    result = results[0]
    boxes = getattr(result, "boxes", None)

    if not boxes:
        return predictions

    for i in range(len(boxes)):
        try:
            conf = float(boxes.conf[i])

            if conf < confidence_threshold:
                continue

            class_id = int(boxes.cls[i])
            ao_code = FRACTURE_CLASSES.get(class_id, f"UNKNOWN_{class_id}")

            x1, y1, x2, y2 = boxes.xyxyn[i]

            bbox_center = [
                float((x1 + x2) / 2.0),
                float((y1 + y2) / 2.0),
                float(x2 - x1),
                float(y2 - y1),
            ]

            predictions.append(
                {
                    "code": ao_code,
                    "confidence": round(conf, 4),
                    "bbox": bbox_center,
                    "model": model_name,
                }
            )
        except Exception:
            continue

    return predictions


def run_inference(image_path: str, model_name: str = "model_u") -> List[Dict[str, Any]]:
    if model_name not in LOADED_MODELS:
        raise ValueError(f"Model '{model_name}' not loaded")

    model = LOADED_MODELS[model_name]

    try:
        results = model.predict(
            source=image_path,
            conf=0.25,
            iou=0.45,
            imgsz=640,
            verbose=False,
        )
        return extract_predictions_from_yolo(results, model_name)
    except Exception as e:
        raise RuntimeError(f"Inference failed for model '{model_name}'") from e


@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "message": "FrACT API is running!",
        "models_loaded": list(LOADED_MODELS.keys()),
    }


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "models_loaded": list(LOADED_MODELS.keys()),
        "num_models": len(LOADED_MODELS),
    }


@app.post("/predict-upload")
async def predict_upload(image: UploadFile = File(...), model: Optional[str] = None):
    filename = Path(image.filename or "uploaded_image").name
    suffix = Path(filename).suffix.lower()

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

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded.")

        model_name = model or "model_u"
        predictions = run_inference(str(save_path), model_name=model_name)

        return {
            "filename": filename,
            "predictions": predictions,
            "num_labels": len(predictions),
            "model": model_name,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Inference failed for %s: %s", filename, e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        try:
            if save_path.exists():
                save_path.unlink()
        except Exception:
            pass


@app.post("/predict-with-visualization")
async def predict_with_visualization(
    image: UploadFile = File(...), model: Optional[str] = None
):
    filename = Path(image.filename or "uploaded_image").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type")

    if cv2 is None:
        raise HTTPException(
            status_code=500, detail="OpenCV is required for visualization"
        )

    save_path = UPLOAD_DIR / filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded.")

        model_name = model or "model_u"

        if model_name not in LOADED_MODELS:
            raise HTTPException(
                status_code=400, detail=f"Model '{model_name}' not available"
            )

        model = LOADED_MODELS[model_name]
        results = model.predict(
            str(save_path), conf=0.25, iou=0.45, imgsz=640, verbose=False
        )
        annotated = results[0].plot()

        output_name = f"annotated_{filename}"
        output_path = UPLOAD_DIR / output_name
        cv2.imwrite(str(output_path), annotated)

        predictions = extract_predictions_from_yolo(results, model_name)

        return {
            "filename": filename,
            "predictions": predictions,
            "num_labels": len(predictions),
            "annotated_image_url": f"/temp_uploads/{output_name}",
            "model": model_name,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Visualization failed for %s: %s", filename, e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        try:
            if save_path.exists():
                save_path.unlink()
        except Exception:
            pass


@app.post("/predict-models")
async def predict_multiple_models(image: UploadFile = File(...)):
    filename = Path(image.filename or "uploaded_image").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type")

    save_path = UPLOAD_DIR / filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded.")

        all_predictions: Dict[str, List[Dict[str, Any]]] = {}

        for model_name in LOADED_MODELS:
            try:
                all_predictions[model_name] = run_inference(
                    str(save_path), model_name=model_name
                )
            except Exception as e:
                logger.warning("Model %s failed: %s", model_name, e)
                all_predictions[model_name] = []

        return {
            "filename": filename,
            "models": all_predictions,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Batch inference failed for %s: %s", filename, e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        try:
            if save_path.exists():
                save_path.unlink()
        except Exception:
            pass
