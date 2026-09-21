"use client";

import type { ReactNode } from "react";

// Icons kept small and inline so the whole shell is one file's worth of imports.
export type NavKey =
  | "home"
  | "capture"
  | "explore"
  | "knowledge"
  | "entities"
  | "patterns"
  | "ideas"
  | "team"
  | "insights"
  | "settings"
  | "pricing";

export type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
};

const s = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

export const NAV: NavItem[] = [
  { key: "home", label: "Home", href: "/app", icon: <svg {...s}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" strokeLinejoin="round" /></svg> },
  { key: "capture", label: "Capture", href: "/app/capture", icon: <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" strokeLinecap="round" /></svg> },
  { key: "explore", label: "Explore", href: "/app/explore", icon: <svg {...s}><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg> },
  { key: "knowledge", label: "Knowledge", href: "/app/knowledge", icon: <svg {...s}><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" strokeLinejoin="round" /><path d="M8 8h6M8 11h6" /></svg> },
  { key: "entities", label: "Entities", href: "/app/entities", icon: <svg {...s}><circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="M10 10L6.5 7.5M14 10l3.5-2.5M10 14l-3.5 2.5M14 14l3.5 2.5" strokeLinecap="round" /></svg> },
  { key: "patterns", label: "Patterns", href: "/app/patterns", icon: <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { key: "ideas", label: "Video Ideas", href: "/app/ideas", icon: <svg {...s}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.85 1.02.85 1.7v.5h5.5v-.5c0-.68.35-1.3.85-1.7A6 6 0 0 0 12 3Z" strokeLinejoin="round" /></svg> },
  { key: "team", label: "Team", href: "/app/team", icon: <svg {...s}><circle cx="9" cy="8" r="3.2" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 14.8c2.6.2 4.5 2.1 4.5 4.7" strokeLinecap="round" /></svg> },
  { key: "insights", label: "Insights", href: "/app/insights", icon: <svg {...s}><path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" /></svg> },
];

export const FOOTER_NAV: NavItem[] = [
  { key: "settings", label: "Settings", href: "/app/settings", icon: <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" strokeLinejoin="round" /></svg> },
  { key: "pricing", label: "Pricing", href: "/app/pricing", icon: <svg {...s}><path d="M3 12l3.5 7L12 4l5.5 15L21 12" strokeLinecap="round" strokeLinejoin="round" /></svg> },
];

export const LABELS: Record<string, string> = Object.fromEntries(
  [...NAV, ...FOOTER_NAV].map((n) => [n.href, n.label]),
);
