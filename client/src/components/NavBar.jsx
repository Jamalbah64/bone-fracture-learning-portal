import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";

const STAFF_ROLES = ["radiologist", "head_radiologist"];

function NavBar({ user }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const role = user?.role;
  const isStaff = STAFF_ROLES.includes(role);
  const isHead = role === "head_radiologist";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "remember=; max-age=0; path=/";

    try {
      window.dispatchEvent(new Event("auth-change"));
    } catch {
      // ignore
    }

    navigate("/login");
  }

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="nav">
      <div className="nav-inner container">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <div className="brand-mark">🦴</div>
          <div className="brand-text">
            <div className="brand-name">FractureDetection</div>
            <div className="brand-sub">AI Fracture Detection + Learning</div>
          </div>
        </Link>

        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li>
            <Link
              to="/"
              className={isActive("/") ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          </li>

          {isStaff && (
            <li>
              <Link
                to="/upload"
                className={isActive("/upload") ? "nav-link active" : "nav-link"}
                onClick={() => setMenuOpen(false)}
              >
                AI Tool
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/analytics"
              className={isActive("/analytics") ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              Analytics
            </Link>
          </li>

          <li>
            <Link
              to="/timeline"
              className={
                isActive("/timeline") || isActive("/patients")
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() => setMenuOpen(false)}
            >
              Timeline
            </Link>
          </li>

          <li>
            <Link
              to="/shared"
              className={isActive("/shared") ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              Shared
            </Link>
          </li>

          {(isHead || role === "radiologist") && (
            <li>
              <Link
                to="/manage"
                className={isActive("/manage") ? "nav-link active" : "nav-link"}
                onClick={() => setMenuOpen(false)}
              >
                {isHead ? "Manage" : "Patients"}
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/settings"
              className={isActive("/settings") ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
          </li>

          <li className="mobile-login">
            <button className="nav-login" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>

        <div className="nav-right">
          {user && (
            <div className="nav-user">
              {user.username}{" "}
              <span className="nav-role-badge">{role?.replace("_", " ")}</span>
            </div>
          )}
          <button className="nav-login desktop-only" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
