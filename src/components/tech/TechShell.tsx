"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, LogOut, Wallet, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Technician } from "@/lib/technicians";

/**
 * The frame the field app sits in.
 *
 * Built for a phone held in one hand on somebody's doorstep, not for a desk:
 * a short header that says who is signed in, and a thumb-height bar at the
 * foot rather than a sidebar. It widens to a centred column on a laptop rather
 * than growing a second layout nobody in the field will ever see.
 */

const TABS = [
  { href: "/tech", label: "Jobs", icon: ClipboardList },
  { href: "/tech/earnings", label: "Earnings", icon: Wallet },
];

export function TechShell({
  technician,
  children,
}: {
  technician: Technician;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/tech/logout", { method: "POST" });
    router.push("/tech/login");
    router.refresh();
  }

  const initials = technician.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2 text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-ink text-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background/15 text-[0.78rem] font-semibold">
            {initials || <Wrench className="size-4" />}
          </span>
          <span className="min-w-0 flex-1 leading-none">
            <span className="block truncate text-[0.95rem] font-semibold tracking-tight">
              {technician.name}
            </span>
            <span className="mt-1 block truncate text-[0.7rem] text-background/60">
              {[technician.city, technician.phone].filter(Boolean).join(" · ") || "Technician"}
            </span>
          </span>
          <button
            onClick={logout}
            className="grid size-9 shrink-0 place-items-center rounded-full text-background/70 transition-colors hover:bg-background/10 hover:text-background"
            aria-label="Sign out"
          >
            <LogOut className="size-[1.05rem]" />
          </button>
        </div>
      </header>

      {/* pb clears the tab bar, which is fixed over the foot of the page */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-28 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((t) => {
            const active = t.href === "/tech" ? pathname === "/tech" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[0.7rem] font-medium transition-colors",
                  active ? "text-royal-bright" : "text-muted hover:text-ink",
                )}
              >
                <t.icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                {t.label}
              </Link>
            );
          })}
        </div>
        {/* iOS home indicator sits where the bar does */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
