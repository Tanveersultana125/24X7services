"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Clock, MapPin, Calendar, Wrench, ShieldCheck,
  Sparkles, Zap, CheckCircle2,
} from "lucide-react";
import { Stepper, type Step } from "./Stepper";
import { OptionCard } from "./OptionCard";
import { Confirmation } from "./Confirmation";
import { Button } from "@/components/ui/Button";
import { ApplianceTile, BrandMark } from "@/components/ui/Icons";
import { APPLIANCES, BRANDS, TIME_SLOTS, PAYMENT_METHODS, getAppliance, getBrand } from "@/lib/data";
import { formatINR, formatRange, cn } from "@/lib/utils";
import type { BookingDraft, BrandId, ApplianceId } from "@/lib/types";

const STEPS: Step[] = [
  { id: "brand", label: "Brand" },
  { id: "appliance", label: "Appliance" },
  { id: "problem", label: "Problem" },
  { id: "date", label: "Date" },
  { id: "time", label: "Time" },
  { id: "address", label: "Address" },
  { id: "payment", label: "Payment" },
];

const VISIT_FEE = 99;

export function BookingFlow() {
  const params = useSearchParams();
  const emergency = params.get("emergency") === "1";

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [draft, setDraft] = useState<BookingDraft>({ problems: [] });
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Prefill from query params
  useEffect(() => {
    const brand = params.get("brand") as BrandId | null;
    const appliance = params.get("appliance") as ApplianceId | null;
    const problem = params.get("problem");
    setDraft((d) => ({
      ...d,
      brand: brand ?? d.brand,
      appliance: appliance ?? d.appliance,
      problems: problem ? [problem] : d.problems,
    }));
    // Jump to the first incomplete step
    if (problem && appliance && brand) setStep(3);
    else if (appliance && brand) setStep(2);
    else if (brand) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliance = getAppliance(draft.appliance);
  const selectedProblems = useMemo(
    () => appliance?.problems.filter((p) => draft.problems.includes(p.id)) ?? [],
    [appliance, draft.problems]
  );

  const estimate = useMemo(() => {
    const min = selectedProblems.reduce((s, p) => s + p.price[0], 0);
    const max = selectedProblems.reduce((s, p) => s + p.price[1], 0);
    return { min, max };
  }, [selectedProblems]);

  const total = Math.round((estimate.min + estimate.max) / 2) + VISIT_FEE + (emergency ? 199 : 0);

  const go = (d: number) => {
    setDir(d);
    setStep((s) => Math.min(Math.max(s + d, 0), STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canProceed = () => {
    switch (STEPS[step].id) {
      case "brand": return !!draft.brand;
      case "appliance": return !!draft.appliance;
      case "problem": return draft.problems.length > 0;
      case "date": return !!draft.date;
      case "time": return !!draft.slot;
      case "address":
        return !!(draft.address?.fullName && draft.address?.phone.length >= 10 && draft.address?.line1 && draft.address?.pincode.length === 6);
      case "payment": return !!draft.payment;
      default: return false;
    }
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setConfirmed(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1600);
  };

  if (confirmed) return <Confirmation draft={draft} total={total} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        {emergency && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm">
            <Zap className="size-5 shrink-0 text-danger" />
            <p><span className="font-semibold text-danger">Emergency mode.</span> Priority technician dispatch — a ₹199 express fee applies.</p>
          </div>
        )}

        <Stepper steps={STEPS} current={step} />

        {/* Nav buttons */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => go(-1)} className={step === 0 ? "invisible" : ""}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => go(1)} disabled={!canProceed()} size="lg">
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handlePay} disabled={!canProceed() || processing} size="lg" variant="accent">
              {processing ? (
                <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Processing…</>
              ) : (
                <>Pay {formatINR(total)} <CheckCircle2 className="size-4" /></>
              )}
            </Button>
          )}
        </div>

        <div className="relative mt-10 min-h-[24rem]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {STEPS[step].id === "brand" && <BrandStep draft={draft} setDraft={setDraft} />}
              {STEPS[step].id === "appliance" && <ApplianceStep draft={draft} setDraft={setDraft} />}
              {STEPS[step].id === "problem" && <ProblemStep draft={draft} setDraft={setDraft} />}
              {STEPS[step].id === "date" && <DateStep draft={draft} setDraft={setDraft} />}
              {STEPS[step].id === "time" && <TimeStep draft={draft} setDraft={setDraft} />}
              {STEPS[step].id === "address" && <AddressStep draft={draft} setDraft={setDraft} />}
              {STEPS[step].id === "payment" && <PaymentStep draft={draft} setDraft={setDraft} total={total} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <SummaryCard draft={draft} appliance={appliance} estimate={estimate} total={total} emergency={emergency} />
    </div>
  );
}

