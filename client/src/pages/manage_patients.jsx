import { useEffect, useState } from "react";
import {
  fetchAssignments,
  createAssignment,
  deleteAssignment,
} from "../api/assignments";
import { searchUsers } from "../api/patients";

function ManagePatients({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [radQuery, setRadQuery] = useState("");
  const [radResults, setRadResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedRad, setSelectedRad] = useState(null);

  const isHead = user?.role === "head_radiologist";

  function loadAssignments() {
    setLoading(true);
    fetchAssignments()
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  async function handlePatientSearch(q) {
    setPatientQuery(q);
    if (q.length < 1) return setPatientResults([]);
    try {
      const users = await searchUsers(q);
      setPatientResults(users.filter((u) => u.role === "patient"));
    } catch {
      setPatientResults([]);
    }
  }

  async function handleRadSearch(q) {
    setRadQuery(q);
    if (q.length < 1) return setRadResults([]);
    try {
      const users = await searchUsers(q);
      setRadResults(
        users.filter(
          (u) => u.role === "radiologist" || u.role === "head_radiologist"
        )
      );
    } catch {
      setRadResults([]);
    }
  }

  async function handleAssign() {
    if (!selectedPatient) return;
    setError("");
    setSuccess("");
    try {
      await createAssignment(
        selectedPatient,
        selectedRad?._id || undefined
      );
      setSuccess(
        `Assigned "${selectedPatient}" to ${
          selectedRad?.username || "yourself"
        }`
      );
      setSelectedPatient("");
      setPatientQuery("");
      setSelectedRad(null);
      setRadQuery("");
      loadAssignments();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this patient assignment?")) return;
    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="manage-patients-page">
      <div className="container">
        <h1>Manage Patient Assignments</h1>
        <p className="muted">
          {isHead
            ? "Assign patients to radiologists. Radiologists can only view data for patients assigned to them."
            : "View your patient assignments."}
        </p>

        {(isHead || user?.role === "radiologist") && (
          <div className="card assign-form">
            <h2>Assign Patient</h2>

            <div className="assign-row">
              <div className="assign-field">
                <label className="modal-label">Patient username</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Search patient…"
                  value={patientQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                />
                {patientResults.length > 0 && (
                  <ul className="share-results">
                    {patientResults.map((u) => (
                      <li
                        key={u._id}
                        className="share-result-item clickable"
                        onClick={() => {
                          setSelectedPatient(u.username);
                          setPatientQuery(u.username);
                          setPatientResults([]);
                        }}
                      >
                        {u.username}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isHead && (
                <div className="assign-field">
                  <label className="modal-label">
                    Radiologist (leave blank for yourself)
                  </label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Search radiologist…"
                    value={radQuery}
                    onChange={(e) => handleRadSearch(e.target.value)}
                  />
                  {radResults.length > 0 && (
                    <ul className="share-results">
                      {radResults.map((u) => (
                        <li
                          key={u._id}
                          className="share-result-item clickable"
                          onClick={() => {
                            setSelectedRad(u);
                            setRadQuery(u.username);
                            setRadResults([]);
                          }}
                        >
                          {u.username}{" "}
                          <span className="muted share-role-badge">
                            {u.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAssign}
              disabled={!selectedPatient}
            >
              Assign
            </button>

            {success && <div className="modal-success">{success}</div>}
            {error && <div className="error-box" style={{ marginTop: 10 }}>{error}</div>}
          </div>
        )}

        <h2 style={{ marginTop: 28 }}>Current Assignments</h2>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : assignments.length === 0 ? (
          <div className="card analytics-empty">
            <p>No assignments yet.</p>
          </div>
        ) : (
          <ul className="assignment-list">
            {assignments.map((a) => (
              <li key={a._id} className="assignment-item card">
                <div className="assignment-info">
                  <span>
                    <strong>Patient:</strong>{" "}
                    {a.patientUser?.username || "—"}
                  </span>
                  <span>
                    <strong>Radiologist:</strong>{" "}
                    {a.radiologist?.username || "—"}
                    {a.radiologist?.staffId && (
                      <span className="muted"> (#{a.radiologist.staffId})</span>
                    )}
                  </span>
                  <span className="muted">
                    Assigned by {a.assignedBy?.username || "—"}
                  </span>
                </div>
                {isHead && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemove(a._id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ManagePatients;
