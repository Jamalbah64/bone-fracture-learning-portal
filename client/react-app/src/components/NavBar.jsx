import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
            <button className="nav-login">Login</button>
          </li>
        </ul>

        {/* Desktop Login */}
        <button className="nav-login desktop-only">Login</button>

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