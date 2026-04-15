import { useState, useEffect } from "react";
import { TIMELINE_STORAGE_KEY } from "../utils/analyticsStore";

function PatientTimeline() {
  const [patients, setPatients] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function load() {
      try {
        const stored =
          JSON.parse(localStorage.getItem(TIMELINE_STORAGE_KEY)) || {};

        setPatients(stored);

        const ids = Object.keys(stored);

        setSelectedPatient((prev) => {
          if (ids.length === 0) return null;
          if (ids.length === 1) return ids[0];
          if (prev && ids.includes(prev)) return prev;
          return null;
        });
      } catch {
        setPatients({});
        setSelectedPatient(null);
      }
    }

    load();
    window.addEventListener("storage", load);
    window.addEventListener("timeline-updated", load);

    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("timeline-updated", load);
    };
  }, []);

  // 🔥 fade-in on route change
  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const patientIds = Object.keys(patients);

  return (
    <section className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* HEADER (matches other pages) */}
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

      {/* CONTENT WRAPPER */}
      <div className="px-6 lg:px-12 py-10">

        {/* PATIENT SELECTOR */}
        {patientIds.length > 1 && (
          <div className="mb-8 max-w-md">
            <select
              value={selectedPatient || ""}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="" disabled>
                Choose patient
              </option>

              {patientIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* TIMELINE */}
        {selectedPatient && patients[selectedPatient]?.length > 0 ? (
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-6 min-w-max">

              {patients[selectedPatient]
                .slice()
                .reverse()
                .map((item, index) => (
                  <div
                    key={index}
                    onClick={() => item.image && setActiveImage(item.image)}
                    className={`
                      w-[340px] flex-shrink-0 cursor-pointer
                      rounded-2xl bg-white/5 border border-white/10
                      backdrop-blur p-4
                      hover:bg-white/10 hover:scale-[1.03]
                      transition-all duration-300
                      opacity-0 animate-fadeIn
                    `}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >

                    {/* IMAGE */}
                    {item.image && (
                      <div className="rounded-xl overflow-hidden border border-white/10 mb-4">
                        <img
                          src={item.image}
                          alt="X-ray"
                          className="w-full h-[200px] object-cover"
                        />
                      </div>
                    )}

                    {/* INFO */}
                    <div className="space-y-2">
                      <div className="text-white/60 text-sm">
                        {item.date} • {item.time}
                      </div>

                      <h3 className="text-lg font-semibold">
                        {item.result}
                      </h3>

                      {item.confidence !== null && (
                        <p className="text-white/60 text-sm">
                          Confidence: {(item.confidence * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : selectedPatient ? (
          <p className="text-white/60">No timeline data available.</p>
        ) : (
          <p className="text-white/60">Select a patient to view timeline.</p>
        )}

        {/* IMAGE MODAL */}
        {activeImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setActiveImage(null)}
          >
            <div className="max-w-5xl w-full p-4">
              <img
                src={activeImage}
                alt="Full scan"
                className="w-full rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>
          </div>
        )}

      </div>

      {/* FADE ANIMATION */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </section>
  );
}

export default PatientTimeline;