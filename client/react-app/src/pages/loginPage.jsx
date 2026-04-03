import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

/**
 * Login Component
 * Handles user authentication.
 * Collects username + password and sends to backend.
 */
function Login() {
  const navigate = useNavigate();

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
        return;
      }

      // Save authentication token locally
      localStorage.setItem("token", data.token);

      /**
       * Optional "Remember Me" feature
       * Stores a cookie that persists login for 30 days
       */
      if (remember) {
        document.cookie = `remember=true; max-age=${60 * 60 * 24 * 30}; path=/`;
      } else {
        document.cookie = `remember=; max-age=0; path=/`;
      }

      // Redirect user to dashboard/home
      navigate("/");
    } catch {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Page title */}
        <h2>Welcome Back</h2>
        <p className="muted">Login to continue</p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username Input */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Remember Me Checkbox */}
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

          {/* Error Message */}
          {error && <div className="error-box">{error}</div>}

          {/* Submit Button */}
          <button className="btn btn-primary" type="submit">
            Login
          </button>
        </form>

        {/* Link to Register Page */}
        <p className="auth-switch">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;