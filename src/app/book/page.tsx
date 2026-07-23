import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a Service",
  description: "Book certified doorstep appliance repair anywhere in Telangana in under 60 seconds.",
};

export default function BookPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Home</span>
          </Link>
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Book your service</h1>
          <p className="mt-2 text-muted">A premium repair experience, booked in a few taps.</p>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-2" />}>
          <BookingFlow />
        </Suspense>
      </main>
    </div>
  );
}
