import "./App.css";
import NavBar from "./components/NavBar";

function App() {
  return (
    <div className="app">
      <NavBar />

      {/* HERO */}
      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="pill">AI + Medical Learning</span>
            <h1>Bone Fracture Learning Portal</h1>
            <p>
              Learn fracture anatomy and patterns with flashcards and chapters —
              and use our AI tool to upload X-rays for fracture detection
              (educational use).
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary">Try AI Tool</button>
              <button className="btn btn-ghost">Browse Chapters</button>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-number">AI</div>
                <div className="stat-label">Fracture Detection</div>
              </div>
              <div className="stat">
                <div className="stat-number">200+</div>
                <div className="stat-label">Flashcards</div>
              </div>
              <div className="stat">
                <div className="stat-number">12+</div>
                <div className="stat-label">Chapters</div>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <h3>What you can do</h3>
            <ul>
              <li>🦴 Upload X-rays for AI detection</li>
              <li>📚 Learn fracture types by chapter</li>
              <li>🧠 Study with flashcards</li>
              <li>📈 Track progress (coming soon)</li>
            </ul>
            <button className="btn btn-secondary">Upload an X-ray</button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="content">
        <div className="container">
          {/* FEATURE CARDS */}
          <section className="grid">
            <div className="card">
              <h3>AI Fracture Detection Tool</h3>
              <p>
                Upload an X-ray image and get an AI-assisted prediction with a
                confidence score and highlighted region (coming soon).
              </p>
              <button className="link-btn">Open AI Tool →</button>
            </div>

            <div className="card">
              <h3>Chapters</h3>
              <p>Step-by-step topics with images and simple explanations.</p>
              <button className="link-btn">Open Chapters →</button>
            </div>

            <div className="card">
              <h3>Flashcards</h3>
              <p>Study key terms and fracture patterns with quick recall cards.</p>
              <button className="link-btn">Study Flashcards →</button>
            </div>
          </section>

          {/* AI TOOL SECTION */}
          <section className="ai-section">
            <div className="ai-header">
              <h2>AI Fracture Detection</h2>
              <p>
                Upload an X-ray to receive an AI-assisted prediction. This tool
                is for learning and should not replace medical diagnosis.
              </p>
            </div>

            <div className="ai-grid">
              {/* Upload Card */}
              <div className="ai-card">
                <h3>Upload X-ray</h3>
                <p className="muted">
                  Supported: JPG, PNG. (DICOM later if you want.)
                </p>

                <div className="upload-box">
                  <div className="upload-icon">⬆️</div>
                  <div className="upload-text">
                    <div className="upload-title">Drag & drop your image</div>
                    <div className="upload-sub">or click to choose a file</div>
                  </div>
                  <button className="btn btn-primary">Choose File</button>
                </div>

                <div className="ai-actions">
                  <button className="btn btn-primary">Run Detection</button>
                  <button className="btn btn-ghost">Clear</button>
                </div>

                <div className="disclaimer">
                  <strong>Note:</strong> Educational tool only — always consult a
                  healthcare professional.
                </div>
              </div>

              {/* Results Card */}
              <div className="ai-card">
                <h3>Results</h3>
                <p className="muted">
                  After you run detection, results will show here.
                </p>

                <div className="result-box">
                  <div className="result-row">
                    <span className="label">Prediction</span>
                    <span className="value">—</span>
                  </div>
                  <div className="result-row">
                    <span className="label">Confidence</span>
                    <span className="value">—</span>
                  </div>
                  <div className="result-row">
                    <span className="label">Region Highlight</span>
                    <span className="value">—</span>
                  </div>
                </div>

                <div className="hint">
                  Later we can connect this to your backend AI model (Python /
                  Flask/FastAPI or Node + Python service).
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Bone Fracture Learning Portal</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
