export async function fetchPatients() {
    const res = await fetch("/api/patients", { credentials: "include" });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load patients");
    return res.json();
}

export async function searchUsers(query) {
    const res = await fetch(
        `/api/patients/search?q=${encodeURIComponent(query)}`,
        { credentials: "include" }
    );
    if (!res.ok) throw new Error((await res.json()).error || "Search failed");
    return res.json();
}
