"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Moss — the workspace companion (lean port of reference.html).
 *
 * A floating helper button opens a chat panel that answers questions about the
 * workspace from a built-in keyword FAQ (works fully offline, no backend). The
 * same component hosts the 1-minute tour player, which the Home tour tile opens
 * by dispatching a `mossaic:tour` window event.
 *
 * Enable/disable is stored in localStorage under `mossaic.moss.on` (default on)
 * and mirrored live via the `mossaic:moss-toggle` window event so the Settings
 * card can flip it without a reload.
 */

const MOSS_ON_KEY = "mossaic.moss.on";
const TOUR_SEEN_KEY = "mossaic.tour.seen";

// Page id -> [route, label]. Note "discover" is the Patterns route, matching the
// reference's link tokens.
const PAGES: Record<string, [string, string]> = {
  home: ["/app", "Home"],
  capture: ["/app/capture", "Capture"],
  explore: ["/app/explore", "Explore"],
  knowledge: ["/app/knowledge", "Knowledge"],
  entities: ["/app/entities", "Entities"],
  discover: ["/app/patterns", "Patterns"],
  ideas: ["/app/ideas", "Video Ideas"],
  team: ["/app/team", "Team"],
  insights: ["/app/insights", "Insights"],
  settings: ["/app/settings", "Settings"],
  pricing: ["/app/pricing", "Pricing"],
};

type FaqEntry = { k: string[]; go: string[]; en: string };

// Ported verbatim (English) from reference.html's moss-js FAQ.
const FAQ: FaqEntry[] = [
  { k: ["add", "video", "link", "paste", "save", "capture"], go: ["capture"],
    en: "Open Capture, paste the video link and add one sentence on why it worked on you — then save. That one sentence is what the analysis learns from." },
  { k: ["bulk", "many", "list", "import", "several"], go: ["capture"],
    en: "In Capture, switch to the Bulk import tab and drop in the whole list of links — one per line." },
  { k: ["phone", "mobile", "share", "iphone", "android"], go: ["capture"],
    en: "On Capture, use “Capture from your phone” — then you can share videos straight from TikTok or Instagram into Mossaic." },
  { k: ["when", "first", "how many", "twenty", "20"], go: ["discover"],
    en: "A pattern appears once around twenty of your videos agree. After that, every new video keeps sharpening it." },
  { k: ["pattern", "confidence", "evidence"], go: ["discover"],
    en: "Patterns shows what keeps working across your videos: how sure Mossaic is, the evidence behind it, and what to do next." },
  { k: ["entit", "brand", "competitor"], go: ["entities"],
    en: "Brands and competitors spotted in your videos are collected in Entities automatically." },
  { k: ["knowledge", "principle"], go: ["knowledge"],
    en: "Principles that have proven themselves go to the Knowledge Base — your team's shared playbook." },
  { k: ["explore", "perform", "trend", "over time"], go: ["explore"],
    en: "Explore tracks how everything performs over time." },
  { k: ["idea", "script", "film", "generate", "next video"], go: ["ideas"],
    en: "In Video Ideas, pick a campaign, a goal and an audience, then press Generate — it writes concepts for what to film next." },
  { k: ["team", "invite", "member", "colleague"], go: ["team"],
    en: "Team shows who is contributing, and it's where you invite teammates." },
  { k: ["insight", "changed", "recommend"], go: ["insights"],
    en: "Insights flags what changed and what to try next." },
  { k: ["switch", "workspace", "organi", "client"], go: [],
    en: "Click your name in the top-right corner to switch between brands. Each one stays completely separate." },
  { k: ["theme", "dark", "light", "notification", "setting"], go: ["settings"],
    en: "Theme, notifications and your account live in Settings." },
  { k: ["plan", "price", "pricing", "pay", "invoice", "upgrade"], go: ["pricing"],
    en: "Plans and billing are under Pricing." },
  { k: ["moss", "turn off", "disable", "hide", "annoy"], go: ["settings"],
    en: "You can turn me off — or just my help tips — in Settings → Moss. No hard feelings." },
  { k: ["tour", "tutorial", "how does", "show me"], go: ["tour"],
    en: "The 90-second tour walks through the whole workspace." },
];

