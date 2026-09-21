"use client";

import Link from "next/link";
import { useState } from "react";

export type PatternVM = {
  id: string;
  name: string;
  description: string;
  status: string;
  confidence: number;
  performanceLift: number | null;
  evidenceCount: number;
  recommendedActions: string[];
  evidence: { id: string; strength: number; videoId: string; label: string }[];
};

const BoltIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" strokeLinejoin="round" /></svg>
);

export default function PatternsExplorer({ patterns }: { patterns: PatternVM[] }) {
  const [selectedId, setSelectedId] = useState(patterns[0]?.id ?? null);
  const selected = patterns.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <div>
        <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-3">{patterns.length} PATTERNS FOUND</p>
        <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
          {patterns.map((p) => (
            <div key={p.id} className={`pattern-row${p.id === selectedId ? " active" : ""}`} onClick={() => setSelectedId(p.id)}>
              <div className="flex gap-3">
                <div className="pattern-icon"><BoltIcon /></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{p.name}</p>
                    <span className={`font-mono text-[11px] ${p.id === selectedId ? "text-[var(--violet-2)]" : "text-[var(--mist-dim)]"}`}>{p.confidence}%</span>
                  </div>
                  <p className="text-[var(--mist-dim)] text-xs mt-0.5">{p.evidenceCount} {p.evidenceCount === 1 ? "video" : "videos"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="card p-7">
          <div className="pd-head mb-6">
            <div className="flex items-center gap-4">
              <div className="pattern-icon" style={{ width: 48, height: 48 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--violet-2)" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" strokeLinejoin="round" /></svg></div>
              <h3 className="font-serif text-2xl min-w-0">{selected.name}</h3>
            </div>
            <div className="pd-tags flex gap-2">
              <span className="chip in">{selected.confidence}% Confidence</span>
              <span className="chip in">{selected.status[0] + selected.status.slice(1).toLowerCase()}</span>
            </div>
          </div>
          <p className="text-[var(--mist)] text-sm mb-7 max-w-xl">{selected.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
            <div className="stat-tile"><p className="font-display text-xl font-semibold">{selected.evidenceCount}</p><p className="text-[var(--mist-dim)] text-[11px] mt-1">Supporting videos</p></div>
            <div className="stat-tile"><p className="font-display text-xl font-semibold text-[var(--good)]">{selected.performanceLift == null ? "—" : `${selected.performanceLift > 0 ? "+" : ""}${selected.performanceLift}%`}</p><p className="text-[var(--mist-dim)] text-[11px] mt-1">Engagement Lift</p></div>
            <div className="stat-tile"><p className="font-display text-xl font-semibold">{selected.confidence}%</p><p className="text-[var(--mist-dim)] text-[11px] mt-1">Confidence</p></div>
            <div className="stat-tile"><p className="font-display text-xl font-semibold">{selected.status[0] + selected.status.slice(1).toLowerCase()}</p><p className="text-[var(--mist-dim)] text-[11px] mt-1">Status</p></div>
          </div>

          {selected.recommendedActions.length > 0 && (
            <div className="card p-4 mb-4" style={{ background: "rgba(123,47,247,0.06)" }}>
              <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-2">RECOMMENDED ACTIONS</p>
              <ul className="space-y-1.5 text-sm text-[var(--mist)]">
                {selected.recommendedActions.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="check-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9D5CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg></span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.evidence.length > 0 && (
            <div>
              <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-2">SUPPORTING VIDEOS</p>
              <div className="space-y-2">
                {selected.evidence.map((e) => (
                  <Link key={e.id} href={`/app/videos/${e.videoId}`} className="card p-4 flex items-center justify-between tile-hover">
                    <span className="text-sm truncate mr-3">{e.label}</span>
                    <span className="font-mono text-[11px] text-[var(--mist-dim)] whitespace-nowrap">{e.strength}% match</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-7">
          <p className="text-[var(--mist-dim)]">No patterns yet. Mossaic needs a handful of analysed videos before a mechanism can count as repeating rather than coincidental.</p>
        </div>
      )}
    </div>
  );
}
