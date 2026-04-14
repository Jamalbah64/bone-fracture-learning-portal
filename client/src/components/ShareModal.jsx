import { useState } from "react";
import { createShare } from "../api/shares";
import { searchUsers } from "../api/patients";

function ShareModal({ scanId, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleSearch(value) {
    setQuery(value);
    if (value.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(value);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleShare(username) {
    setError("");
    setStatus("");
    try {
      await createShare("scan", scanId, username, message);
      setStatus(`Shared with ${username}`);
      setResults([]);
      setQuery("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Scan</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-label">Search for a user</label>
          <input
            type="text"
            className="modal-input"
            placeholder="Type a username…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />

          {searching && <p className="muted modal-hint">Searching…</p>}

          {results.length > 0 && (
            <ul className="share-results">
              {results.map((u) => (
                <li key={u._id} className="share-result-item">
                  <span>
                    <strong>{u.username}</strong>{" "}
                    <span className="muted share-role-badge">{u.role}</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleShare(u.username)}
                  >
                    Share
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="modal-label" style={{ marginTop: 14 }}>
            Message (optional)
          </label>
          <input
            type="text"
            className="modal-input"
            placeholder="Add a note…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {status && <div className="modal-success">{status}</div>}
          {error && <div className="error-box" style={{ marginTop: 10 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