const SUGGESTIONS = [
  "How do I add a video?",
  "When will I see my first pattern?",
  "How do Video Ideas work?",
];

const HELLO =
  "Hi! I'm Moss. Ask me anything about your workspace — where things are, what they mean, what to do next.";

function faq(q: string): { text: string; gos: string[] } {
  const s = q.toLowerCase();
  let best: FaqEntry | null = null;
  let score = 0;
  for (const f of FAQ) {
    let n = 0;
    for (const k of f.k) if (s.indexOf(k) !== -1) n += k.length > 4 ? 2 : 1;
    if (n > score) { score = n; best = f; }
  }
  if (!best) {
    return {
      text: "I'm not sure about that one. Quick map: Capture (add videos), Patterns (what works), Video Ideas (what to film), Insights (what changed).",
      gos: ["capture", "tour"],
    };
  }
  return { text: best.en, gos: best.go };
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/** plain text -> paragraphs, "- " lists, **bold** (escaped HTML). */
function formatBody(text: string): string {
  let out = "";
  let list = false;
  text.replace(/\s+$/, "").split(/\n/).forEach((line) => {
    const l = line.trim();
    if (!l) { if (list) { out += "</ul>"; list = false; } return; }
    const h = esc(l).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^[-•*]\s+/.test(l)) {
      if (!list) { out += "<ul>"; list = true; }
      out += "<li>" + h.replace(/^[-•*]\s+/, "") + "</li>";
    } else {
      if (list) { out += "</ul>"; list = false; }
      out += "<p>" + h + "</p>";
    }
  });
  if (list) out += "</ul>";
  return out;
}

type Msg = { role: "u" | "a"; body?: string; gos?: string[]; wait?: boolean };

