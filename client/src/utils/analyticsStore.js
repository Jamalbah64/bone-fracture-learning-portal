const ANALYTICS_STORAGE_KEY = "analyticsData";
const LEGACY_ANALYTICS_KEYS = ["analyticsScans", "scanResults"];
const TIMELINE_STORAGE_KEY = "timelineData";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function appendScanRecord(record) {
  const items = readJson(ANALYTICS_STORAGE_KEY, []);
  items.push({
    createdAt: new Date().toISOString(),
    ...record,
  });
  writeJson(ANALYTICS_STORAGE_KEY, items);
  return items;
}

export function clearAnalyticsData() {
  localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  for (const legacyKey of LEGACY_ANALYTICS_KEYS) {
    localStorage.removeItem(legacyKey);
  }
}

export function clearTimelineData() {
  localStorage.removeItem(TIMELINE_STORAGE_KEY);
}

export function clearAllPatientLocalData() {
  clearAnalyticsData();
  clearTimelineData();
}
