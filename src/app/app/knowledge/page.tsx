export const metadata = { title: "Knowledge Base — Mossaic" };

const PRINCIPLES: { title: string; body: string; status: "Confirmed" | "Emerging" }[] = [
  { title: "Contrast-driven storytelling increases retention", body: "Videos that set up a clear “before” state retain viewers 22% longer on average.", status: "Confirmed" },
  { title: "Real people outperform stock-style footage", body: "Unscripted, handheld framing consistently beats polished studio shots for this audience.", status: "Confirmed" },
  { title: "Silence before the offer builds anticipation", body: "A brief pause (0.5–1s) right before the call-to-action correlates with higher completion.", status: "Emerging" },
  { title: "Text overlays should change every 2–3 seconds", body: "Static on-screen text held longer than 3 seconds shows a measurable attention drop.", status: "Confirmed" },
];

export default function KnowledgePage() {
  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Knowledge Base</h1>
      <p className="text-[var(--mist)] mb-6">Creative principles Mossaic has extracted and confirmed over time.</p>

      <div className="card p-5 mb-8" style={{ background: "rgba(123,47,247,0.06)" }}>
        <p className="font-mono text-[11px] text-[var(--violet-2)] mb-2">OUR PHILOSOPHY</p>
        <p className="text-sm text-[var(--mist)]">Analyze. Discover. Create. Remember. Every video you analyse makes the next idea sharper — nothing here ever resets to zero.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[["48", "Confirmed Principles"], ["12", "Added this month"], ["6", "Categories"]].map(([n, l]) => (
          <div key={l} className="stat-tile"><p className="font-display text-2xl font-semibold">{n}</p><p className="text-[var(--mist-dim)] text-[11px] mt-1">{l}</p></div>
        ))}
      </div>

      <div className="space-y-3">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium mb-1">{p.title}</p>
                <p className="text-[var(--mist)] text-sm">{p.body}</p>
              </div>
              <span
                className="chip in whitespace-nowrap"
                style={p.status === "Emerging" ? { background: "rgba(255,193,7,0.12)", borderColor: "rgba(255,193,7,0.3)", color: "#FFC107" } : undefined}
              >
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
