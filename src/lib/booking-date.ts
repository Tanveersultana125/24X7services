/**
 * The day a visit is actually on.
 *
 * A booking's `date` is the label the customer pressed — "Today", "Tomorrow",
 * "Sat, 8 Aug". That is the right thing to print and the wrong thing to sort,
 * compare or group by: "Today" means whatever day you read it on, and "Sat, 8
 * Aug" carries no year. Bookings taken from now on store `dateKey` alongside
 * it; everything taken before is resolved here, from the label and the moment
 * the booking was made.
 *
 * Client and server both need this, so it stays out of the `server-only` layer.
 */

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/** A Date as YYYY-MM-DD in local time. `toISOString` would shift the day. */
export function dateKeyOf(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Today, as the same kind of key. */
export function todayKey(): string {
  return dateKeyOf(new Date());
}

/**
 * Work a sortable key out of what a booking has.
 *
 * `stored` wins when it is there. Otherwise the label is read against the day
 * the booking was taken: "Today" is that day, "Tomorrow" the next, and a
 * "Sat, 8 Aug" takes the year that puts it nearest to — and not long before —
 * the booking. Returns "" when the label says nothing usable, which callers
 * read as "undated" rather than guessing.
 */
export function resolveDateKey(label: string, stored: string | undefined, createdAt: number): string {
  if (stored) return stored;
  if (!label) return "";

  // Without a creation time there is nothing to read a relative label against.
  const base = createdAt ? new Date(createdAt) : new Date();
  const text = label.trim().toLowerCase();

  if (text === "today") return dateKeyOf(base);
  if (text === "tomorrow") {
    const next = new Date(base);
    next.setDate(base.getDate() + 1);
    return dateKeyOf(next);
  }

  // "Sat, 8 Aug" / "8 Aug" / "Aug 8" — a day number and a month name, in
  // either order, with whatever punctuation the locale put between them.
  const day = text.match(/\b(\d{1,2})\b/);
  const month = MONTHS.findIndex((m) => text.includes(m));
  if (!day || month < 0) return "";

  const candidate = new Date(base.getFullYear(), month, Number(day[1]));
  // A visit is booked ahead, so a date that lands well before the booking was
  // taken is next year's — 45 days of slack for one entered a little late.
  if (candidate.getTime() < base.getTime() - 45 * 24 * 60 * 60 * 1000) {
    candidate.setFullYear(base.getFullYear() + 1);
  }
  return dateKeyOf(candidate);
}
