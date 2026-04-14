export async function fetchShares(direction = "received") {
    const res = await fetch(`/api/shares?direction=${direction}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load shares");
    return res.json();
}

export async function createShare(resourceType, resourceId, sharedWithUsername, message) {
    const res = await fetch("/api/shares", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType, resourceId, sharedWithUsername, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Share failed");
    return data;
}

export async function deleteShare(id) {
    const res = await fetch(`/api/shares/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Revoke failed");
    return data;
}
