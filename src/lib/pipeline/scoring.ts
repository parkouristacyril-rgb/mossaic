import type { ScrapedVideo } from "@/lib/providers/apify";

/**
 * Fields the scoring math cannot run without. A fresh upload often returns
 * some of these as undefined — that is not a failure, it just means the video
 * must not enter pattern mining yet or it would drag every average down.
 */
const REQUIRED_STATS = [
  "playCount",
  "diggCount",
  "commentCount",
  "authorFans",
  "durationSeconds",
] as const;

export type ReadinessResult = {
  complete: boolean;
  missing: string[];
};

/**
 * Note this checks for *presence*, not for non-zero. A video with a genuine
 * zero view count is complete data; a video whose view count never arrived is
 * not. Conflating the two was a real bug in the spreadsheet version.
 */
export function checkReadiness(stats: ScrapedVideo): ReadinessResult {
  const missing = REQUIRED_STATS.filter((key) => stats[key] === undefined);
  return { complete: missing.length === 0, missing };
}

export type Scores = {
  viralityIndex: number;
  algorithmVerdict: string;
  distributionScore: number;
  replicationOdds: number;
  confidence: string;
  engagementRate: number;
};

/**
 * Engagement relative to reach, not raw totals — otherwise a big account
 * always outranks a small one and the patterns learned are just "be famous".
 */
function engagementRate(stats: ScrapedVideo): number {
  const plays = stats.playCount ?? 0;
  if (plays === 0) return 0;
  const interactions =
    (stats.diggCount ?? 0) +
    (stats.commentCount ?? 0) +
    (stats.shareCount ?? 0) +
    (stats.collectCount ?? 0);
  return interactions / plays;
}

/**
 * How far a video travelled beyond the creator's existing audience. A clip
 * with 10x the creator's follower count in views was pushed by the algorithm;
 * one that reached a fraction of them was suppressed or simply ignored.
 */
function reachMultiple(stats: ScrapedVideo): number {
  const fans = stats.authorFans ?? 0;
  const plays = stats.playCount ?? 0;
  if (fans === 0) return plays > 0 ? 1 : 0;
  return plays / fans;
}

export function computeScores(stats: ScrapedVideo): Scores {
  const er = engagementRate(stats);
  const reach = reachMultiple(stats);

  // Log scale: the gap between 1x and 10x reach matters far more than the gap
  // between 100x and 110x, and a linear scale would compress everything real
  // into the bottom of the range.
  const reachScore = Math.min(10, Math.log10(Math.max(reach, 0.01) + 1) * 4.2);
  const engagementScore = Math.min(10, er * 100);

  const viralityIndex = round1(reachScore * 0.6 + engagementScore * 0.4);
  const distributionScore = Math.round(Math.min(100, reachScore * 10));

  return {
    viralityIndex,
    algorithmVerdict: verdictFor(viralityIndex, reach),
    distributionScore,
    replicationOdds: replicationOdds(viralityIndex, er),
    confidence: confidenceFor(stats),
    engagementRate: round4(er),
  };
}

function verdictFor(index: number, reach: number): string {
  if (index >= 9 || reach >= 25) return "Viral breakout";
  if (index >= 7) return "Boosted by algorithm";
  if (index >= 4.5) return "Steady organic reach";
  if (index >= 2) return "Limited distribution";
  return "Did not travel";
}

/**
 * How likely the same creative approach is to work again. High reach driven by
 * strong engagement is repeatable; high reach with weak engagement usually
 * means the clip caught a trend rather than doing something reproducible.
 */
function replicationOdds(index: number, er: number): number {
  const base = index * 7;
  const engagementBonus = Math.min(25, er * 250);
  return Math.round(Math.min(95, Math.max(5, base + engagementBonus)));
}

/**
 * Confidence in the *scores*, driven by sample size. Percentages computed from
 * a few hundred plays are noise; the same percentages over a million are not.
 */
function confidenceFor(stats: ScrapedVideo): string {
  const plays = stats.playCount ?? 0;
  if (plays >= 100_000) return "High";
  if (plays >= 10_000) return "Medium";
  return "Low";
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;
