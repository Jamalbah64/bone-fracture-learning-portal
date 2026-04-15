import { useState, useEffect } from "react";
import {
  clearAllPatientLocalData,
  clearAnalyticsData,
  clearTimelineData,
} from "../utils/analyticsStore";

function Settings() {
  const [notice, setNotice] = useState("");
  const [mounted, setMounted] = useState(false);

  function flash(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 4000);
  }

  function confirmClear(message, action) {
    if (!window.confirm(message)) return;
    action();
    flash("Local data was cleared.");
  }

  // 🔥 fade-in on route change
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* HEADER (consistent with all pages) */}
      <div
        className={`border-b border-white/10 px-10 py-6 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/60 mt-2">
          Advanced options for the AI fracture workflow will live here. For now
          you can manage data stored only in this browser.
        </p>
      </div>

      {/* CONTENT */}
      <div className="px-6 lg:px-12 py-10">

        <div
          className={`max-w-3xl rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-6 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >

          <h2 className="text-xl font-semibold">Local browser data</h2>

          <p className="text-white/60 mt-2 text-sm">
            Analytics and Timeline keep their data in{" "}
            <code className="text-white">localStorage</code> until you clear it.
            Nothing is removed automatically; clearing cannot be undone.
          </p>

          {/* NOTICE */}
          {notice && (
            <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
              {notice}
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-6 space-y-3">

            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
              onClick={() =>
                confirmClear(
                  "Remove all Analytics scans (images + model results) stored in this browser?",
                  clearAnalyticsData
                )
              }
            >
              <div className="font-medium">Clear Analytics data</div>
              <div className="text-sm text-white/60">
                Removes all scan results and model outputs
              </div>
            </button>

            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
              onClick={() =>
                confirmClear(
                  "Remove all Timeline entries stored in this browser?",
                  clearTimelineData
                )
              }
            >
              <div className="font-medium">Clear Timeline data</div>
              <div className="text-sm text-white/60">
                Removes all patient timeline records
              </div>
            </button>

            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition text-left border border-red-500/30"
              onClick={() =>
                confirmClear(
                  "Remove ALL Analytics and Timeline data stored in this browser? This cannot be undone.",
                  clearAllPatientLocalData
                )
              }
            >
              <div className="font-medium">Clear Analytics & Timeline</div>
              <div className="text-sm text-red-200/70">
                Permanently deletes all local data
              </div>
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;