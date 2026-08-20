import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LEGAL_DOCS } from "@/lib/legal";

/**
 * The panel's own footer.
 *
 * The site's footer is a shop window — an oversized wordmark on a marquee,
 * four columns of services, a "Book a service" button. Under a table of this
 * afternoon's bookings that is not a footer, it is an advertisement aimed at
 * the person who wrote it. So the panel gets a footer of its own carrying the
 * part that is actually wanted at the bottom of a working screen: who this
 * belongs to, the policies, and a way back out to the site.
 */

const LINKS = [
  { label: "Open the site", href: "/", external: true },
  { label: "Track a booking", href: "/track", external: true },
  ...LEGAL_DOCS.map((d) => ({ label: d.title, href: `/legal/${d.slug}`, external: true })),
];

/** Kept out of the component, which renders and must stay pure. */
function currentYear() {
  return new Date().getFullYear();
}

export function AdminFooter() {
  return (
    // The bottom padding is the assistant's. It is fixed to the window and the
    // footer is the last thing on the page, so without the room the links would
    // be read out from underneath a search bar.
    <footer className="mt-10 border-t border-border px-4 pb-40 pt-6 text-sm text-muted sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {currentYear()} 24X7 Services Pvt. Ltd. · <span className="text-ink">Admin panel</span>
        </p>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              // The panel is where the day's work happens — a policy opened
              // from here should not take the booking being edited with it.
              target={l.external ? "_blank" : undefined}
              rel={l.external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              {l.label}
              {l.external && <ExternalLink className="size-3.5" />}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
