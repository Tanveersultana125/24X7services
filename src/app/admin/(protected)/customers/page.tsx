import { listCustomers } from "@/lib/bookings";

export const dynamic = "force-dynamic";

function fmt(ms: number) {
  return ms
    ? new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

export default async function AdminCustomersPage() {
  const customers = await listCustomers().catch(() => []);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Everyone who has signed in with Google · {customers.length} total.
        </p>
      </div>

      {/* Phones get a card per customer — the five-column table needs 42rem. */}
      <div className="space-y-3 lg:hidden">
        {customers.map((c) => (
          <div key={c.uid} className="rounded-2xl border border-border bg-surface p-4 shadow-premium-sm">
            <div className="flex items-center gap-3">
              {c.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.picture} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-background">
                  {initials(c.name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted">{c.email}</p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-xs">
              <div>
                <dt className="text-muted">Bookings</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{c.bookings}</dd>
              </div>
              <div>
                <dt className="text-muted">Joined</dt>
                <dd className="mt-0.5 font-medium">{fmt(c.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted">Last login</dt>
                <dd className="mt-0.5 font-medium">{fmt(c.lastLoginAt)}</dd>
              </div>
            </dl>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border-strong bg-surface py-10 text-center text-muted">
            No customers yet — they appear here the moment they sign in.
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface shadow-premium-sm lg:block">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Bookings</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {customers.map((c) => (
              <tr key={c.uid} className="hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.picture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.picture} alt="" className="size-9 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-background">
                        {initials(c.name)}
                      </span>
                    )}
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{c.email}</td>
                <td className="px-4 py-3 tabular-nums">{c.bookings}</td>
                <td className="px-4 py-3 text-muted">{fmt(c.createdAt)}</td>
                <td className="px-4 py-3 text-muted">{fmt(c.lastLoginAt)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No customers yet — they appear here the moment they sign in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
