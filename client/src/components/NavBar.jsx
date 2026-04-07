import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";

const FULL_ACCESS_ROLES = ["radiologist", "head_radiologist", "clinician", "admin"];

function NavBar({ user }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const role = user?.role;
  const hasFullAccess = FULL_ACCESS_ROLES.includes(role);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // remove remember cookie
    document.cookie = 'remember=; max-age=0; path=/';
    // notify app to update state
    try { window.dispatchEvent(new Event('auth-change')); }
    catch { // ignore
    }
    navigate('/login');
  }

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="nav">
      <div className="nav-inner container">
        {/* Brand */}
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

        {/* Nav Links */}
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

          {hasFullAccess && (
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

          {hasFullAccess && (
            <li>
              <Link
                to="/analytics"
                className={isActive("/analytics") ? "nav-link active" : "nav-link"}
                onClick={() => setMenuOpen(false)}
              >
                Analytics
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/timeline"
              className={isActive("/timeline") || isActive("/patients")
                ? "nav-link active"
                : "nav-link"}
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
            <button className="nav-login" onClick={handleLogout}>Logout</button>
          </li>
        </ul>

        {/* Desktop Logout */}
        <div className="nav-right">
          {user && <div className="nav-user">{user.username}</div>}
          <button className="nav-login desktop-only" onClick={handleLogout}>Logout</button>
        </div>

        {/* Hamburger */}
        <div
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
