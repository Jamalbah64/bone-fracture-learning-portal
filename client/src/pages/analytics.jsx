import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPatients } from "../api/patients";

function Analytics() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatients()
      .then(setPatients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="analytics-page">
      <div className="container">
        <h1>Analytics</h1>
        <p className="muted analytics-intro">
          Select a patient to view their complete list of scans and model analytics.
        </p>

        {loading ? (
          <p className="muted">Loading patients…</p>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : patients.length === 0 ? (
          <div className="card analytics-empty">
            <p>
              No patients found. Upload an image from{" "}
              <Link to="/upload">AI Tool</Link> and enter a patient username.
            </p>
          </div>
        ) : (
          <ul className="analytics-patient-list">
            {patients.map((p) => (
              <li key={p._id}>
                <Link
                  to={`/analytics/patient/${encodeURIComponent(p.username)}`}
                  className="analytics-patient-link card"
                >
                  <span className="analytics-patient-id">{p.username}</span>
                  <span className="muted">
                    {p.scanCount} scan{p.scanCount === 1 ? "" : "s"}
                  </span>
                  <span className="analytics-chevron" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Analytics;
