"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { getFirebaseAuth, createGoogleProvider, firebaseConfigured } from "@/lib/firebase/client";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);

    if (!firebaseConfigured) {
      setError("Google sign-in isn't configured yet. Please contact support.");
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, createGoogleProvider());
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "server_not_configured"
            ? "Google sign-in isn't configured yet. Please contact support."
            : "We couldn't complete your sign-in. Please try again.",
        );
        await auth.signOut().catch(() => {});
        return;
      }

      // Full navigation so the server picks up the new session cookie.
      window.location.assign("/dashboard");
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User simply dismissed the popup — no error banner needed.
      } else if (code === "auth/popup-blocked") {
        setError("Your browser blocked the sign-in popup. Please allow popups and try again.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-4xl tracking-[-0.02em]">Welcome back</h1>
      <p className="mt-3 text-muted">Log in with Google to manage bookings, invoices and your AMC plan.</p>

      {error && (
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={signIn}
        disabled={loading}
        className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border-strong bg-surface py-3.5 font-medium transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleG className="size-5" />}
        {loading ? "Signing you in…" : "Continue with Google"}
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        New to 24X7? Signing in with Google creates your account automatically.
      </p>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 text-emerald" /> Protected by bank-grade encryption
      </p>
    </div>
  );
}
