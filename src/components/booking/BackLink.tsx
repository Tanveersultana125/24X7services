"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Booking is a detour, so this returns to whatever page sent the customer here
 * rather than always dropping them on the homepage.
 *
 * Home is the fallback for a cold arrival — a shared link or a new tab — where
 * there is no earlier entry to go back to.
 */
export function BackLink() {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back</span>
    </button>
  );
}
