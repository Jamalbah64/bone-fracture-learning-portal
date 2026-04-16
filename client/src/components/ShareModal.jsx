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
    <div
      className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Scan</h3>
          <button
            type="button"
            className="text-white/50 hover:text-white text-lg"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-white/60">Search for a user</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Type a username…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />

          {searching && <p className="text-white/50 text-sm">Searching…</p>}

          {results.length > 0 && (
            <ul className="max-h-44 overflow-y-auto border border-white/10 rounded-xl bg-black/30">
              {results.map((u) => (
                <li
                  key={u._id}
                  className="flex justify-between items-center px-4 py-2 border-b border-white/5 last:border-0 text-sm"
                >
                  <span>
                    <strong>{u.username}</strong>{" "}
                    <span className="text-white/50 text-xs capitalize">{u.role}</span>
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 text-xs rounded-lg bg-sky-500 text-black font-semibold hover:bg-sky-400 transition"
                    onClick={() => handleShare(u.username)}
                  >
                    Share
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="text-sm text-white/60 mt-2 block">Message (optional)</label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Add a note…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {status && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
              {status}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
