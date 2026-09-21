"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CheckIcon = () => (
  <span className="check-icon">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9D5CFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6" />
    </svg>
  </span>
);

type HeroTab = "overview" | "patterns" | "entities" | "ideas";

export default function MarketingPage() {
  const [heroTab, setHeroTab] = useState<HeroTab>("overview");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [progressStep, setProgressStep] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  // Reveal-on-scroll, count-ups, and pattern-bar fills.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveals = root.querySelectorAll<HTMLElement>(".reveal");
    if (reduce) {
      reveals.forEach((el) => el.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      reveals.forEach((el) => io.observe(el));
      return () => io.disconnect();
    }
  }, []);

  // Count-up the stat bar numbers once visible.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nums = root.querySelectorAll<HTMLElement>("[data-count]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = Number(el.dataset.count || "0");
        const start = performance.now();
        const dur = 1100;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toString();
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    });
    nums.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // Fill the overview score bars + grade ring whenever the overview shows.
  useEffect(() => {
    if (heroTab !== "overview") return;
    const root = rootRef.current;
    if (!root) return;
    const panel = root.querySelector<HTMLElement>('[data-panel="overview"]');
    if (!panel) return;
    const raf = requestAnimationFrame(() => {
      panel.querySelectorAll<HTMLElement>(".pattern-bar > span[data-target]").forEach((s) => {
        s.style.width = `${s.dataset.target}%`;
      });
      panel.querySelectorAll<HTMLElement>(".val[data-num]").forEach((v) => {
        const target = Number(v.dataset.num || "0");
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 900);
          v.textContent = Math.round(target * p).toString();
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      const ring = root.querySelector<HTMLElement>("#gradeRing");
      const gradeNum = root.querySelector<HTMLElement>("#gradeNum");
      if (ring) ring.style.background =
        "conic-gradient(var(--violet-2) 0% 78%, rgba(255,255,255,0.08) 78% 100%)";
      if (gradeNum) {
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 900);
          gradeNum.textContent = Math.round(78 * p).toString();
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [heroTab, analyzed]);

  function runDemo() {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalyzed(false);
    setHeroTab("overview");
    let step = 0;
    setProgressStep(0);
    const timer = setInterval(() => {
      step += 1;
      if (step > 3) {
        clearInterval(timer);
        setAnalyzing(false);
        setAnalyzed(true);
        setProgressStep(-1);
      } else {
        setProgressStep(step);
      }
    }, 650);
  }

  const progressLabels = [
    "Ingesting video…",
    "Reading frames, audio, and text…",
    "Matching against your pattern library…",
    "Scoring and generating ideas…",
  ];

  const faqs = [
    {
      q: "What exactly does Mossaic analyze?",
      a: "Every video is read across visual composition, camera work, editing pace, voice, music, sound design, on-screen text, spoken language, and named entities, then matched against your growing pattern library.",
    },
    {
      q: "What platforms does it support?",
      a: "TikTok today, with Instagram Reels and YouTube Shorts on the roadmap.",
    },
    {
      q: "How does the pattern library get smarter?",
      a: "Every analyzed video becomes evidence. Patterns are only kept when multiple, distinct videos support them.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes — every plan starts with a free trial, no credit card required.",
    },
  ];

  return (
    <div ref={rootRef}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/mark.webp" className="mk mk-bar" alt="Mossaic" />
            <span className="font-display font-semibold text-lg tracking-tight">Mossaic</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-mono text-[13px] text-[var(--mist)]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-block px-4 py-2 rounded-full text-sm btn-ghost">Sign in</Link>
            <Link href="/login" className="px-4 py-2 rounded-full text-sm font-medium btn-primary text-white">Start Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none"></div>
        <svg width="520" height="520" className="absolute top-16 right-0 w-[520px] h-[520px] opacity-70 pointer-events-none hidden lg:block" viewBox="0 0 520 520" fill="none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7B2FF7" /><stop offset="100%" stopColor="#E23FCB" />
            </linearGradient>
          </defs>
          {[
            [60, 120, 180, 90], [180, 90, 290, 150], [60, 120, 120, 230], [120, 230, 290, 150],
            [290, 150, 400, 100], [290, 150, 380, 260], [120, 230, 250, 320], [250, 320, 380, 260],
            [380, 260, 440, 380], [250, 320, 300, 420],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} className="node-line" x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
          <g className="float-slow"><circle className="node-dot" cx="60" cy="120" r="5" /></g>
          <g className="float-slower"><circle className="node-dot" cx="180" cy="90" r="4" /></g>
          <g className="float-slow"><circle className="node-dot" cx="290" cy="150" r="7" fill="#E23FCB" /></g>
          <g className="float-slower"><circle className="node-dot" cx="120" cy="230" r="4" /></g>
          <g className="float-slow"><circle className="node-dot" cx="400" cy="100" r="4" /></g>
          <g className="float-slower"><circle className="node-dot" cx="380" cy="260" r="6" fill="#9D5CFF" /></g>
          <g className="float-slow"><circle className="node-dot" cx="250" cy="320" r="5" /></g>
          <g className="float-slower"><circle className="node-dot" cx="440" cy="380" r="4" /></g>
          <g className="float-slow"><circle className="node-dot" cx="300" cy="420" r="4" /></g>
        </svg>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] font-semibold tracking-tight mb-6">
              An AI system that watches every video you make{" "}
              <span className="accent-mark">and remembers what worked.</span>
            </h1>
            <p className="text-lg text-[var(--mist)] leading-relaxed max-w-lg mb-8">
              Paste a link below and watch Mossaic read it live: patterns, entities, and performance signals, all matched against everything it already knows.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input id="demoUrl" type="text" placeholder="Paste a TikTok link, or leave blank to try a sample" className="demo-input flex-1 px-4 py-3.5 text-sm" />
              <button onClick={runDemo} disabled={analyzing} className="px-6 py-3.5 rounded-[14px] font-medium btn-primary text-white whitespace-nowrap">
                {analyzing ? "Analyzing…" : "Analyze video"}
              </button>
            </div>
            <p className="font-mono text-[12px] text-[var(--mist-dim)]">No credit card required · Free to start · Try it right here, no signup</p>
          </div>

          {/* Dashboard mockup */}
          <div className="mock p-5 sm:p-6 reveal">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: analyzing ? "var(--violet-2)" : analyzed ? "var(--good)" : "var(--mist-dim)" }}></span>
                <span className="font-mono text-[11px] text-[var(--mist)]">
                  {analyzing ? "Reading video…" : analyzed ? "Analysis complete" : "Waiting for a video"}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[var(--mist-dim)]">TikTok · 0:22</span>
            </div>

            {analyzing && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`step-dot ${i < progressStep ? "done" : i === progressStep ? "active" : ""}`}></div>
                  ))}
                </div>
                <p className="font-mono text-[12px] text-[var(--mist)]">{progressLabels[Math.max(0, progressStep)]}</p>
              </div>
            )}

            <div className="flex gap-1 mb-6">
              {(["overview", "patterns", "entities", "ideas"] as HeroTab[]).map((t) => (
                <button key={t} className={`mock-tab ${heroTab === t ? "active" : ""}`} onClick={() => setHeroTab(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {heroTab === "overview" && (
              <div data-panel="overview">
                <div className="flex items-center gap-5 mb-6">
                  <div className="grade-ring" id="gradeRing"><div className="grade-ring-inner"><span className="font-display font-semibold text-lg" id="gradeNum">0</span></div></div>
                  <div>
                    <p className="font-display font-semibold text-base">3 known patterns matched</p>
                    <p className="text-[var(--mist-dim)] text-[12.5px]">Screenshot Proof, Native UI Overlay +1 more</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[["Hook", 85], ["Pacing", 74], ["Audio", 61], ["Visual", 79]].map(([lbl, val]) => (
                    <div className="score-row" key={lbl}>
                      <span className="lbl">{lbl}</span>
                      <div className="pattern-bar flex-1"><span data-target={val}></span></div>
                      <span className="val" data-num={val}>0</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {heroTab === "patterns" && (
              <div className="space-y-3">
                {[["Screenshot Proof", 6, "94% match"], ["Native UI Overlay", 4, "87% match"], ["Pattern Interruption", 3, "71% match"]].map(([name, n, match]) => (
                  <div key={name as string} className="flex items-center justify-between pill rounded-xl px-4 py-3">
                    <div><p className="text-sm font-medium">{name}</p><p className="font-mono text-[11px] text-[var(--mist-dim)]">Detected in {n} videos</p></div>
                    <span className="chip in">{match}</span>
                  </div>
                ))}
              </div>
            )}

            {heroTab === "entities" && (
              <div>
                <p className="font-mono text-[11px] text-[var(--mist-dim)] mb-3">ENTITIES DETECTED</p>
                <div className="flex flex-wrap gap-2">
                  {["brand · thehealthylab", "city · Prague", "category · Wellness", "product · matcha tonic", "website · thehealthylab.bs"].map((c) => (
                    <span key={c} className="chip in">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {heroTab === "ideas" && (
              <div>
                <p className="pill inline-block rounded-full px-3 py-1 font-mono text-[11px] text-[var(--mist)] mb-3">IDEA-004</p>
                <p className="font-display font-semibold mb-2">&quot;The 6am reset, filmed in one continuous shot&quot;</p>
                <p className="text-[var(--mist)] text-[13px] leading-relaxed">Uses: Screenshot Proof + Pattern Interruption. Hook at 0:00–0:02: phone screen lights up mid-scroll, cut to POV pouring…</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-[var(--line)] bg-[var(--ink-2)]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap justify-between gap-6 font-mono text-[12px] text-[var(--mist-dim)]">
          <div><span className="text-white text-lg font-semibold block stat-num" data-count="400">0</span>+ signals read per video</div>
          <div><span className="text-white text-lg font-semibold block stat-num" data-count="36">0</span> connected data tables</div>
          <div><span className="text-white text-lg font-semibold block">24/7</span>pattern discovery</div>
          <div><span className="text-white text-lg font-semibold block">1</span>memory that compounds</div>
        </div>
      </div>

      {/* HOW */}
      <section id="how" className="px-6 py-28">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16 reveal">
            <p className="font-mono text-[13px] text-[var(--violet-2)] mb-3">HOW MOSSAIC WORKS</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">One loop that learns your channel.</h2>
            <p className="text-[var(--mist)] mt-4">Analyze what happened, discover what&apos;s repeating, create the next one, and feed the result back in. One memory connects every stage: your Creative DNA.</p>
          </div>
          <div className="space-y-0 mb-10">
            {[
              ["01", "Analyze", "Every frame, sound, and word, decoded into structured, comparable data."],
              ["02", "Discover", "Mossaic checks it against every pattern it has ever learned — and scores the fit."],
              ["03", "Create", "Ask for a campaign. Get shot-by-shot concepts built from what's proven to work."],
              ["04", "Remember", "Every result feeds back in. The library gets sharper with every video, forever."],
            ].map(([num, title, body], i, arr) => (
              <div key={num} className={`grid md:grid-cols-[100px_1fr] gap-4 md:gap-10 py-8 border-t ${i === arr.length - 1 ? "border-b" : ""} border-[var(--line)] reveal items-baseline`}>
                <p className="font-display text-5xl md:text-6xl font-light text-[var(--line-strong)] leading-none">{num}</p>
                <div><h3 className="font-display text-xl font-semibold mb-2">{title}</h3><p className="text-[var(--mist)] text-sm leading-relaxed max-w-md">{body}</p></div>
              </div>
            ))}
          </div>
          <p className="text-center font-mono text-[12px] text-[var(--mist-dim)] reveal">Creative DNA is the memory that connects every stage — it compounds, it never resets.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6"><div className="divider-glow"></div></div>

      {/* FEATURES */}
      <section id="features" className="px-6 py-28">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16 reveal">
            <p className="font-mono text-[13px] text-[var(--violet-2)] mb-3">THE PLATFORM</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">One growing intelligence layer, four ways in.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/app/patterns" className="card tile-hover p-8 md:col-span-2 reveal cursor-pointer">
              <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-4">PATTERN ENGINE</p>
              <h3 className="font-display text-2xl font-semibold mb-4">The mechanisms behind your best videos, named and scored.</h3>
              <p className="text-[var(--mist)] text-sm leading-relaxed max-w-md mb-2">Click through to the full library →</p>
            </Link>
            <Link href="/app/entities" className="card tile-hover p-8 reveal cursor-pointer">
              <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-4">ENTITY INTELLIGENCE</p>
              <h3 className="font-display text-xl font-semibold mb-4">Every brand, place, and face — indexed.</h3>
              <p className="text-[var(--mist)] text-sm leading-relaxed">Explore the entity graph →</p>
            </Link>
            <Link href="/app/ideas" className="card tile-hover p-8 reveal cursor-pointer">
              <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-4">VIDEO IDEAS</p>
              <h3 className="font-display text-xl font-semibold mb-4">Concepts, not just insights.</h3>
              <p className="text-[var(--mist)] text-sm leading-relaxed">See a generated idea →</p>
            </Link>
            <Link href="/app/insights" className="card tile-hover p-8 md:col-span-2 reveal cursor-pointer">
              <p className="font-mono text-[12px] text-[var(--mist-dim)] mb-4">PERFORMANCE HISTORY</p>
              <h3 className="font-display text-xl font-semibold mb-4">Every pull, kept — not overwritten.</h3>
              <p className="text-[var(--mist)] text-sm leading-relaxed max-w-md">View the performance dashboard →</p>
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-28 bg-[var(--ink-2)] border-y border-[var(--line)]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-16 reveal">
            <p className="font-mono text-[13px] text-[var(--violet-2)] mb-3">PRICING</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Start where you are. Grow into the platform.</h2>
            <p className="text-[var(--mist)]">Every plan builds the same Creative DNA. It just compounds faster the higher you go.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="card p-8 tile-hover reveal">
              <h3 className="font-display text-lg font-semibold mb-1">Starter</h3>
              <p className="text-[var(--mist-dim)] text-sm mb-6">For solo creators &amp; small brands</p>
              <p className="mb-6"><span className="font-display text-4xl font-semibold">€89</span><span className="text-[var(--mist-dim)] font-mono text-sm"> /month</span></p>
              <Link href="/login" className="block w-full text-center px-5 py-3 rounded-full btn-ghost text-sm font-medium mb-8">Start free trial</Link>
              <ul className="space-y-3 text-sm text-[var(--mist)]">
                {["2 team seats", "150 videos analysed / month", "Full creative breakdown per video", "Read-only pattern library", "Performance history"].map((f) => (
                  <li key={f} className="flex gap-3"><CheckIcon /><span>{f}</span></li>
                ))}
              </ul>
            </div>
            {/* Growth */}
            <div className="card p-8 relative overflow-hidden lg:-translate-y-4 reveal" style={{ borderColor: "rgba(157,92,255,0.6)", boxShadow: "0 30px 60px -20px rgba(123,47,247,0.4)" }}>
              <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-mono text-[11px]" style={{ background: "var(--violet)" }}>MOST POPULAR</div>
              <h3 className="font-display text-lg font-semibold mb-1">Growth</h3>
              <p className="text-[var(--mist-dim)] text-sm mb-6">For brands building a real strategy</p>
              <p className="mb-6"><span className="font-display text-4xl font-semibold">€289</span><span className="text-[var(--mist-dim)] font-mono text-sm"> /month</span></p>
              <Link href="/login" className="block w-full text-center px-5 py-3 rounded-full btn-primary text-sm font-medium mb-8 text-white">Start free trial</Link>
              <ul className="space-y-3 text-sm text-[var(--mist)]">
                {["5 team seats", "800 videos analysed / month", "Everything in Starter", "Full pattern library + evidence", "AI-generated video ideas", "Entity & competitor tracking"].map((f) => (
                  <li key={f} className="flex gap-3"><CheckIcon /><span>{f}</span></li>
                ))}
              </ul>
            </div>
            {/* Expert */}
            <div className="card p-8 tile-hover reveal">
              <h3 className="font-display text-lg font-semibold mb-1">Expert</h3>
              <p className="text-[var(--mist-dim)] text-sm mb-6">For agencies running multiple brands</p>
              <p className="mb-6"><span className="font-display text-4xl font-semibold">€889</span><span className="text-[var(--mist-dim)] font-mono text-sm"> /month</span></p>
              <Link href="/login" className="block w-full text-center px-5 py-3 rounded-full btn-ghost text-sm font-medium mb-8">Talk to us</Link>
              <ul className="space-y-3 text-sm text-[var(--mist)]">
                {["15 team seats", "Unlimited videos analysed", "Everything in Growth", "Multiple brand workspaces", "Priority processing", "API access + 15 team seats"].map((f) => (
                  <li key={f} className="flex gap-3"><CheckIcon /><span>{f}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature comparison */}
          <div className="mt-16 reveal">
            <p className="text-center font-mono text-[12px] text-[var(--mist-dim)] mb-8">FULL FEATURE COMPARISON</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="text-left py-4 font-display font-medium text-[var(--mist)]">Feature</th>
                    <th className="py-4 font-display font-medium">Starter</th>
                    <th className="py-4 font-display font-medium text-[var(--violet-2)]">Growth</th>
                    <th className="py-4 font-display font-medium">Expert</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[13px]">
                  {[
                    ["Videos analysed / month", "150", "800", "Unlimited"],
                    ["Creative breakdown per video", "✓", "✓", "✓"],
                    ["Pattern library access", "Read-only", "Full + evidence", "Full + evidence"],
                    ["AI-generated video ideas", "—", "✓", "✓"],
                    ["Entity & competitor tracking", "—", "✓", "✓"],
                    ["Performance history", "✓", "✓", "✓"],
                    ["Brand workspaces", "1", "1", "Multiple"],
                    ["Team seats", "2", "5", "15"],
                    ["API access", "—", "—", "✓"],
                    ["Processing priority", "Standard", "Standard", "Priority"],
                  ].map(([feat, s, g, e], i, arr) => (
                    <tr key={feat} className={i === arr.length - 1 ? "" : "border-b border-[var(--line)]"}>
                      <td className="py-4 text-[var(--mist)]">{feat}</td>
                      <td className={`text-center ${s === "—" ? "text-[var(--mist-dim)]" : ""}`}>{s}</td>
                      <td className="text-center text-[var(--paper)]">{g}</td>
                      <td className={`text-center ${e === "—" ? "text-[var(--mist-dim)]" : ""}`}>{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mt-16 reveal">
            <div><p className="font-medium mb-1">Can I switch plans anytime?</p><p className="text-[var(--mist)] text-sm">Yes — upgrade or downgrade whenever, prorated automatically.</p></div>
            <div><p className="font-medium mb-1">What happens if I go over my video limit?</p><p className="text-[var(--mist)] text-sm">We&apos;ll notify you before you hit the cap so you can upgrade — no surprise charges.</p></div>
            <div><p className="font-medium mb-1">Is there an annual discount?</p><p className="text-[var(--mist)] text-sm">Yes, annual billing saves roughly 2 months compared to paying monthly.</p></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-28">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 reveal">
            <p className="font-mono text-[13px] text-[var(--violet-2)] mb-3">FAQ</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Common questions.</h2>
          </div>
          <div className="reveal">
            {faqs.map((f, i) => (
              <div key={f.q} className={`faq-item ${openFaq === i ? "open" : ""}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-medium">{f.q}</span>
                  <span className="faq-icon text-2xl" style={{ fontSize: "24px", lineHeight: 1 }}>+</span>
                </button>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, var(--violet), transparent 70%)", filter: "blur(40px)" }}></div>
        </div>
        <div className="relative max-w-2xl mx-auto reveal">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-6">Stop guessing what will work.</h2>
          <p className="text-[var(--mist)] mb-10">Drop in a video. Get patterns, evidence, and a next idea already backed by data.</p>
          <Link href="/login" className="inline-block px-8 py-4 rounded-full font-medium btn-primary text-white">Start Free</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-16 border-t border-[var(--line)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/mark.webp" className="mk mk-xs" alt="Mossaic" />
            <span className="font-display font-semibold">Mossaic</span>
          </div>
          <p className="font-mono text-[12px] text-[var(--mist-dim)]">© 2026 Mossaic. Creative intelligence for short-form video.</p>
        </div>
      </footer>
    </div>
  );
}
