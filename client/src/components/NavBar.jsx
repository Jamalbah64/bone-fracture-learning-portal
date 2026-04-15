import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const FULL_ACCESS_ROLES = [
  "radiologist",
  "head_radiologist",
  "clinician",
  "admin",
];

function NavBar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.role;
  const hasFullAccess = FULL_ACCESS_ROLES.includes(role);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "remember=; max-age=0; path=/";

    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  }

  const linkClass = (active) =>
    `px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium
    ${
      active
        ? "bg-white/10 text-white shadow-md"
        : "text-white/70 hover:text-white hover:bg-white/5"
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* NAV BACKGROUND */}
      <div className="backdrop-blur-xl bg-black/60 border-b border-white/10">

        <div className="h-16 flex items-center justify-between px-6">

          {/* BRAND */}
          <Link
            to="/"
            className="flex items-center gap-3 font-bold text-white"
            onClick={closeMenu}
          >
            
            <div className="leading-tight">
              <div className="text-lg">FractureDetection</div>
              <div className="text-xs text-white/50">
                Medical AI Platform
              </div>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className={linkClass(isActive("/"))}>
              Dashboard
            </Link>

            {hasFullAccess && (
              <Link to="/upload" className={linkClass(isActive("/upload"))}>
                AI Tool
              </Link>
            )}

            {hasFullAccess && (
              <Link to="/analytics" className={linkClass(isActive("/analytics"))}>
                Analytics
              </Link>
            )}

            <Link to="/timeline" className={linkClass(isActive("/timeline"))}>
              Timeline
            </Link>

            <Link to="/settings" className={linkClass(isActive("/settings"))}>
              Settings
            </Link>
          </div>

          {/* USER + LOGOUT (DESKTOP) */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="text-white/60 text-sm">
                {user.username}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
            >
              Logout
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white text-2xl"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* MOBILE MENU */}
        <div
          className={`md:hidden px-6 pb-4 flex flex-col gap-2 border-t border-white/10 transition-all ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <Link onClick={closeMenu} to="/" className="py-2 text-white/80">
            Dashboard
          </Link>

          {hasFullAccess && (
            <Link onClick={closeMenu} to="/upload" className="py-2 text-white/80">
              AI Tool
            </Link>
          )}

          {hasFullAccess && (
            <Link onClick={closeMenu} to="/analytics" className="py-2 text-white/80">
              Analytics
            </Link>
          )}

          <Link onClick={closeMenu} to="/timeline" className="py-2 text-white/80">
            Timeline
          </Link>

          <Link onClick={closeMenu} to="/settings" className="py-2 text-white/80">
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="mt-3 px-4 py-2 rounded-xl bg-red-500/20 text-red-300"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}

export default NavBar;