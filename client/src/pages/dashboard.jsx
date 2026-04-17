import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const STAFF_ROLES = ["radiologist", "head_radiologist"];

function Dashboard({ user }) {
  const navigate = useNavigate();
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isHead = user?.role === "head_radiologist";

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const bottomLeftRef = useRef(null);
  const bottomRightRef = useRef(null);

  const [leftVisible, setLeftVisible] = useState(false);
  const [rightVisible, setRightVisible] = useState(false);
  const [bottomLeftVisible, setBottomLeftVisible] = useState(false);
  const [bottomRightVisible, setBottomRightVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === leftRef.current)
            setLeftVisible(entry.isIntersecting);
          if (entry.target === rightRef.current)
            setRightVisible(entry.isIntersecting);
          if (entry.target === bottomLeftRef.current)
            setBottomLeftVisible(entry.isIntersecting);
          if (entry.target === bottomRightRef.current)
            setBottomRightVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );

    if (leftRef.current) observer.observe(leftRef.current);
    if (rightRef.current) observer.observe(rightRef.current);
    if (bottomLeftRef.current) observer.observe(bottomLeftRef.current);
    if (bottomRightRef.current) observer.observe(bottomRightRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0b1220] overflow-x-hidden">

      {/* ===================== TOP SECTION ===================== */}
      <section className="min-h-screen flex items-center px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl mx-auto items-center gap-20">

          {/* LEFT */}
          <div
            ref={leftRef}
            className={`transition-all duration-1000 ease-out ${
              leftVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              AI Fracture <br />
              <span className="text-sky-400">Detection System</span>
            </h1>

            <p className="mt-4 text-sm text-white/50">
              Welcome, <strong className="text-white">{user?.username}</strong>
              <span className="ml-2 px-2 py-0.5 rounded-lg bg-sky-400/20 border border-sky-400/30 text-sky-300 text-xs capitalize">
                {user?.role?.replace("_", " ")}
              </span>
            </p>

            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
              This platform uses artificial intelligence to analyze medical scans.
              It runs multiple deep learning models and combines their predictions
              to improve accuracy, while maintaining patient history for clinical tracking.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {isStaff ? (
                <button
                  onClick={() => navigate("/upload")}
                  className="px-7 py-3 text-lg font-semibold rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-[1.04] transition-all duration-300 shadow-lg"
                >
                  Upload X-Ray
                </button>
              ) : (
                <button
                  onClick={() => navigate("/timeline")}
                  className="px-7 py-3 text-lg font-semibold rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-[1.04] transition-all duration-300 shadow-lg"
                >
                  View My Timeline
                </button>
              )}
              <button
                onClick={() => navigate("/shared")}
                className="px-7 py-3 text-lg font-semibold rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all duration-300"
              >
                Shared Scans
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div
            ref={rightRef}
            className={`transition-all duration-1000 ease-out ${
              rightVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }`}
          >
            <div className="grid grid-cols-1 gap-4">
              {isStaff && (
                <div
                  onClick={() => navigate("/upload")}
                  className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold">AI Fracture Detection</h3>
                  <p className="text-white/60 text-sm mt-2">
                    Upload medical images and receive AI predictions with confidence scores.
                  </p>
                </div>
              )}

              <div
                onClick={() => navigate("/timeline")}
                className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold">Patient Timeline</h3>
                <p className="text-white/60 text-sm mt-2">
                  View historical scans organized by patient with chronological events.
                </p>
              </div>

              <div
                onClick={() => navigate("/analytics")}
                className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                <p className="text-white/60 text-sm mt-2">
                  Review model outputs and detection results from uploaded medical data.
                </p>
              </div>

              {(isHead || user?.role === "radiologist") && (
                <div
                  onClick={() => navigate("/manage")}
                  className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold">Patient Assignments</h3>
                  <p className="text-white/60 text-sm mt-2">
                    {isHead
                      ? "Assign patients to radiologists and manage access."
                      : "View your assigned patients."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STAFF ONLY SECTION ===================== */}
      {isStaff && (
        <>
          {/* DIVIDER */}
          <div className="relative flex items-center justify-center py-16 px-6 md:px-16">
            <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative z-10 px-6 py-2 rounded-full bg-[#0b1220] border border-white/10 backdrop-blur-md shadow-lg">
              <span className="text-sm md:text-base text-yellow-300 font-medium tracking-wide">
                ⚠️ Sensitive Data: Upload images with caution and ensure privacy compliance
              </span>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <section className="min-h-screen flex items-center px-6 md:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl mx-auto items-center gap-20">

              {/* LEFT */}
              <div
                ref={bottomLeftRef}
                className={`transition-all duration-1000 ${
                  bottomLeftVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                <h2 className="text-4xl md:text-5xl font-bold">
                  How to Use the AI Tool
                </h2>

                <p className="mt-6 text-lg text-white/70 leading-relaxed max-w-xl">
                  Using the AI fracture detection tool is simple and efficient:
                </p>

                <ul className="mt-6 space-y-4 text-white/70">
                  <li>• Enter a <strong>Patient ID</strong> to track history</li>
                  <li>• Upload an X-ray</li>
                  <li>• Click <strong>Run Analysis</strong></li>
                  <li>• View AI predictions and confidence levels</li>
                  <li>• Automatically saved to the patient timeline</li>
                </ul>

                <button
                  onClick={() => navigate("/upload")}
                  className="mt-8 px-6 py-3 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 hover:bg-sky-500/30 transition"
                >
                  Try It Now
                </button>
              </div>

              {/* RIGHT */}
              <div
                ref={bottomRightRef}
                className={`transition-all duration-1000 ${
                  bottomRightVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-10"
                }`}
              >
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                  <img
                    src="\src\assets\GIF.gif"
                    alt="How to use AI tool"
                    className="w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

    </div>
  );
}

export default Dashboard;