export default function MossCompanion() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [showSug, setShowSug] = useState(true);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Read the on/off preference and keep it in sync with the Settings card.
  useEffect(() => {
    const read = () => {
      try {
        const v = localStorage.getItem(MOSS_ON_KEY);
        setEnabled(v == null ? true : v === "1");
      } catch { setEnabled(true); }
    };
    read();
    const onToggle = () => read();
    window.addEventListener("mossaic:moss-toggle", onToggle);
    window.addEventListener("storage", onToggle);
    return () => {
      window.removeEventListener("mossaic:moss-toggle", onToggle);
      window.removeEventListener("storage", onToggle);
    };
  }, []);

  // The Home tour tile (and the chat's tour button) open the player via events.
  useEffect(() => {
    const onTour = () => { setChatOpen(false); setTourOpen(true); };
    window.addEventListener("mossaic:tour", onTour);
    return () => window.removeEventListener("mossaic:tour", onTour);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs]);

  // Play the panel's enter transition, and let Escape close it.
  useEffect(() => {
    if (!chatOpen) { setChatIn(false); return; }
    const id = requestAnimationFrame(() => setChatIn(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setChatOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(id); document.removeEventListener("keydown", onKey); };
  }, [chatOpen]);

  const openChat = useCallback(() => {
    setChatOpen(true);
    if (msgs.length === 0) { setMsgs([{ role: "a", body: formatBody(HELLO) }]); setShowSug(true); }
    setTimeout(() => { if (window.innerWidth > 640) taRef.current?.focus(); }, 120);
  }, [msgs.length]);

  const closeChat = useCallback(() => setChatOpen(false), []);

  const goTo = useCallback((id: string) => {
    if (id === "tour") { setChatOpen(false); setTourOpen(true); return; }
    const p = PAGES[id];
    if (p) { router.push(p[0]); if (window.innerWidth <= 640) setChatOpen(false); }
  }, [router]);

  const ask = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setShowSug(false);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    setMsgs((m) => [...m, { role: "u", body: esc(q).replace(/\n/g, "<br>") }, { role: "a", wait: true, body: "Thinking…" }]);
    // Small delay so the "Thinking…" state reads as a reply, matching the reference.
    setTimeout(() => {
      const { text, gos } = faq(q);
      setMsgs((m) => {
        const next = m.slice();
        next[next.length - 1] = { role: "a", body: formatBody(text), gos };
        return next;
      });
    }, 420);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        className={`moss-launch${chatOpen ? " open" : ""}`}
        aria-label="Ask Moss for help"
        onClick={openChat}
      >
        <img src="/moss/avatar.png" alt="" />
      </button>

      {chatOpen && (
        <div
          className={`moss-chat${chatIn ? " in" : ""}`}
          role="dialog"
          aria-label="Moss"
          style={{ right: 22, bottom: 88, transformOrigin: "100% 100%" }}
        >
          <div className="mc-head">
            <div className="mc-av" style={{ backgroundImage: "url(/moss/avatar.png)" }} />
            <div>
              <h4>Moss</h4>
              <small className="mc-sub">HELP · QUICK ANSWERS</small>
            </div>
            <button type="button" className="mc-x" aria-label="Close" onClick={closeChat}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <div className="mc-log" aria-live="polite" ref={logRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`mc-m ${m.role}${m.wait ? " wait" : ""}`}>
                {m.body && <span dangerouslySetInnerHTML={{ __html: m.body }} />}
                {m.gos && m.gos.length > 0 && (
                  <div className="mc-gos">
                    {m.gos.slice(0, 2).map((g) => (
                      <button type="button" key={g} onClick={() => goTo(g)}>
                        {g === "tour" ? "Watch the tour" : `Open ${PAGES[g]?.[1] ?? g}`} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {showSug && (
              <div className="mc-sug">
                {SUGGESTIONS.map((q) => (
                  <button type="button" key={q} onClick={() => ask(q)}>{q}</button>
                ))}
              </div>
            )}
          </div>

          <div className="mc-foot">
            <div className="mc-row">
              <textarea
                ref={taRef}
                rows={1}
                maxLength={600}
                placeholder="Ask about your workspace…"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = Math.min(110, el.scrollHeight) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(draft); }
                }}
              />
              <button type="button" className="mc-send" aria-label="Send" disabled={!draft.trim()} onClick={() => ask(draft)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            <div className="mc-meta">Built-in answers · works offline</div>
          </div>
        </div>
      )}

      {tourOpen && <TourPlayer onClose={() => setTourOpen(false)} />}
    </>
  );
}

function TourPlayer({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    const v = videoRef.current;
    if (v) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(id); document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try { videoRef.current?.pause(); } catch { /* ignore */ }
    setTimeout(onClose, 380);
  }, [onClose]);

  const markSeen = () => { try { localStorage.setItem(TOUR_SEEN_KEY, "1"); } catch { /* ignore */ } };

  return (
    <div className={`tour-veil${open ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="tour-box" role="dialog" aria-modal="true" aria-label="Your workspace, in a minute">
        <div className="tour-bar">
          <div>
            <h4>Your workspace, in a minute</h4>
            <small>WORKSPACE TOUR</small>
          </div>
          <button type="button" className="tour-x" aria-label="Close" onClick={close} style={{ marginLeft: "auto" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="tour-frame">
          <video
            ref={videoRef}
            playsInline
            controls
            preload="auto"
            poster="/tour/poster.jpg"
            src="/tour/tour_en.mp4"
            onEnded={() => { markSeen(); setTimeout(close, 600); }}
            onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration && v.currentTime / v.duration > 0.6) markSeen(); }}
          />
        </div>
      </div>
    </div>
  );
}
