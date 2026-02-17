import React from "react";
import "./NavBar.css";

function NavBar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-mark">🦴</div>
          <div className="brand-text">
            <div className="brand-name">FractureDetection</div>
            <div className="brand-sub">AI Fracture Detection + Learning</div>
          </div>
        </div>

        <ul className="nav-links">
          <li className="nav-link">AI Tool</li>
          <li className="nav-link">Learning Portal</li>
          <li className="nav-link">Flashcards</li>
        </ul>

        <button className="nav-login">Login</button>
      </div>
    </nav>
  );
}

export default NavBar;
