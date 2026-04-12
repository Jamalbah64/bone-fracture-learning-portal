import { useState, useEffect } from "react";
import { TIMELINE_STORAGE_KEY } from "../utils/analyticsStore";

function PatientTimeline() {
  const [patients, setPatients] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    function load() {
      try {
        const stored = JSON.parse(localStorage.getItem(TIMELINE_STORAGE_KEY)) || {};
        setPatients(stored);
        const ids = Object.keys(stored);
        setSelectedPatient((prev) => {
          if (ids.length === 0) return null;
          if (ids.length === 1) return ids[0];
          if (prev && ids.includes(prev)) return prev;
          return null;
        });
      } catch {
        setPatients({});
        setSelectedPatient(null);
      }
    }

    load();
    window.addEventListener("storage", load);
    window.addEventListener("timeline-updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("timeline-updated", load);
    };
  }, []);

  const patientIds = Object.keys(patients);

  return (
    <section className="timeline-page container">
      <h1>Patient Timeline</h1>

      {/* Patient Selector */}
      {patientIds.length > 1 && (
        <div className="patient-selector">
          <label>Select Patient:</label>
          <select
            value={selectedPatient || ""}
            onChange={(e) => setSelectedPatient(e.target.value)}
          >
            <option value="" disabled>
              Choose a patient
            </option>
            {patientIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Timeline */}
      {selectedPatient && patients[selectedPatient]?.length > 0 ? (
        <div className="timeline-horizontal">
          {patients[selectedPatient]
            .slice()
            .reverse()
            .map((item, index) => (
              <div key={index} className="timeline-card">
                
                {/* IMAGE */}
                {item.image && (
                  <div className="timeline-image-wrapper">
                    <img
                      src={item.image}
                      alt="X-ray"
                      className="timeline-image"
                    />
                  </div>
                )}

                {/* CONTENT */}
                <div className="timeline-info">
                  <div className="timeline-date">
                    {item.date} • {item.time}
                  </div>

                  <h3 className="timeline-title">{item.result}</h3>

                  {item.confidence !== null && (
                    <p className="timeline-confidence">
                      Confidence: {(item.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : selectedPatient ? (
        <p className="muted">No timeline data available.</p>
      ) : (
        <p className="muted">Select a patient to view timeline.</p>
      )}
    </section>
  );
}

export default PatientTimeline;