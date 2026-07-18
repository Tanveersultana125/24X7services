"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6 shadow-premium-lg">
      <label className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Password</label>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 focus-within:border-royal-bright">
        <Lock className="size-4 text-muted" />
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full bg-transparent py-3 text-sm outline-none"
        />
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
