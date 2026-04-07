import { useState } from "react";
import { classifyImage } from "../api/classification";

function XrayUpload() {
  const [filestem, setFilestem] = useState("");
  const [patientId, setPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const onRun = async () => {
    if (!filestem.trim() || !patientId.trim()) {
      setError("Please provide a patient ID and an image filestem.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await classifyImage(filestem.trim());
      setResult(data);

      const topPrediction = data.predictions?.[0];
      const timelineData = JSON.parse(localStorage.getItem("timelineData")) || {};
      if (!timelineData[patientId]) timelineData[patientId] = [];

      timelineData[patientId].push({
        date: new Date().toISOString().split("T")[0],
        event: "X-ray Analyzed",
        filename: data.filestem,
        result: topPrediction?.code ?? "Unknown",
        confidence: topPrediction?.confidence ?? null,
      });

      localStorage.setItem("timelineData", JSON.stringify(timelineData));
      setMessage("Analysis complete! Event saved to timeline.");
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
            Enter an X-ray image filestem from the dataset to classify it.
            The AI model must run to save the result to the patient timeline.
          </p>

          <div className="upload-card">
            <input
              type="text"
              placeholder="Enter Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />

            <input
              type="text"
              placeholder="Enter image filestem (e.g. 0001_1297860395_01_WRI-L1_M014)"
              value={filestem}
              onChange={(e) => {
                setFilestem(e.target.value);
                setError("");
                setResult(null);
                setMessage("");
              }}
            />

            <button
              className="btn btn-primary"
              type="button"
              onClick={onRun}
              disabled={!filestem.trim() || isLoading}
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
                <span>Filestem:</span>
                <strong>{result.filestem}</strong>
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