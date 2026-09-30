"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Headphones,
  ReceiptText,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  CatalogAppliance,
  CatalogIssue,
  CatalogService,
  ServiceReview,
} from "@app/shared";

import { Overlay } from "@/components/ui/Overlay";
import { BrandDisclaimer } from "@/components/BrandCard";
import { ReviewsPanel } from "@/components/ReviewsSheet";
import { usePrefersReducedMotion } from "@/components/ServiceClip";
import { useToast } from "@/components/Toast";
import { durationNote } from "@/components/ServiceRail";
import { StickyCTA, StickySpacer } from "@/components/StickyCTA";
import {
  addToCart,
  countForService,
  inCart,
  useCart,
} from "@/lib/cart";
import {
  fetchBrands,
  fetchBusinessConfig,
  fetchServiceReviews,
} from "@/lib/catalog";
import { formatPaise } from "@/lib/format";
import { shareText } from "@/lib/share";
import { useAsync } from "@/lib/useAsync";
import { cn } from "@/lib/cn";

/**
 * A service, opened over the page it was tapped on — the way the marketplaces
 * open one: photographs across the top, the name and what it starts at, the
 * choices it needs, then everything worth knowing before booking it, in the
 * order somebody asks: how it goes, who comes, which brands, what stands
 * behind it, what it does not cover, the usual questions, and what other
 * people made of it.
 *
 * The choices are steps. A repair is booked for a problem, so the first step
 * is which one; every appliance with a kind — front-load or top-load, split or
 * window — asks that next. A step opens once the one before it is answered,
 * and Add at the foot waits for both. The kind rides along in the cart and
 * opens the booking's details step already chosen; it is not decoration.
 *
 * Every line comes from the catalog entry, the business config, the brands
 * list or the reviews written for this service. Nothing is a number made up
 * to fill a slot the marketplaces happen to have.
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
  /** The service that is open, or null when the sheet is closed. */
  service: CatalogService | null;
  appliance?: CatalogAppliance;
  /** Every service in the catalog. */
  services: readonly CatalogService[];
  issues: readonly CatalogIssue[];
  /** The kind of machine already chosen on the page, picked in advance here. */
  initialKind?: string | null;
  onClose: () => void;
}

export function ServiceSheet({
  service,
  appliance,
  issues,
  initialKind,
  onClose,
}: ServiceSheetProps) {
  const titleId = useId();

  return (
    <Overlay
      open={service !== null}
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
          {/* Keyed, so opening another service starts its choices afresh. */}
          <ServiceDetails
            key={service.id}
            variant="sheet"
            titleId={titleId}
            service={service}
            appliance={appliance}
            issues={issues}
            initialKind={initialKind}
            onClose={onClose}
          />
        </>
      ) : null}
    </Overlay>
  );
}

/**
 * Everything the sheet shows, as its own piece: the sheet frames it in a
 * panel from the bottom, and the service's own page (`/services/detail`) lays
 * the same thing out full width — one design wherever a service is opened,
 * rather than a sheet saying one thing and a page another.
 */
