"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError(null);

    if (!firebaseConfigured) {
      setError("Google sign-in isn't configured yet.");
      return;
    }

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, createGoogleProvider());
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error === "not_admin"
            ? "This Google account isn't authorised for admin access."
            : data.error === "server_not_configured"
              ? "Admin sign-in isn't configured yet."
              : "We couldn't sign you in. Please try again.",
        );
        // Not an admin (or failed) — drop the Firebase session so we don't leave
        // them half-signed-in on the admin surface.
        await auth.signOut().catch(() => {});
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // dismissed — no banner
      } else if (code === "auth/popup-blocked") {
        setError("Your browser blocked the sign-in popup. Please allow popups and try again.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-premium-lg">
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={signIn}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-strong bg-surface-2 font-medium transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleG className="size-5" />}
        {loading ? "Signing in…" : "Continue with Google"}
      </button>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 text-emerald" /> Restricted to authorised admin accounts
      </p>
    </div>
  );
}
