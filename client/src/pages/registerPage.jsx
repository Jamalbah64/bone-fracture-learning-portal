import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Register Component
 * Handles user account creation.
 * Sends username + password to backend.
 */
function Register() {
  const navigate = useNavigate();

  // Form input state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [staffId, setStaffId] = useState("");
  const requiresStaffId = role === "radiologist" || role === "head_radiologist";

  // Error handling state
  const [error, setError] = useState("");

  /**
   * Handles registration form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Send registration request
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

      // Handle failed registration
      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Redirect to login after success
      navigate("/login");
    } catch (err) {
      setError(err?.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Page title */}
        <h2>Create Account</h2>
        <p className="muted">Sign up to get started</p>

        {/* Registration Form */}
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

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value === "patient") setStaffId("");
            }}
            required
          >
            <option value="patient">Patient</option>
            <option value="radiologist">Radiologist</option>
            <option value="head_radiologist">Head Radiologist</option>
          </select>

          {requiresStaffId && (
            <input
              type="text"
              placeholder="Staff ID Number"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value.replace(/\D/g, ""))}
              required
            />
          )}

          {/* Error Message */}
          {error && <div className="error-box">{error}</div>}

          {/* Submit Button */}
          <button className="btn btn-primary" type="submit">
            Register
          </button>
        </form>

        {/* Link to Login Page */}
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;