import { ShoppingCart, UserRound } from "lucide-react";
import { listCarts } from "@/lib/carts";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "G"
  );
}

/** "4 min ago" reads better here than a date — these are baskets in progress. */
function since(ms: number) {
  if (!ms) return "—";
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminCartsPage() {
  const carts = await listCarts().catch(() => []);
  const value = carts.reduce((sum, c) => sum + c.total, 0);
  const signedIn = carts.filter((c) => !c.guest).length;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Baskets</h1>
        <p className="mt-1 text-sm text-muted">
          What people have added but not yet booked · {carts.length}{" "}
          {carts.length === 1 ? "basket" : "baskets"} worth {formatINR(value)} · {signedIn} signed in.
        </p>
      </div>

      {carts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong bg-surface py-12 text-center text-muted">
          No baskets yet — one appears here the moment someone adds a service on the site.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {carts.map((c) => (
            <article
              key={c.key}
              className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5"
            >
              <header className="flex items-center gap-3 border-b border-hairline pb-3">
                {c.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.picture}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={
                      "grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold " +
                      (c.guest ? "bg-surface-2 text-muted" : "bg-ink text-background")
                    }
                  >
                    {c.guest ? <UserRound className="size-4" /> : initials(c.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.guest ? "Guest visitor" : c.name}</p>
                  <p className="truncate text-xs text-muted">
                    {/* A guest has no name to show, so the browser id is the
                        only thing that tells two of them apart. */}
                    {c.email || `Not signed in · ${c.key.slice(0, 8)}`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-royal-bright/12 px-2.5 py-1 text-[0.68rem] font-bold text-royal-bright">
                  {c.count} {c.count === 1 ? "item" : "items"}
                </span>
              </header>

              <ul className="flex-1 divide-y divide-hairline">
                {c.items.map((i, n) => (
                  <li key={`${i.id}-${i.problem ?? ""}-${i.qty}-${n}`} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                      <ShoppingCart className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{i.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {i.problemLabel
                          ? i.problemLabel
                          : i.kind === "plan"
                            ? "Annual plan"
                            : `${i.qty} ${i.qty === 1 ? "unit" : "units"}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatINR(i.price)}</span>
                  </li>
                ))}
              </ul>

              <footer className="flex items-baseline justify-between border-t border-hairline pt-3">
                <span className="text-xs text-muted">Updated {since(c.updatedAt)}</span>
                <span className="font-display text-xl tracking-tight">{formatINR(c.total)}</span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
