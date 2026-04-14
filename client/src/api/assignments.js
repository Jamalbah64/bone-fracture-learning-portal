export async function fetchAssignments() {
    const res = await fetch("/api/assignments", { credentials: "include" });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load assignments");
    return res.json();
}

export async function createAssignment(patientUsername, radiologistId) {
    const res = await fetch("/api/assignments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUsername, radiologistId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Assignment failed");
    return data;
}

export async function deleteAssignment(id) {
    const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    return data;
}
