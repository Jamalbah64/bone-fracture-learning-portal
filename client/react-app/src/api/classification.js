function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected FileReader result type"));
        return;
      }

      // result is a data URL: "data:<mime>;base64,<data>"
      const base64 = result.includes("base64,") ? result.split("base64,")[1] : "";
      if (!base64) {
        reject(new Error("Failed to extract base64 from data URL"));
        return;
      }

      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export async function classifyImage(file) {
  const imageBase64 = await fileToBase64(file);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const response = await fetch(`${apiBaseUrl}/api/classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Classification failed";
    throw new Error(message);
  }

  return data;
}