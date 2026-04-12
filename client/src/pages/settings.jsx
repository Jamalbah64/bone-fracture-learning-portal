import { useState } from "react";
import {
  clearAllPatientLocalData,
  clearAnalyticsData,
  clearTimelineData,
} from "../utils/analyticsStore";

function Settings() {
  const [notice, setNotice] = useState("");

  function flash(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 4000);
  }

  function confirmClear(message, action) {
    if (!window.confirm(message)) return;
    action();
    flash("Local data was cleared.");
  }

  return (
    <section className="settings-page">
      <div className="container">
        <h1>Settings</h1>
        <p className="muted">
          Advanced options for the AI fracture workflow will live here. For now you can manage
          data stored only in this browser.
        </p>

        <div className="card settings-local-data">
          <h2>Local browser data</h2>
          <p className="muted settings-local-desc">
            Analytics and Timeline keep their data in <code>localStorage</code> until you clear
            it. Nothing is removed automatically; clearing cannot be undone.
          </p>

          {notice && <div className="settings-notice">{notice}</div>}

          <div className="settings-clear-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                confirmClear(
                  "Remove all Analytics scans (images + model results) stored in this browser?",
                  clearAnalyticsData
                )
              }
            >
              Clear Analytics data
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                confirmClear(
                  "Remove all Timeline entries stored in this browser?",
                  clearTimelineData
                )
              }
            >
              Clear Timeline data
            </button>
            <button
              type="button"
              className="btn btn-primary settings-clear-all"
              onClick={() =>
                confirmClear(
                  "Remove ALL Analytics and Timeline data stored in this browser? This cannot be undone.",
                  clearAllPatientLocalData
                )
              }
            >
              Clear Analytics & Timeline
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;
