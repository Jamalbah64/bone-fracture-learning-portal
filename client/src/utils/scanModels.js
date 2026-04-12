/** Placeholder labels until three separate model endpoints exist. */
export const MODEL_SLOTS = [
  { key: "model_a", label: "Fracture model A" },
  { key: "model_b", label: "Fracture model B" },
  { key: "model_c", label: "Fracture model C" },
];

/**
 * Maps a single /predict-upload API payload into three UI slots.
 * Replace with real multi-model responses when backends are ready.
 */
export function splitApiResultIntoModels(apiResult) {
  if (!apiResult) return [];
  const base = {
    filename: apiResult.filename,
    predictions: apiResult.predictions ?? [],
    num_labels: apiResult.num_labels ?? 0,
  };
  return MODEL_SLOTS.map((slot) => ({
    ...slot,
    ...base,
  }));
}
