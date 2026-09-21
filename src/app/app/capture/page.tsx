"use client";

import { useEffect, useState } from "react";

type State = "idle" | "saving" | "saved" | "error";

async function resolveOrgId(): Promise<string> {
  const res = await fetch("/api/session");
  return (await res.json()).organizationId as string;
}

export default function CapturePage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Capture Observation</h1>
      <p className="text-[var(--mist)] mb-6">
        Saw something interesting? Share it — your instinct plus our analysis is stronger than either alone.
      </p>

      <div className="flex gap-6 border-b border-[var(--line)] mb-8 font-mono">
        <span className={`app2-tab${mode === "single" ? " active" : ""}`} onClick={() => setMode("single")} style={{ userSelect: "none" }}>Single Observation</span>
        <span className={`app2-tab${mode === "bulk" ? " active" : ""}`} onClick={() => setMode("bulk")} style={{ userSelect: "none" }}>Bulk Import</span>
      </div>

      {mode === "single" ? <SingleForm /> : <BulkForm />}
    </div>
  );
}

function SingleForm() {
  const [link, setLink] = useState("");
  const [reaction, setReaction] = useState("");
  const [firstImpression, setFirstImpression] = useState("");
  const [whyItWorked, setWhyItWorked] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  // The share target redirects here with the link already extracted.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("link");
    if (shared) setLink(shared);
    if (params.get("error") === "nolink") {
      setState("error");
      setMessage("That share didn't contain a video link. Paste it below instead.");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
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
          source: "WORKSPACE",
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
          ? "Added to a video Mossaic already knows — your read joins the others."
          : "Observation received — it goes into your library the moment analysis finishes.",
      );
      setLink(""); setReaction(""); setFirstImpression(""); setWhyItWorked("");
    } catch {
      setState("error");
      setMessage("Network problem — the observation was not saved.");
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <form className="card p-7 space-y-5" onSubmit={submit}>
        {message && (
          <div className={`notice ${state === "error" ? "notice-error" : "notice-good"}`} style={{ marginBottom: 0 }}>{message}</div>
        )}
        <div>
          <label className="text-sm font-medium mb-2 block">Video link</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} type="text" placeholder="Paste a TikTok or Instagram link..." className="login-field" />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">What made you react?</label>
          <textarea value={reaction} onChange={(e) => setReaction(e.target.value)} rows={2} placeholder="e.g. The reveal at the end genuinely surprised me" className="login-field resize-none" />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">What caught your attention first?</label>
          <textarea value={firstImpression} onChange={(e) => setFirstImpression(e.target.value)} rows={2} placeholder="e.g. The unexpected camera angle in the first second" className="login-field resize-none" />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Why do you think it worked?</label>
          <textarea value={whyItWorked} onChange={(e) => setWhyItWorked(e.target.value)} rows={2} placeholder="e.g. It broke the pattern viewers expect from this niche" className="login-field resize-none" />
        </div>
        <button type="submit" disabled={state === "saving"} className="px-6 py-3 rounded-full btn-primary text-sm font-medium text-white">
          {state === "saving" ? "Saving…" : "Submit Observation"}
        </button>
      </form>
      <div className="space-y-5">
        <div className="card p-6">
          <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">HOW IT WORKS</p>
          <div className="space-y-3 text-sm text-[var(--mist)]">
            <p><span className="text-[var(--paper)] font-medium">1.</span> Paste a link that caught your eye</p>
            <p><span className="text-[var(--paper)] font-medium">2.</span> Add your instinct — what worked and why</p>
            <p><span className="text-[var(--paper)] font-medium">3.</span> Mossaic analyses it and files it against your patterns</p>
          </div>
        </div>
        <div className="card p-6" style={{ background: "rgba(123,47,247,0.06)" }}>
          <p className="font-mono text-[11px] text-[var(--violet-2)] mb-2">TIP</p>
          <p className="text-sm text-[var(--mist)]">The more specific your instinct, the better Mossaic can connect it to a measurable pattern.</p>
        </div>
      </div>
    </div>
  );
}

function BulkForm() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ok: number; fail: number } | null>(null);
  const links = text.split("\n").map((l) => l.trim()).filter(Boolean);

  async function submit() {
    if (links.length === 0 || busy) return;
    setBusy(true);
    setDone(null);
    const orgId = await resolveOrgId();
    let ok = 0;
    let fail = 0;
    for (const link of links) {
      try {
        const res = await fetch("/api/observations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId: orgId, link, source: "BULK_IMPORT" }),
        });
        if (res.ok) ok += 1; else fail += 1;
      } catch {
        fail += 1;
      }
    }
    setBusy(false);
    setDone({ ok, fail });
    if (fail === 0) setText("");
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="card p-7">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 12h8M12 8v8" strokeLinecap="round" /></svg>
          <p className="font-medium">Bulk import — great for onboarding or a pilot</p>
        </div>
        <p className="text-[var(--mist)] text-sm mb-5">Paste as many video links as you like, one per line. These are analysed objectively — no subjective questions needed, since these are existing videos, not something someone is reacting to right now.</p>
        <label className="text-sm font-medium mb-2 block">Video links (one per line)</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={"https://www.tiktok.com/@yourbrand/video/...\nhttps://www.instagram.com/reel/..."} className="login-field resize-none" style={{ fontFamily: "var(--mono)", fontSize: 12 }} />
        <div className="flex items-center justify-between mt-3 mb-5">
          <span className="font-mono text-[12px] text-[var(--mist-dim)]"><span>{links.length}</span> links detected</span>
          {done && <span className="font-mono text-[11px] text-[var(--good)]">{done.ok} queued{done.fail ? `, ${done.fail} failed` : ""}</span>}
        </div>
        <button onClick={submit} disabled={busy || links.length === 0} className="px-6 py-3 rounded-full btn-primary text-sm font-medium text-white">
          {busy ? "Submitting…" : "Start Bulk Analysis"}
        </button>
      </div>
      <div className="space-y-5">
        <div className="card p-6">
          <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">HOW IT WORKS</p>
          <div className="space-y-3 text-sm text-[var(--mist)]">
            <p><span className="text-[var(--paper)] font-medium">1.</span> Paste links from your existing content library</p>
            <p><span className="text-[var(--paper)] font-medium">2.</span> Mossaic analyses each one objectively — visual, audio, structure, performance</p>
            <p><span className="text-[var(--paper)] font-medium">3.</span> Once enough videos are in, your first patterns start emerging</p>
          </div>
        </div>
        <div className="card p-6" style={{ background: "rgba(123,47,247,0.06)" }}>
          <p className="font-mono text-[11px] text-[var(--violet-2)] mb-2">TIP</p>
          <p className="text-sm text-[var(--mist)]">30–50 videos is usually enough to surface your first few reliable patterns.</p>
        </div>
      </div>
    </div>
  );
}
