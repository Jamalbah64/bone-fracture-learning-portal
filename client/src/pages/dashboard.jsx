import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      {/* HERO */}
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="pill">AI + Medical Learning</span>
            <h1>Bone Fracture Classification and Viewing</h1>
          
          </div>

          <div className="hero-card">
            <h3>What you can do</h3>
            <ul>
              <li>Upload X-rays for AI detection</li>
              <li>View Analytics</li>
              <li>Track Patient Timeline</li>
            </ul>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/upload")}
            >
              Upload an X-ray
            </button>
          </div>
        </div>
      </header>

      {/* AI TOOL PREVIEW SECTION */}
      <section className="ai-section">
        <div className="ai-header">
          <h2>AI Fracture Detection</h2>
          <p>
            Upload an X-ray to receive an AI-assisted prediction. This tool is
            for learning and should not replace medical diagnosis.
          </p>
        </div>

        <div className="ai-grid">
          {/* Upload Card */}
          <div className="ai-card">
            <h3>Upload X-ray</h3>
            <p className="muted">
              Supported: JPG, PNG. (DICOM later if you want.)
            </p>

            <div className="upload-box">
              <div className="upload-icon">⬆️</div>
              <div className="upload-text">
                <div className="upload-title">Drag &amp; drop your image</div>
                <div className="upload-sub">or click to choose a file</div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/upload")}
              >
                Go to Upload Page
              </button>
            </div>

            <div className="ai-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/upload")}
              >
                Run Detection
              </button>
              <button className="btn btn-ghost">Clear</button>
            </div>

            <div className="disclaimer">
              <strong>Note:</strong> Educational tool only — always consult a
              healthcare professional.
            </div>
          </div>

          {/* Results Card */}
          <div className="ai-card">
            <h3>Results</h3>
            <p className="muted">
              After you run detection, results will show here.
            </p>

            <div className="result-box">
              <div className="result-row">
                <span className="label">Prediction</span>
                <span className="value">—</span>
              </div>
              <div className="result-row">
                <span className="label">Confidence</span>
                <span className="value">—</span>
              </div>
              <div className="result-row">
                <span className="label">Region Highlight</span>
                <span className="value">—</span>
              </div>
            </div>

            <div className="hint">
              Later we can connect this to your backend AI model (Python /
              Flask/FastAPI or Node + Python service).
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
