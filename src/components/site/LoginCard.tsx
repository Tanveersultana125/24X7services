"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ShieldCheck, Smartphone, Loader2 } from "lucide-react";

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 27.68c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.98 21.98 0 0 0 2 23.5c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

export function LoginCard() {
  const router = useRouter();
  const [step, setStep] = useState<"method" | "otp">("method");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState<null | "google" | "otp" | "verify">(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = () => {
    if (phone.length < 10) return;
    setLoading("otp");
    setTimeout(() => {
      setLoading(null);
      setStep("otp");
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }, 900);
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) inputs.current[i + 1]?.focus();
  };

  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const verify = () => {
    if (otp.some((d) => !d)) return;
    setLoading("verify");
    setTimeout(() => router.push("/dashboard"), 1000);
  };

  const googleLogin = () => {
    setLoading("google");
    setTimeout(() => router.push("/dashboard"), 1100);
  };

  return (
    <div className="w-full max-w-sm">
      <AnimatePresence mode="wait">
        {step === "method" ? (
          <motion.div
            key="method"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-4xl tracking-[-0.02em]">Welcome back</h1>
            <p className="mt-3 text-muted">Log in to manage bookings, invoices and your AMC plan.</p>

            <button
              onClick={googleLogin}
              disabled={!!loading}
              className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border-strong bg-surface py-3.5 font-medium transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              {loading === "google" ? <Loader2 className="size-5 animate-spin" /> : <GoogleG className="size-5" />}
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.18em] text-muted-2">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <label className="mb-2 block text-sm font-medium">Phone number</label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 focus-within:border-royal-bright focus-within:ring-2 focus-within:ring-royal-bright/20">
              <span className="flex items-center gap-1.5 border-r border-border py-3.5 pr-3 text-sm text-muted">
                <Smartphone className="size-4" /> +91
              </span>
              <input
                value={phone}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="98765 43210"
                className="w-full bg-transparent py-3.5 text-base outline-none placeholder:text-muted-2"
              />
            </div>

            <button
              onClick={sendOtp}
              disabled={phone.length < 10 || !!loading}
              className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-medium text-background transition-transform enabled:hover:scale-[1.01] disabled:opacity-50"
            >
              {loading === "otp" ? <Loader2 className="size-5 animate-spin" /> : <>Continue with OTP <ArrowRight className="size-4" /></>}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button onClick={() => setStep("method")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
              <ArrowLeft className="size-4" /> Back
            </button>
            <h1 className="font-display text-4xl tracking-[-0.02em]">Enter the code</h1>
            <p className="mt-3 text-muted">
              We sent a 6-digit code to <span className="font-medium text-ink">+91 {phone}</span>.
            </p>

            <div className="mt-8 flex justify-between gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  value={d}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onOtpKey(i, e)}
                  className="h-14 w-full flex-1 rounded-2xl border border-border bg-surface text-center text-xl font-semibold outline-none transition-colors focus:border-royal-bright focus:ring-2 focus:ring-royal-bright/20"
                />
              ))}
            </div>

            <button
              onClick={verify}
              disabled={otp.some((x) => !x) || !!loading}
              className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-royal-bright py-3.5 font-medium text-white shadow-royal transition-transform enabled:hover:scale-[1.01] disabled:opacity-50"
            >
              {loading === "verify" ? <Loader2 className="size-5 animate-spin" /> : <>Verify &amp; continue <ArrowRight className="size-4" /></>}
            </button>
            <p className="mt-5 text-center text-sm text-muted">
              Didn&apos;t get it? <button onClick={sendOtp} className="font-medium text-royal-bright">Resend code</button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 text-emerald" /> Protected by bank-grade encryption
      </p>
    </div>
  );
}
