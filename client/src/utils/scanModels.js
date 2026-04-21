function normalizeModelResult(key, value) {
  return {
    key,
    label: key,
    filename: value?.filename ?? null,
    predictions: Array.isArray(value?.predictions) ? value.predictions : [],
    num_labels:
      typeof value?.num_labels === "number"
        ? value.num_labels
        : Array.isArray(value?.predictions)
          ? value.predictions.length
          : 0,
  };
}

export function splitApiResultIntoModels(apiResult) {
  if (!apiResult || typeof apiResult !== "object") return [];

  // Multi-model response shape: { filename, models: { model_u: [...], model_a: [...] } }
  if (apiResult.models && typeof apiResult.models === "object") {
    return Object.entries(apiResult.models).map(([modelKey, predictions]) => ({
      key: modelKey,
      label: modelKey,
      filename: apiResult.filename ?? null,
      predictions: Array.isArray(predictions) ? predictions : [],
      num_labels: Array.isArray(predictions) ? predictions.length : 0,
    }));
  }

  // Single-model response shape.
  return [
    normalizeModelResult(apiResult.model || "model_u", {
      ...apiResult,
      predictions: apiResult.predictions,
    }),
  ];
}
