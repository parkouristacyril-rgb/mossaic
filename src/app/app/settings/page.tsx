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

type NotifKey = "pattern" | "digest" | "teammate";
const NOTIF_STORAGE_KEY = "mossaic.notifs.v1";
const DEFAULT_NOTIFS: Record<NotifKey, boolean> = { pattern: true, digest: true, teammate: false };

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifs, setNotifs] = useState(DEFAULT_NOTIFS);

  // Session-derived identity. Null until loaded; drives what this page exposes.
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [accountState, setAccountState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [accountError, setAccountError] = useState("");

  const [workspace, setWorkspace] = useState("");
  const [savedWorkspace, setSavedWorkspace] = useState("");
  const [workspaceState, setWorkspaceState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [workspaceError, setWorkspaceError] = useState("");

  const isAdmin = role === "ADMIN";

  // Theme + notification preferences are per-device conveniences, kept locally.
  useEffect(() => {
    try {
      const t = localStorage.getItem("mossaic-theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (raw) setNotifs({ ...DEFAULT_NOTIFS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  // Load who we are; the workspace card only exists for admins.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) return;
        const data = await res.json();
        setRole(data.member?.role ?? "VIEWER");
        setEmail(data.member?.email ?? "");
        setName(data.member?.name ?? "");
        setSavedName(data.member?.name ?? "");
        setWorkspace(data.name ?? "");
        setSavedWorkspace(data.name ?? "");
      } catch { /* leave fields blank on failure */ }
    })();
  }, []);

  function applyTheme(t: "dark" | "light") {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("mossaic-theme", t); } catch { /* ignore */ }
  }

  // Toggling a notification takes effect immediately — no explicit save.
  function toggleNotif(key: NotifKey) {
    setNotifs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  async function saveAccount() {
    const trimmed = name.trim();
    if (!trimmed) {
      setAccountState("error");
      setAccountError("Name can't be empty.");
      return;
    }
    setAccountState("saving");
    setAccountError("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setAccountState("error");
        setAccountError(body.error ?? "Could not save your changes.");
        return;
      }
      setSavedName(trimmed);
      setAccountState("saved");
      setTimeout(() => setAccountState("idle"), 2000);
      // Reflect the new name in the app shell (which reads it from the session).
      router.refresh();
    } catch {
      setAccountState("error");
      setAccountError("Network problem — changes were not saved.");
    }
  }

  async function saveWorkspace() {
    const trimmed = workspace.trim();
    if (!trimmed) {
      setWorkspaceState("error");
      setWorkspaceError("Workspace name can't be empty.");
      return;
    }
    setWorkspaceState("saving");
    setWorkspaceError("");
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setWorkspaceState("error");
        setWorkspaceError(body.error ?? "Could not save the workspace.");
        return;
      }
      setSavedWorkspace(trimmed);
      setWorkspaceState("saved");
      setTimeout(() => setWorkspaceState("idle"), 2000);
      router.refresh();
    } catch {
      setWorkspaceState("error");
      setWorkspaceError("Network problem — changes were not saved.");
    }
  }

  async function signOut() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
    router.push("/login");
    router.refresh();
  }

  const accountDirty = name.trim() !== savedName;
  const workspaceDirty = workspace.trim() !== savedWorkspace;

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Settings</h1>
      <p className="text-[var(--mist)] mb-8">Manage your workspace and account preferences.{" "}
        <span className="egg-stat">Fun fact<span className="egg-tooltip">The average scroll session lasts about 2.5 minutes before a person consciously puts their phone down — or doesn&apos;t</span></span> — you&apos;ve probably scrolled more today than you&apos;d like to admit.</p>

      <div className="grid lg:grid-cols-2 gap-6 max-w-3xl">
        {/* Workspace — admins only. The org is shared, so only its admin may rename it. */}
        {isAdmin && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium">Workspace</p>
              <span className="font-mono text-[10px] text-[var(--mist-dim)] uppercase tracking-wide">Admin</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Workspace name</label>
                <input type="text" value={workspace} onChange={(e) => { setWorkspace(e.target.value); setWorkspaceState("idle"); }} className="login-field" />
              </div>
              <div>
                <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Default platform</label>
                <input type="text" value="TikTok" disabled className="login-field" style={{ opacity: 0.6, cursor: "not-allowed" }} />
                <p className="font-mono text-[10px] text-[var(--mist-dim)] mt-1">Instagram Reels and YouTube Shorts are on the roadmap.</p>
              </div>
            </div>
            {workspaceError && <p className="text-[13px] mt-3" style={{ color: "var(--rose, #f87171)" }}>{workspaceError}</p>}
            <button onClick={saveWorkspace} disabled={workspaceState === "saving" || !workspaceDirty} className="mt-4 px-5 py-2.5 rounded-full btn-primary text-sm font-medium text-white">
              {workspaceState === "saving" ? "Saving…" : workspaceState === "saved" ? "Saved ✓" : "Save workspace"}
            </button>
          </div>
        )}

        {/* Account — the one card with an explicit save (name is editable). */}
        <div className="card p-6">
          <p className="font-medium mb-4">Account</p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Name</label>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); setAccountState("idle"); }} className="login-field" />
            </div>
            <div>
              <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Email</label>
              <input type="text" value={email} disabled readOnly className="login-field" style={{ opacity: 0.6, cursor: "not-allowed" }} />
              <p className="font-mono text-[10px] text-[var(--mist-dim)] mt-1">Your email is your login and can&apos;t be changed here.</p>
            </div>
          </div>
          {accountError && <p className="text-[13px] mt-3" style={{ color: "var(--rose, #f87171)" }}>{accountError}</p>}
          <button onClick={saveAccount} disabled={accountState === "saving" || !accountDirty} className="mt-4 px-6 py-3 rounded-full btn-primary text-sm font-medium text-white">
            {accountState === "saving" ? "Saving…" : accountState === "saved" ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

        {/* Appearance — applies instantly. */}
        <div className="card p-6">
          <p className="font-medium mb-4">Appearance</p>
          <div className="flex items-center justify-between">
            <span className="text-[var(--mist)] text-sm">Light mode</span>
            <Toggle on={theme === "light"} onClick={() => applyTheme(theme === "light" ? "dark" : "light")} />
          </div>
        </div>

        {/* Notifications — each toggle applies instantly. */}
        <div className="card p-6">
          <p className="font-medium mb-4">Notifications</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-[var(--mist)]">New pattern discovered</span><Toggle on={notifs.pattern} onClick={() => toggleNotif("pattern")} /></div>
            <div className="flex items-center justify-between"><span className="text-[var(--mist)]">Weekly performance digest</span><Toggle on={notifs.digest} onClick={() => toggleNotif("digest")} /></div>
            <div className="flex items-center justify-between"><span className="text-[var(--mist)]">Teammate activity</span><Toggle on={notifs.teammate} onClick={() => toggleNotif("teammate")} /></div>
          </div>
        </div>
      </div>

      <div className="card p-6 mt-10 max-w-3xl">
        <p className="font-medium mb-1">Session</p>
        <p className="text-[var(--mist)] text-sm mb-4">Signing out returns you to the sign-in screen.</p>
        <button onClick={signOut} className="px-5 py-2.5 rounded-full btn-ghost text-sm font-medium">Sign out →</button>
      </div>
    </div>
  );
}
