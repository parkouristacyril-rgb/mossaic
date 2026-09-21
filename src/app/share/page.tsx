"use client";

import { useEffect, useState } from "react";

type State = "idle" | "saving" | "saved" | "error";

export default function SharePage() {
  const [link, setLink] = useState("");
  const [reaction, setReaction] = useState("");
  const [firstImpression, setFirstImpression] = useState("");
  const [whyItWorked, setWhyItWorked] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [fromShare, setFromShare] = useState(false);

  // The share target redirects here with the link already extracted, so the
  // person never has to copy and paste anything.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("link");
    if (shared) {
      setLink(shared);
      setFromShare(true);
    }
    if (params.get("error") === "nolink") {
      setMessage("That share didn't contain a video link. Paste it below instead.");
      setState("error");
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!link.trim()) {
      setState("error");
      setMessage("Paste a TikTok or Instagram link first.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const res = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: await resolveOrgId(),
          link,
          reaction: reaction || undefined,
          firstImpression: firstImpression || undefined,
          whyItWorked: whyItWorked || undefined,
          source: fromShare ? "SHARE_SHEET" : "WORKSPACE",
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(body.error ?? "Could not save this observation.");
        return;
      }

      setState("saved");
      setMessage(
        body.alreadyKnown
          ? "Added to a video Mosaic already knows — your read joins the others."
          : "Captured. Analysis has started in the background.",
      );
      setLink("");
      setReaction("");
      setFirstImpression("");
      setWhyItWorked("");
    } catch {
      setState("error");
      setMessage("Network problem — the observation was not saved.");
    }
  }

  return (
    <>
      <h1>Capture observation</h1>
      <p className="lede">
        Saw something that worked? Your instinct plus the analysis is stronger
        than either alone.
      </p>

      {message && (
        <div className={`notice ${state === "error" ? "notice-error" : "notice-good"}`}>
          {message}
        </div>
      )}

      <form className="card" onSubmit={submit}>
        <label className="field">
          <span>Video link</span>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste a TikTok or Instagram link"
          />
        </label>

        <label className="field">
          <span>What made you react?</span>
          <textarea
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
            placeholder="The reveal at the end genuinely surprised me"
          />
        </label>

        <label className="field">
          <span>What caught your attention first?</span>
          <textarea
            value={firstImpression}
            onChange={(e) => setFirstImpression(e.target.value)}
            placeholder="The unexpected camera angle in the first second"
          />
        </label>

        <label className="field">
          <span>Why do you think it worked?</span>
          <textarea
            value={whyItWorked}
            onChange={(e) => setWhyItWorked(e.target.value)}
            placeholder="It broke the pattern viewers expect from this niche"
          />
        </label>

        <button type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Send to Mosaic"}
        </button>
      </form>
    </>
  );
}

/**
 * Placeholder for the session lookup. Swap for the signed-in user's org when
 * auth lands — every API route already expects the id explicitly.
 */
async function resolveOrgId(): Promise<string> {
  const res = await fetch("/api/session");
  const body = await res.json();
  return body.organizationId as string;
}
