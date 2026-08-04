"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X, UserRound, ChevronRight, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { SearchTrigger } from "./SearchCommand";
import { AccountMenu, Avatar, LogOutForm, useSession } from "./AccountMenu";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Services", href: "/services" },
  { label: "Brands", href: "/brands" },
  { label: "Process", href: "/process" },
  { label: "Plans", href: "/plans" },
  { label: "Reviews", href: "/reviews" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useSession();

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
      >
        {/* min-w-0 + a tighter left inset on phones: the pill has to stay inside
            the viewport even when the logo and every action are on screen */}
        <nav className="flex w-full min-w-0 max-w-6xl items-center gap-2 rounded-full border border-border/70 bg-surface/70 py-2.5 pl-3.5 pr-2.5 shadow-premium-sm backdrop-blur-xl sm:gap-3 sm:pl-5">

          {/* min-w-0 + truncate is the last line of defence: if the wordmark
              still can't fit, it clips instead of pushing the buttons off-screen.
              No overflow-hidden here — the mark's status dot sits outside its
              box and would get shaved off. */}
          <Link href="/" aria-label="24X7 Services" className="min-w-0 shrink">
            <Logo className="min-w-0 [&>span:last-child]:truncate" />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm transition-colors",
                    active ? "text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-px bg-royal-bright"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* On phones the search bar takes the empty middle so the nav reads as
              one balanced row instead of a logo and a cluster of icons pushed
              to opposite edges. From xl it goes back to hugging the actions. */}
          <SearchTrigger variant="pill" className="min-w-0 flex-1 xl:ml-auto xl:w-auto xl:flex-none" />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:ml-0">
            <SearchTrigger variant="icon" />
            <ThemeToggle />
            <AccountMenu />
            <Link
              href="/book"
              className="group hidden items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] sm:inline-flex"
            >
              Book now
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-9 shrink-0 place-items-center rounded-full glass sm:size-10 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background lg:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-10 place-items-center rounded-full glass">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-col px-6 pt-6">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between border-b border-hairline py-3 text-[1.05rem] font-medium tracking-tight text-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                    <ChevronRight className="size-4 text-muted-2 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </motion.div>
              ))}
              <div className="mt-8 flex flex-col gap-2.5">
                <Link
                  href="/book"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[0.95rem] font-medium text-background"
                >
                  Book a service <ArrowUpRight className="size-5" />
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-border-strong text-[0.95rem] font-medium text-ink"
                    >
                      <Avatar user={user} className="size-6" /> My dashboard
                    </Link>
                    <LogOutForm>
                      <button
                        type="submit"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.95rem] font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        <LogOut className="size-5" /> Log out
                      </button>
                    </LogOutForm>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-strong text-[0.95rem] font-medium text-ink"
                  >
                    <UserRound className="size-5" /> Log in
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
