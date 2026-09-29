'use client'

import { useState } from 'react'
import { ChevronDown, CircleCheck, Flag, Headset, MessageCircle, Phone, Siren } from 'lucide-react'
import { Button, Card, Field, FilterChip, Page, ScreenHeader, SectionTitle, Sheet, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'

const FAQ = [
  ['A customer wants work outside the booked service', 'Record it in diagnosis and add it to the bill as a separate line before starting. Never do unbilled work — it isn’t covered by the service warranty.'],
  ['The part I need is not in my van', 'Select it in Parts — it is marked Not Available and requested from the Kondapur hub automatically. Agree a revisit slot with the customer and note it in technician notes.'],
  ['Customer is not at home when I arrive', 'Call twice, wait 10 minutes, then use Report Issue → “Customer not reachable”. Dispatch will reschedule and you are paid the visit fee.'],
  ['How are payouts calculated?', 'You keep 80% of the service bill (labour + parts + additional charges). Payouts settle daily at 11 PM; cash collected is deducted from that day’s payout.'],
  ['Can I reject an assigned job?', 'Requests can be rejected freely. An already accepted job must be released through Chat Support so dispatch can reassign it without a late-cancellation mark.'],
  ['Handling a gas leak or electrical hazard', 'Stop work, isolate power or gas, move people away, and use Emergency Support. Do not continue the repair until a supervisor clears it.'],
] as const

const ISSUES = ['Customer not reachable', 'Wrong address', 'Payment dispute', 'Part not available', 'App problem', 'Safety concern']

export default function SupportPage() {
  const { jobs } = useStore()
  const [open, setOpen] = useState<number | null>(0)
  const [report, setReport] = useState(false)
  const [sent, setSent] = useState<number | null>(null)
  const [kind, setKind] = useState(ISSUES[0])
  const recent = jobs.filter((j) => j.status !== 'request').slice(0, 6)

  return (
    <>
      <ScreenHeader back="/profile" title="Help & Support" subtitle="Partner desk · open 24×7" />
      <Page className="space-y-5">
        <a href="tel:+914068241111" className="flex items-center gap-4 rounded-card bg-danger p-4 text-white hover:brightness-95">
          <span className="grid size-12 place-items-center rounded-full bg-white/15">
            <Siren className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block text-base font-extrabold">Emergency Support</span>
            <span className="block text-sm font-medium text-white/80">Accident, safety hazard or threat on site</span>
          </span>
          <Phone className="size-5" />
        </a>

        <div className="grid grid-cols-3 gap-3">
          <a href="tel:+914068241000" className="flex flex-col items-center gap-2 rounded-card border border-line bg-card p-4 text-center shadow-card hover:border-line-strong">
            <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success">
              <Phone className="size-5" />
            </span>
            <span className="text-sm font-extrabold">Call Support</span>
            <span className="text-[11px] font-semibold text-muted">~1 min wait</span>
          </a>
          <a href="https://wa.me/914068241000" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-card border border-line bg-card p-4 text-center shadow-card hover:border-line-strong">
            <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
              <MessageCircle className="size-5" />
            </span>
            <span className="text-sm font-extrabold">Chat Support</span>
            <span className="text-[11px] font-semibold text-muted">Replies in ~3 min</span>
          </a>
          <button type="button" onClick={() => setReport(true)} className="flex flex-col items-center gap-2 rounded-card border border-line bg-card p-4 text-center shadow-card hover:border-line-strong">
            <span className="grid size-11 place-items-center rounded-full bg-warning-soft text-warning">
              <Flag className="size-5" />
            </span>
            <span className="text-sm font-extrabold">Report Issue</span>
            <span className="text-[11px] font-semibold text-muted">About a job</span>
          </button>
        </div>

        <section>
          <SectionTitle>FAQ</SectionTitle>
          <Card className="divide-y divide-line">
            {FAQ.map(([q, a], i) => (
              <div key={q}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="flex-1 text-sm font-extrabold">{q}</span>
                  <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', open === i && 'rotate-180')} />
                </button>
                {open === i && <p className="-mt-1 px-4 pb-4 text-sm font-medium leading-relaxed text-muted">{a}</p>}
              </div>
            ))}
          </Card>
        </section>

        <p className="flex items-center justify-center gap-2 text-xs font-semibold text-faint">
          <Headset className="size-4" /> Partner desk 040 6824 1000 · partners@24x7services.in
        </p>
      </Page>

      <Sheet
        open={report}
        onClose={() => {
          setReport(false)
          setSent(null)
        }}
        title="Report an issue"
      >
        {sent !== null ? (
          <div className="py-4 text-center">
            <CircleCheck className="mx-auto size-12 text-success" />
            <p className="mt-3 font-extrabold">Ticket raised · #SUP-{sent}</p>
            <p className="mt-1 text-sm text-muted">The partner desk will call you back within 15 minutes.</p>
            <Button className="mt-5 w-full" onClick={() => setReport(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(Math.floor(Date.now() / 1000) % 100000)
            }}
          >
            <div>
              <p className="mb-2 text-sm font-bold text-ink-2">What happened?</p>
              <div className="flex flex-wrap gap-2">
                {ISSUES.map((i) => (
                  <FilterChip key={i} active={kind === i} onClick={() => setKind(i)}>
                    {i}
                  </FilterChip>
                ))}
              </div>
            </div>
            <Field label="Related job">
              <select className={inputClass} defaultValue={recent[0]?.id}>
                {recent.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} · {j.customer.name}
                  </option>
                ))}
                <option value="">Not about a job</option>
              </select>
            </Field>
            <Field label="Details">
              <textarea rows={3} required className={cn(inputClass, 'resize-none')} placeholder="Tell us what happened" />
            </Field>
            <Button type="submit" size="lg" className="w-full">
              Submit report
            </Button>
          </form>
        )}
      </Sheet>
    </>
  )
}
