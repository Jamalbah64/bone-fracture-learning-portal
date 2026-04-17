import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchScans, scanImageUrl } from "../api/scans";
import { fetchPatients } from "../api/patients";
import ShareButton from "../components/ShareButton";

function PatientTimeline() {
  const { patientId: routePatient } = useParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(
    routePatient ? decodeURIComponent(routePatient) : null
  );
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchPatients()
      .then((list) => {
        setPatients(list);
        if (!selectedPatient && list.length === 1) {
          setSelectedPatient(list[0].username);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setScans([]);
      return;
    }
    setScanLoading(true);
    fetchScans(selectedPatient)
      .then((data) =>
        setScans(
          data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )
        )
      )
      .catch(() => setScans([]))
      .finally(() => setScanLoading(false));
  }, [selectedPatient]);

  const topPrediction = (scan) => {
    const preds = scan.models?.[0]?.predictions;
    if (!preds || preds.length === 0) return null;
    return preds.reduce((best, p) =>
      p.confidence > best.confidence ? p : best
    , preds[0]);
  };

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* HEADER */}
      <div
        className={`border-b border-white/10 px-10 py-6 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold">Patient Timeline</h1>
        <p className="text-white/60 mt-2">
          Click a scan to view full resolution image
        </p>
      </div>

      <div className="px-6 lg:px-12 py-10">

        {loading ? (
          <p className="text-white/60">Loading…</p>
        ) : (
          <>
            {patients.length > 1 && (
              <div className="mb-8 max-w-md">
                <select
                  value={selectedPatient || ""}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="" disabled className="bg-slate-900 text-white">
                    Choose patient
                  </option>
                  {patients.map((p) => (
                    <option
                      key={p._id}
                      value={p.username}
                      className="bg-slate-900 text-white"
                    >
                      {p.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scanLoading ? (
              <p className="text-white/60">Loading scans…</p>
            ) : selectedPatient && scans.length > 0 ? (
              <div className="overflow-x-auto pb-6">
                <div className="flex gap-6 min-w-max">
                  {scans.map((scan, index) => {
                    const top = topPrediction(scan);
                    const imgUrl = scanImageUrl(scan._id);

                    return (
                      <div
                        key={scan._id}
                        onClick={() => setActiveImage(imgUrl)}
                        className="w-[340px] flex-shrink-0 cursor-pointer rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-4 hover:bg-white/10 hover:scale-[1.03] transition-all duration-300 opacity-0 animate-fadeIn"
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        {/* IMAGE */}
                        <div className="rounded-xl overflow-hidden border border-white/10 mb-4 bg-black">
                          <img
                            src={imgUrl}
                            alt="X-ray"
                            className="w-full h-[200px] object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>

                        {/* TEXT */}
                        <div className="space-y-2">
                          <div className="text-white/60 text-sm">
                            {new Date(scan.createdAt).toLocaleDateString()} •{" "}
                            {new Date(scan.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>

                          <h3 className="text-lg font-semibold">
                            {top ? top.code : "No prediction"}
                          </h3>

                          {top && (
                            <p className="text-white/60 text-sm">
                              Confidence:{" "}
                              {(top.confidence * 100).toFixed(1)}%
                            </p>
                          )}

                          <div onClick={(e) => e.stopPropagation()}>
                            <ShareButton scanId={scan._id} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : selectedPatient ? (
              <p className="text-white/60">
                No scans available for this patient.
              </p>
            ) : patients.length === 0 ? (
              <p className="text-white/60">No patients available.</p>
            ) : (
              <p className="text-white/60">
                Select a patient to view timeline.
              </p>
            )}
          </>
        )}

        {/* ===================== FULL IMAGE MODAL ===================== */}
        {activeImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6"
            onClick={() => setActiveImage(null)}
          >
            <div
              className="max-w-6xl w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImage}
                alt="Full scan"
                className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

export default PatientTimeline;