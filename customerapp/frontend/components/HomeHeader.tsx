"use client";

import { Bell, LogIn, LogOut, WalletMinimal } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { LocationSelector } from "@/components/LocationSelector";
import { CartButton } from "@/components/CartButton";
import { ConfirmModal } from "@/components/Modal";
import { SearchBar } from "@/components/SearchBar";
import { useToast } from "@/components/Toast";
import { signOut, useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/format";

/**
 * The top of Home: where the customer is, and what they are looking for.
 *
 * Two pieces, both on solid white, the way every app of this kind does it.
 * The location row sits in the page and scrolls away with it; the search field
 * under it is sticky, so it rides up with the finger and then stays pinned at
 * the top. Nothing animates and nothing waits for a scroll threshold — the
 * header moves exactly as far as the page does, which is what makes it feel
 * smooth, and because both pieces are opaque, the banner and the rails below
 * pass underneath without a single word showing through.
 *
 * It used to float, transparent, over the hero banner, and fold itself down
 * once the page moved. Every scroll then ran the banner's headline up under
 * the location and the search field for the length of the fold — text over
 * text, on the most-seen screen in the app.
 *
 * A fragment rather than a wrapper: sticky only holds inside its parent, and
 * the parent here is the shell's full-height column, so the search field stays
 * pinned for the whole page rather than for the height of a wrapper.
 */
export function HomeHeader({
  area,
  detail,
  raised = false,
  tone,
  onChangeLocation,
  onSearch,
}: {
  /**
   * The colour of the banner in view under the header, as a hex value. Given,
   * the header is painted with it and its words turn white, so header and
   * banner read as one block, as on the marketplaces' home screens; once the
   * page scrolls, the pinned search bar goes back to the page colour.
   */
  tone?: string;
  /** The saved area, once there is one. Absent reads as "Set your location". */
  area?: string;
  /** City and pincode, on the line under it. */
  detail?: string;
  /** Set once the page has scrolled: a hairline and shadow under the search. */
  raised?: boolean;
  onChangeLocation: () => void;
  onSearch: () => void;
}) {
  // Painted while the banner is in view under it; the caller stops passing a
  // tone once the banner has scrolled away.
  const painted = Boolean(tone);

  return (
    <>
      {/* The status bar's own strip, so the pinned search field never slides
          under the clock. Zero tall on anything without a notch. */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-x-0 top-0 z-40 h-[var(--safe-top)] transition-colors duration-500 lg:hidden",
          !painted && "bg-bg",
        )}
        style={painted ? { backgroundColor: tone } : undefined}
      />
      <div
        className={cn(
          "pt-[var(--safe-top)] transition-colors duration-500 lg:hidden",
          !tone && "bg-bg",
        )}
        style={tone ? { backgroundColor: tone } : undefined}
      >
        <div className="mx-auto flex max-w-lg items-start gap-2 px-4 pt-2">
          <LocationSelector
            className="min-w-0 flex-1"
            area={area}
            detail={detail}
            onDark={Boolean(tone)}
            onClick={onChangeLocation}
          />
          <div className="flex shrink-0 gap-2">
            {/* The wallet glyph every app of this shape puts in this corner,
                opening the balance: credits we issued, plus whatever the
                customer has added. Closed loop — it buys our own services and
                nothing else — which is the condition on it being here at all. */}
            <HeaderTile
              href="/profile/wallet"
              label="Balance"
              icon={WalletMinimal}
              onDark={Boolean(tone)}
            />
            <HeaderTile
              href="/profile/notifications"
              label="Notifications"
              icon={Bell}
              onDark={Boolean(tone)}
            />
            <AccountTile onDark={Boolean(tone)} />
          </div>
        </div>
      </div>
      <div
        className={cn(
          "sticky top-[var(--safe-top)] z-30 lg:hidden",
          // The same timing as the strips above it, so the two change colour
          // together when a slide changes rather than showing a seam between
          // an old colour and a new one.
          "transition-[box-shadow,background-color] duration-500",
          !painted && "bg-bg",
          // The hairline belongs to the page colour; on the banner's colour
          // it would draw a white seam across the block.
          raised &&
            !painted &&
            "shadow-[0_1px_0_var(--color-border),0_6px_16px_-10px_rgb(23_21_15/0.25)]",
        )}
        // At a fractional display scale (125% on Windows, most Androids) the
        // blocks above and below land on half pixels and the page colour shows
        // through the joins as thin white lines. The bar's own colour, drawn a
        // pixel past its top and bottom, covers both joins.
        style={
          painted
            ? {
                backgroundColor: tone,
                boxShadow: `0 -1px 0 ${tone}, 0 1px 0 ${tone}`,
              }
            : undefined
        }
      >
        {/* Once the banner slides up under the pinned bar, its lighter colour
            meets the bar's solid one in a hard edge that reads as a line.
            A short fade from the bar's colour hides the edge. */}
        {painted && raised ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-6"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${tone}, transparent)`,
            }}
          />
        ) : null}
        {/* The cart beside the search, so it stays in reach once the location
            row has scrolled away. */}
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 pt-3 pb-3">
          <SearchBar
            readOnly
            onOpen={onSearch}
            // Crisp white on the colour, as the marketplaces have it; the dark
            // theme keeps its own field so the muted hint stays readable.
            className={cn(
              "min-w-0 flex-1",
              painted && "border-transparent bg-white dark:bg-surface",
            )}
          />
          <CartButton
            className={cn(painted && "border-white/25 bg-white/15 text-white hover:bg-white/25")}
          />
        </div>
      </div>
    </>
  );
}

