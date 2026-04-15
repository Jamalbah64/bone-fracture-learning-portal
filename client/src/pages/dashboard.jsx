import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const [leftVisible, setLeftVisible] = useState(false);
  const [rightVisible, setRightVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === leftRef.current) {
            setLeftVisible(entry.isIntersecting);
          }
          if (entry.target === rightRef.current) {
            setRightVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.25,
      }
    );

    if (leftRef.current) observer.observe(leftRef.current);
    if (rightRef.current) observer.observe(rightRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#0b1220] overflow-x-hidden">

      {/* HERO */}
      <section className="min-h-screen flex items-center px-6 md:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-7xl mx-auto items-center gap-20">

          {/* LEFT TEXT */}
          <div
            ref={leftRef}
            className={`
              transition-all duration-1000 ease-out
              ${leftVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
            `}
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              AI Fracture <br />
              <span className="text-sky-400">Detection System</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
              This platform uses artificial intelligence to analyze medical scans
              such as X-rays, CT, and MRI images. It runs multiple deep learning
              models and combines their predictions to improve accuracy. The system
              helps doctors detect fractures faster while maintaining patient
              history for long-term clinical tracking.
            </p>

            <button
              onClick={() => navigate("/upload")}
              className="
                mt-8 px-7 py-3 text-lg font-semibold rounded-2xl
                backdrop-blur-xl bg-white/10 border border-white/20
                text-white hover:bg-white/20 hover:scale-[1.04]
                transition-all duration-300 shadow-lg
              "
            >
              Upload X-Ray
            </button>
          </div>

          {/* RIGHT GIF (WIDER NOW) */}
          <div
            ref={rightRef}
            className={`
              flex justify-end
              transition-all duration-1000 ease-out
              ${rightVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}
            `}
          >
            <div className="w-full max-w-3xl">

              <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-[75vh]">
                <img
                  src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2h2eWZxZ3ZkY2R0b2JxZ2h0d2V3Z3F3b2R0Z2Z3b2R0Z2Z3/3o7TKMt1VVNkHV2PaE/giphy.gif"
                  alt="AI Processing"
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-right text-white/50 mt-4 text-sm">
                Live AI inference visualization
              </p>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

export default Dashboard;