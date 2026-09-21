import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function PatternsPage() {
  const org = await currentOrganization();
  const patterns = await db.pattern.findMany({
    where: { organizationId: org.id },
    orderBy: [{ confidence: "desc" }],
    include: {
      _count: { select: { evidence: true } },
      evidence: {
        orderBy: { strength: "desc" },
        take: 3,
        include: { video: { select: { id: true, creatorHandle: true, url: true } } },
      },
    },
  });

  return (
    <>
      <h1>Patterns</h1>
      <p className="lede">
        Creative mechanisms that show up again and again in your work — each one
        backed by the videos that prove it.
      </p>

      {patterns.length === 0 ? (
        <div className="card">
          <p className="empty">
            No patterns yet. Mosaic needs at least a handful of analysed videos
            before a mechanism can count as repeating rather than coincidental.
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {patterns.map((p) => (
            <div className="card" key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{p.name}</strong>
                <span className={`chip ${p.status === "CONFIRMED" ? "chip-good" : ""}`}>
                  {p.status.toLowerCase()}
                </span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>{p.description}</p>

              <div className="row">
                <span className="muted">Confidence</span>
                <span>{p.confidence}%</span>
              </div>
              <div className="row">
                <span className="muted">Supporting videos</span>
                <span>{p._count.evidence}</span>
              </div>
              <div className="row">
                <span className="muted">Engagement lift</span>
                <span className={p.performanceLift && p.performanceLift > 0 ? "chip-good" : ""}>
                  {p.performanceLift === null ? "—" : `${p.performanceLift > 0 ? "+" : ""}${p.performanceLift}%`}
                </span>
              </div>

              {p.recommendedActions.length > 0 && (
                <>
                  <h2 style={{ fontSize: 14, marginBottom: 6 }}>What to do with it</h2>
                  <ul style={{ margin: 0, paddingLeft: 18 }} className="muted">
                    {p.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </>
              )}

              {p.evidence.length > 0 && (
                <>
                  <h2 style={{ fontSize: 14, marginBottom: 6 }}>Evidence</h2>
                  {p.evidence.map((e) => (
                    <div className="row" key={e.id}>
                      <a href={`/videos/${e.video.id}`}>
                        {e.video.creatorHandle ?? e.video.url}
                      </a>
                      <span className="muted">{e.strength}%</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
