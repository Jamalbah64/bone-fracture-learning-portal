import { useNavigate } from "react-router-dom";

const STAFF_ROLES = ["radiologist", "head_radiologist"];

function Dashboard({ user }) {
  const navigate = useNavigate();
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isHead = user?.role === "head_radiologist";

  return (
    <>
      <header className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="pill">AI Medical Imaging Platform</span>

            <h1>Bone Fracture Detection & Patient Tracking System</h1>

            <p>
              This platform uses AI to analyze X-ray images and assist in
              fracture detection, patient tracking, and medical data
              visualization.
            </p>

            {isStaff ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/upload")}
              >
                Start AI Analysis
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/timeline")}
              >
                View My Timeline
              </button>
            )}
          </div>

          <div className="hero-card">
            <h3>Welcome, {user?.username}</h3>
            <p className="muted" style={{ marginTop: 6 }}>
              Role: <strong>{user?.role?.replace("_", " ")}</strong>
            </p>

            <ul>
              {isStaff && <li>Upload &amp; classify X-ray images</li>}
              <li>View patient timelines &amp; analytics</li>
              <li>Share scans with colleagues or patients</li>
              {isHead && <li>Manage patient–radiologist assignments</li>}
              {user?.role === "patient" && (
                <li>View scans shared with you by your radiologist</li>
              )}
            </ul>

            <p className="muted" style={{ marginTop: 10 }}>
              All analysis is for educational and assistive purposes only.
            </p>
          </div>
        </div>
      </header>

      <section className="grid">
        {isStaff && (
          <div className="card" onClick={() => navigate("/upload")} style={{ cursor: "pointer" }}>
            <h3>AI Fracture Detection</h3>
            <p>
              Upload medical images and receive AI predictions with confidence
              scores and classification results.
            </p>
          </div>
        )}

        <div className="card" onClick={() => navigate("/timeline")} style={{ cursor: "pointer" }}>
          <h3>Patient Timeline</h3>
          <p>
            View historical scans organized by patient with chronological
            medical events.
          </p>
        </div>

        <div className="card" onClick={() => navigate("/analytics")} style={{ cursor: "pointer" }}>
          <h3>Analytics Dashboard</h3>
          <p>
            Visualize detection results and review model outputs from
            uploaded medical data.
          </p>
        </div>

        <div className="card" onClick={() => navigate("/shared")} style={{ cursor: "pointer" }}>
          <h3>Shared Scans</h3>
          <p>
            View scans shared with you and manage your outgoing shares.
          </p>
        </div>

        {(isHead || user?.role === "radiologist") && (
          <div className="card" onClick={() => navigate("/manage")} style={{ cursor: "pointer" }}>
            <h3>Patient Assignments</h3>
            <p>
              {isHead
                ? "Assign patients to radiologists and manage access permissions."
                : "View your assigned patients."}
            </p>
          </div>
        )}
      </section>

      {isStaff && (
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
      )}
    </>
  );
}

export default Dashboard;
