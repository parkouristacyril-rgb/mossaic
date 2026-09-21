"use client";

import { useState } from "react";

const CheckIcon = () => (
  <span className="check-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9D5CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg></span>
);

const PLANS = [
  { name: "STARTER", monthly: 89, blurb: "Perfect for small teams getting started with creative intelligence.", cta: "Get Started", popular: false, features: ["2 team seats", "150 videos analysed / month", "Read-only pattern library", "Performance history"] },
  { name: "GROWTH", monthly: 289, blurb: "For growing teams who want deeper insights and collaboration.", cta: "Get Started", popular: true, features: ["5 team seats", "800 videos analysed / month", "Full pattern library + evidence", "AI-generated video ideas", "Entity & competitor tracking"] },
  { name: "EXPERT", monthly: 889, blurb: "For agencies running multiple brands and workspaces.", cta: "Talk to us", popular: false, features: ["15 team seats", "Unlimited videos analysed", "Multiple brand workspaces", "Priority processing", "API access"] },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between mb-2 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-4xl mb-2">Choose Your Plan</h1>
          <p className="text-[var(--mist)]">Scale your Creative Intelligence. Choose the plan that fits your team&apos;s needs.</p>
        </div>
        <span className="chip in flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--mist)" strokeWidth="2"><path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z" strokeLinejoin="round" /></svg>Secure. Private. Enterprise-ready.</span>
      </div>

      <div className="flex items-center gap-3 my-8 font-mono text-[13px]">
        <span className={yearly ? "text-[var(--mist-dim)]" : "text-[var(--violet-2)]"}>Monthly</span>
        <div className={`toggle-pill${yearly ? " on" : ""}`} role="switch" aria-checked={yearly} tabIndex={0}
          onClick={() => setYearly((v) => !v)}
          onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setYearly((v) => !v); } }}>
          <div className="dot" />
        </div>
        <span className={yearly ? "text-[var(--violet-2)]" : "text-[var(--mist-dim)]"}>Yearly</span>
        <span className="chip in" style={{ opacity: 1, transform: "none" }}>Two months free</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const price = yearly ? p.monthly * 10 : p.monthly;
          const unit = yearly ? " /year" : " /month";
          return (
            <div key={p.name} className="card p-7 relative overflow-hidden"
              style={p.popular ? { borderColor: "rgba(157,92,255,0.6)", boxShadow: "0 30px 60px -20px rgba(123,47,247,0.4)" } : undefined}>
              {p.popular && <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-mono text-[11px]" style={{ background: "var(--violet)" }}>MOST POPULAR</div>}
              <p className="font-mono text-[12px] text-[var(--violet-2)] mb-4">{p.name}</p>
              <p className="mb-4"><span className="font-display text-4xl font-semibold">€{price.toLocaleString("en-US")}</span><span className="text-[var(--mist-dim)] font-mono text-sm">{unit}</span></p>
              <p className="text-[var(--mist)] text-sm mb-6">{p.blurb}</p>
              <ul className="space-y-2.5 text-sm mb-7">
                {p.features.map((f) => <li key={f} className="flex gap-2"><CheckIcon />{f}</li>)}
              </ul>
              <button className={`w-full px-5 py-3 rounded-full text-sm font-medium ${p.popular ? "btn-primary text-white" : "btn-ghost"}`}>{p.cta}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
