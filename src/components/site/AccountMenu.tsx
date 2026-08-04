"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound, LayoutDashboard, Navigation, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export type SessionUser = { name: string; email: string; picture?: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Account";
}

/**
 * Reads the session after hydration.
 *
 * The nav renders on statically prerendered pages, so the signed-in state
 * can't come from the server without making all of them dynamic.
 * `undefined` means "not known yet" — distinct from `null`, "signed out" —
 * so the nav can hold its space instead of flashing "Log in" at a signed-in
 * visitor on every page load.
 */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => {
        if (active) setUser(d.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
    // Re-check on navigation so signing in or out is reflected straight away.
  }, [pathname]);

  return user;
}

export function Avatar({ user, className }: { user: SessionUser; className?: string }) {
  if (user.picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.picture}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", className)}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-royal-bright text-[0.65rem] font-semibold text-white",
        className,
      )}
    >
      {initials(user.name)}
    </span>
  );
}

/** Posts to the logout route, which clears the cookie and redirects home. */
export function LogOutForm({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <form action="/api/auth/logout" method="post" className={className}>
      {children}
    </form>
  );
}

/** Desktop nav slot: "Log in" when signed out, an account menu when signed in. */
export function AccountMenu() {
  const user = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Unknown yet — hold the space so the nav doesn't jump once it resolves.
  if (user === undefined) {
    return <span aria-hidden className="hidden h-10 w-[6.5rem] lg:block" />;
  }

  if (user === null) {
    return (
      <Link
        href="/login"
        className="hidden items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2 lg:inline-flex"
      >
        <UserRound className="size-4" />
        Log in
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
      >
        <Avatar user={user} className="size-7" />
        <span className="max-w-[7rem] truncate">{firstName(user.name)}</span>
        <ChevronDown className={cn("size-3.5 text-muted transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease }}
            className="absolute right-0 top-[calc(100%+0.6rem)] w-60 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-premium-xl"
          >
            <div className="flex items-center gap-2.5 px-2.5 py-2.5">
              <Avatar user={user} className="size-9" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-semibold">{user.name}</span>
                <span className="block truncate text-xs text-muted">{user.email}</span>
              </span>
            </div>

            <div className="my-1 h-px bg-hairline" />

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-colors hover:bg-surface-2"
            >
              <LayoutDashboard className="size-4 text-muted" /> My dashboard
            </Link>
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-colors hover:bg-surface-2"
            >
              <Navigation className="size-4 text-muted" /> Track a service
            </Link>

            <div className="my-1 h-px bg-hairline" />

            <LogOutForm>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="size-4" /> Log out
              </button>
            </LogOutForm>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
