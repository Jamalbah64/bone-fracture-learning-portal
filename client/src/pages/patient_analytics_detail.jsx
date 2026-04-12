import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ModelResultsGrid from "../components/ModelResultsGrid";
import { getScansForPatient } from "../utils/analyticsStore";

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
  const [storeTick, setStoreTick] = useState(0);

  useEffect(() => {
    function bump() {
      setStoreTick((t) => t + 1);
    }
    window.addEventListener("storage", bump);
    window.addEventListener("analytics-updated", bump);
    return () => {
      window.removeEventListener("storage", bump);
      window.removeEventListener("analytics-updated", bump);
    };
  }, []);

  const scans = useMemo(
    () => (patientId ? getScansForPatient(patientId) : []),
    [patientId, storeTick]
  );

  return (
    <section className="patient-analytics-page">
      <div className="container">
        <nav className="patient-analytics-breadcrumb">
          <Link to="/analytics">Analytics</Link>
          <span aria-hidden> / </span>
          <span>{patientId || "Patient"}</span>
        </nav>

        <h1>Patient {patientId || "—"}</h1>
        <p className="muted">
          Newest scans displayed first.
        </p>

        {scans.length === 0 ? (
          <div className="card analytics-empty">
            <p>No scans stored for this patient. Upload from the AI Tool with this patient ID.</p>
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: 12, display: "inline-block" }}>
              Go to upload
            </Link>
          </div>
        ) : (
          <ol className="patient-scan-timeline">
            {scans.map((scan) => (
              <li key={scan.id} className="patient-scan-row card">
                <div className="patient-scan-meta">
                  <time dateTime={scan.createdAt}>{formatWhen(scan.createdAt)}</time>
                  <span className="muted patient-scan-filename">{scan.filename}</span>
                </div>
                <div className="patient-scan-body">
                  <div className="patient-scan-image-col">
                    {scan.imageDataUrl ? (
                      <img
                        src={scan.imageDataUrl}
                        alt={`Scan ${scan.filename}`}
                        className="patient-scan-image"
                      />
                    ) : (
                      <div className="patient-scan-image-placeholder muted">No image stored</div>
                    )}
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
