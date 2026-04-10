export async function classifyUploadedImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/classify", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Classification failed");
  }

  return data;
}
