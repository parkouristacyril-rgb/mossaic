import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const org = await currentOrganization();

  const [videoCount, analyzedCount, patternCount, observationCount, recent, avg] =
    await Promise.all([
      db.video.count({ where: { organizationId: org.id } }),
      db.video.count({ where: { organizationId: org.id, status: "ANALYZED" } }),
      db.pattern.count({ where: { organizationId: org.id, status: { not: "FADING" } } }),
      db.observation.count({ where: { organizationId: org.id } }),
      db.observation.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          member: { select: { name: true } },
          video: { select: { id: true, creatorHandle: true, status: true, url: true } },
        },
      }),
      db.videoScore.aggregate({
        where: { video: { organizationId: org.id } },
        _avg: { viralityIndex: true },
      }),
    ]);

  return (
    <>
      <h1>{org.name}</h1>
      <p className="lede">
        Everything the team has noticed, analysed and learned — in one place.
      </p>

      <div className="grid grid-4">
        <div className="card">
          <div className="stat-value">{observationCount}</div>
          <div className="stat-label">Observations captured</div>
        </div>
        <div className="card">
          <div className="stat-value">{analyzedCount}<span className="muted"> / {videoCount}</span></div>
          <div className="stat-label">Videos analysed</div>
        </div>
        <div className="card">
          <div className="stat-value">{patternCount}</div>
          <div className="stat-label">Active patterns</div>
        </div>
        <div className="card">
          <div className="stat-value">
            {avg._avg.viralityIndex ? avg._avg.viralityIndex.toFixed(1) : "—"}
          </div>
          <div className="stat-label">Average virality index</div>
        </div>
      </div>

      <h2>Recently captured</h2>
      <div className="card">
        {recent.length === 0 ? (
          <p className="empty">
            Nothing captured yet. <a href="/share">Add the first video</a> and the
            analysis starts on its own.
          </p>
        ) : (
          recent.map((obs) => (
            <div className="row" key={obs.id}>
              <div>
                <a href={`/videos/${obs.video.id}`}>
                  {obs.video.creatorHandle ?? obs.video.url}
                </a>
                <div className="muted">
                  {obs.reaction ?? "Bulk import — no notes"}
                </div>
              </div>
              <div className="muted" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                {obs.member?.name ?? "Unknown"}
                <br />
                {statusLabel(obs.video.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "ANALYZED": return "Analysed";
    case "PROCESSING": return "Analysing…";
    case "AWAITING_DATA": return "Waiting on stats";
    case "FAILED": return "Failed";
    default: return "Queued";
  }
}
