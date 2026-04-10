import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-grid">

          {/* MAIN INTRO */}
          <div className="hero-content">
            <span className="pill">AI Medical Imaging Platform</span>

            <h1>Bone Fracture Detection & Patient Tracking System</h1>

            <p>
              This platform uses AI to analyze X-ray images and assist in
              fracture detection, patient tracking, and medical data
              visualization.
            </p>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/upload")}
            >
              Start AI Analysis
            </button>
          </div>

          {/* INFO PANEL */}
          <div className="hero-card">
            <h3>System Overview</h3>

            <ul>
              <li>AI-powered X-ray classification</li>
              <li>Patient-based timeline tracking</li>
              <li>Medical image history storage</li>
              <li>Confidence-based predictions</li>
            </ul>

            <p className="muted" style={{ marginTop: 10 }}>
              All analysis is for educational and assistive purposes only.
            </p>
          </div>

        </div>
      </header>

      {/* FEATURE SECTION (INFO ONLY — NO EXTRA BUTTONS) */}
      <section className="grid">
        <div className="card">
          <h3>AI Fracture Detection</h3>
          <p>
            Upload medical images and receive AI predictions with confidence
            scores and classification results.
          </p>
        </div>

        <div className="card">
          <h3>Patient Timeline</h3>
          <p>
            View historical scans organized by patient ID with chronological
            medical events.
          </p>
        </div>

        <div className="card">
          <h3>Analytics Dashboard</h3>
          <p>
            Visualize trends, detection frequency, and system insights from
            uploaded medical data.
          </p>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (ONLY ONE UPLOAD BUTTON) */}
      <section className="ai-section">
        <div className="ai-header">
          <h2>Ready to Analyze a Scan?</h2>
          <p>
            Upload an X-ray or medical image to begin AI-assisted fracture detection.
          </p>
        </div>

        <div className="ai-card" style={{ textAlign: "center" }}>
          <h3>AI Upload Tool</h3>

          <p className="muted">
            Supports X-ray, MRI, CT scan images for analysis.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/upload")}
          >
            Go to Upload Tool
          </button>
        </div>
      </section>
    </>
  );
}

export default Dashboard;