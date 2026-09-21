import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: { id: string } }) {
  const video = await db.video.findUnique({
    where: { id: params.id },
    include: {
      analysis: true,
      scores: true,
      observations: { include: { member: { select: { name: true } } } },
      entityLinks: { include: { entity: true } },
      evidence: { include: { pattern: true } },
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });

  if (!video) notFound();

  const a = video.analysis;
  const s = video.scores;
  const latest = video.snapshots[0];

  const dimensions: Array<[string, string | null | undefined]> = [
    ["Hook", a?.hook],
    ["Pacing", a?.pacing],
    ["Visual composition", a?.visualComposition],
    ["Camera work", a?.cameraWork],
    ["Scene", a?.sceneEnvironment],
    ["People", a?.subjectPeople],
    ["Product", a?.objectProduct],
    ["On-screen text", a?.onScreenText],
    ["Voice", a?.voiceTone],
    ["Music", a?.music],
    ["Sound design", a?.soundDesign],
    ["Emotional arc", a?.emotionalArc],
    ["Spoken topic", a?.spokenTopic],
    ["Intent", a?.intent],
    ["Sentiment", a?.sentiment],
    ["Caption style", a?.captionStyle],
  ];

  return (
    <>
      <h1>{video.creatorHandle ?? "Video"}</h1>
      <p className="lede">
        <a href={video.url} target="_blank" rel="noreferrer">{video.url}</a>
      </p>

      {video.status !== "ANALYZED" && (
        <div className="notice notice-error">
          {video.status === "AWAITING_DATA"
            ? `Scores are on hold until the platform reports full stats. ${video.statusNote ?? ""}`
            : `Status: ${video.status.toLowerCase()}. ${video.statusNote ?? ""}`}
        </div>
      )}

      {s && (
        <div className="grid grid-4">
          <div className="card">
            <div className="stat-value">{s.viralityIndex}</div>
            <div className="stat-label">Virality index</div>
          </div>
          <div className="card">
            <div className="stat-value" style={{ fontSize: 17 }}>{s.algorithmVerdict}</div>
            <div className="stat-label">Algorithm verdict</div>
          </div>
          <div className="card">
            <div className="stat-value">{s.replicationOdds}%</div>
            <div className="stat-label">Replication odds</div>
          </div>
          <div className="card">
            <div className="stat-value">{s.distributionScore}</div>
            <div className="stat-label">Distribution score</div>
          </div>
        </div>
      )}

      {latest && (
        <>
          <h2>Latest performance</h2>
          <div className="card">
            <div className="row"><span className="muted">Views</span><span>{fmt(latest.playCount)}</span></div>
            <div className="row"><span className="muted">Likes</span><span>{fmt(latest.diggCount)}</span></div>
            <div className="row"><span className="muted">Comments</span><span>{fmt(latest.commentCount)}</span></div>
            <div className="row"><span className="muted">Shares</span><span>{fmt(latest.shareCount)}</span></div>
          </div>
        </>
      )}

      <h2>Creative breakdown</h2>
      <div className="card">
        {dimensions.filter(([, v]) => v).length === 0 ? (
          <p className="empty">Analysis has not finished yet.</p>
        ) : (
          dimensions
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div className="row" key={label}>
                <span className="muted">{label}</span>
                <span style={{ textAlign: "right" }}>{value}</span>
              </div>
            ))
        )}
      </div>

      {video.evidence.length > 0 && (
        <>
          <h2>Matched patterns</h2>
          <div className="card">
            {video.evidence.map((e) => (
              <div className="row" key={e.id}>
                <span>{e.pattern.name}</span>
                <span className="muted">{e.strength}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {video.entityLinks.length > 0 && (
        <>
          <h2>Entities mentioned</h2>
          <div className="card">
            {video.entityLinks.map((link) => (
              <span className="chip" key={link.entityId}>{link.entity.name}</span>
            ))}
          </div>
        </>
      )}

      {a?.seoKeywords && a.seoKeywords.length > 0 && (
        <>
          <h2>Keywords</h2>
          <div className="card">
            {a.seoKeywords.map((k) => <span className="chip" key={k}>{k}</span>)}
          </div>
        </>
      )}

      <h2>What people noticed</h2>
      <div className="card">
        {video.observations.length === 0 ? (
          <p className="empty">Imported in bulk — nobody recorded a reaction.</p>
        ) : (
          video.observations.map((o) => (
            <div className="row" key={o.id}>
              <div>
                <div>{o.reaction ?? "—"}</div>
                <div className="muted">{o.whyItWorked ?? ""}</div>
              </div>
              <span className="muted">{o.member?.name ?? "Unknown"}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("en-US");
