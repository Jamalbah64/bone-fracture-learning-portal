export async function classifyImage(filestem) {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/classify/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ filestem }),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const raw = await response.text();
    throw new Error(`Non-JSON response from /api/classify/upload: ${raw.slice(0, 200)}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Classification failed");
  }

  return data;
}

/**
 * Uploads a medical image file for classification
 * @param {File} file - The image file to classify
 * @returns {Promise<Object>} Classification results
 */
export async function classifyUploadedImage(file) {
  const token = localStorage.getItem("token");

  // Create FormData to send the file
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/classify/upload", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    credentials: "include", // Include cookies if sent
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const raw = await response.text();
    throw new Error(`Non-JSON response from /api/classify/upload: ${raw.slice(0, 200)}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Image upload or classification failed");
  }

  return data;
}
