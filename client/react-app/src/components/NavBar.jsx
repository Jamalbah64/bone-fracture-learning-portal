import React from "react";
import "./NavBar.css";

function NavBar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-mark">🦴</div>
          <div className="brand-text">
            <div className="brand-name">BoneLearn</div>
            <div className="brand-sub">Fracture Learning Portal</div>
          </div>
        </div>

        <ul className="nav-links">
          <li className="nav-link">Chapters</li>
          <li className="nav-link">Quizzes</li>
          <li className="nav-link">Flashcards</li>
        </ul>

        <button className="nav-login">Login</button>
      </div>
    </nav>
  );
}

export default NavBar;
