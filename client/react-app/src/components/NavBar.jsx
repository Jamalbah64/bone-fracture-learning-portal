import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  const location = useLocation();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link
          to="/"
          className="brand"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="brand-mark">🦴</div>
          <div className="brand-text">
            <div className="brand-name">FractureDetection</div>
            <div className="brand-sub">AI Fracture Detection + Learning</div>
          </div>
        </Link>

        <ul className="nav-links">
          <li>
            <Link
              to="/"
              className={
                location.pathname === "/" ? "nav-link active" : "nav-link"
              }
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/upload"
              className={
                location.pathname === "/upload" ? "nav-link active" : "nav-link"
              }
            >
              AI Tool
            </Link>
          </li>
          <li>
            <Link
              to="/analytics"
              className={
                location.pathname.startsWith("/analytics")
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              Analytics
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={
                location.pathname.startsWith("/settings")
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              Settings
            </Link>
          </li>
        </ul>

        <button className="nav-login">Login</button>
      </div>
    </nav>
  );
}

export default NavBar;
