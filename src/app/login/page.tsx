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

export default function LoginPage() {
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
          <Logo />
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
          <div className="flex items-center gap-3 lg:hidden">
            <Logo showWord={false} />
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <LoginCard />
        </div>

        <p className="px-6 pb-8 text-center text-xs text-muted">
          By continuing you agree to our{" "}
          <Link href="#" className="underline underline-offset-2">Terms</Link> &amp;{" "}
          <Link href="#" className="underline underline-offset-2">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
