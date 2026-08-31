"use client";

import Link from "next/link";
import { Marquee } from "./Marquee";
import { Logo } from "@/components/ui/Logo";
import { LEGAL_DOCS } from "@/lib/legal";
import { useBrands } from "@/components/providers/BrandsProvider";
import { cn } from "@/lib/utils";

/**
 * Every link here goes somewhere.
 *
 * The columns used to be lists of words with href="#" behind all of them, so
 * a footer that looked like a site map was four columns of nothing. A label
 * with no page behind it was removed rather than pointed at the homepage —
 * Careers, Press and a Blog we do not have said more about the site than
 * leaving them out does.
 *
 * The repairs point at their own row on the services page rather than at the
 * booking form: /book asks people to sign in first, and a footer link that
 * opens a login wall has not taken anyone to the thing they clicked.
 */
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Services",
    links: [
      { label: "Refrigerator Repair", href: "/services#service-refrigerator" },
      { label: "Washing Machine Repair", href: "/services#service-washing-machine" },
      // One service in the catalogue covers both, and both are what people search for.
      { label: "Microwave Repair", href: "/services#service-microwave" },
      { label: "Oven Repair", href: "/services#service-microwave" },
      { label: "AC Repair", href: "/services#service-ac" },
      { label: "Installation", href: "/services#service-installation" },
      { label: "Annual Maintenance", href: "/plans" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/process" },
      { label: "Reviews", href: "/reviews" },
      { label: "Track a Booking", href: "/track" },
      { label: "Contact", href: "/services#contact" },
    ],
  },
  {
    title: "Legal",
    links: LEGAL_DOCS.map((d) => ({ label: d.title, href: `/legal/${d.slug}` })),
  },
];

export function SiteFooter() {
  const brands = useBrands();
  // Brands are the one column an admin can change, so it is assembled here
  // rather than sitting frozen in COLUMNS — and it keeps its place, third.
  const columns = [
    ...COLUMNS.slice(0, 2),
    { title: "Brands", links: brands.map((b) => ({ label: b.name, href: `/brands/${b.id}` })) },
    ...COLUMNS.slice(2),
  ];

  return (
    // Black in both themes. `theme-dark` pins the dark palette on this subtree
    // — the same class the admin panel uses — so every child keeps its own
    // classes and resolves them against a dark ground: text-muted stays
    // readable, hairlines turn light, and the CTA flips to near-white on black.
    // Restating each colour with a `dark:` variant would have left two
    // palettes to keep in step instead of one.
    <footer className="theme-dark relative bg-background pt-14 text-foreground sm:pt-16">
      {/* oversized wordmark marquee */}
      <div className="border-b border-hairline pb-14">
        <Marquee fade={false}>
          <span
            className="font-display bg-clip-text px-6 text-[2.6rem] leading-none tracking-tight text-transparent sm:text-[4rem] lg:text-[5rem]"
            style={{ backgroundImage: "linear-gradient(90deg, #4f74ff, #10b981)" }}
          >
            24X7 Services{" "}
            <span style={{ WebkitTextFillColor: "var(--muted)" }}>—</span>
          </span>
          <span
            className="font-display bg-clip-text px-6 text-[2.6rem] leading-none tracking-tight text-transparent sm:text-[4rem] lg:text-[5rem]"
            style={{ backgroundImage: "linear-gradient(90deg, #4f74ff, #10b981)" }}
          >
            24X7 Services{" "}
            <span style={{ WebkitTextFillColor: "var(--muted)" }}>—</span>
          </span>
        </Marquee>
      </div>

      <div className="mx-auto max-w-[92rem] px-6 py-16 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Link href="/" aria-label="24X7 Services — home" className="inline-block">
              <Logo />
            </Link>
            <p className="mt-5 max-w-xs text-pretty text-sm leading-relaxed text-muted">
              Telangana&apos;s premium doorstep appliance service. Certified experts, genuine
              parts, and a warranty on every repair — 24×7.
            </p>
            {/* The social row was four icons all pointing at "#". Until there
                are profiles to point at, a button that does nothing is worse
                than no button — put them back here with their real URLs. */}
            <Link
              href="/book"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
            >
              Book a service
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map(({ title, links }, i) => (
              // Nudge the right mobile column (odd index) slightly right; no change from sm up.
              <div key={title} className={cn(i % 2 === 1 && "pl-16 sm:pl-0")}>
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</h4>
                <ul className="mt-5 space-y-3">
                  {links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 sm:mt-16 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} 24X7 Services Pvt. Ltd.</p>
          <p>Designed &amp; built in Hyderabad.</p>
        </div>
      </div>
    </footer>
  );
}
