import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const org = await currentOrganization();

  const [observationCount, patternCount, confAgg, patterns] = await Promise.all([
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
  ]);

  const avgConfidence = confAgg._avg.confidence;
  const avgLift = confAgg._avg.performanceLift;

  const stats = [
    ["Observations Analyzed", observationCount.toLocaleString("en-US")],
    ["Patterns Identified", patternCount.toString()],
    ["Avg. Confidence", avgConfidence == null ? "—" : `${Math.round(avgConfidence)}%`],
    ["Engagement Lift", avgLift == null ? "—" : `${avgLift > 0 ? "+" : ""}${avgLift.toFixed(1)}%`],
  ] as const;

  const drivers = [
    ["Curiosity", 68], ["Surprise", 57], ["Relatability", 52], ["Desire", 49],
  ] as const;

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
          <svg width="560" height="160" viewBox="0 0 560 160" className="w-full" style={{ height: 160 }}>
            <polyline points="0,120 56,100 112,70 168,90 224,55 280,75 336,40 392,60 448,30 504,20 560,10" fill="none" stroke="var(--violet-2)" strokeWidth="2.5" />
          </svg>
          <div className="flex justify-between font-mono text-[11px] text-[var(--mist-dim)] mt-2">
            <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
          </div>
        </div>
        <div className="card p-6">
          <p className="font-medium mb-4">Top Performing Patterns</p>
          <div className="space-y-3 font-mono text-[12px]">
            {patterns.length === 0 ? (
              <p className="text-[var(--mist-dim)]">No scored patterns yet.</p>
            ) : (
              patterns.map((p) => (
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
              <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
              <circle cx="55" cy="55" r="42" fill="none" stroke="var(--violet)" strokeWidth="16" strokeDasharray="110.8 153.5" strokeDashoffset="0" transform="rotate(-90 55 55)" />
              <circle cx="55" cy="55" r="42" fill="none" stroke="var(--violet-2)" strokeWidth="16" strokeDasharray="97.7 166.6" strokeDashoffset="-110.8" transform="rotate(-90 55 55)" />
              <circle cx="55" cy="55" r="42" fill="none" stroke="var(--magenta)" strokeWidth="16" strokeDasharray="39.6 224.7" strokeDashoffset="-208.5" transform="rotate(-90 55 55)" />
              <text x="55" y="51" textAnchor="middle" fill="var(--paper)" fontFamily="Bricolage Grotesque" fontSize="20" fontWeight="600">{patternCount}</text>
              <text x="55" y="67" textAnchor="middle" fill="var(--mist-dim)" fontFamily="IBM Plex Mono, monospace" fontSize="8">Total</text>
            </svg>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: "var(--violet)" }}></span>High <span className="text-[var(--mist-dim)]">42%</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: "var(--violet-2)" }}></span>Medium <span className="text-[var(--mist-dim)]">37%</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: "var(--magenta)" }}></span>Emerging <span className="text-[var(--mist-dim)]">15%</span></div>
            </div>
          </div>
        </div>
        <div className="card p-6 lg:col-span-2">
          <p className="font-medium mb-5">Most Active Psychological Drivers</p>
          <div className="space-y-3">
            {drivers.map(([name, pct]) => (
              <div key={name}>
                <div className="flex justify-between font-mono text-[11px] text-[var(--mist-dim)] mb-1"><span>{name}</span><span>{pct}%</span></div>
                <div className="prog-bar"><span style={{ width: `${pct}%` }}></span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
