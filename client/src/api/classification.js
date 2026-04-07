export async function classifyImage(filestem) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${apiBaseUrl}/api/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filestem }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Classification failed";
    throw new Error(message);
  }

  return data;
}