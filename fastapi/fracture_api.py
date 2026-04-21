# Import standard libraries
import sys
import shutil
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

# Import third-party libraries
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import cv2
import torch
import dill
import cpuinfo

# Set up paths and load YOLO model
BASE_DIR = Path(__file__).resolve().parent
FCE_REPO_DIR = (BASE_DIR / "FCE-YOLOv8").resolve()
FCE_ULTRALYTICS_DIR = (FCE_REPO_DIR / "ultralytics").resolve()

# Add FCE-YOLOv8 to sys.path if it exists
if not FCE_ULTRALYTICS_DIR.exists():
    raise RuntimeError(f"Custom ultralytics repo not found at {FCE_ULTRALYTICS_DIR}")

sys.path = [str(FCE_REPO_DIR)] + [
    p for p in sys.path if Path(p).resolve() != FCE_REPO_DIR
]

# Add ultralytics from FCE-YOLOv8 to sys.pat
from ultralytics import YOLO
import ultralytics
from ultralytics.nn.tasks import DetectionModel

torch.serialization.add_safe_globals(
    [
        DetectionModel,
        dill._dill._load_type,
        torch.nn.Sequential,
    ]
)

# Log setup for debugging and monitoring
logger = logging.getLogger("fracture_api")
logging.basicConfig(level=logging.INFO)
logger.info("Ultralytics loaded from: %s", ultralytics.__file__)

# Initialize FastAPI app and set up upload directory
app = FastAPI()

# Create a temporary directory for uploads and serve it as static files
UPLOAD_DIR = Path("./temp_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/temp_uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="temp_uploads")

# Extensions and content types allowed for upload
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"}

# Common medical imaging content types
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

# Define paths for model weights and mapping of class IDs to AO codes
DATA_DIR = BASE_DIR / "data"

MODEL_DIRS = {
    "model_u": DATA_DIR / "Model_U",
    "model_a": DATA_DIR / "Model_A",
    "model_b": DATA_DIR / "Model_B",
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

# Dictionary to hold loaded models in memory
LOADED_MODELS: Dict[str, Any] = {}


# Function to find weight files in a given model directory
def _find_weight_file(model_dir: Path) -> Optional[str]:
    if not model_dir.exists():
        return None

    for candidate in ("best.pt", "last.pt"):
        weight_path = model_dir / candidate
        if weight_path.exists():
            return str(weight_path.resolve())

    return None


# Function to load a YOLO model from a given weight path and store it in the LOADED_MODELS dictionary
def _load_model(weight_path: str, model_name: str) -> None:
    model = YOLO(weight_path)
    print(model_name, model.names)
    LOADED_MODELS[model_name] = model
    logger.info(
        "%s loaded from %s", model_name, weight_path
    )  # Log successful model loading


# Function to load all models from specific directories and handle any exceptions that occur during loading
def load_models() -> None:
    for model_name, model_dir in MODEL_DIRS.items():
        try:
            # Check if the model directory exists and contains subdirectories
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

# Set up CORS middleware to allow cross-origin requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Function to extract predictions from YOLO results
# and format them into a list of dictionaries containing
# AO code, confidence, bounding box, and model name
def extract_predictions_from_yolo(
    results: Any, model_name: str, confidence_threshold: float = 0.05
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
            # Debug logging to trace class IDs and confidence scores
            class_id = int(boxes.cls[i])
            conf = float(boxes.conf[i])
            print("class_id:", class_id, "confidence:", conf)

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


# Function to run inference on an image using a specified model and return formatted predictions
def run_inference(image_path: str, model_name: str = "model_u") -> List[Dict[str, Any]]:
    if model_name not in LOADED_MODELS:
        raise ValueError(f"Model '{model_name}' not loaded")

    model = LOADED_MODELS[model_name]
    results = model.predict(
        source=image_path,
        conf=0.05,
        iou=0.45,
        imgsz=640,
        verbose=False,
        device="cpu",
    )
    return extract_predictions_from_yolo(results, model_name)


# Function to run inference on two images together using model_u and return formatted predictions
def run_dual_inference(
    image_path_1: str,
    image_path_2: str,
    model_name: str = "model_u",
) -> List[Dict[str, Any]]:
    if model_name not in LOADED_MODELS:
        raise ValueError(f"Model '{model_name}' not loaded")

    model = LOADED_MODELS[model_name]

    # Replace this placeholder logic with the actual paired-projection inference path
    # from the custom FCE-YOLOv8 model if model_u was trained to jointly consume both views.
    results_projection1 = model.predict(
        source=image_path_1,
        conf=0.05,
        iou=0.45,
        imgsz=640,
        verbose=False,
        device="cpu",
    )

    results_projection2 = model.predict(
        source=image_path_2,
        conf=0.05,
        iou=0.45,
        imgsz=640,
        verbose=False,
        device="cpu",
    )

    predictions_projection1 = extract_predictions_from_yolo(
        results_projection1, f"{model_name}_projection1"
    )
    predictions_projection2 = extract_predictions_from_yolo(
        results_projection2, f"{model_name}_projection2"
    )

    return predictions_projection1 + predictions_projection2


# Function to validate uploaded images by checking their file extensions and content types against allowed lists above
def validate_uploaded_image(upload: UploadFile) -> str:
    filename = Path(upload.filename or "uploaded_image").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image. Please upload only X-rays, MRIs, or CT scans.",
        )

    content_type = upload.content_type or ""
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload JPG, PNG, TIFF, or DICOM images.",
        )

    return filename


# Function to validate uploaded images and ensure they're correct for processing
def save_upload_file(upload: UploadFile, filename: str) -> Path:
    save_path = UPLOAD_DIR / filename
    with save_path.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return save_path


# Check to see if API is running and return a message along with the list of loaded models
@app.get("/")
def root() -> Dict[str, Any]:
    return {
        "message": "FrACT API is running!",
        "models_loaded": list(LOADED_MODELS.keys()),
    }


# Health check endpoint to veriy API status
@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "models_loaded": list(LOADED_MODELS.keys()),
        "num_models": len(LOADED_MODELS),
    }


