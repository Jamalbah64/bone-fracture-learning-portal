import { useState } from "react";
import { classifyImage } from "../api/classification";

function XrayUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const onPickFile = (e) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setError("");
    setResult(null);

    if (picked) {
      setPreview(URL.createObjectURL(picked));
    } else {
      setPreview(null);
    }
  };

  const onRun = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await classifyImage(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="upload-page">
      <div className="upload-container">
        <div className="upload-left">
          <h1>AI Fracture Detection</h1>
          <p>
            Upload a medical X-ray image. Our AI model will analyze and detect
            possible bone fractures.
          </p>

          <div className="upload-card">
            <input type="file" accept="image/*" onChange={onPickFile} />

            <button
              className="btn btn-primary"
              type="button"
              onClick={onRun}
              disabled={!file || isLoading}
            >
              {isLoading ? "Analyzing..." : "Run Analysis"}
            </button>

            {error && <div className="error-box">{error}</div>}
          </div>
        </div>

        <div className="upload-right">
          {preview && (
            <div className="preview-card">
              <h3>X-ray Preview</h3>
              <img src={preview} alt="preview" />
            </div>
          )}

          {isLoading && (
            <div className="result-card loading">
              <div className="spinner"></div>
              <p>Running AI model...</p>
            </div>
          )}

          {result && (
            <div className="result-card">
              <h3>Analysis Result</h3>

              <div className="result-row">
                <span>Prediction:</span>
                <strong>
                  {result.label ?? "Unknown"}
                </strong>
              </div>

              <div className="result-row">
                <span>Confidence:</span>
                <strong>
                  {result.confidence
                    ? `${(result.confidence * 100).toFixed(1)}%`
                    : "N/A"}
                </strong>
              </div>

              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: result.confidence
                      ? `${result.confidence * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default XrayUpload;