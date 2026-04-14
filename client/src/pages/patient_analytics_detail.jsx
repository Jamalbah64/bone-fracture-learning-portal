import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ModelResultsGrid from "../components/ModelResultsGrid";
import { fetchScans, scanImageUrl } from "../api/scans";
import ShareButton from "../components/ShareButton";

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function PatientAnalyticsDetail() {
  const { patientId: rawId } = useParams();
  const patientId = rawId ? decodeURIComponent(rawId) : "";
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetchScans(patientId)
      .then((data) => setScans(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <section className="patient-analytics-page">
      <div className="container">
        <nav className="patient-analytics-breadcrumb">
          <Link to="/analytics">Analytics</Link>
          <span aria-hidden> / </span>
          <span>{patientId || "Patient"}</span>
        </nav>

        <h1>Patient {patientId || "—"}</h1>
        <p className="muted">Newest scans displayed first.</p>

        {loading ? (
          <p className="muted">Loading scans…</p>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : scans.length === 0 ? (
          <div className="card analytics-empty">
            <p>No scans stored for this patient. Upload from the AI Tool with this patient username.</p>
            <Link
              to="/upload"
              className="btn btn-primary"
              style={{ marginTop: 12, display: "inline-block" }}
            >
              Go to upload
            </Link>
          </div>
        ) : (
          <ol className="patient-scan-timeline">
            {scans.map((scan) => (
              <li key={scan._id} className="patient-scan-row card">
                <div className="patient-scan-meta">
                  <time dateTime={scan.createdAt}>{formatWhen(scan.createdAt)}</time>
                  <span className="muted patient-scan-filename">{scan.filename}</span>
                  {scan.uploadedBy && (
                    <span className="muted">by {scan.uploadedBy.username}</span>
                  )}
                  <ShareButton scanId={scan._id} />
                </div>
                <div className="patient-scan-body">
                  <div className="patient-scan-image-col">
                    <img
                      src={scanImageUrl(scan._id)}
                      alt={`Scan ${scan.filename}`}
                      className="patient-scan-image"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="patient-scan-models-col">
                    <ModelResultsGrid models={scan.models} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export default PatientAnalyticsDetail;
