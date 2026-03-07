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
  // Initialize token and user from storage synchronously to avoid sync setState in effects
  const initialToken = (() => {
    const t = localStorage.getItem('token');
    // Only retain token if the remember cookie exists
    return t && /(?:^|; )remember=/.test(document.cookie) ? t : null;
  })();

  const initialUser = (() => {
    try {
      return initialToken ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    } catch {
      return null;
    }
  })();

  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    // Listen for storage changes (in case another tab logs in/out)
    function onStorage(e) {
      if (e.key === 'token') setToken(e.newValue);
    }

    // Listen for custom auth-change event in same tab
    function onAuthChange() {
      setToken(localStorage.getItem('token'));
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-change', onAuthChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-change', onAuthChange);
    };
  }, []);

  // When token changes, fetch the current user's profile to validate the token
  useEffect(() => {
    if (!token) {
      // remove persisted user; defer setUser to avoid synchronous state update in effect
      localStorage.removeItem('user');
      const id = setTimeout(() => setUser(null), 0);
      return () => clearTimeout(id);
    }

    let mounted = true;
    (async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        if (!res.ok) {
          // token invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data);
        // persist user only if remember cookie exists
        if (/(?:^|; )remember=/.test(document.cookie)) {
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Failed to fetch /me', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <BrowserRouter>
      {/* Show NavBar only when logged in */}
      {token && <NavBar user={user} />}

      <main className="content">
        <div className="container">
          <Routes>
            {/* These are the main routes for the application */}
            <Route
              path="/"
              element={
                token ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            {/* Authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Additional routes */}
            <Route path="/upload" element={<XrayUpload />} />
            <Route path="/timeline" element={<PatientTimeline />} />
            <Route
              path="/patients/:patientId"
              element={<PatientTimeline />}
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      {/* Show footer only when logged in*/}
      {token && (
        <footer className="footer">
          <div className="container">
            <p>
              © {new Date().getFullYear()} Bone Fracture Learning Portal
            </p>
          </div>
        </footer>
      )}
    </BrowserRouter>
  );
}

export default App;
