"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Phone,
  Siren,
  User,
  X,
} from "lucide-react";
import { STATUS_META, type BookingStatus } from "@/lib/admin/data";
import type { Booking } from "@/lib/bookings";
import { formatINR } from "@/lib/utils";

/**
 * One visit, as the person doing it needs it.
 *
 * Everything above the fold answers "where am I going and what is wrong": the
 * address with a button that opens it in maps, the customer with a button that
 * dials them, then the appliances and the fault. The status buttons are last
 * because they are pressed on the way out, not on the way in.
 */

/** What a technician can move a job to, and what the button says. */
const NEXT: Partial<Record<BookingStatus, { to: BookingStatus; label: string }>> = {
  new: { to: "assigned", label: "Accept this job" },
  assigned: { to: "in-progress", label: "Start work" },
  "in-progress": { to: "completed", label: "Mark completed" },
};

export function JobDetail({ job: initial }: { job: Booking }) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [busy, setBusy] = useState<BookingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[job.status];
  const next = NEXT[job.status];
  const closed = job.status === "completed" || job.status === "cancelled";

  const a = job.address;
  const fullAddress = [a?.line1, a?.line2, a?.landmark, a?.pincode].filter(Boolean).join(", ");
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || job.city)}`;

  const move = async (status: BookingStatus) => {
    setBusy(status);
    setError(null);
    const res = await fetch("/api/tech/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: job.id, status }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        res.status === 401
          ? "You've been signed out — sign in again."
          : data?.error === "not_yours"
            ? "This job isn't assigned to you any more."
            : "That didn't save. Check your signal and try again.",
      );
      return;
    }
    setJob((j) => ({ ...j, status }));
    router.refresh();
  };

  return (
    <div>
      <Link
        href="/tech"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> All jobs
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold"
          style={{ background: `${meta.color}18`, color: meta.color }}
        >
          {meta.label}
        </span>
        {job.emergency && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-danger">
            <Siren className="size-3" /> Emergency
          </span>
        )}
        <span className="font-mono text-[0.72rem] text-muted-2">{job.code}</span>
      </div>

      <h1 className="font-display mt-3 text-[1.7rem] leading-tight tracking-[-0.02em]">
        {job.items.length > 1 ? `${job.items.length} appliances` : `${job.brand} ${job.appliance}`.trim() || "Service visit"}
      </h1>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
        <CalendarClock className="size-4 shrink-0" />
        {job.date || "Date to be set"} · {job.slot || "slot to be set"}
      </p>

      {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {/* Where */}
      <Card title="Where" icon={MapPin}>
        <p className="text-[0.95rem] font-medium leading-relaxed">{fullAddress || "—"}</p>
        {job.city && <p className="mt-1 text-sm text-muted">{job.city}</p>}
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
        >
          <Navigation className="size-4" /> Open in Maps
        </a>
      </Card>

      {/* Who */}
      <Card title="Customer" icon={User}>
        <p className="text-[0.95rem] font-medium">{a?.fullName || job.customer}</p>
        {a?.phone && (
          <a
            href={`tel:${a.phone.replace(/\s/g, "")}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40"
          >
            <Phone className="size-4" /> {a.phone}
          </a>
        )}
      </Card>

      {/* What */}
      <Card title="The job" icon={Package}>
        <ul className="divide-y divide-hairline">
          {job.items.map((item, i) => (
            <li key={`${item.appliance}-${i}`} className="py-3 first:pt-0 last:pb-0">
              <p className="text-[0.95rem] font-medium">
                {[item.brand, item.appliance].filter(Boolean).join(" ") || "Appliance"}
                {item.units > 1 && <span className="ml-1.5 text-muted">× {item.units}</span>}
              </p>
              <p className="mt-1 text-sm text-muted">
                {[item.variant, item.problem].filter(Boolean).join(" · ") || "Diagnosis"}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Money */}
      <Card title="Payment" icon={CreditCard}>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted">{job.payment || "Not set"}</span>
          <span className="font-display text-2xl tabular-nums tracking-tight">{formatINR(job.price)}</span>
        </div>
        <p className="mt-2 text-[0.72rem] leading-snug text-muted-2">
          The quote the customer agreed to. Anything beyond it goes through the office first.
        </p>
      </Card>

      {/* What happens next */}
      <div className="mt-8 space-y-2.5">
        {closed ? (
          <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-center text-sm text-muted">
            This job is {meta.label.toLowerCase()}. The office can reopen it if that&apos;s wrong.
          </p>
        ) : (
          <>
            {next && (
              <button
                onClick={() => move(next.to)}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald py-3.5 text-[0.95rem] font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                {busy === next.to ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {next.label}
              </button>
            )}
            <button
              onClick={() => move("cancelled")}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-[0.85rem] font-medium text-muted transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-60"
            >
              {busy === "cancelled" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              Can&apos;t do this job
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-surface p-5 shadow-premium-sm">
      <h2 className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted">
        <Icon className="size-3.5" strokeWidth={2.2} />
        {title}
      </h2>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}
