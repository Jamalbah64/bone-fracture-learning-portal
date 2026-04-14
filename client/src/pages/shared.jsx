import { useEffect, useState } from "react";
import { fetchShares, deleteShare } from "../api/shares";
import { scanImageUrl } from "../api/scans";
import ModelResultsGrid from "../components/ModelResultsGrid";

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function Shared() {
  const [tab, setTab] = useState("received");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load(dir) {
    setLoading(true);
    setError("");
    fetchShares(dir)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function handleRevoke(id) {
    if (!window.confirm("Revoke this share?")) return;
    try {
      await deleteShare(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="shared-page">
      <div className="container">
        <h1>Shared Scans</h1>
        <p className="muted">View scans that have been shared with you or that you sent.</p>

        <div className="shared-tabs">
          <button
            type="button"
            className={`btn ${tab === "received" ? "btn-primary" : ""}`}
            onClick={() => setTab("received")}
          >
            Received
          </button>
          <button
            type="button"
            className={`btn ${tab === "sent" ? "btn-primary" : ""}`}
            onClick={() => setTab("sent")}
          >
            Sent
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : items.length === 0 ? (
          <div className="card analytics-empty">
            <p>
              {tab === "received"
                ? "No scans have been shared with you yet."
                : "You haven't shared any scans yet."}
            </p>
          </div>
        ) : (
          <ul className="shared-list">
            {items.map((item) => {
              const scan = item.resource;
              return (
                <li key={item._id} className="shared-item card">
                  <div className="shared-item-header">
                    <span className="muted">
                      {tab === "received"
                        ? `From ${item.sharedBy?.username || "unknown"}`
                        : `To ${item.sharedWith?.username || "unknown"}`}
                    </span>
                    <span className="muted">{formatWhen(item.createdAt)}</span>
                    {tab === "sent" && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleRevoke(item._id)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                  {item.message && (
                    <p className="shared-message">"{item.message}"</p>
                  )}
                  {scan ? (
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
                        <p className="muted" style={{ marginBottom: 8 }}>
                          Patient: {scan.patientUser?.username || scan.patientId}
                          {scan.uploadedBy && ` • Uploaded by ${scan.uploadedBy.username}`}
                        </p>
                        <ModelResultsGrid models={scan.models} />
                      </div>
                    </div>
                  ) : (
                    <p className="muted">Scan data unavailable.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default Shared;
