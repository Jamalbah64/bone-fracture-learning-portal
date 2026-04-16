import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const STAFF_ROLES = ["radiologist", "head_radiologist"];

function NavBar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.role;
  const isStaff = STAFF_ROLES.includes(role);
  const isHead = role === "head_radiologist";

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
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "remember=; max-age=0; path=/";
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  }

  const linkClass = (active) =>
    `px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-white/10 text-white shadow-md"
        : "text-white/70 hover:text-white hover:bg-white/5"
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="backdrop-blur-xl bg-black/60 border-b border-white/10">
        <div className="h-16 flex items-center justify-between px-6">

          <Link
            to="/"
            className="flex items-center gap-3 font-bold text-white"
            onClick={closeMenu}
          >
            <div className="leading-tight">
              <div className="text-lg">FractureDetection</div>
              <div className="text-xs text-white/50">Medical AI Platform</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className={linkClass(isActive("/"))}>
              Dashboard
            </Link>

            {isStaff && (
              <Link to="/upload" className={linkClass(isActive("/upload"))}>
                AI Tool
              </Link>
            )}

            <Link to="/analytics" className={linkClass(isActive("/analytics"))}>
              Analytics
            </Link>

            <Link
              to="/timeline"
              className={linkClass(
                isActive("/timeline") || isActive("/patients")
              )}
            >
              Timeline
            </Link>

            <Link to="/shared" className={linkClass(isActive("/shared"))}>
              Shared
            </Link>

            {(isHead || role === "radiologist") && (
              <Link to="/manage" className={linkClass(isActive("/manage"))}>
                {isHead ? "Manage" : "Patients"}
              </Link>
            )}

            <Link to="/settings" className={linkClass(isActive("/settings"))}>
              Settings
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="text-white/60 text-sm">
                {user.username}
                <span className="ml-2 text-xs px-2 py-0.5 rounded-lg bg-sky-400/20 border border-sky-400/30 text-sky-300 capitalize">
                  {role?.replace("_", " ")}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
            >
              Logout
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white text-2xl"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        <div
          className={`md:hidden px-6 pb-4 flex flex-col gap-2 border-t border-white/10 transition-all ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <Link onClick={closeMenu} to="/" className="py-2 text-white/80">
            Dashboard
          </Link>
          {isStaff && (
            <Link onClick={closeMenu} to="/upload" className="py-2 text-white/80">
              AI Tool
            </Link>
          )}
          <Link onClick={closeMenu} to="/analytics" className="py-2 text-white/80">
            Analytics
          </Link>
          <Link onClick={closeMenu} to="/timeline" className="py-2 text-white/80">
            Timeline
          </Link>
          <Link onClick={closeMenu} to="/shared" className="py-2 text-white/80">
            Shared
          </Link>
          {(isHead || role === "radiologist") && (
            <Link onClick={closeMenu} to="/manage" className="py-2 text-white/80">
              {isHead ? "Manage" : "Patients"}
            </Link>
          )}
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
