"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wrench,
  Images,
  ImagePlay,
  Star,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_IMAGE_GROUP_PAGES } from "@/lib/site-images-shared";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/services", label: "Services & prices", icon: Wrench },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/images", label: "Site images", icon: ImagePlay },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-surface-2 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" className="font-display text-lg tracking-[-0.02em]">
            24X7 <span className="text-muted">Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-2 px-3">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-ink text-background" : "text-muted hover:bg-surface-2 hover:text-ink"
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </Link>

                {/* Images opens into one page per section of the site — listed
                    here so a section is one click away, not two. */}
                {item.href === "/admin/images" && active && (
                  <div className="mb-2 ml-6 border-l border-border pl-3">
                    {SITE_IMAGE_GROUP_PAGES.map((g) => {
                      const href = `/admin/images/${g.slug}`;
                      return (
                        <Link
                          key={g.slug}
                          href={href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "mb-0.5 block rounded-lg px-3 py-2 text-[0.82rem] transition-colors",
                            pathname === href
                              ? "bg-surface-2 font-medium text-ink"
                              : "text-muted hover:text-ink"
                          )}
                        >
                          {g.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 space-y-1 border-t border-border p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            <ExternalLink className="size-4.5" /> View site
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
          >
            <LogOut className="size-4.5" /> Log out
          </button>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-ink/40 lg:hidden" />}

      {/* Main — min-w-0 keeps a wide table from stretching this grid column
          and pushing the whole admin layout sideways */}
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-5 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-lg hover:bg-surface-2">
            <Menu className="size-5" />
          </button>
          <span className="font-display text-lg">24X7 Admin</span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
