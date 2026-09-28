"use client";

import { useEffect, useState } from "react";

/**
 * The "Take the 1-minute tour" tile. Clicking it asks the global Moss companion
 * to open the tour player (via the `mossaic:tour` event). Once the video has
 * been mostly watched it flips to "Watch the tour again".
 */
export default function TourTile() {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    try { setSeen(localStorage.getItem("mossaic.tour.seen") === "1"); } catch { /* ignore */ }
  }, []);

  return (
    <button
      type="button"
      className={`tour-tile${seen ? " seen" : ""}`}
      aria-label={seen ? "Watch the tour again" : "Take the 1-minute tour"}
      onClick={() => window.dispatchEvent(new CustomEvent("mossaic:tour"))}
    >
      <span className="tour-thumb" style={{ backgroundImage: "url(/tour/thumb.jpg)" }}>
        <span className="tour-play">
          <svg viewBox="0 0 10 12"><path d="M1 1 L9 6 L1 11Z" fill="#7B2FF7" /></svg>
        </span>
      </span>
      <span className="tour-txt">
        <b>{seen ? "Watch the tour again" : "Take the 1-minute tour"}</b>
        <span>MOSS SHOWS YOU AROUND · 1:13</span>
      </span>
    </button>
  );
}
