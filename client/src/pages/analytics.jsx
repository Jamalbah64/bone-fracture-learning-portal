import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { listPatientIds, loadAnalyticsStore } from "../utils/analyticsStore";

function Analytics() {
  const [patientIds, setPatientIds] = useState([]);

  useEffect(() => {
    function refresh() {
      setPatientIds(listPatientIds());
    }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("analytics-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("analytics-updated", refresh);
    };
  }, []);

  const store = loadAnalyticsStore();

  return (
    <section className="analytics-page">
      <div className="container">
        <h1>Analytics</h1>
        <p className="muted analytics-intro">
          Select patient to view complete list of scans and model analytics.
        </p>

        {patientIds.length === 0 ? (
          <div className="card analytics-empty">
            <p>No saved scans yet. Upload an image from <Link to="/upload">AI Tool</Link>, enter a patient ID, and run analysis.</p>
          </div>
        ) : (
          <ul className="analytics-patient-list">
            {patientIds.map((id) => {
              const count = store.patients[id]?.length ?? 0;
              return (
                <li key={id}>
                  <Link to={`/analytics/patient/${encodeURIComponent(id)}`} className="analytics-patient-link card">
                    <span className="analytics-patient-id">{id}</span>
                    <span className="muted">{count} scan{count === 1 ? "" : "s"}</span>
                    <span className="analytics-chevron" aria-hidden>→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Analytics;
