import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchScans, scanImageUrl } from "../api/scans";
import { fetchPatients } from "../api/patients";
import ShareButton from "../components/ShareButton";

function PatientTimeline() {
  const { patientId: routePatient } = useParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(
    routePatient ? decodeURIComponent(routePatient) : null
  );
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => {
    fetchPatients()
      .then((list) => {
        setPatients(list);
        if (!selectedPatient && list.length === 1) {
          setSelectedPatient(list[0].username);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setScans([]);
      return;
    }
    setScanLoading(true);
    fetchScans(selectedPatient)
      .then((data) =>
        setScans(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch(() => setScans([]))
      .finally(() => setScanLoading(false));
  }, [selectedPatient]);

  const topPrediction = (scan) => {
    const preds = scan.models?.[0]?.predictions;
    if (!preds || preds.length === 0) return null;
    return preds.reduce((best, p) => (p.confidence > best.confidence ? p : best), preds[0]);
  };

  return (
    <section className="timeline-page container">
      <h1>Patient Timeline</h1>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          {patients.length > 1 && (
            <div className="patient-selector">
              <label>Select Patient:</label>
              <select
                value={selectedPatient || ""}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="" disabled>
                  Choose a patient
                </option>
                {patients.map((p) => (
                  <option key={p._id} value={p.username}>
                    {p.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scanLoading ? (
            <p className="muted">Loading scans…</p>
          ) : selectedPatient && scans.length > 0 ? (
            <div className="timeline-horizontal">
              {scans.map((scan) => {
                const top = topPrediction(scan);
                return (
                  <div key={scan._id} className="timeline-card">
                    <div className="timeline-image-wrapper">
                      <img
                        src={scanImageUrl(scan._id)}
                        alt="X-ray"
                        className="timeline-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="timeline-info">
                      <div className="timeline-date">
                        {new Date(scan.createdAt).toLocaleDateString()} •{" "}
                        {new Date(scan.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <h3 className="timeline-title">
                        {top ? top.code : "No prediction"}
                      </h3>
                      {top && (
                        <p className="timeline-confidence">
                          Confidence: {(top.confidence * 100).toFixed(1)}%
                        </p>
                      )}
                      <ShareButton scanId={scan._id} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : selectedPatient ? (
            <p className="muted">No scans available for this patient.</p>
          ) : patients.length === 0 ? (
            <p className="muted">No patients available.</p>
          ) : (
            <p className="muted">Select a patient to view timeline.</p>
          )}
        </>
      )}
    </section>
  );
}

export default PatientTimeline;
