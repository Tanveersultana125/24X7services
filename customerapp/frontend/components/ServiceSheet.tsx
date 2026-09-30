"use client";

import { useCallback, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type {
  CatalogAppliance,
  CatalogIssue,
  CatalogService,
} from "@app/shared";

import { Overlay } from "@/components/ui/Overlay";
import { ServiceScore, countNote } from "@/components/ServiceScore";
import { durationNote } from "@/components/ServiceRail";
import {
  addToCart,
  countForService,
  inCart,
  removeFromCart,
  useCart,
} from "@/lib/cart";
import { fetchBusinessConfig } from "@/lib/catalog";
import { formatPaise } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/cn";

/**
 * A repair's options, and everything worth knowing before picking one.
 *
 * A repair is booked for a problem, and the problems are the options: "AC
 * repair" opens this sheet rather than going straight into the cart, and each
 * problem has its own "Add". Every option costs the same visit fee — the fee
 * pays for the inspection, and whatever the repair needs is quoted on site —
 * so the price on each card is that fee, stated as it is.
 *
 * Below the options it reads the way a service page reads: what the visit
 * covers, how it goes, what stands behind it, and what it does not include.
 * Every line of it comes from the catalog entry or the business config; the
 * pictures are the appliance's own photographs, so the sheet shows the same
 * machine the rails do.
 */

/** Only a repair is booked for a problem; the rest go into the cart as they are. */
export function serviceOptions(
  service: Pick<CatalogService, "applianceId" | "serviceKey">,
  issues: readonly CatalogIssue[],
): CatalogIssue[] {
  if (service.serviceKey !== "repair") return [];
  return issues.filter((issue) => issue.applianceId === service.applianceId);
}

export interface ServiceSheetProps {
  /** The service whose options are open, or null when the sheet is closed. */
  service: CatalogService | null;
  appliance?: CatalogAppliance;
  /** Every service in the catalog — where the appliance's photographs come from. */
  services: readonly CatalogService[];
  issues: readonly CatalogIssue[];
  onClose: () => void;
}

export function ServiceSheet({
  service,
  appliance,
  services,
  issues,
  onClose,
}: ServiceSheetProps) {
  const titleId = useId();
  const cart = useCart();

  const loadConfig = useCallback(() => fetchBusinessConfig(), []);
  const config = useAsync(loadConfig);

  const open = service !== null;
  const options = service ? serviceOptions(service, issues) : [];
  const added = service ? countForService(cart, service) : 0;

  // The picture at the top, then the appliance's other photographs for the
  // steps, each used once — a step with no photograph left keeps its text.
  const hero = service?.photo ?? appliance?.heroImage ?? appliance?.image;
  const gallery = service
    ? [
        ...new Set(
          services
            .filter((each) => each.applianceId === service.applianceId)
            .map((each) => each.photo)
            .filter((photo): photo is string => Boolean(photo)),
        ),
      ].filter((photo) => photo !== hero)
    : [];

  const warrantyDays =
    service?.warrantyDays ?? config.data?.defaultWarrantyDays ?? undefined;
  const duration = durationNote(service?.durationMinutes);

  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      // The panel itself is only a frame: the close button hangs above it, on
      // the backdrop, where scrolled content can never slide underneath it.
      className={cn(
        "relative mt-auto flex max-h-[88dvh] w-full flex-col",
        "sm:m-auto sm:max-w-lg",
      )}
    >
      {service ? (
        <>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-14 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-bg text-ink shadow-md hover:bg-surface"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.25rem] bg-bg sm:rounded-card sm:shadow-raised">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* The hero: the photograph across the width, faded to white on
                the left where the name sits over it. */}
              <div className="relative h-52 overflow-hidden bg-surface">
                {hero ? (
                  <Image
                    src={hero}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 512px, 100vw"
                    className="object-cover object-right"
                    priority
                  />
                ) : null}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent"
                />
                <div className="relative flex h-full max-w-[60%] flex-col justify-center px-5">
                  <p className="text-2xl font-bold leading-tight text-ink">
                    {service.name}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-snug text-muted">
                    {firstSentence(service.description)}
                  </p>
                </div>
              </div>

              <section className="px-5 pb-6 pt-6">
                <h2
                  id={titleId}
                  className="text-2xl font-bold leading-tight text-ink"
                >
                  {service.name}
                </h2>
                <ServiceScore
                  rating={service.rating}
                  reviewCount={service.reviewCount}
                  className="mt-2"
                />

                <div className="mt-5 flex items-center gap-3 rounded-card bg-surface px-4 py-3.5">
                  <ShieldCheck
                    className="size-5 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 text-sm text-ink">
                    <span className="font-semibold">
                      {formatPaise(service.visitFee)} visit fee
                    </span>
                    <span className="text-muted">
                      {" "}
                      · repairs quoted before work starts
                    </span>
                  </p>
                </div>
              </section>

              {options.length > 0 ? (
                <section className="border-t border-border py-6">
                  <h3 className="px-5 text-lg font-semibold text-ink">
                    What is the problem?
                  </h3>
                  <p className="mt-1 px-5 text-sm text-muted">
                    Add the one you are seeing. Add more than one if there are
                    several.
                  </p>
                  <ul className="no-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pb-1">
                    {options.map((issue) => {
                      const item = {
                        applianceId: service.applianceId,
                        serviceKey: service.serviceKey,
                        issueId: issue.id,
                      };
                      const chosen = inCart(cart, item);
                      return (
                        <li
                          key={issue.id}
                          className={cn(
                            "flex w-44 shrink-0 snap-start flex-col rounded-card border p-4 transition-colors duration-[var(--duration-fast)]",
                            chosen
                              ? "border-brand bg-brand-soft/40"
                              : "border-border",
                          )}
                        >
                          <p className="line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-ink">
                            {issue.label}
                          </p>
                          <ServiceScore
                            rating={service.rating}
                            reviewCount={service.reviewCount}
                            variant="compact"
                            className="mt-1.5"
                          />
                          <p className="mt-4 text-base font-semibold text-ink">
                            {formatPaise(service.visitFee)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              chosen ? removeFromCart(item) : addToCart(item)
                            }
                            aria-pressed={chosen}
                            aria-label={
                              chosen
                                ? `Remove ${service.name}, ${issue.label}, from cart`
                                : `Add ${service.name}, ${issue.label}, to cart`
                            }
                            className={cn(
                              "mt-4 inline-flex h-11 w-24 items-center justify-center gap-1 rounded-card border text-sm font-semibold transition-colors duration-[var(--duration-fast)]",
                              chosen
                                ? "border-brand bg-bg text-brand"
                                : "border-border bg-bg text-brand hover:border-brand",
                            )}
                          >
                            {chosen ? (
                              <>
                                <Check className="size-4" aria-hidden="true" />
                                Added
                              </>
                            ) : (
                              "Add"
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}

              <Band />

              <section className="px-5 py-7">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
                  <Sparkles
                    className="size-5 fill-warning text-warning"
                    aria-hidden="true"
                  />
                  Highlights
                </p>
                {service.reviewCount ? (
                  <p className="mt-4 text-lg font-semibold leading-snug text-ink">
                    Chosen by {countNote(service.reviewCount)} customers for{" "}
                    {service.name}
                  </p>
                ) : null}
                <ul className="mt-4 flex flex-col gap-3">
                  <Highlight>
                    {formatPaise(service.visitFee)} covers the visit and a full
                    inspection
                  </Highlight>
                  <Highlight>
                    Any repair is quoted first and starts only after you approve
                    it
                  </Highlight>
                  {duration ? (
                    <Highlight>{duration} on site, usually</Highlight>
                  ) : null}
                  {warrantyDays ? (
                    <Highlight>
                      {warrantyDays}-day warranty on the work and the parts we
                      fit
                    </Highlight>
                  ) : null}
                </ul>
              </section>

              {service.process && service.process.length > 0 ? (
                <>
                  <Band />
                  <section className="px-5 py-7">
                    <h3 className="text-2xl font-bold text-ink">Our process</h3>
                    <ol className="mt-6">
                      {service.process.map((step, index) => {
                        const photo = gallery[index];
                        const last =
                          index === (service.process?.length ?? 0) - 1;
                        return (
                          <li key={step.title} className="relative flex gap-4">
                            {/* The rail joining the numbers, stopping at the
                              last one. */}
                            {!last ? (
                              <span
                                aria-hidden="true"
                                className="absolute bottom-0 left-[0.9375rem] top-9 w-px bg-border"
                              />
                            ) : null}
                            <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
                              {index + 1}
                            </span>
                            <div
                              className={cn(
                                "min-w-0 flex-1",
                                last ? "pb-0" : "pb-8",
                              )}
                            >
                              <p className="pt-1 text-lg font-semibold text-ink">
                                {step.title}
                              </p>
                              <p className="mt-1.5 text-base leading-relaxed text-muted">
                                {step.body}
                              </p>
                              {photo ? (
                                // Contained, not cropped: these are product
                                // photographs on white, and a crop cuts the
                                // machine in half. Multiplied onto the tile so
                                // each one's own near-white backdrop becomes
                                // the tile's colour instead of a box within it.
                                <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-card bg-plate">
                                  <Image
                                    src={photo}
                                    alt=""
                                    fill
                                    sizes="(min-width: 640px) 420px, 80vw"
                                    className="object-contain p-4 mix-blend-multiply"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                </>
              ) : null}

              <Band />

              <section className="px-5 py-7">
                <h3 className="text-2xl font-bold text-ink">
                  Covered on every visit
                </h3>
                <ul className="mt-5 grid grid-cols-3 gap-3">
                  <CoverTile icon={ShieldCheck}>
                    {warrantyDays
                      ? `${warrantyDays}-day warranty`
                      : "Service warranty"}
                  </CoverTile>
                  <CoverTile icon={ReceiptText}>
                    Quote before any repair
                  </CoverTile>
                  <CoverTile icon={BadgeCheck}>Verified technicians</CoverTile>
                </ul>
              </section>

              {service.excludes && service.excludes.length > 0 ? (
                <>
                  <Band />
                  <section className="px-5 py-7">
                    <h3 className="text-2xl font-bold text-ink">
                      Not included
                    </h3>
                    <ul className="mt-4 flex flex-col gap-3">
                      {service.excludes.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-3 text-base leading-relaxed text-muted"
                        >
                          <X
                            className="mt-1 size-4 shrink-0 text-muted"
                            aria-hidden="true"
                          />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              ) : null}

              <div className="border-t border-border px-5 py-2">
                <Link
                  href={
                    `/services/detail/?a=${service.applianceId}&s=${service.serviceKey}` as Route
                  }
                  onClick={onClose}
                  className="flex min-h-12 items-center justify-between text-base font-semibold text-ink"
                >
                  Questions, reviews and more
                  <ChevronRight
                    className="size-5 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            {added > 0 ? (
              <div className="flex items-center gap-3 border-t border-border bg-bg px-5 py-3 pb-[calc(0.75rem+var(--safe-bottom))]">
                <p className="min-w-0 flex-1" aria-live="polite">
                  <span className="block text-base font-semibold text-ink">
                    {added} {added === 1 ? "item" : "items"} added
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {service.name}
                  </span>
                </p>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="inline-flex h-12 items-center justify-center rounded-card bg-brand px-7 text-base font-semibold text-white hover:bg-brand-deep"
                >
                  View cart
                </Link>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </Overlay>
  );
}

/** "Not cooling, leaking water. Inspection first." → "Not cooling, leaking water." */
function firstSentence(text: string): string {
  const end = text.search(/[.!?](\s|$)/);
  return end === -1 ? text : text.slice(0, end + 1);
}

/** The grey band between unrelated blocks, as on the rest of the app. */
function Band() {
  return <div aria-hidden="true" className="h-2 bg-surface" />;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-base leading-relaxed text-ink">
      <Check className="mt-1 size-4 shrink-0 text-ink" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function CoverTile({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-card bg-surface p-3.5">
      <Icon className="size-7 text-ink" aria-hidden />
      <span className="text-sm font-medium leading-snug text-ink">
        {children}
      </span>
    </li>
  );
}
