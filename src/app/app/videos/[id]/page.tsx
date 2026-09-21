import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("en-US");

const statusLabel = (s: string) =>
  ({ ANALYZED: "Analysed", PROCESSING: "Analysing…", AWAITING_DATA: "Waiting on stats", FAILED: "Failed", PENDING: "Queued" }[s] ?? s);

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
    ["Hook", a?.hook], ["Pacing", a?.pacing], ["Visual composition", a?.visualComposition],
    ["Camera work", a?.cameraWork], ["Scene", a?.sceneEnvironment], ["People", a?.subjectPeople],
    ["Product", a?.objectProduct], ["On-screen text", a?.onScreenText], ["Voice", a?.voiceTone],
    ["Music", a?.music], ["Sound design", a?.soundDesign], ["Emotional arc", a?.emotionalArc],
    ["Spoken topic", a?.spokenTopic], ["Intent", a?.intent], ["Sentiment", a?.sentiment],
    ["Caption style", a?.captionStyle],
  ];
  const filled = dimensions.filter(([, v]) => v);

  return (
    <div>
      <Link href="/app" className="font-mono text-[12px] text-[var(--mist-dim)] hover:text-[var(--paper)]">← Back</Link>
      <h1 className="font-serif text-4xl mb-1 mt-3">{video.creatorHandle ?? "Video"}</h1>
      <p className="mb-8"><a href={video.url} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-[var(--violet-2)] break-all">{video.url}</a></p>

      {video.status !== "ANALYZED" && (
        <div className="notice notice-error">
          {video.status === "AWAITING_DATA"
            ? `Scores are on hold until the platform reports full stats. ${video.statusNote ?? ""}`
            : `Status: ${statusLabel(video.status)}. ${video.statusNote ?? ""}`}
        </div>
      )}

      {s && (
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          {[
            [s.viralityIndex, "Virality index"],
            [s.algorithmVerdict, "Algorithm verdict"],
            [`${s.replicationOdds}%`, "Replication odds"],
            [s.distributionScore, "Distribution score"],
          ].map(([val, label]) => (
            <div key={label as string} className="stat-tile">
              <p className="font-display text-2xl font-semibold" style={typeof val === "string" && (val as string).length > 6 ? { fontSize: 17 } : undefined}>{val}</p>
              <p className="text-[var(--mist-dim)] text-[11px] mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-3">CREATIVE BREAKDOWN</p>
          <div className="card p-6">
            {filled.length === 0 ? (
              <p className="text-[var(--mist-dim)]">Analysis has not finished yet.</p>
            ) : (
              filled.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3 border-b border-[var(--line)] last:border-0">
                  <span className="text-[var(--mist-dim)] text-sm flex-shrink-0">{label}</span>
                  <span className="text-sm text-right">{value}</span>
                </div>
              ))
            )}
          </div>

          {video.evidence.length > 0 && (
            <>
              <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-3 mt-8">MATCHED PATTERNS</p>
              <div className="card p-6">
                {video.evidence.map((e) => (
                  <div key={e.id} className="flex justify-between py-2.5 border-b border-[var(--line)] last:border-0">
                    <Link href="/app/patterns" className="text-sm text-[var(--violet-2)]">{e.pattern.name}</Link>
                    <span className="font-mono text-[11px] text-[var(--mist-dim)]">{e.strength}% match</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          {latest && (
            <div className="card p-6">
              <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-4">LATEST PERFORMANCE</p>
              {[["Views", latest.playCount], ["Likes", latest.diggCount], ["Comments", latest.commentCount], ["Shares", latest.shareCount]].map(([l, v]) => (
                <div key={l as string} className="flex justify-between py-2 text-sm"><span className="text-[var(--mist-dim)]">{l}</span><span>{fmt(v as number | null)}</span></div>
              ))}
            </div>
          )}

          {video.entityLinks.length > 0 && (
            <div className="card p-6">
              <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">ENTITIES MENTIONED</p>
              <div className="flex flex-wrap gap-2">
                {video.entityLinks.map((l) => <span key={l.entityId} className="chip in">{l.entity.name}</span>)}
              </div>
            </div>
          )}

          {a?.seoKeywords && a.seoKeywords.length > 0 && (
            <div className="card p-6">
              <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">KEYWORDS</p>
              <div className="flex flex-wrap gap-2">
                {a.seoKeywords.map((k) => <span key={k} className="chip in">{k}</span>)}
              </div>
            </div>
          )}

          <div className="card p-6">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">WHAT PEOPLE NOTICED</p>
            {video.observations.length === 0 ? (
              <p className="text-[var(--mist-dim)] text-sm">Imported in bulk — nobody recorded a reaction.</p>
            ) : (
              <div className="space-y-3">
                {video.observations.map((o) => (
                  <div key={o.id}>
                    <p className="text-sm">{o.reaction ?? "—"}</p>
                    <p className="text-[var(--mist-dim)] text-xs">{o.whyItWorked ?? ""} {o.member?.name ? `· ${o.member.name}` : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
