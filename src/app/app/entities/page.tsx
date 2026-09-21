import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

const typeLabel = (t: string) => t[0] + t.slice(1).toLowerCase();

export default async function EntitiesPage() {
  const org = await currentOrganization();

  const entities = await db.entity.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { videoLinks: true } } },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const total = entities.length;
  const competitors = entities.filter((e) => e.type === "COMPETITOR").length;
  const totalLinks = entities.reduce((n, e) => n + e._count.videoLinks, 0);
  const newThisMonth = entities.filter((e) => e.createdAt >= monthStart).length;

  const ranked = [...entities]
    .sort((a, b) => b._count.videoLinks - a._count.videoLinks)
    .slice(0, 12);

  // Type distribution as percentages of the total.
  const byType = new Map<string, number>();
  entities.forEach((e) => byType.set(e.type, (byType.get(e.type) ?? 0) + 1));
  const dist = [...byType.entries()]
    .map(([type, n]) => ({ type, pct: total ? Math.round((n / total) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const stats = [
    ["Entities tracked", total],
    ["Competitor brands", competitors],
    ["Video links", totalLinks],
    ["New this month", newThisMonth],
  ] as const;

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Entities &amp; Competitors</h1>
      <p className="text-[var(--mist)] mb-8">
        Every brand, product, place and person Mossaic has detected across your analysed content.
      </p>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {stats.map(([label, val]) => (
          <div key={label} className="stat-tile">
            <p className="font-display text-2xl font-semibold">{val.toLocaleString("en-US")}</p>
            <p className="text-[var(--mist-dim)] text-[11px] mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="card overflow-hidden">
          {ranked.length === 0 ? (
            <p className="text-[var(--mist-dim)] p-7">Nothing detected yet. Entities are pulled out automatically as videos are analysed.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[var(--mist-dim)] font-mono text-[11px]">
                  <th className="p-4 font-medium">Entity</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Videos</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((e, i) => (
                  <tr key={e.id} className={i === ranked.length - 1 ? "" : "border-b border-[var(--line)]"}>
                    <td className="p-4">{e.name}</td>
                    <td className="p-4 text-[var(--mist)]">{typeLabel(e.type)}</td>
                    <td className="p-4">{e._count.videoLinks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">ENTITY TYPES</p>
            <div className="space-y-3 text-sm">
              {dist.length === 0 ? (
                <p className="text-[var(--mist-dim)]">No entities yet.</p>
              ) : (
                dist.map((d) => (
                  <div key={d.type} className="flex items-center gap-3">
                    <span className="text-[var(--mist)]" style={{ width: 96, flexShrink: 0 }}>{typeLabel(d.type)}</span>
                    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${d.pct}%`, height: "100%", background: "linear-gradient(90deg,var(--violet),var(--magenta))" }} />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--mist-dim)]">{d.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card p-6" style={{ background: "rgba(123,47,247,0.06)" }}>
            <p className="font-mono text-[11px] text-[var(--violet-2)] mb-2">WHY THIS MATTERS</p>
            <p className="text-sm text-[var(--mist)]">Knowing which brands and topics show up alongside your best-performing content tells you where your category conversation actually lives.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
