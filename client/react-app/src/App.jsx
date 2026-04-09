import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import Analytics from "./pages/analytics";
import Dashboard from "./pages/dashboard";
import Login from "./pages/loginPage";
import PatientTimeline from "./pages/patient_timeline";
import Register from "./pages/registerPage";
import Settings from "./pages/settings";
import XrayUpload from "./pages/xray_upload";

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
              element={
                user ? <Navigate to="/" replace /> : <Login />
              }
            />
            <Route
              path="/register"
              element={
                user ? <Navigate to="/" replace /> : <Register />
              }
            />
            <Route
              path="/upload"
              element={
                user ? <XrayUpload /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/timeline"
              element={
                user ? <PatientTimeline /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/patients/:patientId"
              element={
                user ? <PatientTimeline /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/analytics"
              element={
                user ? <Analytics /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/settings"
              element={
                user ? <Settings /> : <Navigate to="/login" replace />
              }
            />
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
