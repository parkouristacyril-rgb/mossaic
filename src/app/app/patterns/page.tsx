import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";
import PatternsExplorer, { type PatternVM } from "./PatternsExplorer";

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
        take: 6,
        include: { video: { select: { id: true, creatorHandle: true, url: true } } },
      },
    },
  });

  const vms: PatternVM[] = patterns.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    confidence: p.confidence,
    performanceLift: p.performanceLift,
    evidenceCount: p._count.evidence,
    recommendedActions: p.recommendedActions,
    evidence: p.evidence.map((e) => ({
      id: e.id,
      strength: e.strength,
      videoId: e.video.id,
      label: e.video.creatorHandle ?? e.video.url,
    })),
  }));

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Discover Patterns</h1>
      <p className="text-[var(--mist)] mb-8">
        Explore recurring creative patterns and psychological drivers that drive engagement and results.
      </p>
      <PatternsExplorer patterns={vms} />
    </div>
  );
}
