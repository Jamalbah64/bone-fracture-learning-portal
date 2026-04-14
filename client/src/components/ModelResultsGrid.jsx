function ModelResultCard({ title, filename, predictions, num_labels }) {
  return (
    <div className="model-result-card">
      <h4 className="model-result-title">{title}</h4>
      {filename && (
        <div className="result-row">
          <span>File</span>
          <strong className="model-result-filename">{filename}</strong>
        </div>
      )}
      <div className="result-row">
        <span>Labels</span>
        <strong>{num_labels ?? 0}</strong>
      </div>
      {predictions?.length ? (
        predictions.map((pred, i) => (
          <div key={i} className="model-pred-block">
            <div className="result-row">
              <span>AO code</span>
              <strong>{pred.code}</strong>
            </div>
            <div className="result-row">
              <span>Confidence</span>
              <strong>{(pred.confidence * 100).toFixed(1)}%</strong>
            </div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${Math.min(100, pred.confidence * 100)}%` }}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="muted model-result-empty">No classifications</p>
      )}
    </div>
  );
}

export default function ModelResultsGrid({ models }) {
  if (!models?.length) return null;
  return (
    <div className="model-results-grid">
      {models.map((m) => (
        <ModelResultCard
          key={m.key}
          title={m.label}
          filename={m.filename}
          predictions={m.predictions}
          num_labels={m.num_labels}
        />
      ))}
    </div>
  );
}
