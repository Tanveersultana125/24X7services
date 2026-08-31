"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  ShoppingCart,
  MousePointerClick,
  Users,
  HardHat,
  Wrench,
  Tags,
  ListOrdered,
  Images,
  ImagePlay,
  Star,
  LogOut,
  Menu,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_IMAGE_GROUP_PAGES } from "@/lib/site-images-shared";
import type { AdminBrand } from "@/lib/brands-shared";
import { AdminThemeProvider, AdminThemeToggle } from "@/components/admin/AdminTheme";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { AdminAssistant } from "@/components/admin/AdminAssistant";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  // Baskets sit next to bookings: they are the same list one step earlier.
  { href: "/admin/carts", label: "Baskets", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  // Next to the customers: the two halves of every visit, the people who book
  // it and the people who do it.
  { href: "/admin/technicians", label: "Technicians", icon: HardHat },
  // After customers: the trail is who they were before they were customers.
  { href: "/admin/activity", label: "Activity", icon: MousePointerClick },
  { href: "/admin/services", label: "Services & prices", icon: Wrench },
  // The makes themselves, next to the services they are priced against: a
  // company has to exist here before a service can be ticked for it.
  { href: "/admin/brands", label: "Brands & companies", icon: Tags },
  // Its own line rather than a child of Services & prices: that menu only
  // opened once you were already inside it, so the one page that edits the
  // services page could not be found from anywhere else.
  { href: "/admin/service-list", label: "Services page list", icon: ListOrdered },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/images", label: "Site images", icon: ImagePlay },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

/**
 * The spinner on a link that has been pressed but not yet arrived.
 *
 * `loading.tsx` covers the page itself, but the sidebar stays on screen across
 * the navigation and would otherwise show nothing at all where the press
 * landed. It renders at a fixed size whatever the state, so nothing shifts
 * when it starts or stops.
 */
function Pending() {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      aria-hidden
      className={cn(
        // The box is always there so nothing shifts when it appears; only the
        // one that is actually waiting is drawn, and only it spins — ten
        // invisible spinners still cost ten animations a frame.
        "ml-auto size-4 shrink-0 transition-opacity",
        pending ? "animate-spin opacity-70" : "opacity-0",
      )}
    />
  );
}

export function AdminShell({
  brands,
  children,
}: {
  brands: AdminBrand[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <AdminThemeProvider>
    <div className="min-h-dvh bg-surface-2 text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar */}
      {/* A column, not a box with something pinned to its floor: the links
          scroll and the footer keeps its own row, so a short window — or a
          Services menu opened out into its brands — can't run underneath it.
          Sticky rather than static so the footer stays on screen down a long
          page instead of sitting at the very bottom of it. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Link href="/admin" className="font-display text-lg tracking-[-0.02em]">
            24X7 <span className="text-muted">Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-2">
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
                  <item.icon className="size-4.5 shrink-0" />
                  <span className="min-w-0 truncate">{item.label}</span>
                  <Pending />
                </Link>

                {/* Services opens into one page per manufacturer, where their
                    prices sit side by side — that is how a price is decided,
                    Samsung against Samsung rather than fridge against washer. */}
                {item.href === "/admin/services" && active && (
                  <div className="mb-2 ml-6 border-l border-border pl-3">
                    <Link
                      href="/admin/services"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "mb-0.5 block rounded-lg px-3 py-2 text-[0.82rem] transition-colors",
                        pathname === "/admin/services"
                          ? "bg-surface-2 font-medium text-ink"
                          : "text-muted hover:text-ink",
                      )}
                    >
                      <span className="flex items-center">
                        All services
                        <Pending />
                      </span>
                    </Link>
                    {brands.map((b) => {
                      const href = `/admin/services/${b.id}`;
                      return (
                        <Link
                          key={b.id}
                          href={href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "mb-0.5 flex items-center gap-2 rounded-lg px-3 py-2 text-[0.82rem] transition-colors",
                            pathname === href
                              ? "bg-surface-2 font-medium text-ink"
                              : "text-muted hover:text-ink",
                          )}
                        >
                          <span
                            aria-hidden
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: b.accent }}
                          />
                          <span className="min-w-0 truncate">{b.name}</span>
                          <Pending />
                        </Link>
                      );
                    })}
                  </div>
                )}

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
                          <span className="flex items-center">
                            <span className="min-w-0 truncate">{g.name}</span>
                            <Pending />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-border bg-surface p-3">
          {/* The panel's own theme — the site's dark mode doesn't reach here. */}
          <AdminThemeToggle className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink" />
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
        {/* flex-1 on the main so a short page still pushes the footer to the
            bottom of the window rather than leaving it halfway up. The room
            for the assistant belongs to the footer, which is what sits under
            it — see AdminFooter. */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        <AdminFooter />
        <AdminAssistant />
      </div>
    </div>
    </AdminThemeProvider>
  );
}