export function ServiceDetails({
  variant,
  titleId,
  service,
  appliance,
  issues,
  initialKind,
  onClose,
}: {
  /** In the sheet it scrolls inside the panel; on a page, with the page. */
  variant: "sheet" | "page";
  titleId?: string;
  service: CatalogService;
  appliance?: CatalogAppliance;
  issues: readonly CatalogIssue[];
  /** The kind of machine already chosen, if any: that step starts answered. */
  initialKind?: string | null;
  /** Closes the sheet on the way to another page; nothing to close on a page. */
  onClose?: () => void;
}) {
  const page = variant === "page";
  const cart = useCart();
  const toast = useToast();

  const loadExtras = useCallback(async () => {
    const [config, brands, reviews] = await Promise.all([
      fetchBusinessConfig().catch(() => null),
      fetchBrands().catch(() => []),
      fetchServiceReviews(service.applianceId, service.serviceKey).catch(
        () => [] as ServiceReview[],
      ),
    ]);
    return { config, brands, reviews };
  }, [service.applianceId, service.serviceKey]);
  const extras = useAsync(loadExtras);

  const options = serviceOptions(service, issues);
  // The one "kind of machine" question the appliance asks, if it asks one.
  const kindField = appliance?.detailFields.find(
    (field) => field.kind === "select" && field.key === "type",
  );
  const kinds = kindField?.options ?? [];

  const [issueId, setIssueId] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(
    initialKind && kinds.includes(initialKind) ? initialKind : null,
  );
  const needsIssue = options.length > 0;
  const needsKind = kinds.length > 0;
  const [openStep, setOpenStep] = useState<1 | 2>(needsIssue ? 1 : 2);

  const ready = (!needsIssue || issueId !== null) && (!needsKind || kind !== null);
  const item = {
    applianceId: service.applianceId,
    serviceKey: service.serviceKey,
    ...(issueId ? { issueId } : {}),
    ...(kind ? { applianceType: kind } : {}),
  };
  const already = inCart(cart, item);
  const added = countForService(cart, service);

  const photos = [
    ...new Set(
      [service.technicianPhoto, service.photo, appliance?.heroImage].filter(
        (photo): photo is string => Boolean(photo),
      ),
    ),
  ];
  const warrantyDays =
    service.warrantyDays ?? extras.data?.config?.defaultWarrantyDays;
  const duration = durationNote(service.durationMinutes)?.replace(/^About /, "");
  const brands = extras.data?.brands ?? [];

  async function share(): Promise<void> {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const outcome = await shareText(
      `${service.name} on 24X7 — ${formatPaise(service.visitFee)} visit fee, quoted before any work starts. ${url}/services/detail/?a=${service.applianceId}&s=${service.serviceKey}`,
      service.name,
    );
    if (outcome === "copied") toast.show("Link copied.", { tone: "success" });
    else if (outcome === "failed")
      toast.show("We could not share that.", { tone: "error" });
  }

  const footerDetail = (
    <p className="min-w-0 flex-1" aria-live="polite">
      {added > 0 ? (
        <>
          <span className="block text-base font-semibold text-ink">
            {added} {added === 1 ? "item" : "items"} added
          </span>
          <Link
            href="/cart"
            onClick={onClose}
            className="text-sm font-semibold text-brand"
          >
            View cart
          </Link>
        </>
      ) : (
        <>
          <span className="block text-base font-semibold text-ink">
            {formatPaise(service.visitFee)}
          </span>
          <span className="block text-sm text-muted">
            {ready ? "Visit fee" : "Pick the options above"}
          </span>
        </>
      )}
    </p>
  );
  const footerButton = (
    <button
      type="button"
      disabled={!ready || already}
      onClick={() => addToCart(item)}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-1.5 rounded-card px-7 text-base font-semibold transition-colors duration-[var(--duration-fast)]",
        already
          ? "border border-brand bg-brand-soft text-brand"
          : "bg-brand text-white hover:bg-brand-deep disabled:bg-surface disabled:text-muted",
      )}
    >
      {already ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          Added
        </>
      ) : (
        "Add to cart"
      )}
    </button>
  );

  return (
    <div
      className={cn(
        page
          ? "-mx-4 lg:mx-0"
          : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.25rem] bg-bg sm:rounded-card sm:shadow-raised",
      )}
    >
      <div
        className={cn(
          !page && "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
      >
        <PhotoStrip photos={photos} rounded={page} />

        <section className="px-5 pb-6 pt-6">
          {page ? (
            <h1 className="text-2xl font-bold leading-tight text-ink">
              {service.name}
            </h1>
          ) : (
            <h2
              id={titleId}
              className="text-2xl font-bold leading-tight text-ink"
            >
              {service.name}
            </h2>
          )}
          <p className="mt-1.5 text-base text-ink">
            <span className="font-semibold">
              Starts at {formatPaise(service.visitFee)}
            </span>
            {duration ? <span className="text-muted"> · {duration}</span> : null}
          </p>
        </section>

        {needsIssue || needsKind ? (
          <>
            <Band />
            <section className="px-5 py-7">
              <h3 className="text-2xl font-bold text-ink">Select requirements</h3>
              <div className="mt-5 divide-y divide-border">
                {needsIssue ? (
                  <Step
                    number={1}
                    title="Select type of issue"
                    answer={options.find((each) => each.id === issueId)?.label}
                    open={openStep === 1}
                    onToggle={() => setOpenStep(1)}
                  >
                    <Choices
                      choices={options.map((issue) => ({
                        key: issue.id,
                        label: issue.label,
                        note: formatPaise(service.visitFee),
                      }))}
                      chosen={issueId}
                      onChoose={(id) => {
                        setIssueId(id);
                        if (needsKind) setOpenStep(2);
                      }}
                    />
                  </Step>
                ) : null}
                {needsKind && kindField ? (
                  <Step
                    number={needsIssue ? 2 : 1}
                    title={`Select ${kindField.label.toLowerCase()}`}
                    answer={kind ? titleCase(kind) : undefined}
                    open={openStep === 2}
                    // Waits for the problem, where there is one to pick.
                    disabled={needsIssue && issueId === null}
                    onToggle={() => setOpenStep(2)}
                  >
                    <Choices
                      choices={kinds.map((each) => ({
                        key: each,
                        label: titleCase(each),
                      }))}
                      chosen={kind}
                      onChoose={setKind}
                    />
                  </Step>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        <Band />
        <Link
          href={
            `/services/detail/?a=${service.applianceId}&s=${service.serviceKey}` as Route
          }
          onClick={onClose}
          className="flex min-h-16 items-center gap-4 px-5 text-base font-semibold text-ink hover:bg-surface"
        >
          <ReceiptText className="size-5 text-muted" aria-hidden="true" />
          <span className="flex-1">Rate card</span>
          <ChevronRight className="size-5 text-muted" aria-hidden="true" />
        </Link>

        {service.process && service.process.length > 0 ? (
          <>
            <Band />
            <section className="px-5 py-7">
              <h3 className="text-2xl font-bold text-ink">Our process</h3>
              <ol className="mt-6">
                {service.process.map((step, index, all) => {
                  const last = index === all.length - 1;
                  return (
                    <li key={step.title} className="relative flex gap-4">
                      {!last ? (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0 left-[0.9375rem] top-9 w-px bg-border"
                        />
                      ) : null}
                      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-ink">
                        {index + 1}
                      </span>
                      <div className={cn("min-w-0 flex-1", last ? "" : "pb-7")}>
                        <p className="pt-1 text-lg font-semibold text-ink">
                          {step.title}
                        </p>
                        <p className="mt-1 text-base leading-relaxed text-muted">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        ) : null}

        <Band />
        <section className="flex items-center gap-4 px-5 py-7">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-ink">Top technicians</h3>
            <ul className="mt-5 flex flex-col gap-4">
              <PromiseLine icon={BadgeCheck}>Verified technicians</PromiseLine>
              <PromiseLine icon={ReceiptText}>
                Repairs only after your approval
              </PromiseLine>
              <PromiseLine icon={FileText}>Digital GST invoice</PromiseLine>
            </ul>
          </div>
          {service.technicianPhoto ? (
            <div className="relative aspect-[3/4] w-[38%] shrink-0 overflow-hidden rounded-card bg-plate">
              <Image
                src={service.technicianPhoto}
                alt=""
                fill
                sizes="(min-width: 640px) 190px, 38vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </section>

        {brands.length > 0 ? (
          <>
            <Band />
            <section className="px-5 py-7">
              <h3 className="text-2xl font-bold text-ink">
                We service all brands
              </h3>
              <ul className="mt-5 grid grid-cols-3 gap-3">
                {brands.map((brand) => (
                  <li
                    key={brand.id}
                    className="flex h-16 items-center justify-center rounded-card bg-logo px-3"
                  >
                    {brand.logo ? (
                      <span className="relative block h-7 w-full">
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          sizes="100px"
                          className="object-contain"
                        />
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-night">
                        {brand.wordmark}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <BrandDisclaimer className="mt-4" />
            </section>
          </>
        ) : null}

        <Band />
        <section className="px-5 py-7">
          <h3 className="text-2xl font-bold text-ink">
            <span className="text-brand">24X7</span> promise
          </h3>
          <ul className="mt-5 flex flex-col gap-4">
            <PromiseLine icon={ShieldCheck}>
              {warrantyDays
                ? `Up to ${warrantyDays} days warranty`
                : "Service warranty on the work"}
            </PromiseLine>
            <PromiseLine icon={ReceiptText}>
              Fixed visit fee, repairs quoted first
            </PromiseLine>
            <PromiseLine icon={Headphones}>Support at any hour</PromiseLine>
          </ul>
        </section>

        {service.excludes && service.excludes.length > 0 ? (
          <>
            <Band />
            <section className="px-5 py-7">
              <h3 className="text-2xl font-bold text-ink">
                What is not included
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                {service.excludes.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3 text-base leading-relaxed text-muted"
                  >
                    <X
                      className="mt-1 size-4 shrink-0 text-error"
                      aria-hidden="true"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {service.faqs && service.faqs.length > 0 ? (
          <>
            <Band />
            <section className="px-5 py-7">
              <h3 className="text-xl font-bold text-ink">
                Frequently asked questions
              </h3>
              <div className="mt-3 divide-y divide-border">
                {service.faqs.map((faq) => (
                  <details key={faq.q} className="group py-1">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 text-base text-ink [&::-webkit-details-marker]:hidden">
                      <span className="flex-1">{faq.q}</span>
                      <ChevronDown
                        className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <p className="pb-4 text-sm leading-relaxed text-muted">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <Band />
        <section className="px-5 py-6 text-center">
          <p className="text-base text-muted">
            Share this service with your loved ones
          </p>
          <button
            type="button"
            onClick={() => void share()}
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-card border border-border text-base font-semibold text-brand hover:border-brand"
          >
            Share
            <Share2 className="size-4" aria-hidden="true" />
          </button>
        </section>

        <Band />
        <section className="px-5 py-7">
          <ReviewsPanel
            rating={service.rating}
            ratingCount={service.reviewCount}
            reviews={extras.data?.reviews ?? []}
            serviceNames={new Map()}
          />
        </section>
      </div>

      {/* The way to add it, for as long as the sheet is open: waits for the
          choices above, then adds; once anything of this service is in the
          cart, the way to it sits beside. */}
      {page ? (
        <>
          <StickySpacer aboveBottomNav />
          <StickyCTA aboveBottomNav wide detail={footerDetail}>
            {footerButton}
          </StickyCTA>
        </>
      ) : (
        <div className="flex items-center gap-3 border-t border-border bg-bg px-5 py-3 pb-[calc(0.75rem+var(--safe-bottom))]">
          {footerDetail}
          {footerButton}
        </div>
      )}
    </div>
  );
}

/**
 * The photographs across the top, one at a time, with a bar per photograph
 * along the foot that fills while it shows — the same hand-on as the banner
 * on the appliance page, and none at all for somebody who asked for less
 * motion.
 */
function PhotoStrip({
  photos,
  rounded = false,
}: {
  photos: readonly string[];
  /** On a page from a laptop up, where it sits inside the column. */
  rounded?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const count = photos.length;

  useEffect(() => {
    if (reducedMotion || count < 2) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), 4000);
    return () => clearTimeout(timer);
  }, [index, count, reducedMotion]);

  if (count === 0) return <div className="h-6" />;

  return (
    <div
      className={cn(
        "relative aspect-[16/11] overflow-hidden bg-plate",
        rounded && "lg:mt-6 lg:rounded-card",
      )}
    >
      {photos.map((photo, i) => (
        <Image
          key={photo}
          src={photo}
          alt=""
          fill
          sizes="(min-width: 640px) 512px, 100vw"
          priority={i === 0}
          className={cn(
            "object-cover transition-opacity duration-500",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      {count > 1 ? (
        <div className="absolute inset-x-5 bottom-3 flex gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index}
              className="flex h-6 flex-1 items-center"
            >
              <span className="block h-1 w-full overflow-hidden rounded-pill bg-white/40">
                <span
                  key={i === index ? `on-${index}` : "off"}
                  className={cn(
                    "block h-full origin-left rounded-pill bg-white",
                    i === index
                      ? reducedMotion
                        ? "scale-x-100"
                        : "animate-[hero-progress_4000ms_linear_forwards]"
                      : i < index
                        ? "scale-x-100"
                        : "scale-x-0",
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** One numbered question in "Select requirements", folding open to its choices. */
function Step({
  number,
  title,
  answer,
  open,
  disabled = false,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  /** What was picked, shown on the folded step. */
  answer?: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const expanded = open && !disabled;
  return (
    <div className="py-4">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 text-left disabled:opacity-45"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface text-sm font-semibold text-ink">
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg text-ink">{title}</span>
          {!expanded && answer ? (
            <span className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-success">
              <Check className="size-4" aria-hidden="true" />
              {answer}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {expanded ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

/** A row of cards to pick one from, scrolling sideways past the sheet's edge. */
function Choices({
  choices,
  chosen,
  onChoose,
}: {
  choices: ReadonlyArray<{ key: string; label: string; note?: string }>;
  chosen: string | null;
  onChoose: (key: string) => void;
}) {
  return (
    <ul
      className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pb-1"
      role="radiogroup"
    >
      {choices.map((choice) => {
        const on = chosen === choice.key;
        return (
          <li key={choice.key} className="shrink-0 snap-start">
            <button
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChoose(choice.key)}
              className={cn(
                "flex min-h-24 w-40 flex-col justify-between rounded-card border p-4 text-left transition-colors duration-[var(--duration-fast)]",
                on
                  ? "border-ink bg-surface"
                  : "border-border hover:border-muted",
              )}
            >
              <span className="line-clamp-2 text-base leading-snug text-ink">
                {choice.label}
              </span>
              {choice.note ? (
                <span className="mt-3 text-lg font-semibold text-ink">
                  {choice.note}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PromiseLine({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 text-lg leading-snug text-ink">
      <Icon className="size-6 shrink-0 text-ink" aria-hidden />
      {children}
    </li>
  );
}

/** "front-load" → "Front-load", "single-door" → "Single-door". */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** The grey band between unrelated blocks, as on the rest of the app. */
function Band() {
  return <div aria-hidden="true" className="h-2 bg-surface" />;
}
