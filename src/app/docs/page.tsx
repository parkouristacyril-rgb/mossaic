"use client";

import Link from "next/link";
import { useState } from "react";

type Panel = "start" | "engine" | "entities" | "api";

const NAV: { key: Panel; label: string; icon: React.ReactNode }[] = [
  { key: "start", label: "Getting Started", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" strokeLinejoin="round" /></svg> },
  { key: "engine", label: "Pattern Engine", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { key: "entities", label: "Entities", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><circle cx="4" cy="6" r="2" /><circle cx="20" cy="6" r="2" /><circle cx="4" cy="18" r="2" /><circle cx="20" cy="18" r="2" /><line x1="9.5" y1="10" x2="5.5" y2="7.2" /><line x1="14.5" y1="10" x2="18.5" y2="7.2" /><line x1="9.5" y1="14" x2="5.5" y2="16.8" /><line x1="14.5" y1="14" x2="18.5" y2="16.8" /></svg> },
  { key: "api", label: "API", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 4 3 12l5 8M16 4l5 8-5 8" strokeLinecap="round" strokeLinejoin="round" /></svg> },
];

export default function DocsPage() {
  const [panel, setPanel] = useState<Panel>("start");

  return (
    <div id="docs-view" style={{ position: "static", background: "transparent", display: "block" }}>
      <div className="app-shell">
        <aside className="app-sidebar">
          <div className="flex items-center justify-between md:mb-8 mb-3">
            <div className="flex items-center gap-3 px-1">
              <img src="/mark.webp" className="mk mk-sm" alt="Mossaic" />
              <span className="font-display font-semibold">Docs</span>
            </div>
            <Link href="/" className="md:hidden text-[var(--mist)] text-sm px-3 py-1.5 rounded-full btn-ghost">Exit</Link>
          </div>
          <nav className="app-nav-row md:flex-1">
            {NAV.map((n) => (
              <div key={n.key} className={`sidebar-item${panel === n.key ? " active" : ""}`} onClick={() => setPanel(n.key)}>
                {n.icon} {n.label}
              </div>
            ))}
          </nav>
          <Link href="/" className="sidebar-item mt-4 hidden md:flex">← Back to site</Link>
        </aside>

        <main className="app-main">
          {panel === "start" && (
            <div className="doc-panel active">
              <p className="font-mono text-[12px] text-[var(--violet-2)] mb-3">GETTING STARTED</p>
              <h2 className="font-display text-2xl font-semibold mb-6">Connect your first video in three steps.</h2>
              <div className="space-y-5 max-w-xl">
                {[
                  ["1", "v1", "Paste a TikTok link", "Mossaic pulls the video, transcript, and live performance data automatically."],
                  ["2", "v2", "Let the analysis run", "Takes a few minutes. You'll see patterns, entities, and scores populate live."],
                  ["3", "v3", "Explore or generate an idea", "Browse the pattern library, or ask for a full production concept."],
                ].map(([n, v, title, body]) => (
                  <div key={n} className="flex gap-4">
                    <div className={`icon-badge ${v}`} style={{ width: 36, height: 36, flexShrink: 0 }}><span className="font-mono text-sm">{n}</span></div>
                    <div><p className="font-medium mb-1">{title}</p><p className="text-[var(--mist)] text-sm">{body}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {panel === "engine" && (
            <div className="doc-panel active">
              <p className="font-mono text-[12px] text-[var(--violet-2)] mb-3">PATTERN ENGINE</p>
              <h2 className="font-display text-2xl font-semibold mb-6">How patterns get discovered and scored.</h2>
              <div className="space-y-4 max-w-xl text-[var(--mist)] text-sm leading-relaxed">
                <p>Every analysed video is checked against your existing pattern library. When a mechanism repeats across multiple distinct videos, Mossaic keeps it as evidence — never from a single guess.</p>
                <p><span className="text-[var(--paper)] font-medium">Detected</span> counts how many separate videos support a pattern. <span className="text-[var(--paper)] font-medium">Confidence</span> reflects how much evidence backs it. <span className="text-[var(--paper)] font-medium">Performance lift</span> compares videos with the pattern against your average.</p>
              </div>
            </div>
          )}
          {panel === "entities" && (
            <div className="doc-panel active">
              <p className="font-mono text-[12px] text-[var(--violet-2)] mb-3">ENTITIES</p>
              <h2 className="font-display text-2xl font-semibold mb-6">Every brand, place, and person — indexed.</h2>
              <p className="max-w-xl text-[var(--mist)] text-sm leading-relaxed">Mossaic extracts named entities from every video: brands, cities, people, products, and more. Ask which videos mention a competitor or a specific place, and get an instant answer.</p>
            </div>
          )}
          {panel === "api" && (
            <div className="doc-panel active">
              <p className="font-mono text-[12px] text-[var(--violet-2)] mb-3">API</p>
              <h2 className="font-display text-2xl font-semibold mb-6">Programmatic access (Expert plan).</h2>
              <div className="card p-5 font-mono text-[12px] text-[var(--mist)] overflow-x-auto">
                curl https://api.mossaic.app/v1/videos \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_KEY&quot; \<br />
                &nbsp;&nbsp;-d url=&quot;https://tiktok.com/...&quot;
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
