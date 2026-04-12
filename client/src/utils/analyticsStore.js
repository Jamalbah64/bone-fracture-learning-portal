const STORAGE_KEY = "scanAnalytics";

/** Timeline cards (separate from Analytics scan store). */
export const TIMELINE_STORAGE_KEY = "timelineData";

function emitAnalyticsUpdated() {
  try {
    window.dispatchEvent(new Event("analytics-updated"));
  } catch {
    /* ignore */
  }
}

function emitTimelineUpdated() {
  try {
    window.dispatchEvent(new Event("timeline-updated"));
  } catch {
    /* ignore */
  }
}

/**
 * @typedef {object} ModelRun
 * @property {string} key
 * @property {string} label
 * @property {string} [filename]
 * @property {{ code: string, confidence: number }[]} predictions
 * @property {number} num_labels
 */

/**
 * @typedef {object} ScanRecord
 * @property {string} id
 * @property {string} createdAt
 * @property {string} patientId
 * @property {string} filename
 * @property {string} imageDataUrl
 * @property {ModelRun[]} models
 */

function emptyStore() {
  return { patients: {} };
}

export function loadAnalyticsStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.patients && typeof parsed.patients === "object") {
      return parsed;
    }
    return emptyStore();
  } catch {
    return emptyStore();
  }
}

/** @returns {string[]} */
export function listPatientIds() {
  const { patients } = loadAnalyticsStore();
  return Object.keys(patients).sort((a, b) => a.localeCompare(b));
}

/** @returns {ScanRecord[]} chronological (oldest first) */
export function getScansForPatient(patientId) {
  const { patients } = loadAnalyticsStore();
  const list = patients[patientId] || [];
  return [...list].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
}

/**
 * @param {string} patientId
 * @param {Omit<ScanRecord, 'id' | 'createdAt' | 'patientId'>} payload
 */
export function appendScanRecord(patientId, payload) {
  const store = loadAnalyticsStore();
  const pid = (patientId || "").trim() || "unassigned";
  if (!store.patients[pid]) store.patients[pid] = [];

  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    patientId: pid,
    ...payload,
  };

  store.patients[pid].push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  emitAnalyticsUpdated();
  return record;
}

/** Remove all Analytics scan records (patient list + detail). */
export function clearAnalyticsData() {
  localStorage.removeItem(STORAGE_KEY);
  emitAnalyticsUpdated();
}

/** Remove all Timeline local data. */
export function clearTimelineData() {
  localStorage.removeItem(TIMELINE_STORAGE_KEY);
  emitTimelineUpdated();
}

/** Clear Analytics and Timeline stores in one step. */
export function clearAllPatientLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TIMELINE_STORAGE_KEY);
  emitAnalyticsUpdated();
  emitTimelineUpdated();
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
