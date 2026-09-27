import Link from "next/link";
import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const hr = Math.floor(m / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const initials = (name: string) =>
  name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

const AVATARS = ["#7B2FF7", "var(--violet-2)", "#4C1D95", "#E23FCB", "#3A3550"];

export default async function AppHome() {
  const org = await currentOrganization();

  const [observationCount, patternCount, recent, weekCount] = await Promise.all([
    db.observation.count({ where: { organizationId: org.id } }),
    db.pattern.count({ where: { organizationId: org.id, status: { not: "FADING" } } }),
    db.observation.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        member: { select: { name: true } },
        video: { select: { id: true, creatorHandle: true, url: true } },
      },
    }),
    db.observation.count({
      where: {
        organizationId: org.id,
        createdAt: { gte: new Date(Date.now() - 7 * 864e5) },
      },
    }),
  ]);

  const momentum = await db.pattern.findMany({
    where: { organizationId: org.id },
    orderBy: [{ performanceLift: "desc" }],
    take: 4,
    select: { id: true, name: true, performanceLift: true },
  });

  // Capture activity heatmap — 13 weeks of real daily capture counts.
  const HEAT_COLS = 13;
  const HEAT_DAYS = HEAT_COLS * 7;
  const heatSince = new Date();
  heatSince.setHours(0, 0, 0, 0);
  heatSince.setDate(heatSince.getDate() - (HEAT_DAYS - 1));
  const heatObs = await db.observation.findMany({
    where: { organizationId: org.id, createdAt: { gte: heatSince } },
    select: { createdAt: true },
  });
  const heatCounts = new Array<number>(HEAT_DAYS).fill(0);
  const heatStartMs = heatSince.getTime();
  for (const { createdAt } of heatObs) {
    const idx = Math.floor((createdAt.getTime() - heatStartMs) / 864e5);
    if (idx >= 0 && idx < HEAT_DAYS) heatCounts[idx]++;
  }
  const heatMax = Math.max(1, ...heatCounts);
  const heatLevel = (c: number) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / heatMax) * 4)));
  const heatTotal = heatCounts.reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">{greeting()}.</h1>
      <p className="text-[var(--mist)] mb-8">
        You&apos;re not just watching. You&apos;re noticing. Your Creative Intelligence for{" "}
        <span className="text-[var(--violet-2)]">{org.name}</span> grew today.
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Link href="/app/explore" className="action-card">
              <div className="action-icon" style={{ background: "var(--violet)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></svg></div>
              <p className="font-medium mb-1">Explore Intelligence</p>
              <p className="text-[var(--mist-dim)] text-sm">See what your team has learned together.</p>
            </Link>
            <Link href="/app/capture" className="action-card">
              <div className="action-icon" style={{ background: "var(--violet-2)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg></div>
              <p className="font-medium mb-1">Capture Observation</p>
              <p className="text-[var(--mist-dim)] text-sm">Share something interesting you noticed.</p>
            </Link>
            <Link href="/app/patterns" className="action-card">
              <div className="action-icon" style={{ background: "var(--magenta)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><circle cx="12" cy="12" r="2" /><circle cx="4" cy="6" r="1.6" /><circle cx="20" cy="6" r="1.6" /><circle cx="4" cy="18" r="1.6" /><circle cx="20" cy="18" r="1.6" /><line x1="10" y1="10.6" x2="5.4" y2="7" /><line x1="14" y1="10.6" x2="18.6" y2="7" /><line x1="10" y1="13.4" x2="5.4" y2="17" /><line x1="14" y1="13.4" x2="18.6" y2="17" /></svg></div>
              <p className="font-medium mb-1">Discover Patterns</p>
              <p className="text-[var(--mist-dim)] text-sm">Uncover recurring creative principles.</p>
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-medium">Live Intelligence Feed</p>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--good)]"><span className="w-1.5 h-1.5 rounded-full bg-[var(--good)]"></span>Live</span>
            </div>
            <div className="space-y-4">
              {recent.length === 0 ? (
                <p className="text-[var(--mist-dim)] text-sm">
                  Nothing captured yet. <Link href="/app/capture" className="text-[var(--violet-2)]">Add the first video</Link> and the analysis starts on its own.
                </p>
              ) : (
                recent.map((o, i) => (
                  <Link key={o.id} href={`/app/videos/${o.video.id}`} className="flex items-center justify-between cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="avatar-circle" style={{ background: AVATARS[i % AVATARS.length], fontSize: 10 }}>{initials(o.member?.name ?? "Bulk")}</div>
                      <div>
                        <p className="text-sm">{o.member?.name ?? "A bulk import"} captured a Creative Signal</p>
                        <p className="text-[var(--mist-dim)] text-xs">{o.reaction ?? o.video.creatorHandle ?? o.video.url}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--mist-dim)]">{timeAgo(o.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6" id="home-extra">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium">Gaining momentum</p>
                <span className="font-mono text-[11px] text-[var(--mist-dim)]">by lift</span>
              </div>
              <div className="space-y-3">
                {momentum.length === 0 ? (
                  <p className="text-[var(--mist-dim)] text-sm">Patterns appear once enough videos are analysed.</p>
                ) : (
                  momentum.map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--mist)] truncate mr-3">{p.name}</span>
                      <span className="font-mono text-[11px] text-[var(--good)] whitespace-nowrap">
                        {p.performanceLift == null ? "—" : `${p.performanceLift > 0 ? "+" : ""}${p.performanceLift}%`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium">Capture activity</p>
                <span className="font-mono text-[11px] text-[var(--mist-dim)]"><b>{heatTotal}</b> captures</span>
              </div>
              <div id="heatmap" style={{ "--cols": HEAT_COLS } as React.CSSProperties}>
                {Array.from({ length: HEAT_COLS }).map((_, c) => (
                  <div key={c} className="heat-col">
                    {Array.from({ length: 7 }).map((_, d) => (
                      <i key={d} data-l={heatLevel(heatCounts[c * 7 + d] ?? 0)} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="heat-legend">
                <span>Quiet</span>
                <i style={{ background: "var(--heat-0)" }} /><i style={{ background: "var(--heat-1)" }} />
                <i style={{ background: "var(--heat-2)" }} /><i style={{ background: "var(--heat-3)" }} />
                <i style={{ background: "var(--heat-4)" }} />
                <span>Busy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <p className="font-mono text-[11px] text-[var(--violet-2)] mb-3">INTELLIGENCE FACT</p>
            <p className="font-serif text-xl leading-snug">The best campaigns start with someone <span className="italic text-[var(--violet-2)]">noticing</span> what others ignore.</p>
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mt-4">MOSSAIC</p>
          </div>
          <div className="card p-6">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">FROM OUR TEAMS</p>
            <p className="text-sm text-[var(--mist)] italic mb-4">&quot;We stopped debating whose gut feeling was right. Mossaic just shows us which one actually was.&quot;</p>
            <div className="flex items-center gap-3">
              <div className="avatar-circle" style={{ background: "#4C1D95", fontSize: 11 }}>{org.name[0]?.toUpperCase() ?? "B"}</div>
              <div>
                <p className="text-[13px] font-medium">{org.name}</p>
                <p className="text-[11px] text-[var(--mist-dim)]">Social media team, Prague</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">TEAM INTELLIGENCE</p>
            <p className="font-display text-3xl font-semibold mb-1">{observationCount}</p>
            <p className="text-[var(--mist)] text-sm mb-4">Creative Signals captured all-time</p>
            <p className="font-mono text-[11px] text-[var(--good)]">{weekCount} added this week</p>
          </div>
          <div className="card p-6">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">YOUR IMPACT</p>
            <p className="text-sm text-[var(--mist)]">Your observations back <span className="text-[var(--violet-2)]">{patternCount} active {patternCount === 1 ? "pattern" : "patterns"}</span> in the library.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
