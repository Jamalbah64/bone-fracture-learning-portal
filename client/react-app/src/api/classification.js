export async function classifyUploadedImage(file) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("You must be logged in to upload an image.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/classify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Classification failed");
  }

  return data;
}
