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
  // Determine whether a user is logged in by checking for a token
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      {/* Show NavBar only when logged in */}
      {token && <NavBar />}

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
