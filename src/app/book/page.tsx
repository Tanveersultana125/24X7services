import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getCustomerSession } from "@/lib/customer/auth";

export const metadata: Metadata = {
  title: "Book a Service",
  description: "Book certified doorstep appliance repair anywhere in Telangana in under 60 seconds.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  // Gate: a customer MUST be signed in before booking anything. If not, bounce
  // to /login and come straight back here (with any prefill query intact).
  const user = await getCustomerSession();
  if (!user) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (typeof value === "string") qs.set(key, value);
      else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
    }
    const suffix = qs.toString();
    const next = `/book${suffix ? `?${suffix}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

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
          <p className="mt-2 text-muted">
            A premium repair experience, booked in a few taps · signed in as{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-2" />}>
          <BookingFlow customer={{ name: user.name, email: user.email }} />
        </Suspense>
      </main>
    </div>
  );
}
