import { useState } from "react";
import { classifyImage } from "../api/classification";

function XrayUpload() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const onPickFile = (e) => {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setError("");
    setResult(null);
  };

  const onRun = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await classifyImage(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <h1>AI X-ray Upload</h1>
      <p>Select an image, then run classification.</p>

      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <input type="file" accept="image/*" onChange={onPickFile} />

        <button type="button" onClick={onRun} disabled={!file || isLoading}>
          {isLoading ? "Running..." : "Run model"}
        </button>

        {file ? (
          <div>
            <strong>Selected:</strong> {file.name}
          </div>
        ) : null}

        {error ? (
          <div style={{ color: "crimson" }}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {result ? (
          <pre style={{ margin: 0, padding: 12, background: "#0b1020", color: "#e6edf3", overflowX: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

export default XrayUpload;
