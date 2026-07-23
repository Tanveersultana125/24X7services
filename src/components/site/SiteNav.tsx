"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Menu, X, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { SearchTrigger } from "./SearchCommand";
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
        <nav className="flex w-full max-w-6xl items-center gap-3 rounded-full border border-border/70 bg-surface/70 py-2.5 pl-5 pr-2.5 shadow-premium-sm backdrop-blur-xl">

          <Link href="/" aria-label="24X7 Services" className="shrink-0">
            <Logo />
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
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

          <div className="ml-auto flex items-center gap-2">
            <SearchTrigger variant="pill" />
            <SearchTrigger variant="icon" />
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2 lg:inline-flex"
            >
              <UserRound className="size-4" />
              Log in
            </Link>
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
              className="grid size-10 place-items-center rounded-full glass lg:hidden"
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
                    className="font-display block border-b border-hairline py-4 text-[1.75rem] tracking-tight"
                  >
                    {l.label}
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
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-strong text-[0.95rem] font-medium text-ink"
                >
                  <UserRound className="size-5" /> Log in
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
