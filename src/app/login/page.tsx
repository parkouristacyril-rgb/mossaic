"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import BgCanvas from "../app/BgCanvas";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not sign in. Try again.");
        setBusy(false);
        return;
      }
      // The session cookie is set by the server; go where they were headed.
      const next = params.get("next");
      router.push(next && next.startsWith("/app") ? next : "/app");
      router.refresh();
    } catch {
      setError("Network problem — could not sign in.");
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
            <p className="login-kicker">Creative intelligence for short-form video.</p>
          </div>

          <div className="login-fields">
            <label className="lf">
              <span>Email</span>
              <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="text" placeholder="you@company.com" autoComplete="username" spellCheck={false} />
            </label>
            <label className="lf">
              <span>Password</span>
              <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type="password" placeholder="••••••••••" autoComplete="current-password" />
            </label>
            {error && <p className="login-error" role="alert" style={{ color: "var(--rose, #f87171)", fontSize: 13, margin: "-4px 0 0" }}>{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary login-go">{busy ? "Signing in…" : "Enter workspace"}</button>
          </div>

          <p className="login-foot">Sign in with the email and password for your workspace.</p>
        </form>
      </div>
    </div>
  );
}
