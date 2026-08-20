/**
 * What the panel shows while a page is being fetched.
 *
 * Every page in here is `force-dynamic` and reads Firestore, so a link click
 * had nothing to commit to until the data came back — the panel sat perfectly
 * still for a second or two and then changed. It read as a click that had
 * missed, which is why the second one seemed to be the one that worked.
 *
 * A `loading` file puts the segment behind a Suspense boundary, so the
 * navigation lands immediately and this stands in until the page arrives. The
 * shape is the shape of the pages it stands in for — a heading, a line under
 * it, then cards — so the swap is a fill rather than a jump.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading…</span>

      <div className="mb-6 sm:mb-8">
        <div className="h-8 w-48 rounded-lg bg-surface" />
        <div className="mt-2.5 h-4 w-72 max-w-full rounded bg-surface" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Six is what most of these pages open with; fewer left a gap under
            the fold that filled in as a lurch. */}
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm sm:p-5">
            <div className="flex items-center gap-3 border-b border-hairline pb-3">
              <div className="size-10 shrink-0 rounded-full bg-surface-2" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-2/3 rounded bg-surface-2" />
                <div className="mt-2 h-3 w-1/2 rounded bg-surface-2" />
              </div>
            </div>
            <div className="space-y-3 py-4">
              <div className="h-3 w-full rounded bg-surface-2" />
              <div className="h-3 w-5/6 rounded bg-surface-2" />
              <div className="h-3 w-3/5 rounded bg-surface-2" />
            </div>
            <div className="flex items-center justify-between border-t border-hairline pt-3">
              <div className="h-3 w-20 rounded bg-surface-2" />
              <div className="h-4 w-16 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
