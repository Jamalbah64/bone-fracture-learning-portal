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

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      <div
        className={`border-b border-white/10 px-10 py-6 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/60 mt-2">
          Manage local browser data and view access control information.
        </p>
      </div>

      <div className="px-6 lg:px-12 py-10 space-y-8">

        {/* LOCAL DATA CLEARING */}
        <div
          className={`max-w-3xl rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-6 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-xl font-semibold">Local Browser Data</h2>

          <p className="text-white/60 mt-3 text-sm leading-relaxed">
            Old Analytics and Timeline data may still be stored in your browser's{" "}
            <code className="text-white">localStorage</code> from before the server
            migration. Use these buttons to clear it. This cannot be undone.
          </p>

          {notice && (
            <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
              {notice}
            </div>
          )}

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
                Removes all local scan results and model outputs
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
                Removes all local patient timeline records
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
              <div className="font-medium">Clear All Local Data</div>
              <div className="text-sm text-red-200/70">
                Permanently deletes all local Analytics and Timeline data
              </div>
            </button>
          </div>
        </div>

        {/* ACCESS CONTROL INFO */}
        <div
          className={`max-w-3xl rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-6 transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-xl font-semibold">Data Storage & Access Control</h2>

          <p className="text-white/60 mt-3 text-sm leading-relaxed">
            New scan data is stored on the server and protected by role-based
            access control — you can only see data you are authorized to view.
          </p>

          <div className="mt-6 space-y-3">
            <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5">
              <div className="font-medium">Patients</div>
              <div className="text-sm text-white/60">
                Can only view their own scans and data shared with them.
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5">
              <div className="font-medium">Radiologists</div>
              <div className="text-sm text-white/60">
                Can view scans they uploaded or for patients assigned to them.
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5">
              <div className="font-medium">Head Radiologists</div>
              <div className="text-sm text-white/60">
                Can view all patient data and manage assignments.
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Settings;
