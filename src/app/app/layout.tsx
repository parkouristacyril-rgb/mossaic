"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BgCanvas from "./BgCanvas";
import { NAV, FOOTER_NAV, LABELS } from "./nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [orgMenu, setOrgMenu] = useState(false);
  const [notifMenu, setNotifMenu] = useState(false);
  const [moreSheet, setMoreSheet] = useState(false);
  const topbarRef = useRef<HTMLDivElement>(null);

  // Close the popovers on any outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!topbarRef.current?.contains(e.target as Node)) {
        setOrgMenu(false);
        setNotifMenu(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const crumb = LABELS[pathname] ?? (pathname === "/app" ? "Home" : "");

  const bottomHrefs = ["/app", "/app/capture", "/app/patterns", "/app/ideas"];
  const bottomTabs = bottomHrefs.map((href) => NAV.find((n) => n.href === href)!);

  return (
    <div className="app-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <BgCanvas />
      <div className="app2-shell">
        {/* SIDEBAR */}
        <aside className={`app2-sidebar${collapsed ? " collapsed" : ""}`}>
          <div className="flex items-center justify-between px-2 mb-8">
            <div className="flex items-center gap-2.5">
              <img src="/mark.webp" className="mk mk-sm" alt="Mossaic" />
              {!collapsed && <span className="font-display font-semibold tracking-wide text-sm sidebar-label sidebar-wordmark">MOSSAIC</span>}
            </div>
            <div className="sidebar-collapse-btn" onClick={() => setCollapsed((c) => !c)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? "rotate(180deg)" : undefined }}>
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <nav className="space-y-0.5 flex-1">
            {NAV.map((item) => (
              <Link key={item.key} href={item.href} className={`app2-nav-item${isActive(item.href) ? " active" : ""}`}>
                {item.icon} {!collapsed && <span className="sidebar-label">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="pt-3 mt-3 border-t border-[var(--line)] space-y-0.5">
            {FOOTER_NAV.map((item) => (
              <Link key={item.key} href={item.href} className={`app2-nav-item${isActive(item.href) ? " active" : ""}`}>
                {item.icon} {!collapsed && <span className="sidebar-label">{item.label}</span>}
              </Link>
            ))}
          </div>

          {!collapsed && (
            <div className="mt-4 p-4 rounded-2xl border border-[var(--line)] plan-widget" style={{ background: "rgba(123,47,247,0.06)" }}>
              <p className="font-mono text-[10px] text-[var(--mist-dim)] mb-1">CURRENT PLAN</p>
              <p className="font-display text-lg font-semibold mb-1">Growth <span className="text-[var(--violet-2)]">✦</span></p>
              <p className="text-[11px] text-[var(--mist-dim)] mb-2">Renews on Aug 30, 2026</p>
              <Link href="/app/pricing" className="text-[11px] text-[var(--violet-2)] font-medium">Manage Plan →</Link>
            </div>
          )}
        </aside>

        {/* MAIN COLUMN */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="app2-topbar" ref={topbarRef}>
            <div className="flex items-center gap-2 font-mono text-[12px] text-[var(--mist-dim)] flex-shrink-0">
              <span>{crumb}</span>
            </div>
            <div className="relative hidden md:block flex-1 max-w-[420px]">
              <div className="search-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
                <input type="text" placeholder="Search patterns, ideas, entities…" className="bg-transparent border-none outline-none text-[13px] text-[var(--paper)] w-full placeholder:text-[var(--mist-dim)]" />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setNotifMenu((v) => !v); setOrgMenu(false); }} className="relative flex items-center justify-center" style={{ width: 32, height: 32, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mist)" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                </button>
                {notifMenu && (
                  <div className="absolute top-[calc(100%+8px)] right-0 card p-2 w-80 z-30">
                    <p className="font-mono text-[10px] text-[var(--mist-dim)] px-3 pt-1.5 pb-2">NOTIFICATIONS</p>
                    <Link href="/app/patterns" className="org-menu-item block" style={{ height: "auto", padding: "10px 12px" }} onClick={() => setNotifMenu(false)}>
                      <p className="text-sm">New pattern crossed 90% confidence</p>
                      <p className="text-[11px] text-[var(--mist-dim)]">&quot;Immediate Emotional Reward&quot; · 2h ago</p>
                    </Link>
                    <Link href="/app/insights" className="org-menu-item block" style={{ height: "auto", padding: "10px 12px" }} onClick={() => setNotifMenu(false)}>
                      <p className="text-sm">Engagement lift trending up</p>
                      <p className="text-[11px] text-[var(--mist-dim)]">+32% this month · 1d ago</p>
                    </Link>
                    <Link href="/app/knowledge" className="org-menu-item block" style={{ height: "auto", padding: "10px 12px" }} onClick={() => setNotifMenu(false)}>
                      <p className="text-sm">Knowledge base expanded</p>
                      <p className="text-[11px] text-[var(--mist-dim)]">3 new principles added · 2d ago</p>
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="avatar-circle" style={{ background: "var(--violet)" }}>JR</div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-sm font-medium">Jordan Reyes</p>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setOrgMenu((v) => !v); setNotifMenu(false); }} className="flex items-center gap-1 text-[11px] text-[var(--mist-dim)] hover:text-[var(--paper)] transition-colors" style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                      <span>BUMP</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {orgMenu && (
                      <div className="absolute top-[calc(100%+8px)] right-0 card p-1.5 w-48 z-30">
                        <p className="font-mono text-[10px] text-[var(--mist-dim)] px-3 pt-1.5 pb-1">ORGANIZATIONS</p>
                        <div className="org-menu-item active">BUMP</div>
                        <p className="font-mono text-[10px] text-[var(--mist-dim)] px-3 pt-2 pb-1.5" style={{ lineHeight: 1.5 }}>A second brand workspace comes with Expert.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="app2-main">{children}</div>
        </div>
      </div>

      {/* MOBILE BOTTOM TABBAR */}
      <nav className="bottom-tabbar" style={{ position: "relative" }}>
        {bottomTabs.map((t) => (
          <Link key={t.href} href={t.href} className={`tab-item${isActive(t.href) ? " active" : ""}`}>
            {t.icon}{t.label === "Video Ideas" ? "Ideas" : t.label}
          </Link>
        ))}
        <button className="tab-item" onClick={() => setMoreSheet(true)} style={{ background: "none", border: "none" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>More
        </button>
      </nav>

      {/* MOBILE MORE SHEET */}
      <div id="more-sheet-backdrop" className={moreSheet ? "open slide-in" : ""} onClick={() => setMoreSheet(false)} />
      <div id="more-sheet" className={moreSheet ? "open slide-in" : ""}>
        <div className="sheet-handle" />
        {[...NAV.filter((n) => !bottomTabs.some((b) => b.href === n.href)), ...FOOTER_NAV].map((item) => (
          <Link key={item.key} href={item.href} className="sheet-nav-item" onClick={() => setMoreSheet(false)}>
            {item.icon}{item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
