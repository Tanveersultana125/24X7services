"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Wrench } from "lucide-react";

/**
 * The field sign-in.
 *
 * A phone number and a PIN, because a technician has neither a work email nor
 * a keyboard — the number is the one credential they already know by heart,
 * and the PIN is issued by the office and can be changed there the day
 * somebody's phone goes missing.
 */
export function TechLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tech/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      setError(
        data?.error === "bad_credentials"
          ? "That number and PIN don't match. Ask the office if you've forgotten it."
          : "We couldn't sign you in. Please try again.",
      );
      return;
    }

    // Not setLoading(false): the button stays busy until the new page paints,
    // so a slow connection can't take a second submit.
    router.push("/tech");
    router.refresh();
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-surface-2 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink text-background">
            <Wrench className="size-6" strokeWidth={1.8} />
          </span>
          <h1 className="font-display mt-5 text-2xl tracking-[-0.02em]">Technician sign-in</h1>
          <p className="mt-1.5 text-sm text-muted">
            Your jobs for the day, the address and the fault.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-7 rounded-2xl border border-border bg-surface p-5 shadow-premium-md"
        >
          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-3 text-[0.82rem] leading-snug text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-xs font-medium text-muted">Phone number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="98450 11223"
              required
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-[0.95rem] outline-none focus:border-royal-bright"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-medium text-muted">PIN</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="••••"
              required
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-[0.95rem] tracking-[0.3em] outline-none focus:border-royal-bright"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !phone.trim() || pin.length < 4}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[0.95rem] font-semibold text-background transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-[0.72rem] leading-relaxed text-muted-2">
          Not a technician? This is the field app. The customer site is at{" "}
          <Link href="/" className="font-medium text-royal-bright hover:underline">
            24x7services
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
