import "server-only";
import { listBookings, listCustomers } from "@/lib/bookings";
import { listCarts } from "@/lib/carts";
import { listActivity, topPressed } from "@/lib/activity";

/**
 * The panel's numbers, written out for the assistant to read.
 *
 * Deliberately without a single personal detail. Answering "how many bookings
 * today" needs counts, appliances and statuses; it does not need anybody's
 * name, phone, email or address, and this text is sent to a model run by
 * somebody else. Booking codes are here because they are how the office refers
 * to a job out loud, and they identify a booking rather than a person.
 *
 * Kept short on purpose: every line is paid for on the way out, and a
 * thousand rows of detail buys worse answers than fifty rows of summary.
 */

/** Recent bookings listed one by one; the rest survive as counts. */
const RECENT = 15;

function day(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function tally<T>(rows: T[], key: (row: T) => string): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row) || "(unset)";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return (
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, n]) => `${k} ${n}`)
      .join(", ") || "none"
  );
}

export async function panelSnapshot(now: number): Promise<string> {
  const [bookings, customers, carts, visitors] = await Promise.all([
    listBookings().catch(() => []),
    listCustomers().catch(() => []),
    listCarts().catch(() => []),
    listActivity().catch(() => []),
  ]);

  const today = day(now);
  const weekAgo = now - 7 * 86_400_000;

  const takenToday = bookings.filter((b) => day(b.createdAt) === today);
  const takenThisWeek = bookings.filter((b) => b.createdAt > weekAgo);
  const scheduledToday = bookings.filter((b) => b.date === today);
  const completed = bookings.filter((b) => b.status === "completed");
  const revenue = completed.reduce((sum, b) => sum + b.price, 0);
  const open = bookings.filter((b) => b.status !== "completed" && b.status !== "cancelled");

  const lines = [
    `TODAY IS ${today}.`,
    "",
    "BOOKINGS",
    `total ${bookings.length}; taken today ${takenToday.length}; taken in the last 7 days ${takenThisWeek.length}; scheduled for today ${scheduledToday.length}; still open ${open.length}`,
    `by status: ${tally(bookings, (b) => b.status)}`,
    `by appliance: ${tally(bookings.flatMap((b) => b.items), (i) => i.appliance)}`,
    `by brand: ${tally(bookings.flatMap((b) => b.items), (i) => i.brand)}`,
    `completed revenue ₹${revenue}; average booking ₹${
      bookings.length ? Math.round(bookings.reduce((s, b) => s + b.price, 0) / bookings.length) : 0
    }`,
    "",
    `RECENT BOOKINGS (newest first, up to ${RECENT})`,
    ...bookings.slice(0, RECENT).map((b) => {
      const what = b.items
        .map((i) => `${i.brand} ${i.appliance}${i.units > 1 ? ` x${i.units}` : ""} (${i.problem})`)
        .join(" + ");
      return `${b.code} | ${what} | ${b.date} ${b.slot} | ${b.status}${b.tech ? ` | tech ${b.tech}` : ""} | ₹${b.price}${b.emergency ? " | emergency" : ""}`;
    }),
    "",
    "CUSTOMERS",
    `total ${customers.length}; joined in the last 7 days ${customers.filter((c) => c.createdAt > weekAgo).length}`,
    "",
    "BASKETS (added but not booked)",
    `${carts.length} baskets worth ₹${carts.reduce((s, c) => s + c.total, 0)}; ${carts.filter((c) => !c.guest).length} from signed-in customers`,
    `what is in them: ${tally(carts.flatMap((c) => c.items), (i) => i.name)}`,
    "",
    "SITE ACTIVITY",
    `${visitors.length} visitors tracked; ${visitors.reduce((n, v) => n + v.clicks, 0)} clicks; ${visitors.reduce((n, v) => n + v.views, 0)} page views`,
    `most pressed: ${topPressed(visitors, "click", 6).map((r) => `${r.label} ${r.count}`).join(", ") || "none"}`,
    `most opened: ${topPressed(visitors, "view", 6).map((r) => `${r.label} ${r.count}`).join(", ") || "none"}`,
  ];

  return lines.join("\n");
}
