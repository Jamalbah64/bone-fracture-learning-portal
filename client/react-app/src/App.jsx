import "./App.css";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/dashboard";
import XrayUpload from "./pages/xray_upload";
import PatientTimeline from "./pages/patient_timeline";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";

function App() {
  return (
    <div className="app">
      <NavBar />

      <main className="content">
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<XrayUpload />} />
            <Route path="/timeline" element={<PatientTimeline />} />
            <Route path="/patients/:patientId" element={<PatientTimeline />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Bone Fracture Learning Portal</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
