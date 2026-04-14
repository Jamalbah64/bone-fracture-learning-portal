const BASE = "/api/scans";

export async function fetchScans(patientId) {
    const params = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
    const res = await fetch(`${BASE}${params}`, { credentials: "include" });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load scans");
    return res.json();
}

export async function fetchScan(id) {
    const res = await fetch(`${BASE}/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load scan");
    return res.json();
}

export function scanImageUrl(id) {
    return `${BASE}/${id}/image`;
}
