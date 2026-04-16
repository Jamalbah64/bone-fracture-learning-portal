import { useState } from "react";
import ShareModal from "./ShareModal";

function ShareButton({ scanId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-share"
        onClick={() => setOpen(true)}
      >
        Share
      </button>
      {open && <ShareModal scanId={scanId} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ShareButton;
