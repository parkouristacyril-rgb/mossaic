import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const metadata = { title: "Knowledge Base — Mossaic" };
export const dynamic = "force-dynamic";

// Patterns are the "creative principles" this page is about; their lifecycle
// status drives the chip.
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  EMERGING: "Emerging",
  FADING: "Fading",
};

const chipStyle = (status: string): React.CSSProperties | undefined => {
  if (status === "EMERGING") return { background: "rgba(255,193,7,0.12)", borderColor: "rgba(255,193,7,0.3)", color: "#FFC107" };
  if (status === "FADING") return { background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.3)", color: "#f87171" };
  return undefined; // CONFIRMED uses the default chip styling
};

export default async function KnowledgePage() {
  const org = await currentOrganization();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [principles, confirmedCount, emergingCount, addedThisMonth] = await Promise.all([
    db.pattern.findMany({
      where: { organizationId: org.id },
      orderBy: [{ confidence: "desc" }],
      select: { id: true, name: true, description: true, status: true, confidence: true, performanceLift: true },
    }),
    db.pattern.count({ where: { organizationId: org.id, status: "CONFIRMED" } }),
    db.pattern.count({ where: { organizationId: org.id, status: "EMERGING" } }),
    db.pattern.count({ where: { organizationId: org.id, createdAt: { gte: monthStart } } }),
  ]);

  const tiles: [number, string][] = [
    [confirmedCount, "Confirmed Principles"],
    [addedThisMonth, "Added this month"],
    [emergingCount, "Emerging"],
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Knowledge Base</h1>
      <p className="text-[var(--mist)] mb-6">Creative principles Mossaic has extracted and confirmed over time.</p>

      <div className="card p-5 mb-8" style={{ background: "rgba(123,47,247,0.06)" }}>
        <p className="font-mono text-[11px] text-[var(--violet-2)] mb-2">OUR PHILOSOPHY</p>
        <p className="text-sm text-[var(--mist)]">Analyze. Discover. Create. Remember. Every video you analyse makes the next idea sharper — nothing here ever resets to zero.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {tiles.map(([n, l]) => (
          <div key={l} className="stat-tile"><p className="font-display text-2xl font-semibold">{n}</p><p className="text-[var(--mist-dim)] text-[11px] mt-1">{l}</p></div>
        ))}
      </div>

      {principles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--mist)] text-sm">No principles yet. As videos are analysed, Mossaic distils the patterns behind them into principles here — and nothing ever resets to zero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {principles.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium mb-1">{p.name}</p>
                  <p className="text-[var(--mist)] text-sm">{p.description}</p>
                  <p className="font-mono text-[11px] text-[var(--mist-dim)] mt-2">
                    Confidence {p.confidence}%
                    {p.performanceLift != null && ` · ${p.performanceLift > 0 ? "+" : ""}${p.performanceLift}% lift`}
                  </p>
                </div>
                <span className="chip in whitespace-nowrap" style={chipStyle(p.status)}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
