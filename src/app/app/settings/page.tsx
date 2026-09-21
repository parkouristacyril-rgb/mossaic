"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div className={`toggle-pill${on ? " on" : ""}`} role="switch" aria-checked={on} tabIndex={0} onClick={onClick}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onClick(); } }}>
      <div className="dot" />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifs, setNotifs] = useState({ pattern: true, digest: true, teammate: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("mossaic-theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch { /* ignore */ }
  }, []);

  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("mossaic-theme", t); } catch { /* ignore */ }
  }

  function signOut() {
    try { localStorage.removeItem("mossaic.session.v1"); } catch { /* ignore */ }
    router.push("/login");
  }

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Settings</h1>
      <p className="text-[var(--mist)] mb-8">Manage your workspace and account preferences.</p>

      <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
        <div className="card p-6">
          <p className="font-medium mb-4">Workspace</p>
          <div className="space-y-3">
            <div><label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Workspace name</label><input type="text" defaultValue="BUMP" className="login-field" /></div>
            <div><label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Default platform</label><input type="text" defaultValue="TikTok" className="login-field" /></div>
          </div>
        </div>
        <div className="card p-6">
          <p className="font-medium mb-4">Account</p>
          <div className="space-y-3">
            <div><label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Name</label><input type="text" defaultValue="Jordan Reyes" className="login-field" /></div>
            <div><label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Email</label><input type="text" defaultValue="jordan@bump.team" className="login-field" /></div>
          </div>
        </div>
        <div className="card p-6">
          <p className="font-medium mb-4">Appearance</p>
          <div className="flex items-center justify-between">
            <span className="text-[var(--mist)] text-sm">Light mode</span>
            <Toggle on={theme === "light"} onClick={() => applyTheme(theme === "light" ? "dark" : "light")} />
          </div>
        </div>
        <div className="card p-6">
          <p className="font-medium mb-4">Notifications</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-[var(--mist)]">New pattern discovered</span><Toggle on={notifs.pattern} onClick={() => setNotifs((n) => ({ ...n, pattern: !n.pattern }))} /></div>
            <div className="flex items-center justify-between"><span className="text-[var(--mist)]">Weekly performance digest</span><Toggle on={notifs.digest} onClick={() => setNotifs((n) => ({ ...n, digest: !n.digest }))} /></div>
            <div className="flex items-center justify-between"><span className="text-[var(--mist)]">Teammate activity</span><Toggle on={notifs.teammate} onClick={() => setNotifs((n) => ({ ...n, teammate: !n.teammate }))} /></div>
          </div>
        </div>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="mt-6 px-6 py-3 rounded-full btn-primary text-sm font-medium text-white">
        {saved ? "Saved ✓" : "Save Changes"}
      </button>

      <div className="card p-6 mt-10 max-w-3xl">
        <p className="font-medium mb-1">Session</p>
        <p className="text-[var(--mist)] text-sm mb-4">Signing out returns you to the sign-in screen.</p>
        <button onClick={signOut} className="px-5 py-2.5 rounded-full btn-ghost text-sm font-medium">Sign out →</button>
      </div>
    </div>
  );
}