/* ---------------- Steps ---------------- */

type StepProps = {
  draft: BookingDraft;
  setDraft: React.Dispatch<React.SetStateAction<BookingDraft>>;
};

function StepTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {hint && <p className="mt-1.5 text-muted">{hint}</p>}
    </div>
  );
}

function BrandStep({ draft, setDraft }: StepProps) {
  return (
    <div>
      <StepTitle title="Choose your brand" hint="Select the manufacturer of your appliance." />
      <div className="grid gap-4 sm:grid-cols-2">
        {BRANDS.map((b) => (
          <OptionCard
            key={b.id}
            selected={draft.brand === b.id}
            onClick={() => setDraft((d) => ({ ...d, brand: b.id }))}
          >
            {/* wordmarks are much wider than they are tall — give the tile a fixed
                landscape box so SAMSUNG/BOSCH cannot spill over the label */}
            <div className="grid h-12 w-[5.25rem] shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2 px-2">
              <BrandMark
                id={b.id}
                tone="brand"
                className={b.id === "lg" ? "text-2xl" : "text-[0.7rem]"}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{b.name}</p>
              <p className="text-sm text-muted">{b.tagline}</p>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function ApplianceStep({ draft, setDraft }: StepProps) {
  return (
    <div>
      <StepTitle title="Which appliance needs care?" hint="Pick the appliance you'd like serviced." />
      <div className="grid gap-4 sm:grid-cols-2">
        {APPLIANCES.map((a) => (
          <OptionCard
            key={a.id}
            selected={draft.appliance === a.id}
            onClick={() => setDraft((d) => ({ ...d, appliance: a.id, problems: [] }))}
          >
            <ApplianceTile id={a.id} />
            <div>
              <p className="font-semibold">{a.name}</p>
              <p className="text-sm text-muted">From {formatINR(a.startingPrice)} · {a.serviceTime}</p>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function ProblemStep({ draft, setDraft }: StepProps) {
  const appliance = getAppliance(draft.appliance);
  if (!appliance) return null;
  const toggle = (id: string) =>
    setDraft((d) => ({
      ...d,
      problems: d.problems.includes(id) ? d.problems.filter((p) => p !== id) : [...d.problems, id],
    }));

  return (
    <div>
      <StepTitle title="What's the problem?" hint="Select one or more symptoms — you can add multiple." />
      <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-sm">
        <Sparkles className="size-5 shrink-0 text-primary" />
        <p><span className="font-semibold">AI Diagnosis:</span> Not sure? Describe it and we&apos;ll detect the fault. Popular issues are marked below.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {appliance.problems.map((p) => (
          <OptionCard key={p.id} multi selected={draft.problems.includes(p.id)} onClick={() => toggle(p.id)}>
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary">
              <Wrench className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-semibold">
                <span className="truncate">{p.label}</span>
                {p.common && <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">POPULAR</span>}
              </p>
              <p className="text-sm text-muted">{formatRange(p.price[0], p.price[1])} · {p.eta}</p>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

function DateStep({ draft, setDraft }: StepProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const days = useMemo(() => {
    const out: { key: string; day: string; date: string; month: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        key,
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        date: String(d.getDate()),
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      });
    }
    return out;
  }, []);

  if (!mounted) return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />;

  return (
    <div>
      <StepTitle title="Pick a date" hint="Same-day and next-day slots available." />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {days.map((d, i) => {
          const selected = draft.date === d.label;
          return (
            <button
              key={d.key}
              onClick={() => setDraft((s) => ({ ...s, date: d.label }))}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-2xl border-2 bg-surface p-3 transition-all hover:-translate-y-0.5",
                selected ? "border-primary shadow-premium-md" : "border-border hover:border-border-strong"
              )}
            >
              <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-muted")}>{d.day}</span>
              <span className="text-xl font-bold">{d.date}</span>
              <span className="text-xs text-muted">{d.month}</span>
              {i <= 1 && <span className="mt-0.5 rounded-full bg-accent/15 px-1.5 text-[9px] font-bold text-accent">{i === 0 ? "TODAY" : "TOM"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeStep({ draft, setDraft }: StepProps) {
  return (
    <div>
      <StepTitle title="Choose a time slot" hint={`For ${draft.date ?? "your selected date"}.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TIME_SLOTS.map((slot, i) => {
          const selected = draft.slot === slot;
          const soldOut = i === 2;
          return (
            <button
              key={slot}
              disabled={soldOut}
              onClick={() => setDraft((s) => ({ ...s, slot }))}
              className={cn(
                "flex items-center justify-between rounded-2xl border-2 bg-surface p-4 transition-all",
                soldOut && "cursor-not-allowed opacity-40",
                selected ? "border-primary shadow-premium-md" : "border-border hover:border-border-strong hover:-translate-y-0.5"
              )}
            >
              <span className="flex items-center gap-2.5 font-medium">
                <Clock className={cn("size-5", selected ? "text-primary" : "text-muted")} />
                {slot}
              </span>
              {soldOut && <span className="text-xs font-semibold text-danger">Full</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddressStep({ draft, setDraft }: StepProps) {
  const a = draft.address ?? { fullName: "", phone: "", line1: "", line2: "", pincode: "", landmark: "" };
  const set = (patch: Partial<typeof a>) => setDraft((d) => ({ ...d, address: { ...a, ...patch } }));

  const field = "w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm outline-none transition-colors placeholder:text-muted-2 focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div>
      <StepTitle title="Service address" hint="Where should our technician arrive?" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input className={field} value={a.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="e.g. Ananya Rao" />
        </div>
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium">Phone number</label>
          <input className={field} value={a.phone} inputMode="numeric" maxLength={10}
            onChange={(e) => set({ phone: e.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Flat / House no. & street</label>
          <input className={field} value={a.line1} onChange={(e) => set({ line1: e.target.value })} placeholder="Flat 402, Prestige Residency" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Area / Locality <span className="text-muted-2">(optional)</span></label>
          <input className={field} value={a.line2} onChange={(e) => set({ line2: e.target.value })} placeholder="Indiranagar" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Pincode</label>
          <input className={field} value={a.pincode} inputMode="numeric" maxLength={6}
            onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, "") })} placeholder="560038" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Landmark <span className="text-muted-2">(optional)</span></label>
          <input className={field} value={a.landmark} onChange={(e) => set({ landmark: e.target.value })} placeholder="Near Metro station" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted">
        <MapPin className="size-4 text-accent" /> We&apos;ll share this only with your assigned technician.
      </div>
    </div>
  );
}

function PaymentStep({ draft, setDraft, total }: StepProps & { total: number }) {
  return (
    <div>
      <StepTitle title="Payment method" hint="Secure, encrypted checkout. Cancel anytime before the visit." />
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_METHODS.map((m) => (
          <OptionCard key={m.id} selected={draft.payment === m.id} onClick={() => setDraft((d) => ({ ...d, payment: m.id }))}>
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm font-bold text-primary">
              {m.label.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{m.label}</p>
              <p className="text-sm text-muted">{m.hint}</p>
            </div>
          </OptionCard>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface-2 p-4">
        <span className="font-medium">Amount payable</span>
        <span className="text-xl font-bold text-primary">{formatINR(total)}</span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted">
        <ShieldCheck className="size-4 text-accent" /> PCI-DSS secure · Razorpay & Stripe · 100% refund if we can&apos;t fix it.
      </p>
    </div>
  );
}

/* ---------------- Summary ---------------- */

function SummaryCard({
  draft, appliance, estimate, total, emergency,
}: {
  draft: BookingDraft;
  appliance?: ReturnType<typeof getAppliance>;
  estimate: { min: number; max: number };
  total: number;
  emergency: boolean;
}) {
  const brand = getBrand(draft.brand);
  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-premium-md">
        <h3 className="text-lg font-bold tracking-tight">Booking summary</h3>

        <dl className="mt-5 space-y-3.5 text-sm">
          <Row label="Brand" value={brand?.name} />
          <Row label="Appliance" value={appliance?.name} />
          <Row label="Problems" value={draft.problems.length ? `${draft.problems.length} selected` : undefined} />
          <Row label="Date" value={draft.date} />
          <Row label="Slot" value={draft.slot} />
        </dl>

        {estimate.max > 0 && (
          <>
            <div className="my-5 border-t border-border" />
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Repair estimate</span>
                <span>{formatRange(estimate.min, estimate.max)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Visit fee</span>
                <span>{formatINR(99)}</span>
              </div>
              {emergency && (
                <div className="flex justify-between text-danger">
                  <span>Emergency express</span>
                  <span>{formatINR(199)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
                <span>Estimated total</span>
                <span className="text-primary">{formatINR(total)}</span>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-accent/10 p-3 text-xs text-accent">
          <ShieldCheck className="size-4 shrink-0" />
          <span>90-day warranty · Genuine parts · Certified pro</span>
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("font-medium", value ? "text-foreground" : "text-muted-2")}>{value ?? "—"}</dd>
    </div>
  );
}
