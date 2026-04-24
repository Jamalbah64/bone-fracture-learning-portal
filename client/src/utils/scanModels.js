// Utility functions for processing and normalizing results from API

// Function to handle formats for model labels
function formatModelLabel(key) {
  const labels = {
    model_a: "Model A",
    model_b: "Model B",
    model_u: "Model U",
  };

  return labels[key] || key;
}

// Function to handle formats for model subtitles
function formatModelSubtitle(key) {
  const subtitles = {
    model_a: "Projection 1 model",
    model_b: "Projection 2 model",
    model_u: "Combined model output",
  };

  return subtitles[key] || "AI Tool output";
}

// Function for normalizing predictions from various API response formats
function normalizePredictions(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.predictions)) {
    return value.predictions;
  }

  return [];
}

// Normalizes different API response formats into a consistent model result structure
function normalizeModelResult(key, value = {}, fallbackFilename = null) {
  const predictions = normalizePredictions(value);
  // returns a normalized model result object with consistent keys and fallback values for missing data
  return {
    key,
    label: value?.label || formatModelLabel(key),
    subtitle: value?.subtitle || formatModelSubtitle(key),
    filename: value?.filename || fallbackFilename,
    predictions,
    num_labels:
      typeof value?.num_labels === "number"
        ? value.num_labels
        : predictions.length,
  };
}

// Function to split API results into an array of model results
// Handles various response formats and normalizes them into a viable structure for the frontend
export function splitApiResultIntoModels(apiResult) {
  if (!apiResult || typeof apiResult !== "object") {
    return [];
  }
  if (apiResult.results && typeof apiResult.results === "object") {
    const results = apiResult.results;

    // Returns a model entry, even if it's blank
    // Having an "issue" where some model entries don't appear
    return [
      normalizeModelResult(
        "model_a",
        Array.isArray(results.model_a) ? results.model_a : [],
        apiResult.projection1_filename
      ),
      normalizeModelResult(
        "model_b",
        Array.isArray(results.model_b) ? results.model_b : [],
        apiResult.projection2_filename
      ),
      normalizeModelResult(
        "model_u",
        Array.isArray(results.model_u) ? results.model_u : [],
        apiResult.projection1_filename
      ),
    ];
  }
  if (Array.isArray(apiResult.models)) {
    return apiResult.models.map((model, index) =>
      normalizeModelResult(
        model.key || model.label || `model_${index + 1}`,
        model,
        model.filename || apiResult.filename
      )
    );
  }

  // Handle case where API returns models as an object with keys
  // Returns an array of normalized model results
  if (apiResult.models && typeof apiResult.models === "object") {
    return Object.entries(apiResult.models).map(([modelKey, value]) =>
      normalizeModelResult(modelKey, value, apiResult.filename)
    );
  }
  return [
    normalizeModelResult(
      apiResult.model || "model_u",
      apiResult,
      apiResult.filename || apiResult.projection1_filename
    ),
  ];
}
