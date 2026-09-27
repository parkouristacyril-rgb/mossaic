"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "ADMIN" | "CONTRIBUTOR" | "VIEWER";

export default function AddMemberForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CONTRIBUTOR");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function reset() {
    setName(""); setEmail(""); setPassword(""); setRole("CONTRIBUTOR");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setState("error");
      setMessage("Name, email, and an initial password are all required.");
      return;
    }
    if (password.length < 8) {
      setState("error");
      setMessage("The initial password must be at least 8 characters.");
      return;
    }
    setState("saving");
    setMessage("");
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(body.error ?? "Could not add this teammate.");
        return;
      }
      setState("saved");
      setMessage(`${body.member?.name ?? "Teammate"} can now sign in with the password you set.`);
      reset();
      router.refresh(); // repopulate the member table
    } catch {
      setState("error");
      setMessage("Network problem — the teammate was not added.");
    }
  }

  if (!open) {
    return (
      <div className="mt-5">
        <button onClick={() => { setOpen(true); setState("idle"); setMessage(""); }} className="px-5 py-2.5 rounded-full btn-ghost text-sm font-medium">
          + Add teammate
        </button>
        {state === "saved" && message && (
          <p className="font-mono text-[11px] text-[var(--good)] mt-3">{message}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 mt-5 max-w-xl space-y-4">
      <p className="font-medium">Add a teammate</p>
      <p className="text-[var(--mist-dim)] text-[12px] -mt-2">
        They&apos;ll sign in with the email and initial password you set here, then can change it in Settings.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Name</label>
          <input value={name} onChange={(e) => { setName(e.target.value); setState("idle"); }} type="text" className="login-field" placeholder="Casey Lin" />
        </div>
        <div>
          <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Email</label>
          <input value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} type="text" className="login-field" placeholder="casey@company.com" spellCheck={false} autoComplete="off" />
        </div>
        <div>
          <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Initial password</label>
          <input value={password} onChange={(e) => { setPassword(e.target.value); setState("idle"); }} type="text" className="login-field" placeholder="At least 8 characters" autoComplete="off" />
        </div>
        <div>
          <label className="text-[11px] font-mono text-[var(--mist-dim)] mb-1 block">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="login-field">
            <option value="ADMIN">Workspace Admin</option>
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
      </div>
      {message && (
        <p className="text-[13px]" style={{ color: state === "error" ? "var(--rose, #f87171)" : "var(--good)" }}>{message}</p>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={state === "saving"} className="px-5 py-2.5 rounded-full btn-primary text-sm font-medium text-white">
          {state === "saving" ? "Adding…" : "Add teammate"}
        </button>
        <button type="button" onClick={() => { setOpen(false); reset(); setState("idle"); setMessage(""); }} className="px-5 py-2.5 rounded-full btn-ghost text-sm font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}
