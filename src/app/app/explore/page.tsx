import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

// Donut geometry — kept here so the arc math and the SVG agree.
const DONUT_R = 42;
const DONUT_CIRC = 2 * Math.PI * DONUT_R; // ~263.9

const titleCase = (key: string) =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default async function ExplorePage() {
  const org = await currentOrganization();

  // Six month buckets ending with the current month, for the engagement trend.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const MONTHS = 6;
  const buckets = Array.from({ length: MONTHS }, (_, i) => {
    const m = new Date(monthStart.getFullYear(), monthStart.getMonth() - (MONTHS - 1 - i), 1);
    return { label: m.toLocaleString("en-US", { month: "short" }), key: `${m.getFullYear()}-${m.getMonth()}`, total: 0 };
  });
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));
  const since = new Date(monthStart.getFullYear(), monthStart.getMonth() - (MONTHS - 1), 1);

  const [observationCount, patternCount, confAgg, topPatterns, confidences, analyses, snapshots] =
    await Promise.all([
      db.observation.count({ where: { organizationId: org.id } }),
      db.pattern.count({ where: { organizationId: org.id } }),
      db.pattern.aggregate({
        where: { organizationId: org.id },
        _avg: { confidence: true, performanceLift: true },
      }),
      db.pattern.findMany({
        where: { organizationId: org.id, performanceLift: { not: null } },
        orderBy: { performanceLift: "desc" },
        take: 3,
        select: { id: true, name: true, performanceLift: true },
      }),
      db.pattern.findMany({
        where: { organizationId: org.id },
        select: { confidence: true },
      }),
      db.videoAnalysis.findMany({
        where: { video: { organizationId: org.id } },
        select: { brandPsychology: true },
      }),
      db.performanceSnapshot.findMany({
        where: { video: { organizationId: org.id }, fetchedAt: { gte: since } },
        select: { fetchedAt: true, diggCount: true, commentCount: true, shareCount: true, collectCount: true },
      }),
    ]);

  const avgConfidence = confAgg._avg.confidence;
  const avgLift = confAgg._avg.performanceLift;

  const stats = [
    ["Observations Analyzed", observationCount.toLocaleString("en-US")],
    ["Patterns Identified", patternCount.toString()],
    ["Avg. Confidence", avgConfidence == null ? "—" : `${Math.round(avgConfidence)}%`],
    ["Engagement Lift", avgLift == null ? "—" : `${avgLift > 0 ? "+" : ""}${avgLift.toFixed(1)}%`],
  ] as const;

  // --- Engagement over time: total recorded interactions per month ------------
  for (const s of snapshots) {
    const idx = bucketIndex.get(`${s.fetchedAt.getFullYear()}-${s.fetchedAt.getMonth()}`);
    if (idx == null) continue;
    buckets[idx].total +=
      (s.diggCount ?? 0) + (s.commentCount ?? 0) + (s.shareCount ?? 0) + (s.collectCount ?? 0);
  }
  const hasEngagement = buckets.some((b) => b.total > 0);
  const maxEngagement = Math.max(1, ...buckets.map((b) => b.total));
  const CH_W = 560;
  const CH_H = 160;
  const PAD = 12;
  const points = buckets
    .map((b, i) => {
      const x = buckets.length === 1 ? CH_W / 2 : (i / (buckets.length - 1)) * CH_W;
      const y = CH_H - PAD - (b.total / maxEngagement) * (CH_H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // --- Pattern confidence distribution ---------------------------------------
  const high = confidences.filter((p) => p.confidence >= 80).length;
  const medium = confidences.filter((p) => p.confidence >= 50 && p.confidence < 80).length;
  const low = confidences.filter((p) => p.confidence < 50).length;
  const pct = (n: number) => (patternCount ? Math.round((n / patternCount) * 100) : 0);

  const segments = [
    { label: "High", count: high, color: "var(--violet)", hint: "80%+" },
    { label: "Medium", count: medium, color: "var(--violet-2)", hint: "50–79%" },
    { label: "Low", count: low, color: "var(--magenta)", hint: "<50%" },
  ];
  let acc = 0;
  const arcs = segments.map((s) => {
    const len = patternCount ? (s.count / patternCount) * DONUT_CIRC : 0;
    const arc = {
      color: s.color,
      dash: `${len.toFixed(2)} ${(DONUT_CIRC - len).toFixed(2)}`,
      offset: -acc,
      len,
    };
    acc += len;
    return arc;
  });

  // --- Most active psychological drivers: averaged brandPsychology axes -------
  const driverSums = new Map<string, { sum: number; n: number }>();
  for (const a of analyses) {
    const bp = a.brandPsychology as Record<string, unknown> | null;
    if (!bp || typeof bp !== "object" || Array.isArray(bp)) continue;
    for (const [key, value] of Object.entries(bp)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        const entry = driverSums.get(key) ?? { sum: 0, n: 0 };
        entry.sum += value;
        entry.n += 1;
        driverSums.set(key, entry);
      }
    }
  }
  const drivers = [...driverSums.entries()]
    .map(([key, { sum, n }]) => ({ name: titleCase(key), pct: Math.round(sum / n) }))
    .filter((d) => d.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Explore Intelligence</h1>
      <p className="text-[var(--mist)] mb-8">
        Discover patterns, insights, and creative truths hidden in your content.{" "}
        <span className="egg-stat">Even we find this fascinating<span className="egg-tooltip">Every minute, roughly 34,000 hours of short-form video get watched worldwide — and almost none of it gets analysed like this</span></span>.
      </p>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {stats.map(([label, val]) => (
          <div key={label} className="stat-tile">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-2">{label}</p>
            <p className="font-display text-2xl font-semibold">{val}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 border-b border-[var(--line)] mb-6 font-mono">
        <span className="app2-tab active">Overview</span>
        <span className="app2-tab">Top Patterns</span>
        <span className="app2-tab">Psychological Drivers</span>
        <span className="app2-tab">Performance</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 lg:col-span-2">
          <p className="font-medium mb-4">Engagement Over Time</p>
          {hasEngagement ? (
            <>
              <svg width={CH_W} height={CH_H} viewBox={`0 0 ${CH_W} ${CH_H}`} className="w-full" style={{ height: CH_H }}>
                <polyline points={points} fill="none" stroke="var(--violet-2)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <div className="flex justify-between font-mono text-[11px] text-[var(--mist-dim)] mt-2">
                {buckets.map((b) => (
                  <span key={b.key}>{b.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center text-center text-sm text-[var(--mist-dim)]" style={{ height: CH_H }}>
              Engagement trends appear once the pipeline records performance data for your videos.
            </div>
          )}
        </div>
        <div className="card p-6">
          <p className="font-medium mb-4">Top Performing Patterns</p>
          <div className="space-y-3 font-mono text-[12px]">
            {topPatterns.length === 0 ? (
              <p className="text-[var(--mist-dim)]">No scored patterns yet.</p>
            ) : (
              topPatterns.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span className="text-[var(--mist)] truncate mr-3">{p.name}</span>
                  <span className="text-[var(--good)] whitespace-nowrap">{p.performanceLift! > 0 ? "+" : ""}{p.performanceLift}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="font-medium mb-5">Pattern Confidence Distribution</p>
          <div className="flex items-center gap-6">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r={DONUT_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
              {patternCount > 0 &&
                arcs.map((arc, i) =>
                  arc.len > 0 ? (
                    <circle
                      key={i}
                      cx="55"
                      cy="55"
                      r={DONUT_R}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth="16"
                      strokeDasharray={arc.dash}
                      strokeDashoffset={arc.offset}
                      transform="rotate(-90 55 55)"
                    />
                  ) : null,
                )}
              <text x="55" y="51" textAnchor="middle" fill="var(--paper)" fontSize="20" fontWeight="600" style={{ fontFamily: "var(--ui-display)", letterSpacing: "-.02em" }}>{patternCount}</text>
              <text x="55" y="67" textAnchor="middle" fill="var(--mist-dim)" fontSize="8" style={{ fontFamily: "var(--ui)" }}>Total</text>
            </svg>
            <div className="space-y-2 font-mono text-[11px]">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }}></span>
                  {s.label} <span className="text-[var(--mist-dim)]">{s.count} · {pct(s.count)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card p-6 lg:col-span-2">
          <p className="font-medium mb-5">Most Active Psychological Drivers</p>
          {drivers.length === 0 ? (
            <p className="text-sm text-[var(--mist-dim)]">Drivers appear once videos have been analysed for brand psychology.</p>
          ) : (
            <div className="space-y-3">
              {drivers.map(({ name, pct }) => (
                <div key={name}>
                  <div className="flex justify-between font-mono text-[11px] text-[var(--mist-dim)] mb-1"><span>{name}</span><span>{pct}%</span></div>
                  <div className="prog-bar"><span style={{ width: `${pct}%` }}></span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
