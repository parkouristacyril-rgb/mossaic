"use client";

import { useEffect, useState } from "react";

type Idea = {
  id: string;
  title: string;
  concept: string;
  hook?: string | null;
  lengthEstimate?: string | null;
  predictedLift?: string | null;
  rationale?: string | null;
  basedOnPatterns: string[];
};

type Batch = { id: string; campaign: string; goal: string; ideas: Idea[] };

async function resolveOrgId(): Promise<string> {
  const res = await fetch("/api/session");
  return (await res.json()).organizationId as string;
}

export default function IdeasPage() {
  const [campaign, setCampaign] = useState("");
  const [count, setCount] = useState(10);
  const [goal, setGoal] = useState("Share rate");
  const [audience, setAudience] = useState("");
  const [product, setProduct] = useState("");
  const [constraints, setConstraints] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const orgId = await resolveOrgId();
      const res = await fetch(`/api/ideas?organizationId=${orgId}`);
      if (res.ok) setBatches((await res.json()).batches ?? []);
    })();
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign.trim()) {
      setError("Give the campaign a name so the concepts have something to aim at.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: await resolveOrgId(),
          campaign,
          goal,
          count,
          audience: audience || undefined,
          product: product || undefined,
          constraints: constraints || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not generate ideas.");
        return;
      }
      setBatches((prev) => [body, ...prev]);
      setCampaign("");
    } catch {
      setError("Network problem — nothing was generated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Video Ideas</h1>
      <p className="text-[var(--mist)] mb-8">
        Turn your pattern library into ready-to-shoot concepts for a specific campaign — built only from
        mechanisms this brand has already proven.
      </p>

      {error && <div className="notice notice-error">{error}</div>}

      <form className="card p-7 mb-10" onSubmit={generate}>
        <p className="font-medium mb-5">Generate a new batch</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Campaign / theme</label>
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} type="text" placeholder="e.g. Back to School" className="login-field" />
          </div>
          <div>
            <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Number of videos</label>
            <input value={count} onChange={(e) => setCount(Number(e.target.value))} type="number" min={1} max={30} className="login-field" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">What do you want to increase?</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className="login-field">
            <option>Share rate</option>
            <option>Engagement rate</option>
            <option>Watch time</option>
            <option>Click-through / conversions</option>
            <option>Follower growth</option>
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Target audience</label>
            <input value={audience} onChange={(e) => setAudience(e.target.value)} type="text" placeholder="e.g. Parents of school-age kids, 28-45" className="login-field" />
          </div>
          <div>
            <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Product / brand context</label>
            <input value={product} onChange={(e) => setProduct(e.target.value)} type="text" placeholder="e.g. Skincare routine kit for teens" className="login-field" />
          </div>
        </div>
        <div className="mb-5">
          <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Anything to avoid</label>
          <input value={constraints} onChange={(e) => setConstraints(e.target.value)} type="text" placeholder="e.g. No direct competitor mentions, keep under 20s" className="login-field" />
        </div>
        <button type="submit" disabled={busy} className="px-6 py-3 rounded-full btn-primary text-sm font-medium text-white">
          {busy ? "Generating…" : "Generate Ideas"}
        </button>
      </form>

      {batches.length === 0 ? (
        <p className="text-[var(--mist-dim)] text-sm">No ideas yet — generate a batch above to see concepts grounded in your patterns.</p>
      ) : (
        batches.map((batch) => (
          <div key={batch.id} className="mb-10">
            <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-4">GENERATED FOR &quot;{batch.campaign.toUpperCase()}&quot; — {batch.ideas.length} {batch.ideas.length === 1 ? "IDEA" : "IDEAS"}</p>
            <div className="space-y-4">
              {batch.ideas.map((idea) => (
                <div key={idea.id} className="card p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="font-display text-lg font-semibold">{idea.title}</p>
                    {idea.basedOnPatterns[0] && <span className="chip in whitespace-nowrap">{idea.basedOnPatterns[0]}</span>}
                  </div>
                  <p className="text-[var(--mist)] text-sm mb-4">{idea.concept}</p>
                  <div className="flex flex-wrap items-center gap-6 text-[12px] font-mono text-[var(--mist-dim)] mb-4">
                    {idea.hook && <span>Hook: {idea.hook}</span>}
                    {idea.lengthEstimate && <span>Length: {idea.lengthEstimate}</span>}
                    {idea.predictedLift && <span>Predicted lift: <span className="text-[var(--good)]">{idea.predictedLift}</span></span>}
                  </div>
                  {idea.rationale && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-[var(--violet-2)] font-medium">Why this works</summary>
                      <p className="text-[var(--mist)] mt-2">{idea.rationale}</p>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
