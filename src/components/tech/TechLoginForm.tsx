"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, MapPin, Wallet, Wrench } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/**
 * The field sign-in.
 *
 * A phone number and a PIN, because a technician has neither a work email nor
 * a keyboard — the number is the one credential they already know by heart,
 * and the PIN is issued by the office and can be changed there the day
 * somebody's phone goes missing.
 *
 * This is the first screen of the working day, opened on a phone in daylight,
 * so it is built like the customer's sign-in rather than like the admin panel's:
 * the brand block says whose app this is and what is behind it, and the card
 * under it sits on the warm page rather than melting into it. The fields are
 * the recessed tone *on* a white card — the two were the same colour before,
 * which is why the form read as a flat sheet with nothing on it.
 */

const INSIDE = [
  { icon: Wrench, label: "Your jobs" },
  { icon: MapPin, label: "Address & maps" },
  { icon: Wallet, label: "Earnings" },
];

const FIELD =
  "mt-1.5 h-13 w-full rounded-2xl border border-border-strong bg-surface-2 px-4 text-[1rem] outline-none transition-colors placeholder:text-muted-2 focus:border-royal-bright";

export function TechLoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
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
    <div className="flex min-h-dvh flex-col justify-center bg-background px-5 py-10 text-ink">
      <div className="mx-auto w-full max-w-sm">
        {/* Brand — inset and rounded, the same block the customer's sign-in
            shows a phone, so the two doors of the same company look related. */}
        <div className="relative overflow-hidden rounded-[1.5rem] bg-royal px-5 pb-6 pt-5 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-royal-bright/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative flex items-center justify-between gap-3 [&_*]:text-white">
            <Logo />
            <span className="shrink-0 rounded-full border border-white/25 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/80">
              Field app
            </span>
          </div>

          <h1 className="font-display relative mt-5 text-[1.7rem] leading-[1.15] tracking-[-0.02em]">
            Your day, in your hand.
          </h1>
          <p className="relative mt-2 text-[0.82rem] leading-snug text-white/70">
            Sign in with the number the office has for you.
          </p>

          <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-[0.75rem] text-white/85">
            {INSIDE.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <item.icon className="size-3.5 text-white/70" strokeWidth={2} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="mt-5 rounded-[1.5rem] border border-border bg-card p-5 shadow-premium-lg"
        >
          {error && (
            <p className="mb-4 flex items-start gap-2.5 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-[0.82rem] leading-snug text-danger">
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
              className={FIELD}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-medium text-muted">PIN</span>
            {/* Typed one-handed on a doorstep, often in sunlight — a PIN that
                can't be read back is a PIN that gets retyped three times. */}
            <span className="relative block">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="••••"
                required
                className={`${FIELD} pr-12 tracking-[0.3em]`}
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
                className="absolute bottom-0 right-0 grid h-13 w-12 place-items-center text-muted-2 transition-colors hover:text-ink"
              >
                {showPin ? <EyeOff className="size-[1.05rem]" /> : <Eye className="size-[1.05rem]" />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !phone.trim() || pin.length < 4}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[0.95rem] font-semibold text-background shadow-premium-md transition-transform hover:scale-[1.01] disabled:scale-100 disabled:bg-surface-2 disabled:text-muted-2 disabled:shadow-none"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </button>

          <p className="mt-4 text-center text-[0.72rem] leading-relaxed text-muted">
            Forgotten your PIN? The office can set a new one — it can&apos;t be read back.
          </p>
        </form>

        <p className="mt-6 text-center text-[0.72rem] leading-relaxed text-muted-2">
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
