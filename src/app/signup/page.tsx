"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BgCanvas from "../app/BgCanvas";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!name.trim() || !organizationName.trim() || !trimmedEmail || !password) {
      setError("Fill in every field to create your workspace.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), organizationName: organizationName.trim(), email: trimmedEmail, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not create your workspace. Try again.");
        setBusy(false);
        return;
      }
      // Signup logs you straight in (session cookie set by the server).
      router.push("/app");
      router.refresh();
    } catch {
      setError("Network problem — could not create your workspace.");
      setBusy(false);
    }
  }

  return (
    <div id="login-view" className="open">
      <BgCanvas id="bg-canvas-login" />
      <div className="login-stage">
        <form className="login-card" onSubmit={submit}>
          <div className="login-head">
            {/* The luma filter keys the mark's black backing to transparent so the
                animated WebP sits cleanly on the card. */}
            <svg id="mark-defs" width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
              <defs>
                <filter id="mark-luma" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                  <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0.34 0.52 0.30 0 -0.02" />
                </filter>
              </defs>
            </svg>
            <div className="mark-stage" aria-hidden="true">
              <img className="mark-media mark-anim" src="/mark-anim.webp" alt="" aria-hidden="true" />
            </div>
            <h1 className="login-wordmark">MOSSAIC</h1>
            <p className="login-kicker">Create your workspace in a minute.</p>
          </div>

          <div className="login-fields">
            <label className="lf">
              <span>Your name</span>
              <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} type="text" placeholder="Jordan Reyes" autoComplete="name" />
            </label>
            <label className="lf">
              <span>Workspace name</span>
              <input value={organizationName} onChange={(e) => { setOrganizationName(e.target.value); setError(""); }} type="text" placeholder="Your brand or team" autoComplete="organization" />
            </label>
            <label className="lf">
              <span>Work email</span>
              <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="text" placeholder="you@company.com" autoComplete="username" spellCheck={false} />
            </label>
            <label className="lf">
              <span>Password</span>
              <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" placeholder="At least 8 characters" autoComplete="new-password" />
            </label>
            {error && <p className="login-error" role="alert" style={{ color: "var(--rose, #f87171)", fontSize: 13, margin: "-4px 0 0" }}>{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary login-go">{busy ? "Creating…" : "Create workspace"}</button>
          </div>

          <p className="login-foot">Already have a workspace? <Link href="/login" style={{ color: "var(--violet-2)" }}>Sign in</Link>.</p>
        </form>
      </div>
    </div>
  );
}
