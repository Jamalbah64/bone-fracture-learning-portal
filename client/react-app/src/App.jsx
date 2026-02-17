import "./App.css";
import NavBar from "./components/NavBar";

function App() {
  return (
    <div className="app">
      <NavBar />

      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="pill">Medical Learning Portal</span>
            <h1>Bone Fracture Learning Portal</h1>
            <p>
              Learn fracture types, anatomy, and diagnosis with chapters, quizzes,
              and flashcards designed to help you study faster.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary">Start Learning</button>
              <button className="btn btn-ghost">Browse Chapters</button>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-number">12+</div>
                <div className="stat-label">Chapters</div>
              </div>
              <div className="stat">
                <div className="stat-number">50+</div>
                <div className="stat-label">Practice Questions</div>
              </div>
              <div className="stat">
                <div className="stat-number">200+</div>
                <div className="stat-label">Flashcards</div>
              </div>
            </div>
          </div>

          <div className="hero-card">
            <h3>Study Toolkit</h3>
            <ul>
              <li>✅ Structured chapters</li>
              <li>✅ Quick quizzes</li>
              <li>✅ Flashcards for recall</li>
              <li>✅ Track progress (coming soon)</li>
            </ul>
            <button className="btn btn-secondary">Take a Quick Quiz</button>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="container">
          <section className="grid">
            <div className="card">
              <h3>Chapters</h3>
              <p>Step-by-step topics with images and explanations.</p>
              <button className="link-btn">Open Chapters →</button>
            </div>

            <div className="card">
              <h3>Quizzes</h3>
              <p>Test yourself with short quizzes and instant feedback.</p>
              <button className="link-btn">Start Quiz →</button>
            </div>

            <div className="card">
              <h3>Flashcards</h3>
              <p>Memorize key terms and fracture patterns quickly.</p>
              <button className="link-btn">Study Flashcards →</button>
            </div>
          </section>
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
