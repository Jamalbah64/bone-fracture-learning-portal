import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requiresStaffId =
    role === "radiologist" || role === "head_radiologist";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          role,
          staffId: requiresStaffId ? staffId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      navigate("/login");
    } catch (err) {
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">

      {/* CARD */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            Create Account
          </h2>
          <p className="text-white/60 mt-2">
            Join the AI Fracture Detection System
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400"
            required
          />

          {/* ROLE SELECT */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value === "patient") setStaffId("");
            }}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option className="text-black" value="patient">
              Patient
            </option>
            <option className="text-black" value="radiologist">
              Radiologist
            </option>
            <option className="text-black" value="head_radiologist">
              Head Radiologist
            </option>
          </select>

          {/* STAFF ID */}
          {requiresStaffId && (
            <input
              type="text"
              placeholder="Staff ID Number"
              value={staffId}
              onChange={(e) =>
                setStaffId(e.target.value.replace(/\D/g, ""))
              }
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            />
          )}

          {/* ERROR */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-white/50 text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;