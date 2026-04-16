import { useEffect, useState } from "react";
import { fetchShares, deleteShare } from "../api/shares";
import { scanImageUrl } from "../api/scans";
import ModelResultsGrid from "../components/ModelResultsGrid";

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function Shared() {
  const [tab, setTab] = useState("received");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleRevoke(id) {
    if (!window.confirm("Revoke this share?")) return;
    try {
      await deleteShare(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  const tabClass = (active) =>
    `px-5 py-2 rounded-xl text-sm font-medium transition ${
      active
        ? "bg-sky-500/20 border border-sky-500/30 text-sky-300"
        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
    }`;

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      <div
        className={`border-b border-white/10 px-10 py-6 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold">Shared Scans</h1>
        <p className="text-white/60 mt-2">
          View scans that have been shared with you or that you sent.
        </p>
      </div>

      <div className="px-6 lg:px-12 py-10">

        <div className="flex gap-3 mb-8">
          <button type="button" className={tabClass(tab === "received")} onClick={() => setTab("received")}>
            Received
          </button>
          <button type="button" className={tabClass(tab === "sent")} onClick={() => setTab("sent")}>
            Sent
          </button>
        </div>

        {loading ? (
          <p className="text-white/60">Loading…</p>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl max-w-2xl">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl">
            <p className="text-white/70">
              {tab === "received"
                ? "No scans have been shared with you yet."
                : "You haven't shared any scans yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => {
              const scan = item.resource;
              return (
                <div key={item._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">

                  <div className="flex flex-wrap gap-3 items-center mb-3 text-sm">
                    <span className="text-white/60">
                      {tab === "received"
                        ? `From ${item.sharedBy?.username || "unknown"}`
                        : `To ${item.sharedWith?.username || "unknown"}`}
                    </span>
                    <span className="text-white/40">{formatWhen(item.createdAt)}</span>
                    {tab === "sent" && (
                      <button
                        type="button"
                        className="px-3 py-1 text-xs rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition"
                        onClick={() => handleRevoke(item._id)}
                      >
                        Revoke
                      </button>
                    )}
                  </div>

                  {item.message && (
                    <p className="text-white/50 italic text-sm mb-3">"{item.message}"</p>
                  )}

                  {scan ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                        <img
                          src={scanImageUrl(scan._id)}
                          alt={`Scan ${scan.filename}`}
                          className="w-full max-h-[360px] object-contain"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-3">
                          Patient: {scan.patientUser?.username || scan.patientId}
                          {scan.uploadedBy && ` · Uploaded by ${scan.uploadedBy.username}`}
                        </p>
                        <ModelResultsGrid models={scan.models} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/40">Scan data unavailable.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Shared;
