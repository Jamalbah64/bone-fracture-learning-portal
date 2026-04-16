import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ModelResultsGrid from "../components/ModelResultsGrid";
import { fetchScans, scanImageUrl } from "../api/scans";
import ShareButton from "../components/ShareButton";

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function PatientAnalyticsDetail() {
  const { patientId: rawId } = useParams();
  const patientId = rawId ? decodeURIComponent(rawId) : "";
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetchScans(patientId)
      .then((data) =>
        setScans(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pt-20 px-6 md:px-10">

      <div className="mb-10">
        <nav className="text-sm text-white/60 mb-3">
          <Link to="/analytics" className="hover:text-white">Analytics</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{patientId || "Patient"}</span>
        </nav>
        <h1 className="text-3xl font-bold">Patient {patientId || "—"}</h1>
        <p className="text-white/60 mt-2">Newest scans displayed first.</p>
      </div>

      {loading ? (
        <p className="text-white/60">Loading scans…</p>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl max-w-2xl">
          {error}
        </div>
      ) : scans.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl">
          <p className="text-white/70">
            No scans stored for this patient. Upload from the AI Tool with this
            patient username.
          </p>
          <Link
            to="/upload"
            className="inline-block mt-5 px-5 py-2 rounded-xl bg-sky-500 text-black font-semibold hover:bg-sky-400 transition"
          >
            Go to upload
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {scans.map((scan) => (
            <div
              key={scan._id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <time className="text-white/60 text-sm">
                  {formatWhen(scan.createdAt)}
                </time>
                <span className="text-white/80 text-sm truncate max-w-[400px]">
                  {scan.filename}
                </span>
                {scan.uploadedBy && (
                  <span className="text-white/50 text-sm">
                    by {scan.uploadedBy.username}
                  </span>
                )}
                <ShareButton scanId={scan._id} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img
                    src={scanImageUrl(scan._id)}
                    alt={`Scan ${scan.filename}`}
                    className="w-full max-h-[420px] object-contain"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
                <div>
                  <ModelResultsGrid models={scan.models} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientAnalyticsDetail;
