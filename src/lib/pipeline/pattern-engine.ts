import { db } from "@/lib/db";
import { generateJson, textPart } from "@/lib/providers/gemini";

/**
 * A mechanism only becomes a pattern once several *different* videos show it.
 * One video exhibiting something is an anecdote, and the whole promise of the
 * product is that it does not sell anecdotes back to the customer.
 */
const MIN_EVIDENCE = 3;

/** Below this, a pattern is kept but marked EMERGING rather than CONFIRMED. */
const CONFIRMED_THRESHOLD = 5;

const PATTERN_SYSTEM = `You find repeating creative mechanisms across a body of short-form video.

A mechanism is a repeatable creative choice — "cold open mid-action", "text
overlay counts down", "pause before the offer". It is never a topic ("skincare")
and never a metric ("high engagement").

Only report a mechanism if you can point to at least ${MIN_EVIDENCE} of the
supplied videos that genuinely exhibit it. It is correct and expected to return
an empty list when the material does not support any repeating mechanism.`;

type MinedPattern = {
  name: string;
  description: string;
  recommendedActions?: string[];
  evidence: Array<{ videoId: string; strength: number; note?: string }>;
};

type MineResult = { patterns?: MinedPattern[] };

export type PatternEngineReport = {
  videosConsidered: number;
  patternsWritten: number;
  patternsSkipped: number;
  statusChanges: string[];
};

/**
 * Runs across an organization's analyzed videos and updates the pattern
 * library. Intended to be called on a schedule, not per upload — patterns are
 * a property of the corpus, not of any single video.
 */
export async function runPatternEngine(
  organizationId: string,
): Promise<PatternEngineReport> {
  // Only videos whose stats were complete enough to score. Including
  // AWAITING_DATA rows would let half-loaded numbers shape the library.
  const videos = await db.video.findMany({
    where: { organizationId, status: "ANALYZED", analysis: { isNot: null } },
    include: { analysis: true, scores: true },
    orderBy: { analyzedAt: "desc" },
    take: 120,
  });

  const report: PatternEngineReport = {
    videosConsidered: videos.length,
    patternsWritten: 0,
    patternsSkipped: 0,
    statusChanges: [],
  };

  if (videos.length < MIN_EVIDENCE) return report;

  const corpus = videos.map((v) => ({
    videoId: v.id,
    hook: v.analysis?.hook,
    pacing: v.analysis?.pacing,
    visual: v.analysis?.visualComposition,
    camera: v.analysis?.cameraWork,
    text: v.analysis?.onScreenText,
    voice: v.analysis?.voiceTone,
    music: v.analysis?.music,
    arc: v.analysis?.emotionalArc,
    viralityIndex: v.scores?.viralityIndex,
  }));

  const mined = await generateJson<MineResult>(
    [
      textPart(`Here are ${corpus.length} analyzed videos.

${JSON.stringify(corpus, null, 1)}

Find the repeating creative mechanisms. Return JSON:
{
  "patterns": [
    {
      "name": "short mechanism name",
      "description": "one sentence on what the mechanism is",
      "recommendedActions": ["concrete instruction a creator could follow"],
      "evidence": [{ "videoId": "id from the list", "strength": 0-100, "note": "how it shows up here" }]
    }
  ]
}`),
    ],
    { systemInstruction: PATTERN_SYSTEM, temperature: 0.3, maxOutputTokens: 8192 },
  );

  const knownIds = new Set(videos.map((v) => v.id));

  for (const pattern of mined.patterns ?? []) {
    // Drop hallucinated ids before counting evidence, otherwise a model that
    // invents three ids can manufacture a pattern out of nothing.
    const evidence = (pattern.evidence ?? []).filter((e) => knownIds.has(e.videoId));

    if (!pattern.name || evidence.length < MIN_EVIDENCE) {
      report.patternsSkipped++;
      continue;
    }

    const lift = await computeLift(organizationId, evidence.map((e) => e.videoId));
    const confidence = confidenceFrom(evidence.length, evidence);
    const status = evidence.length >= CONFIRMED_THRESHOLD ? "CONFIRMED" : "EMERGING";

    const saved = await db.pattern.upsert({
      where: { organizationId_name: { organizationId, name: pattern.name } },
      create: {
        organizationId,
        name: pattern.name,
        description: pattern.description ?? "",
        status,
        confidence,
        performanceLift: lift,
        recommendedActions: pattern.recommendedActions ?? [],
      },
      update: {
        description: pattern.description ?? "",
        status,
        confidence,
        performanceLift: lift,
        recommendedActions: pattern.recommendedActions ?? [],
      },
    });

    for (const item of evidence) {
      await db.patternEvidence.upsert({
        where: { patternId_videoId: { patternId: saved.id, videoId: item.videoId } },
        create: {
          patternId: saved.id,
          videoId: item.videoId,
          strength: clamp(item.strength ?? 50),
          note: item.note ?? null,
        },
        update: { strength: clamp(item.strength ?? 50), note: item.note ?? null },
      });
    }

    report.patternsWritten++;
  }

  report.statusChanges = await markFadingPatterns(organizationId);
  return report;
}

/**
 * How much better videos carrying this pattern performed than the rest. This
 * is the number that turns "we noticed a thing" into "this thing is worth
 * doing", so it is computed from stored scores rather than asked of the model.
 */
async function computeLift(
  organizationId: string,
  videoIds: string[],
): Promise<number | null> {
  const [withPattern, overall] = await Promise.all([
    db.videoScore.aggregate({
      where: { videoId: { in: videoIds } },
      _avg: { engagementRate: true },
    }),
    db.videoScore.aggregate({
      where: { video: { organizationId } },
      _avg: { engagementRate: true },
    }),
  ]);

  const patternAvg = withPattern._avg.engagementRate;
  const baseline = overall._avg.engagementRate;
  if (!patternAvg || !baseline || baseline === 0) return null;

  return Math.round(((patternAvg - baseline) / baseline) * 1000) / 10;
}

/**
 * Confidence blends how many videos back the pattern with how strongly they
 * show it — five weak examples should not outrank three unmistakable ones.
 */
function confidenceFrom(
  count: number,
  evidence: Array<{ strength?: number }>,
): number {
  const volume = Math.min(1, count / 10);
  const avgStrength =
    evidence.reduce((sum, e) => sum + clamp(e.strength ?? 50), 0) / evidence.length / 100;
  return Math.round((volume * 0.5 + avgStrength * 0.5) * 100);
}

/**
 * A pattern that stops appearing in recent work is not deleted — it is marked
 * fading. Knowing a mechanism has stopped working is as useful as knowing it
 * started.
 */
async function markFadingPatterns(organizationId: string): Promise<string[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const changes: string[] = [];

  const patterns = await db.pattern.findMany({
    where: { organizationId, status: { not: "FADING" } },
    include: { evidence: { include: { video: true } } },
  });

  for (const pattern of patterns) {
    const hasRecent = pattern.evidence.some(
      (e) => e.video.analyzedAt && e.video.analyzedAt > cutoff,
    );
    if (!hasRecent && pattern.evidence.length > 0) {
      await db.pattern.update({
        where: { id: pattern.id },
        data: { status: "FADING" },
      });
      changes.push(`${pattern.name} -> FADING`);
    }
  }

  return changes;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
