/**
 * Uploads one or two medical images for classification.
 *
 * projection1 = required.
 * projection2 = optional.
 *
 * The backend forwards these to FastAPI for predictions
 */
export async function classifyImages({
  projection1,
  projection2 = null,
  patientId = "",
}) {
  const token = localStorage.getItem("token");

  if (!projection1) {
    throw new Error("Projection 1 image is required.");
  }

  const formData = new FormData();

  formData.append("projection1", projection1);

  if (projection2) {
    formData.append("projection2", projection2);
  }

  if (patientId) {
    formData.append("patientId", String(patientId).trim());
  }

  const response = await fetch("/api/classify/upload", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const raw = await response.text();

    throw new Error(
      `Non-JSON response from /api/classify: ${raw.slice(0, 200)}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.detail ||
      data.details ||
      "Image upload or classification failed."
    );
  }

  return data;
}
