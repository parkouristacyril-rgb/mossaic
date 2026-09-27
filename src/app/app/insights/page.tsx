import Link from "next/link";
import { db } from "@/lib/db";
import { currentOrganization } from "@/lib/org";

export const metadata = { title: "Insights — Mossaic" };
export const dynamic = "force-dynamic";

// Shape of one row of the "OrganizationInsights" database view
// (prisma/views/organization_insights.sql).
type OrgInsights = {
  organizationId: string;
  organizationName: string;
  organizationCreatedAt: Date;
  videoCount: number;
  analyzedVideoCount: number;
  processingVideoCount: number;
  observationCount: number;
  observationsLast7d: number;
  observationsLast30d: number;
  lastObservationAt: Date | null;
  patternCount: number;
  confirmedPatternCount: number;
  emergingPatternCount: number;
  fadingPatternCount: number;
  avgConfidence: number | null;
  avgPerformanceLift: number | null;
  entityCount: number;
  ideaBatchCount: number;
  ideaCount: number;
  memberCount: number;
};

function timeAgo(date: Date | null) {
  if (!date) return "—";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const fmtLift = (v: number | null) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

export default async function InsightsPage() {
  const org = await currentOrganization();

  const rows = await db.$queryRaw<OrgInsights[]>`
    SELECT * FROM "OrganizationInsights" WHERE "organizationId" = ${org.id}
  `;
  const d = rows[0];

  // The view always returns a row for a real org, but stay defensive.
  if (!d) {
    return (
      <div>
        <h1 className="font-serif text-4xl mb-2">Insights</h1>
        <p className="text-[var(--mist)]">No insights are available for this workspace yet.</p>
      </div>
    );
  }

  const activePatterns = d.confirmedPatternCount + d.emergingPatternCount;
  const patternTotal = d.patternCount || 0;
  const seg = (n: number) => (patternTotal ? (n / patternTotal) * 100 : 0);

  const statusBars = [
    { label: "Confirmed", count: d.confirmedPatternCount, color: "var(--violet-2)" },
    { label: "Emerging", count: d.emergingPatternCount, color: "#FFC107" },
    { label: "Fading", count: d.fadingPatternCount, color: "#f87171" },
  ];

  const headline: { label: string; value: string; sub: string }[] = [
    {
      label: "Videos Analyzed",
      value: d.analyzedVideoCount.toLocaleString("en-US"),
      sub: `${d.videoCount.toLocaleString("en-US")} captured · ${d.processingVideoCount} in progress`,
    },
    {
      label: "Observations",
      value: d.observationCount.toLocaleString("en-US"),
      sub: `${d.observationsLast7d} this week`,
    },
    {
      label: "Active Patterns",
      value: activePatterns.toLocaleString("en-US"),
      sub: `${d.patternCount} tracked all-time`,
    },
    {
      label: "Avg. Engagement Lift",
      value: fmtLift(d.avgPerformanceLift),
      sub: d.avgConfidence == null ? "confidence —" : `${Math.round(d.avgConfidence)}% avg confidence`,
    },
  ];

  const isEmpty = d.observationCount === 0 && d.patternCount === 0 && d.videoCount === 0;

  const secondary: { label: string; value: string; href: string }[] = [
    { label: "Entities Tracked", value: d.entityCount.toLocaleString("en-US"), href: "/app/entities" },
    { label: "Ideas Generated", value: d.ideaCount.toLocaleString("en-US"), href: "/app/ideas" },
    { label: "Team Members", value: d.memberCount.toLocaleString("en-US"), href: "/app/team" },
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Insights</h1>
      <p className="text-[var(--mist)] mb-8">
        A live rollup of everything Mossaic knows about{" "}
        <span className="text-[var(--violet-2)]">{d.organizationName}</span>.
      </p>

      {isEmpty && (
        <div className="card p-5 mb-8" style={{ background: "rgba(123,47,247,0.06)" }}>
          <p className="text-sm text-[var(--mist)]">
            Nothing to summarise yet.{" "}
            <Link href="/app/capture" className="text-[var(--violet-2)]">Capture your first observation</Link>{" "}
            and these numbers start filling in on their own.
          </p>
        </div>
      )}

      {/* Headline KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {headline.map((k) => (
          <div key={k.label} className="stat-tile">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-2">{k.label}</p>
            <p className="font-display text-3xl font-semibold">{k.value}</p>
            <p className="text-[var(--mist-dim)] text-[11px] mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Detail cards */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-medium">Pattern Library Health</p>
            <Link href="/app/patterns" className="font-mono text-[11px] text-[var(--violet-2)]">Open library →</Link>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display text-3xl font-semibold">
              {d.avgConfidence == null ? "—" : `${Math.round(d.avgConfidence)}%`}
            </span>
            <span className="text-[var(--mist-dim)] text-sm">average confidence</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
            {patternTotal > 0 &&
              statusBars.map((s) =>
                s.count > 0 ? (
                  <span key={s.label} style={{ width: `${seg(s.count)}%`, background: s.color }} />
                ) : null,
              )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px]">
            {statusBars.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.label} <span className="text-[var(--mist-dim)]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-medium">Capture Momentum</p>
            <Link href="/app/capture" className="font-mono text-[11px] text-[var(--violet-2)]">Capture →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-display text-2xl font-semibold">{d.observationsLast7d}</p>
              <p className="text-[var(--mist-dim)] text-[11px] mt-1">Observations, last 7 days</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{d.observationsLast30d}</p>
              <p className="text-[var(--mist-dim)] text-[11px] mt-1">Observations, last 30 days</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{d.processingVideoCount}</p>
              <p className="text-[var(--mist-dim)] text-[11px] mt-1">Videos processing now</p>
            </div>
            <div>
              <p className="font-display text-2xl font-semibold">{timeAgo(d.lastObservationAt)}</p>
              <p className="text-[var(--mist-dim)] text-[11px] mt-1">Last capture</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary tiles */}
      <div className="grid sm:grid-cols-3 gap-4">
        {secondary.map((s) => (
          <Link key={s.label} href={s.href} className="stat-tile tile-hover cursor-pointer">
            <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-2">{s.label}</p>
            <p className="font-display text-2xl font-semibold">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
