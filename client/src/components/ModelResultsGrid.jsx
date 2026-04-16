function ModelResultCard({ title, filename, predictions, num_labels }) {
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
        <strong className="text-white">{num_labels ?? 0}</strong>
      </div>

      {/* PREDICTIONS */}
      {predictions?.length ? (
        <div className="space-y-4">
          {predictions.map((pred, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-black/20 border border-white/10"
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">AO code</span>
                <strong className="text-white">{pred.code}</strong>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Confidence</span>
                <strong className="text-white">
                  {(pred.confidence * 100).toFixed(1)}%
                </strong>
              </div>

              {/* CONFIDENCE BAR */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, pred.confidence * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm italic">
          No classifications
        </p>
      )}
    </div>
  );
}

/* GRID WRAPPER */
export default function ModelResultsGrid({ models }) {
  if (!models?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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