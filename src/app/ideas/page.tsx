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

export default function IdeasPage() {
  const [campaign, setCampaign] = useState("");
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

  async function generate(event: React.FormEvent) {
    event.preventDefault();
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
    <>
      <h1>Video ideas</h1>
      <p className="lede">
        Concepts built only from mechanisms this brand has already proven — not
        from generic best practice.
      </p>

      {error && <div className="notice notice-error">{error}</div>}

      <form className="card" onSubmit={generate}>
        <label className="field">
          <span>Campaign or theme</span>
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Back to school"
          />
        </label>

        <label className="field">
          <span>What do you want to increase?</span>
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option>Share rate</option>
            <option>Engagement rate</option>
            <option>Watch time</option>
            <option>Click-through and conversions</option>
            <option>Follower growth</option>
          </select>
        </label>

        <label className="field">
          <span>Audience</span>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Parents of school-age kids, 28-45"
          />
        </label>

        <label className="field">
          <span>Product context</span>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Skincare routine kit for teens"
          />
        </label>

        <label className="field">
          <span>Anything to avoid</span>
          <input
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="No competitor mentions, keep under 20s"
          />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Generating…" : "Generate ideas"}
        </button>
      </form>

      {batches.map((batch) => (
        <div key={batch.id}>
          <h2>{batch.campaign}</h2>
          <div className="grid grid-2">
            {batch.ideas.map((idea) => (
              <div className="card" key={idea.id}>
                <strong>{idea.title}</strong>
                <p className="muted" style={{ marginTop: 8 }}>{idea.concept}</p>
                {idea.hook && (
                  <div className="row"><span className="muted">Hook</span><span>{idea.hook}</span></div>
                )}
                {idea.lengthEstimate && (
                  <div className="row"><span className="muted">Length</span><span>{idea.lengthEstimate}</span></div>
                )}
                {idea.predictedLift && (
                  <div className="row">
                    <span className="muted">Predicted lift</span>
                    <span className="chip-good">{idea.predictedLift}</span>
                  </div>
                )}
                {idea.basedOnPatterns.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {idea.basedOnPatterns.map((p) => <span className="chip" key={p}>{p}</span>)}
                  </div>
                )}
                {idea.rationale && (
                  <p className="muted" style={{ marginTop: 10 }}>{idea.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

async function resolveOrgId(): Promise<string> {
  const res = await fetch("/api/session");
  return (await res.json()).organizationId as string;
}
