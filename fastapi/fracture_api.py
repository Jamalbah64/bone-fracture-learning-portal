# Import standard libraries
import os
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

# Force legacy behavior for trusted local weights.
os.environ.setdefault("TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD", "1")

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
    "model_a": DATA_DIR / "Model_A",
    "model_b": DATA_DIR / "Model_B",
    "model_u": DATA_DIR / "Model_U",
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
            loaded_any = False

            # Try direct weights in the model directory first
            weight_path = _find_weight_file(model_dir)
            if weight_path:
                _load_model(weight_path, model_name)
                loaded_any = True

            # Try subdirectories next
            if model_dir.exists():
                for sub_dir in sorted([p for p in model_dir.iterdir() if p.is_dir()]):
                    sub_weight_path = _find_weight_file(sub_dir)
                    if not sub_weight_path:
                        logger.info(
                            "No weight file found for %s in %s", model_name, sub_dir
                        )
                        continue

                    # Keep one name for the main model while adding suffixes for subdirectories
                    if not loaded_any:
                        _load_model(sub_weight_path, model_name)
                        loaded_any = True
                    else:
                        sub_model_name = f"{model_name}_{sub_dir.name.lower()}"
                        _load_model(sub_weight_path, sub_model_name)

            if not loaded_any:
                logger.info("No weight file found for %s in %s", model_name, model_dir)

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
        conf=0.01,
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

    results_projection1 = model.predict(
        source=image_path_1,
        conf=0.01,
        iou=0.45,
        imgsz=640,
        verbose=False,
        device="cpu",
    )

    results_projection2 = model.predict(
        source=image_path_2,
        conf=0.01,
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


# Function to run inference on two images together using model_a and model_b separately, then combine results using model_u for improved predictions.
def run_projection_pipeline(
    projection1_path: str,
    projection2_path: Optional[str] = None,
) -> Dict[str, Any]:
    if "model_a" not in LOADED_MODELS:
        raise ValueError("model_a is not loaded")
    if "model_b" not in LOADED_MODELS:
        raise ValueError("model_b is not loaded")
    if "model_u" not in LOADED_MODELS:
        raise ValueError("model_u is not loaded")

    used_single_image = projection2_path is None
    projection2_path = projection2_path or projection1_path

    model_a_predictions = run_inference(projection1_path, model_name="model_a")
    model_b_predictions = run_inference(projection2_path, model_name="model_b")
    model_u_predictions = run_dual_inference(
        projection1_path,
        projection2_path,
        model_name="model_u",
    )

    return {
        "model_a": model_a_predictions,
        "model_b": model_b_predictions,
        "model_u": model_u_predictions,
        "used_single_image": used_single_image,
    }


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
# Returns the filename, model used, and a note about whether one or two images were used for inference.
# If only one image is uploaded, it will be reused for both projections.
@app.post("/predict")
async def predict(
    projection1: UploadFile = File(...),
    projection2: Optional[UploadFile] = File(None),
):
    filename1 = validate_uploaded_image(projection1)

    if projection2 is not None and projection2.filename:
        filename2 = validate_uploaded_image(projection2)
    else:
        filename2 = None
        projection2 = None

    save_path1 = UPLOAD_DIR / f"projection1_{filename1}"
    save_path2 = UPLOAD_DIR / f"projection2_{filename2}" if filename2 else None

    try:
        with save_path1.open("wb") as buffer:
            shutil.copyfileobj(projection1.file, buffer)

        if projection2 is not None and save_path2 is not None:
            with save_path2.open("wb") as buffer:
                shutil.copyfileobj(projection2.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded.")

        results = run_projection_pipeline(
            str(save_path1),
            str(save_path2) if save_path2 else None,
        )

        return {
            "projection1_filename": filename1,
            "projection2_filename": filename2 or filename1,
            "input_mode": "single_image" if filename2 is None else "two_images",
            "results": {
                "model_a": results["model_a"],
                "model_b": results["model_b"],
                "model_u": results["model_u"],
            },
            "note": (
                "One image uploaded. The same image was reused for projection2."
                if filename2 is None
                else "Two images uploaded."
            ),
        }

    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        try:
            if save_path1.exists():
                save_path1.unlink()
        except Exception:
            pass

        try:
            if save_path2 and save_path2.exists():
                save_path2.unlink()
        except Exception:
            pass


# Endpoint to handle image uploads, model inference
# Return predictions along with the filename, model used, and a URL to the annotated image with bounding boxes drawn
@app.post("/predict-with-visualization")
async def predict_with_visualization(
    projection1: UploadFile = File(...),
    projection2: Optional[UploadFile] = File(None),
):
    filename1 = validate_uploaded_image(projection1)

    if projection2 is not None and projection2.filename:
        filename2 = validate_uploaded_image(projection2)
    else:
        filename2 = None
        projection2 = None

    save_path1 = UPLOAD_DIR / f"projection1_{filename1}"
    save_path2 = UPLOAD_DIR / f"projection2_{filename2}" if filename2 else None

    try:
        with save_path1.open("wb") as buffer:
            shutil.copyfileobj(projection1.file, buffer)

        if projection2 is not None and save_path2 is not None:
            with save_path2.open("wb") as buffer:
                shutil.copyfileobj(projection2.file, buffer)

        if not LOADED_MODELS:
            raise HTTPException(status_code=503, detail="No models loaded.")

        results = run_projection_pipeline(
            str(save_path1),
            str(save_path2) if save_path2 else None,
        )

        projection2_source = str(save_path2) if save_path2 else str(save_path1)

        annotated_images = {}

        model_a_results = LOADED_MODELS["model_a"].predict(
            source=str(save_path1),
            conf=0.01,
            iou=0.45,
            imgsz=640,
            verbose=False,
            device="cpu",
        )
        model_a_output_name = f"annotated_model_a_{filename1}"
        model_a_output_path = UPLOAD_DIR / model_a_output_name
        cv2.imwrite(str(model_a_output_path), model_a_results[0].plot())
        annotated_images["model_a"] = f"/temp_uploads/{model_a_output_name}"

        model_b_results = LOADED_MODELS["model_b"].predict(
            source=projection2_source,
            conf=0.01,
            iou=0.45,
            imgsz=640,
            verbose=False,
            device="cpu",
        )
        model_b_output_name = f"annotated_model_b_{filename2 or filename1}"
        model_b_output_path = UPLOAD_DIR / model_b_output_name
        cv2.imwrite(str(model_b_output_path), model_b_results[0].plot())
        annotated_images["model_b"] = f"/temp_uploads/{model_b_output_name}"

        return {
            "projection1_filename": filename1,
            "projection2_filename": filename2 or filename1,
            "input_mode": "single_image" if filename2 is None else "two_images",
            "results": {
                "model_a": results["model_a"],
                "model_b": results["model_b"],
                "model_u": results["model_u"],
            },
            "annotated_images": annotated_images,
            "note": (
                "One image uploaded. The same image was reused for projection2."
                if filename2 is None
                else "Two images uploaded."
            ),
        }

    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Visualization failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        try:
            if save_path1.exists():
                save_path1.unlink()
        except Exception:
            pass

        try:
            if save_path2 and save_path2.exists():
                save_path2.unlink()
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

        results = run_projection_pipeline(str(save_path))

        return {
            "filename": filename,
            "projection1_filename": filename,
            "projection2_filename": filename,
            "results": results,
            "note": "Single image reused for both projections.",
        }

    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
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
