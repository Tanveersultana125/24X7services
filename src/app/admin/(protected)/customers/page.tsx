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
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-[-0.02em]">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Everyone who has signed in with Google · {customers.length} total.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-premium-sm">
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
                      <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-white">
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
