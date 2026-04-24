function ModelResultCard({ title, filename, predictions = [], num_labels }) {
  const hasPredictions = Array.isArray(predictions) && predictions.length > 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur hover:bg-white/10 transition">
      {/* TITLE */}
      <h4 className="text-lg font-semibold text-white mb-4">
        {title}
      </h4>

      {/* FILE */}
      {filename && (
        <div className="flex justify-between text-sm text-white/60 mb-2">
          <span>File</span>
          <strong className="text-white truncate max-w-[60%]">
            {filename}
          </strong>
        </div>
      )}

      {/* LABEL COUNT */}
      <div className="flex justify-between text-sm text-white/60 mb-4">
        <span>Labels</span>
        <strong className="text-white">{num_labels ?? predictions.length}</strong>
      </div>

      {/* STATUS */}
      <div className="mb-4">
        {hasPredictions ? (
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold border border-green-500/30 bg-green-500/10 text-green-300">
            Detections found
          </span>
        ) : (
          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold border border-slate-500/30 bg-slate-500/10 text-slate-300">
            No detections
          </span>
        )}
      </div>

      {/* PREDICTIONS */}
      {hasPredictions ? (
        <div className="space-y-4">
          {predictions.map((pred, i) => {
            const confidence =
              typeof pred.confidence === "number" ? pred.confidence : null;

            return (
              <div
                key={i}
                className="p-3 rounded-xl bg-black/20 border border-white/10"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">AO code</span>
                  <strong className="text-white">
                    {pred.code || "Unknown"}
                  </strong>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Confidence</span>
                  <strong className="text-white">
                    {confidence !== null
                      ? `${(confidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </strong>
                </div>

                {/* CONFIDENCE BAR */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all"
                    style={{
                      width:
                        confidence !== null
                          ? `${Math.min(100, confidence * 100)}%`
                          : "0%",
                    }}
                  />
                </div>

                {pred.model && (
                  <p className="text-xs text-white/40 mt-2">
                    Source: {pred.model}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-black/20 border border-white/10">
          <p className="text-sm font-semibold text-white">
            No predictions returned
          </p>

          <p className="text-white/50 text-sm mt-1">
            This model completed analysis, but couldn't return a confident classification for this scan.
          </p>
        </div>
      )}
    </div>
  );
}

/* GRID WRAPPER */
export default function ModelResultsGrid({ models }) {
  if (!Array.isArray(models) || models.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {models.map((m) => (
        <ModelResultCard
          key={m.key}
          title={m.label}
          filename={m.filename}
          predictions={Array.isArray(m.predictions) ? m.predictions : []}
          num_labels={m.num_labels}
        />
      ))}
    </div>
  );
}
