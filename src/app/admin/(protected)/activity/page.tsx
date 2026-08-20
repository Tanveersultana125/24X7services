import { Eye, MousePointerClick, UserRound } from "lucide-react";
import { listActivity, topPressed, type VisitorActivity } from "@/lib/activity";

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

/** "4 min ago" reads better here than a date — these are visits in progress. */
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

/** Was this within the last day? Kept out of the component, which renders. */
function recent(ms: number) {
  return ms > Date.now() - 86_400_000;
}

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/**
 * What people are doing on the site, visitor by visitor.
 *
 * The trails read newest first at the top of the page and oldest first inside
 * a visitor: which visit to look at is a question about recency, and what
 * happened in it is a question about order.
 */
export default async function AdminActivityPage() {
  const visitors = await listActivity().catch(() => []);
  const today = visitors.filter((v) => recent(v.lastSeen));
  const clicks = visitors.reduce((n, v) => n + v.clicks, 0);
  const views = visitors.reduce((n, v) => n + v.views, 0);
  const pressed = topPressed(visitors, "click");
  const opened = topPressed(visitors, "view");

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Activity</h1>
        <p className="mt-1 text-sm text-muted">
          Every page opened and every button pressed on the site ·{" "}
          {visitors.length} {visitors.length === 1 ? "visitor" : "visitors"},{" "}
          {today.length} in the last day · {clicks.toLocaleString("en-IN")} clicks,{" "}
          {views.toLocaleString("en-IN")} views.
        </p>
      </div>

      {visitors.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-strong bg-surface py-12 text-center text-muted">
          Nothing yet — a visitor appears here within a few seconds of opening the site.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Leaderboard title="Most pressed" icon={MousePointerClick} rows={pressed} />
            <Leaderboard title="Most opened" icon={Eye} rows={opened} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {visitors.map((v) => (
              <Trail key={v.key} visitor={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Leaderboard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Eye;
  rows: { label: string; count: number }[];
}) {
  // Bars are drawn against the busiest row rather than the total: the question
  // is which of these is bigger than the others, not what share each holds.
  const top = rows[0]?.count ?? 1;
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-muted" /> {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing recorded yet.</p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{r.label}</span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-royal-bright"
                    style={{ width: `${Math.max(4, Math.round((r.count / top) * 100))}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{r.count}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Trail({ visitor: v }: { visitor: VisitorActivity }) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
      <header className="flex items-center gap-3 border-b border-hairline pb-3">
        {v.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.picture}
            alt=""
            referrerPolicy="no-referrer"
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className={
              "grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold " +
              (v.guest ? "bg-surface-2 text-muted" : "bg-ink text-background")
            }
          >
            {v.guest ? <UserRound className="size-4" /> : initials(v.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{v.guest ? "Guest visitor" : v.name}</p>
          <p className="truncate text-xs text-muted">
            {/* A guest has no name, so the browser id is the only thing that
                tells two of them apart. */}
            {v.email || `Not signed in · ${v.key.slice(0, 8)}`}
          </p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block rounded-full bg-royal-bright/12 px-2.5 py-1 text-[0.68rem] font-bold text-royal-bright">
            {v.clicks} {v.clicks === 1 ? "click" : "clicks"}
          </span>
          <span className="mt-1 block text-[0.68rem] text-muted">{since(v.lastSeen)}</span>
        </span>
      </header>

      {/* Oldest first: a trail is a sequence, and reading it backwards is
          reading someone's afternoon in reverse. */}
      <ol className="max-h-80 flex-1 divide-y divide-hairline overflow-y-auto">
        {v.events.map((e, i) => (
          <li key={`${e.at}-${i}`} className="flex items-start gap-3 py-2.5">
            <span
              className={
                "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg " +
                (e.kind === "click"
                  ? "bg-royal-bright/12 text-royal-bright"
                  : "bg-surface-2 text-muted")
              }
            >
              {e.kind === "click" ? (
                <MousePointerClick className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">
                {e.kind === "click" ? e.label || e.href || "(unlabelled)" : `Opened ${e.path}`}
              </span>
              {e.kind === "click" && (
                <span className="mt-0.5 block truncate text-xs text-muted">
                  on {e.path}
                  {e.href && e.href !== e.path ? ` → ${e.href}` : ""}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-2">{clock(e.at)}</span>
          </li>
        ))}
      </ol>

      <footer className="flex items-baseline justify-between border-t border-hairline pt-3 text-xs text-muted">
        <span>First seen {since(v.firstSeen)}</span>
        <span>
          {v.views} {v.views === 1 ? "page" : "pages"}
        </span>
      </footer>
    </article>
  );
}
