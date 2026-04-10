import { useState } from "react";
import { classifyUploadedImage } from "../api/classification";

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"];

function getExtension(name = "") {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

function looksMedicalName(name = "") {
  const lower = name.toLowerCase();
  return ["xray", "x-ray", "radiograph", "mri", "ct", "dicom", "scan"].some((term) =>
    lower.includes(term)
  );
}

function XrayUpload() {
  const [patientId, setPatientId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const validateFile = (file) => {
    if (!file) {
      return "No file was dropped.";
    }

    const ext = getExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Invalid image. Please upload only X-rays, MRIs, or CT scans.";
    }

    const mimeOk =
      !file.type ||
      [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/tiff",
        "application/dicom",
        "application/octet-stream",
      ].includes(file.type);

    const nameOk = looksMedicalName(file.name);

    if (!mimeOk && !nameOk) {
      return "This file does not appear to be a supported medical image.";
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
    setMessage(`Dropped file: ${file.name}`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setResult(null);
    handleAcceptedFile(file);
  };

  const handleRun = async () => {
    const trimmedPatientId = patientId.trim();

    if (!trimmedPatientId) {
      setError("Please provide a patient ID.");
      return;
    }

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
    setResult(null);
    setMessage("");

    try {
      const data = await classifyUploadedImage({
        file: selectedFile,
        patientId: trimmedPatientId,
      });

      setResult(data);

      const topPrediction = data.predictions?.[0];
      const timelineData = JSON.parse(localStorage.getItem("timelineData")) || {};

      if (!timelineData[trimmedPatientId]) {
        timelineData[trimmedPatientId] = [];
      }

      timelineData[trimmedPatientId].push({
        date: new Date().toISOString().split("T")[0],
        event: "Medical Image Analyzed",
        filename: data.filename || selectedFile.name,
        result: topPrediction?.code ?? "Unknown",
        confidence: topPrediction?.confidence ?? null,
      });

      localStorage.setItem("timelineData", JSON.stringify(timelineData));
      setMessage("Analysis complete. Classification results are ready to view.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError("");
    setMessage("");
  };

  return (
    <section className="upload-page">
      <div className="upload-container">
        <div className="upload-left">
          <h1>AI Fracture Detection</h1>
          <p>
            Drag and drop an X-ray, MRI, or CT scan for analysis.
          </p>

          <div className="upload-card">
            <input
              type="text"
              placeholder="Enter Patient ID"
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setError("");
                setMessage("");
              }}
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
                <p><strong>Dropped file:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearFile}
                >
                  Clear File
                </button>
              </div>
            )}

            <button
              className="btn btn-primary"
              type="button"
              onClick={handleRun}
              disabled={!patientId.trim() || !selectedFile || isLoading}
            >
              {isLoading ? "Analyzing..." : "Run Analysis"}
            </button>

            {error && <div className="error-box">{error}</div>}
            {message && <div style={{ color: "#38bdf8", marginTop: 10 }}>{message}</div>}
          </div>
        </div>

        <div className="upload-right">
          {result && (
            <div className="result-card">
              <h3>Analysis Result</h3>

              <div className="result-row">
                <span>Filename:</span>
                <strong>{result.filename || selectedFile?.name}</strong>
              </div>

              <div className="result-row">
                <span>Patient ID:</span>
                <strong>{result.patient_id ?? patientId}</strong>
              </div>

              <div className="result-row">
                <span>Classifications found:</span>
                <strong>{result.num_labels}</strong>
              </div>

              {result.predictions?.map((pred, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <div className="result-row">
                    <span>AO Code:</span>
                    <strong>{pred.code}</strong>
                  </div>
                  <div className="result-row">
                    <span>Confidence:</span>
                    <strong>{(pred.confidence * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${pred.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              {result.num_labels === 0 && (
                <p style={{ color: "#94a3b8", marginTop: 10 }}>
                  No fracture classifications found for this image.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default XrayUpload;