# Endpoint to handle image uploads, model inference and return predictions
# May not be needed because of /predict-with-visualization but can be used for testing and debugging
@app.post("/predict-upload")
async def predict_upload(image: UploadFile = File(...), model: Optional[str] = None):
    filename = validate_uploaded_image(image)
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


# Endpoint to handle image uploads, model inference, and returning predictions along with the filename, model used, and a URL to the annotated image with bounding boxes drawn
@app.post("/predict-with-visualization")
async def predict_with_visualization(
    image: UploadFile = File(...), model: Optional[str] = None
):
    filename = validate_uploaded_image(image)
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

        model_instance = LOADED_MODELS[model_name]
        results = model_instance.predict(
            str(save_path),
            conf=0.05,
            iou=0.45,
            imgsz=640,
            verbose=False,
            device="cpu",
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


# Endpoint to handle image uploads, run inference on all loaded models.
# Also return predictions along with the filename,
# and a dictionary of model names to their respective predictions
@app.post("/predict-models")
async def predict_multiple_models(image: UploadFile = File(...)):
    filename = validate_uploaded_image(image)
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


# Endpoint to handle multiple image uploads and run inference on all loaded models for each image.
@app.post("/predict-all-projections")
async def predict_all_projections(
    projection1: UploadFile = File(...),
    projection2: UploadFile = File(...),
):
    filename1 = validate_uploaded_image(projection1)
    filename2 = validate_uploaded_image(projection2)

    save_path1 = UPLOAD_DIR / f"projection1_{filename1}"
    save_path2 = UPLOAD_DIR / f"projection2_{filename2}"

    try:
        with save_path1.open("wb") as buffer:
            shutil.copyfileobj(projection1.file, buffer)

        with save_path2.open("wb") as buffer:
            shutil.copyfileobj(projection2.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded.")

        if "model_a" not in LOADED_MODELS:
            raise HTTPException(status_code=503, detail="model_a is not loaded.")
        if "model_b" not in LOADED_MODELS:
            raise HTTPException(status_code=503, detail="model_b is not loaded.")
        if "model_u" not in LOADED_MODELS:
            raise HTTPException(status_code=503, detail="model_u is not loaded.")

        model_a_predictions = run_inference(str(save_path1), model_name="model_a")
        model_b_predictions = run_inference(str(save_path2), model_name="model_b")
        model_u_predictions = run_dual_inference(
            str(save_path1), str(save_path2), model_name="model_u"
        )

        return {
            "projection1_filename": filename1,
            "projection2_filename": filename2,
            "results": {
                "model_a": model_a_predictions,
                "model_b": model_b_predictions,
                "model_u": model_u_predictions,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Dual projection inference failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        try:
            if save_path1.exists():
                save_path1.unlink()
        except Exception:
            pass

        try:
            if save_path2.exists():
                save_path2.unlink()
        except Exception:
            pass
