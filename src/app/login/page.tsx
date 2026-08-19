import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Star, ShieldCheck, Clock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginCard } from "@/components/site/LoginCard";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to 24X7 Services to manage bookings, invoices, warranty and AMC plans.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only allow same-origin relative paths — never an external URL (open-redirect guard).
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left — editorial brand panel */}
      <aside className="relative hidden overflow-hidden bg-royal p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[32rem] rounded-full bg-royal-bright/40 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "56px 56px" }}
        />
        <div className="relative [&_*]:text-white">
          <Link href="/" aria-label="24X7 Services — home" className="inline-block">
            <Logo />
          </Link>
        </div>

        <div className="relative">
          <blockquote className="font-display max-w-md text-4xl leading-[1.1] tracking-[-0.02em]">
            &ldquo;The most premium home-service experience I&apos;ve ever used — tracked, warrantied, effortless.&rdquo;
          </blockquote>
          <p className="mt-6 text-white/70">Ananya R. · Premium AMC member since 2024</p>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-8 text-sm">
            <span className="flex items-center gap-2"><Star className="size-4 fill-amber text-amber" /> 4.9 average rating</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-bright" /> 90-day warranty</span>
            <span className="flex items-center gap-2"><Clock className="size-4 text-white/70" /> Under 90 min</span>
          </div>
        </div>

        <p className="relative text-sm text-white/50">© {new Date().getFullYear()} 24X7 Services</p>
      </aside>

      {/* Right — form */}
      <main className="relative flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft className="size-4" /> Home
          </Link>
          <ThemeToggle />
        </div>

        {/* The brand panel is the left half of this page, and below lg there is
            no left half — so a phone met a bare form on an empty screen. It
            appears here as a card: the mark, the member's line, and the three
            things worth knowing before signing in.

            Inset and rounded, not full-bleed. Everything else on this page sits
            inside the same 24px margin, so a blue block running off both edges
            read as a panel with its sides chopped off. */}
        <div className="relative mx-6 overflow-hidden rounded-[1.5rem] bg-royal px-5 pb-6 pt-5 text-white lg:hidden">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-royal-bright/40 blur-3xl" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative [&_*]:text-white">
            <Link href="/" aria-label="24X7 Services — home" className="inline-block">
              <Logo />
            </Link>
          </div>
          <blockquote className="font-display relative mt-5 text-[1.6rem] leading-[1.15] tracking-[-0.02em]">
            &ldquo;The most premium home-service experience I&apos;ve ever used.&rdquo;
          </blockquote>
          <p className="relative mt-2.5 text-[0.8rem] text-white/70">
            Ananya R. · Premium AMC member since 2024
          </p>
          <div className="relative mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-[0.78rem]">
            <span className="flex items-center gap-1.5"><Star className="size-3.5 fill-amber text-amber" /> 4.9 rating</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-bright" /> 90-day warranty</span>
            <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-white/70" /> Under 90 min</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:py-12">
          <LoginCard next={safeNext} />
        </div>

        {/* The chat button is fixed 20px off the bottom-right and is 56px
            across, so on a phone it sat over the end of this line. Clear it
            vertically rather than nudging the text off-centre. */}
        <p className="px-6 pb-24 text-center text-xs text-muted sm:pb-8">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="underline underline-offset-2">Terms</Link> &amp;{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
