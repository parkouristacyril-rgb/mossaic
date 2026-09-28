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

/**
 * The icon system, ported from reference.html's `icons-js` script.
 *
 * One grid, one weight: 24×24, 1.6 stroke, round caps and joins, no fills.
 * The prototype registered these as an SVG sprite and swapped them in at
 * runtime; here they render directly. The `.ic` class (globals.css) supplies
 * the stroke/fill/weight, so each icon only needs its geometry and viewBox.
 */
const ICON: Record<string, ReactNode> = {
  home: <path d="M4.2 10.4 12 4.3l7.8 6.1V19a1.2 1.2 0 0 1-1.2 1.2h-3.9v-5.6H9.3v5.6H5.4A1.2 1.2 0 0 1 4.2 19z" />,
  capture: <><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" /><path d="M12 8.4v7.2M8.4 12h7.2" /></>,
  explore: <><circle cx="12" cy="12" r="8.4" /><path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z" /></>,
  knowledge: <><path d="M4 5.2A1.2 1.2 0 0 1 5.2 4H10a2 2 0 0 1 2 2v13a1.8 1.8 0 0 0-1.8-1.8H5.2A1.2 1.2 0 0 1 4 16V5.2Z" /><path d="M20 5.2A1.2 1.2 0 0 0 18.8 4H14a2 2 0 0 0-2 2v13a1.8 1.8 0 0 1 1.8-1.8h5A1.2 1.2 0 0 0 20 16V5.2Z" /></>,
  entities: <><circle cx="12" cy="12" r="2.4" /><circle cx="4.6" cy="6.2" r="1.7" /><circle cx="19.4" cy="6.2" r="1.7" /><circle cx="4.6" cy="17.8" r="1.7" /><circle cx="19.4" cy="17.8" r="1.7" /><path d="m10.1 10.6-4-3.2M13.9 10.6l4-3.2M10.1 13.4l-4 3.2M13.9 13.4l4 3.2" /></>,
  patterns: <><path d="M2.8 15.2c2.3-5.4 4.6-5.4 6.9 0s4.6 5.4 6.9 0 4.6-5.4 4.6-5.4" /><path d="M2.8 9.4c2.3-5.4 4.6-5.4 6.9 0" opacity=".45" /></>,
  ideas: <><path d="M9.2 17.6a6.2 6.2 0 1 1 5.6 0v1.2a1.6 1.6 0 0 1-1.6 1.6h-2.4a1.6 1.6 0 0 1-1.6-1.6z" /><path d="M9.6 17.4h4.8" /></>,
  team: <><circle cx="9.2" cy="8.6" r="3.2" /><path d="M3.4 19.4c0-3.2 2.6-5.4 5.8-5.4s5.8 2.2 5.8 5.4" /><path d="M16.2 6.2a3 3 0 0 1 0 5.6M17.6 14.4c1.9.7 3 2.5 3 5" /></>,
  insights: <path d="M4.4 20V12.6M9.6 20V6.8M14.8 20v-5M20 20V9.4" />,
  settings: <><path d="M3.6 7.6h6.2M14.2 7.6h6.2M3.6 16.4h3.6M11.6 16.4h8.8" /><circle cx="12" cy="7.6" r="2.4" /><circle cx="9.4" cy="16.4" r="2.4" /></>,
  pricing: <><path d="M11.1 3.8h5.6a3.5 3.5 0 0 1 3.5 3.5v5.6a1.6 1.6 0 0 1-.47 1.13l-5.6 5.6a1.6 1.6 0 0 1-2.26 0l-7.9-7.9a1.6 1.6 0 0 1 0-2.26l5.6-5.6a1.6 1.6 0 0 1 1.13-.47Z" /><circle cx="16.1" cy="7.9" r="1.35" /></>,
  more: <><circle cx="5.4" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18.6" cy="12" r="1.5" /></>,
  search: <><circle cx="11" cy="11" r="6.8" /><path d="m16 16 4.4 4.4" /></>,
  bell: <><path d="M18 9.4a6 6 0 1 0-12 0c0 5.6-2.2 7.4-2.2 7.4h16.4S18 15 18 9.4" /><path d="M13.7 20.2a2 2 0 0 1-3.4 0" /></>,
};

/** Render a design-system icon. `.ic` (globals.css) sets stroke, weight and size. */
export function Icon({ name, className, style }: { name: keyof typeof ICON | string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`ic${className ? " " + className : ""}`} viewBox="0 0 24 24" aria-hidden="true" style={style}>
      {ICON[name] ?? null}
    </svg>
  );
}

export const NAV: NavItem[] = [
  { key: "home", label: "Home", href: "/app", icon: <Icon name="home" /> },
  { key: "capture", label: "Capture", href: "/app/capture", icon: <Icon name="capture" /> },
  { key: "explore", label: "Explore", href: "/app/explore", icon: <Icon name="explore" /> },
  { key: "knowledge", label: "Knowledge", href: "/app/knowledge", icon: <Icon name="knowledge" /> },
  { key: "entities", label: "Entities", href: "/app/entities", icon: <Icon name="entities" /> },
  { key: "patterns", label: "Patterns", href: "/app/patterns", icon: <Icon name="patterns" /> },
  { key: "ideas", label: "Video Ideas", href: "/app/ideas", icon: <Icon name="ideas" /> },
  { key: "team", label: "Team", href: "/app/team", icon: <Icon name="team" /> },
  { key: "insights", label: "Insights", href: "/app/insights", icon: <Icon name="insights" /> },
];

export const FOOTER_NAV: NavItem[] = [
  { key: "settings", label: "Settings", href: "/app/settings", icon: <Icon name="settings" /> },
  { key: "pricing", label: "Pricing", href: "/app/pricing", icon: <Icon name="pricing" /> },
];

export const LABELS: Record<string, string> = Object.fromEntries(
  [...NAV, ...FOOTER_NAV].map((n) => [n.href, n.label]),
);
