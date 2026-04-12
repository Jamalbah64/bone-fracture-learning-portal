import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

/**
 * Login Component
 * Handles user authentication.
 * Collects username + password and sends to backend.
 */
function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, staffId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      try {
        window.dispatchEvent(new Event("auth-change"));
      } catch {
        // ignore
      }

      navigate("/");
    } catch {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="muted">Login to continue</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Staff ID (radiologists only)"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value.replace(/\D/g, ""))}
          />

          {error && <div className="error-box">{error}</div>}

          <button className="btn btn-primary" type="submit">
            Login
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
