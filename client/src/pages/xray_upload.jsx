import { useEffect, useState } from "react";
import { classifyUploadedImage } from "../api/classification";
import ModelResultsGrid from "../components/ModelResultsGrid";
import { splitApiResultIntoModels } from "../utils/scanModels";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"];

function getExtension(name = "") {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function XrayUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [patientId, setPatientId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const validateFile = (file) => {
    if (!file) {
      return "No file was dropped.";
    }

    const ext = getExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Invalid image. Please upload JPG, JPEG, PNG, TIFF, DCM, or DICOM files.";
    }

    return "";
  };

  const handleAcceptedFile = (file) => {
    const validationMessage = validateFile(file);

    if (validationMessage) {
      setSelectedFile(null);
      setError(validationMessage);
      setMessage("");
      return;
    }

    setSelectedFile(file);
    setError("");
    setMessage(`Selected: ${file.name}`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setModels(null);
    handleAcceptedFile(file);
  };

  const handleRun = async () => {
    if (!selectedFile) {
      setError("Please drag and drop a medical image.");
      return;
    }

    const validationMessage = validateFile(selectedFile);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsLoading(true);
    setError("");
    setModels(null);
    setMessage("");

    try {
      const data = await classifyUploadedImage(selectedFile, patientId);
      const modelRuns = splitApiResultIntoModels(data);
      setModels(modelRuns);

      setMessage("Analysis complete. Results saved to the server for this patient.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setModels(null);
    setError("");
    setMessage("");
  };

  return (
    <section className="upload-page">
      <div className="upload-container">
        <div className="upload-left">
          <h1>AI Fracture Detection</h1>
          <p>
            Drag and drop a scan, confirm the preview, then run analysis. Enter a patient ID
            so results appear under Analytics for that patient.
          </p>

          <div className="upload-card">
            <input
              type="text"
              className="upload-patient-input"
              placeholder="Patient username (links scan to their account)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />

            <div
              className={`drop-zone ${dragActive ? "drop-zone-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
            >
              <p><strong>Drag and drop</strong> an X-ray, MRI, or CT scan here</p>
              <small>Accepted: JPG, JPEG, PNG, TIFF, DCM, DICOM</small>
            </div>

            {selectedFile && (
              <div className="selected-file-box">
                <p><strong>File:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearFile}
                >
                  Clear file
                </button>
              </div>
            )}

            <button
              className="btn btn-primary"
              type="button"
              onClick={handleRun}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? "Running models…" : "Run analysis"}
            </button>

            {error && <div className="error-box">{error}</div>}
            {message && <div className="upload-success-msg">{message}</div>}
          </div>
        </div>

        <div className="upload-right">
          {previewUrl && (
            <div className="preview-card">
              <h3>Image preview</h3>
              <p className="muted preview-hint">
                {isLoading ? "Processing…" : "Uploaded image shown below"}
              </p>
              <div className="upload-preview-frame">
                <img src={previewUrl} alt="Selected scan preview" className="upload-preview-img" />
              </div>
            </div>
          )}

          {models && models.length > 0 && (
            <div className="result-card result-card-models">
              <h3>Model outputs</h3>
              <p className="muted">Model analytics average between three models</p>
              <ModelResultsGrid models={models} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default XrayUpload;
