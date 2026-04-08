import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../context/notificationContext";

/**
 * Login Component
 * Handles user authentication.
 * Collects username + password and sends to backend.
 */
function Login() {
  const navigate = useNavigate();
  const { notify } = useNotification();

  // State for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // State for UI feedback
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  /**
   * Handles form submission
   * Sends login request to backend API
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Send login request
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Handle failed login
      if (!response.ok) {
        setError(data.error || "Login failed");
        notify(data.error || "Login failed", "error");
        return;
      }

      // Save authentication token locally
      localStorage.setItem("token", data.token);
      // Sync App.jsx token state (localStorage alone does not update React state)
      try {
        window.dispatchEvent(new Event("auth-change"));
      } catch {
        /* ignore */
      }

      /**
       * Optional "Remember Me" feature
       * Stores a cookie that persists login for 30 days
       */
      if (remember) {
        document.cookie = `remember=true; max-age=${60 * 60 * 24 * 30}; path=/`;
      } else {
        document.cookie = `remember=; max-age=0; path=/`;
      }
      // Redirect to homepage on successful login
      notify("Login successful. Welcome back.", "success");
      navigate("/");
    } catch {
      // Handle unexpected errors
      setError("An unexpected error occurred");
      notify("An unexpected error occurred during login.", "error");
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

          <div className="auth-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
          </div>

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
