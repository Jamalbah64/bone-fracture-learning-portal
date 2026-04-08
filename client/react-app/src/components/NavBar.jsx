import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext.jsx";
import { logoutUser } from "../utils/logout.js";
import "./NavBar.css";

function NavBar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logoutUser();
    setMenuOpen(false);
    notify("You have been logged out.", "info");
    navigate("/login");
  };

  return (
    <nav className="nav">
      <div className="nav-inner container">
        <Link
          to="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
        >
          <div className="brand-mark">🦴</div>
          <div className="brand-text">
            <div className="brand-name">FractureDetection</div>
            <div className="brand-sub">
              AI Fracture Detection + Learning
            </div>
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

          <li>
            <Link
              to="/upload"
              className={isActive("/upload") ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              AI Tool
            </Link>
          </li>

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
              to="/settings"
              className={isActive("/settings") ? "nav-link active" : "nav-link"}
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
          </li>

          <li className="mobile-login">
            <button
              className="nav-login"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </ul>

        <div className="nav-right">
          {user && (
            <div className="nav-user">
              {user.username} {user.role ? `(${user.role})` : ""}
            </div>
          )}

          <button
            className="nav-login desktop-only"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <button
          className="hamburger"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
