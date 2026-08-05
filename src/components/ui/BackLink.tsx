"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Booking and the dashboard are detours, so this returns to whatever page sent
 * the customer here rather than always dropping them on the homepage.
 *
 * Home is the fallback for a cold arrival — a shared link or a new tab — where
 * there is no earlier entry to go back to.
 */
export function BackLink({
  compact = false,
  className,
}: {
  /** Hides the label below sm, for headers with no room to spare. */
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      <span className={compact ? "hidden sm:inline" : undefined}>Back</span>
    </button>
  );
}
