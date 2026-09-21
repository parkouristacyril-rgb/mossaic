import Link from "next/link";

export const metadata = { title: "Insights — Mossaic" };

const INSIGHTS: { icon: string; bg: string; title: string; body: string; when: string; href?: string }[] = [
  { icon: "✦", bg: "var(--violet-2)", title: "New pattern crossed 90% confidence", body: "“Immediate Emotional Reward” now backed by 124 observations", when: "2h ago", href: "/app/patterns" },
  { icon: "↗", bg: "#7B2FF7", title: "Engagement lift trending up", body: "Your average lift across active patterns rose from +27% to +32% this month", when: "1d ago", href: "/app/explore" },
  { icon: "📖", bg: "#4C1D95", title: "Knowledge base expanded", body: "3 new confirmed principles added from last week's observations", when: "2d ago", href: "/app/knowledge" },
  { icon: "⚠", bg: "#E23FCB", title: "A pattern is fading", body: "“Fast-cut montage” lift dropped from +18% to +6% over 30 days", when: "4d ago", href: "/app/patterns" },
];

export default function InsightsPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Insights</h1>
      <p className="text-[var(--mist)] mb-8">Everything Mossaic has surfaced for your team, in one feed.</p>
      <div className="space-y-4">
        {INSIGHTS.map((it) => {
          const inner = (
            <>
              <div className="flex items-center gap-4">
                <div className="avatar-circle" style={{ background: it.bg }}>{it.icon}</div>
                <div>
                  <p className="font-medium">{it.title}</p>
                  <p className="text-[var(--mist)] text-sm">{it.body}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-[var(--mist-dim)] whitespace-nowrap">{it.when}</span>
            </>
          );
          return it.href ? (
            <Link key={it.title} href={it.href} className="card p-5 flex items-center justify-between cursor-pointer tile-hover">{inner}</Link>
          ) : (
            <div key={it.title} className="card p-5 flex items-center justify-between">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
