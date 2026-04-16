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
  const [mounted, setMounted] = useState(false);

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
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
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
      setRadResults(users.filter((u) => u.role === "radiologist" || u.role === "head_radiologist"));
    } catch {
      setRadResults([]);
    }
  }

  async function handleAssign() {
    if (!selectedPatient) return;
    setError("");
    setSuccess("");
    try {
      await createAssignment(selectedPatient, selectedRad?._id || undefined);
      setSuccess(`Assigned "${selectedPatient}" to ${selectedRad?.username || "yourself"}`);
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
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      <div
        className={`border-b border-white/10 px-10 py-6 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold">Manage Patient Assignments</h1>
        <p className="text-white/60 mt-2">
          {isHead
            ? "Assign patients to radiologists. Radiologists can only view data for patients assigned to them."
            : "View your patient assignments."}
        </p>
      </div>

      <div className="px-6 lg:px-12 py-10">

        {(isHead || user?.role === "radiologist") && (
          <div
            className={`max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur mb-10 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Assign Patient</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Patient username</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="Search patient…"
                  value={patientQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                />
                {patientResults.length > 0 && (
                  <ul className="max-h-36 overflow-y-auto border border-white/10 rounded-xl bg-black/30">
                    {patientResults.map((u) => (
                      <li
                        key={u._id}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-sky-500/10 border-b border-white/5 last:border-0"
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
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Radiologist (leave blank for yourself)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Search radiologist…"
                    value={radQuery}
                    onChange={(e) => handleRadSearch(e.target.value)}
                  />
                  {radResults.length > 0 && (
                    <ul className="max-h-36 overflow-y-auto border border-white/10 rounded-xl bg-black/30">
                      {radResults.map((u) => (
                        <li
                          key={u._id}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-sky-500/10 border-b border-white/5 last:border-0"
                          onClick={() => {
                            setSelectedRad(u);
                            setRadQuery(u.username);
                            setRadResults([]);
                          }}
                        >
                          {u.username}{" "}
                          <span className="text-white/40 text-xs capitalize">{u.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedPatient}
              className="px-6 py-2 rounded-xl bg-sky-500 text-black font-semibold hover:bg-sky-400 transition disabled:opacity-50"
            >
              Assign
            </button>

            {success && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">Current Assignments</h2>

        {loading ? (
          <p className="text-white/60">Loading…</p>
        ) : assignments.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl">
            <p className="text-white/70">No assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {assignments.map((a) => (
              <div
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-4"
              >
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>Patient:</strong> {a.patientUser?.username || "—"}
                  </span>
                  <span>
                    <strong>Radiologist:</strong> {a.radiologist?.username || "—"}
                    {a.radiologist?.staffId && (
                      <span className="text-white/40"> (#{a.radiologist.staffId})</span>
                    )}
                  </span>
                  <span className="text-white/50">
                    Assigned by {a.assignedBy?.username || "—"}
                  </span>
                </div>
                {isHead && (
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition"
                    onClick={() => handleRemove(a._id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ManagePatients;
