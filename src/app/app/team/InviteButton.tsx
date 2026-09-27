"use client";

import { useState } from "react";

export default function InviteButton() {
  const [note, setNote] = useState(false);

  return (
    <div className="mt-5">
      <button
        onClick={() => setNote(true)}
        className="px-5 py-2.5 rounded-full btn-ghost text-sm font-medium"
      >
        + Invite teammate
      </button>
      {note && (
        <p className="font-mono text-[11px] text-[var(--mist-dim)] mt-3">
          Invitations aren&apos;t switched on for this workspace yet.
        </p>
      )}
    </div>
  );
}
