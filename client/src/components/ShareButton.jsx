import { useState } from "react";
import ShareModal from "./ShareModal";

function ShareButton({ scanId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="px-3 py-1 text-xs rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 transition"
        onClick={() => setOpen(true)}
      >
        Share
      </button>
      {open && <ShareModal scanId={scanId} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ShareButton;
