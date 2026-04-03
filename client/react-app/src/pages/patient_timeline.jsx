import { useState, useEffect } from "react";

function PatientTimeline() {
  const [patients, setPatients] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("timelineData")) || {};
    setPatients(stored);

    const ids = Object.keys(stored);
    if (ids.length === 1) setSelectedPatient(ids[0]);
  }, []);

  const patientIds = Object.keys(patients);

  return (
    <section className="timeline-page container">
      <h1>Patient Timeline</h1>

      {patientIds.length > 1 && (
        <div className="patient-selector">
          <label>Select Patient:</label>
          <select
            onChange={(e) => setSelectedPatient(e.target.value)}
            value={selectedPatient || ""}
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

      {selectedPatient && patients[selectedPatient]?.length > 0 ? (
        <div className="timeline">
          {patients[selectedPatient].map((item, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-content">
                <span className="timeline-date">{item.date}</span>
                <h3>{item.event}</h3>
                <p>{item.filename} — {item.result}</p>
              </div>
            </div>
          ))}
        </div>
      ) : selectedPatient ? (
        <p className="muted">No timeline events for this patient yet.</p>
      ) : (
        <p className="muted">Select a patient to view timeline.</p>
      )}
    </section>
  );
}

export default PatientTimeline;