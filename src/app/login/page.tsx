"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BgCanvas from "../app/BgCanvas";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try { localStorage.setItem("mossaic.session.v1", JSON.stringify({ email, at: Date.now() })); } catch { /* ignore */ }
    router.push("/app");
  }

  return (
    <div id="login-view" className="open">
      <BgCanvas id="bg-canvas-login" />
      <div className="login-stage">
        <form className="login-card" onSubmit={submit}>
          <div className="login-head">
            <img src="/mark.webp" className="mk mk-hero mk-breathe" alt="Mossaic" />
            <h1 className="login-wordmark">MOSSAIC</h1>
            <p className="login-kicker">Creative intelligence for short-form video.</p>
          </div>

          <div className="login-fields">
            <label className="lf">
              <span>Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder="you@company.com" autoComplete="username" spellCheck={false} />
            </label>
            <label className="lf">
              <span>Password</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••••" autoComplete="current-password" />
            </label>
            <button type="submit" className="btn-primary login-go">Enter workspace</button>
          </div>

          <p className="login-foot">Your workspace is kept on this device. Sign in with the email and password you created.</p>
        </form>
      </div>
    </div>
  );
}