/**
 * Log in, or log out, from the top of Home.
 *
 * A labelled button rather than a bare glyph: the log-in and log-out arrows
 * are mirror images of each other, and on their own nobody can tell which one
 * they are looking at. Logging out asks first, with the number it is leaving,
 * because it is one tap from the top of the most-used screen.
 *
 * Nothing until Firebase has reported whether anyone is signed in, so the
 * button never says "Login" for a beat to somebody who already is.
 */
function AccountTile({ onDark = false }: { onDark?: boolean }) {
  const { user, ready } = useAuth();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!ready) return <span className="h-11 w-20" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent("/home")}` as Route}
        className={cn(PILL_CLASS, onDark && ON_DARK)}
      >
        <LogIn className="size-4" aria-hidden="true" />
        Login
      </Link>
    );
  }

  async function leave(): Promise<void> {
    setLeaving(true);
    try {
      await signOut();
      setConfirming(false);
      toast.show("You have been logged out.");
    } catch {
      toast.show("We could not log you out. Please try again.", {
        tone: "error",
      });
    } finally {
      setLeaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(PILL_CLASS, onDark && ON_DARK)}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Logout
      </button>
      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void leave()}
        loading={leaving}
        destructive
        title="Log out of 24X7?"
        description={
          user.phoneNumber
            ? `You are logged in as ${formatPhone(user.phoneNumber)}. Your bookings stay saved to this number.`
            : "Your bookings stay saved to your account."
        }
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
      />
    </>
  );
}

const PILL_CLASS =
  "flex h-11 items-center gap-1.5 rounded-card border border-border bg-bg px-3 text-sm font-semibold text-brand hover:bg-brand-soft";

const TILE_CLASS =
  "flex size-11 items-center justify-center rounded-card border border-border bg-bg text-brand hover:bg-brand-soft";

/**
 * One of the square buttons in the top right.
 *
 * An outlined tile rather than a bare icon: an outline-weight glyph on its own
 * reads as decoration, not as something to press. Two of them
 * and the Login button is the ceiling — the location has to keep enough width
 * to show an area name before it truncates.
 */
/** The tiles over a painted header: glass on the colour, white glyphs. */
const ON_DARK = "border-white/25 bg-white/15 text-white hover:bg-white/25";

function HeaderTile({
  href,
  label,
  icon: Icon,
  onDark = false,
}: {
  href: Route;
  label: string;
  icon: typeof Bell;
  onDark?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(TILE_CLASS, onDark && ON_DARK)}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Link>
  );
}
