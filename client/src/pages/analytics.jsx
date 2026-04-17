import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchPatients } from "../api/patients";

function Analytics() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchPatients()
      .then(setPatients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      <div
        className={`border-b border-white/10 px-10 py-6 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-white/60 mt-2">
          Select a patient to view their complete list of scans and model analytics.
        </p>
      </div>

      <div className="pt-10 px-6 md:px-10">
        {loading ? (
          <p className="text-white/60">Loading patients…</p>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl max-w-2xl">
            {error}
          </div>
        ) : patients.length === 0 ? (
          <div
            className={`bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-white/70">
              No patients found. Upload an image from{" "}
              <Link to="/upload" className="text-sky-400 hover:underline">
                AI Tool
              </Link>
              {" "}and enter a patient username.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((p, i) => (
              <Link
                key={p._id}
                to={`/analytics/patient/${encodeURIComponent(p.username)}`}
                className={`group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">
                      Patient
                    </p>
                    <h2 className="text-lg font-semibold mt-1 group-hover:text-sky-300 transition">
                      {p.username}
                    </h2>
                  </div>
                  <span className="text-white/40 group-hover:text-white transition">→</span>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-white/60">Total Scans</span>
                  <span className="text-white font-semibold">{p.scanCount}</span>
                </div>
                <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all"
                    style={{ width: `${Math.min(100, p.scanCount * 10)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
