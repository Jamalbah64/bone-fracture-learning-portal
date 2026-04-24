import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { classifyImages } from "../api/classification";
import ModelResultsGrid from "../components/ModelResultsGrid";
import { validateMedicalImage } from "../utils/medicalImageValidation";
import { splitApiResultIntoModels } from "../utils/scanModels";

function XrayUpload() {
  const location = useLocation();

  const [selectedFile, setSelectedFile] = useState(null);
  const [projection2File, setProjection2File] = useState(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [projection2PreviewUrl, setProjection2PreviewUrl] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const [dragActiveProjection2, setDragActiveProjection2] = useState(false);

  const [patientId, setPatientId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState(null);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.key]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!projection2File) {
      setProjection2PreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(projection2File);
    setProjection2PreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [projection2File]);

  const handleAcceptedFile = (file, projectionNumber = 1) => {
    const validation = validateMedicalImage(file);

    if (!validation.valid) {
      if (projectionNumber === 1) {
        setSelectedFile(null);
      } else {
        setProjection2File(null);
      }

      setError(validation.reason);
      setMessage("");
      return;
    }

    if (projectionNumber === 1) {
      setSelectedFile(file);
      setMessage(`Loaded Projection 1: ${file.name}`);
    } else {
      setProjection2File(file);
      setMessage(`Loaded Projection 2: ${file.name}`);
    }

    setError("");
    setModels(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];

    if (!file) return;

    handleAcceptedFile(file, 1);
  };

  const handleDropProjection2 = (e) => {
    e.preventDefault();
    setDragActiveProjection2(false);

    const file = e.dataTransfer.files?.[0];

    if (!file) return;

    handleAcceptedFile(file, 2);
  };

  const handleRun = async () => {
    if (!selectedFile) {
      setError("Please drag and drop at least one medical image.");
      return;
    }

    const projection1Validation = validateMedicalImage(selectedFile);

    if (!projection1Validation.valid) {
      setError(projection1Validation.reason);
      return;
    }

    if (projection2File) {
      const projection2Validation = validateMedicalImage(projection2File);

      if (!projection2Validation.valid) {
        setError(projection2Validation.reason);
        return;
      }
    }

    setIsLoading(true);
    setError("");
    setModels(null);

    try {
      const data = await classifyImages({
        projection1: selectedFile,
        projection2: projection2File,
        patientId,
      });

      const modelRuns = splitApiResultIntoModels(data);

      setModels(modelRuns);
      setMessage("Analysis complete. Results saved for this patient.");
    } catch (err) {
      setError(err?.message || "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setProjection2File(null);
    setModels(null);
    setError("");
    setMessage("");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div
        className={`px-10 py-6 border-b border-white/10 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        <h1 className="text-3xl font-bold">AI Radiology Workstation</h1>
        <p className="text-white/60">
          Upload scans, run models, and generate clinical insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-10">
        <div
          className={`lg:col-span-1 space-y-6 transition-all duration-700 ease-out delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
            <label className="text-sm text-white/60">Patient Username</label>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Links scan to patient account"
              className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${dragActive
              ? "border-green-400 bg-green-500/10"
              : "border-white/20 bg-white/5"
              }`}
          >
            <p className="text-lg font-semibold">Drop Projection 1 Here</p>
            <p className="text-white/60 text-sm mt-2">
              Required. JPG, PNG, TIFF, DICOM supported
            </p>

            <label className="inline-block mt-4 cursor-pointer px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              Choose File
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.tif,.tiff,.dcm,.dicom"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAcceptedFile(file, 1);
                }}
              />
            </label>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveProjection2(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActiveProjection2(false);
            }}
            onDrop={handleDropProjection2}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${dragActiveProjection2
              ? "border-sky-400 bg-sky-500/10"
              : "border-white/20 bg-white/5"
              }`}
          >
            <p className="text-lg font-semibold">Drop Projection 2 Here</p>
            <p className="text-white/60 text-sm mt-2">
              Optional. If none provided, Projection 1 is reused
            </p>

            <label className="inline-block mt-4 cursor-pointer px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              Choose File
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.tif,.tiff,.dcm,.dicom"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAcceptedFile(file, 2);
                }}
              />
            </label>
          </div>

          {(selectedFile || projection2File) && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              {selectedFile && (
                <>
                  <p className="text-sm">Projection 1: {selectedFile.name}</p>
                  <p className="text-sm text-white/60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              )}

              {projection2File && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-sm">Projection 2: {projection2File.name}</p>
                  <p className="text-sm text-white/60">
                    {(projection2File.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <button
                onClick={handleClear}
                className="mt-4 w-full py-2 rounded-xl border border-white/20 hover:bg-white/10 transition"
              >
                Clear
              </button>
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={!selectedFile || isLoading}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold transition disabled:opacity-50"
          >
            {isLoading ? "Running AI Models..." : "Run Analysis"}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-3 rounded-xl">
              {message}
            </div>
          )}
        </div>

        <div
          className={`lg:col-span-2 space-y-6 transition-all duration-700 ease-out delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {previewUrl && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-500 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-4">Projection 1 Preview</h2>
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={previewUrl}
                  alt="Projection 1 scan"
                  className="w-full max-h-[500px] object-contain bg-black"
                />
              </div>
            </div>
          )}

          {projection2PreviewUrl && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-500 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-4">Projection 2 Preview</h2>
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={projection2PreviewUrl}
                  alt="Projection 2 scan"
                  className="w-full max-h-[500px] object-contain bg-black"
                />
              </div>
            </div>
          )}

          {models && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-500 animate-fadeIn">
              <h2 className="text-xl font-semibold">AI Model Results</h2>
              <p className="text-white/60 text-sm mb-4">
                Multi-model consensus analysis
              </p>
              <ModelResultsGrid models={models} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default XrayUpload;
