import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import Analytics from "./pages/analytics";
import PatientAnalyticsDetail from "./pages/patient_analytics_detail";
import Dashboard from "./pages/dashboard";
import Login from "./pages/loginPage";
import PatientTimeline from "./pages/patient_timeline";
import Register from "./pages/registerPage";
import Settings from "./pages/settings";
import XrayUpload from "./pages/xray_upload";

const FULL_ACCESS_ROLES = ["radiologist", "head_radiologist", "clinician", "admin"];

function canAccessPath(role, path) {
  if (!role) return false;
  if (FULL_ACCESS_ROLES.includes(role)) return true;
  if (role === "patient") {
    return ["/", "/timeline", "/settings", "/patients"].some(
      (allowed) => path === allowed || path.startsWith(`${allowed}/`)
    );
  }
  return false;
}

function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessPath(user.role, location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    function onAuthChange() {
      fetchMe();
    }

    window.addEventListener("auth-change", onAuthChange);
    fetchMe();

    return () => {
      window.removeEventListener("auth-change", onAuthChange);
    };
  }, []);

  async function fetchMe() {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        setAuthChecked(true);
        return;
      }

      const data = await res.json();
      setUser(data);
      setAuthChecked(true);
    } catch (err) {
      console.error("Failed to fetch /me", err);
      setUser(null);
      setAuthChecked(true);
    }
  }

  if (!authChecked) {
    return <div className="container">Checking authentication...</div>;
  }

  return (
    <BrowserRouter>
      {user && <NavBar user={user} />}

      <main className="content">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                user ? <Dashboard /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/" replace /> : <Register />}
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute user={user}>
                  <XrayUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute user={user}>
                  <PatientTimeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:patientId"
              element={
                <ProtectedRoute user={user}>
                  <PatientTimeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute user={user}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/patient/:patientId"
              element={
                <ProtectedRoute user={user}>
                  <PatientAnalyticsDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute user={user}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {user && (
        <footer className="footer">
          <div className="container">
            <p>© {new Date().getFullYear()} Bone Fracture Learning Portal</p>
          </div>
        </footer>
      )}
    </BrowserRouter>
  );
}

export default App;
