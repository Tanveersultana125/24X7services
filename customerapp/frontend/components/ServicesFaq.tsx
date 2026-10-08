import { ChevronDown } from 'lucide-react'
import type { BusinessConfig } from '@app/shared'
import { formatPaise } from '@/lib/format'

/**
 * The questions people ask before their first booking, answered on the page.
 *
 * Every answer is one the assistant already gives (lib/assistantBrain), and
 * the numbers in them — warranty days, the cancellation window — come from the
 * business config, so the page and the policy cannot disagree.
 */
export function faqFor(config: BusinessConfig | null) {
  const warrantyDays = config?.defaultWarrantyDays ?? 30
  const policy = config?.cancellationPolicy
  return [
    {
      q: 'What does the visit fee cover?',
      a: 'The technician coming out and inspecting the appliance. Any repair beyond that is quoted on the spot, and nothing starts until you approve it.',
    },
    {
      q: 'Are spare parts extra?',
      a: 'Yes. Parts are not part of the visit fee. Anything the job needs is quoted on site, itemised with its labour, and nothing is fitted until you approve it.',
    },
    {
      q: 'Is the repair covered by a warranty?',
      a: `Every completed job carries a ${warrantyDays}-day service warranty on the work and on the parts we supplied. If the same fault comes back while it is valid, the return visit costs nothing.`,
    },
    {
      q: 'Can I cancel or reschedule?',
      a: policy
        ? `Yes, from the booking itself. Cancelling is free up to ${policy.freeUntilHours} hours before your slot; after that there is a ${formatPaise(policy.feePaise)} fee. Anything you paid comes back within ${policy.refundDays} working days.`
        : 'Yes, from the booking itself. The app shows any fee before you confirm.',
    },
    {
      q: 'How soon can someone come?',
      a: 'Visits run every day in two-hour windows from 9 AM to 7 PM. The earliest free slot is the first one you see when booking — often the same day.',
    },
    {
      q: 'How do I pay?',
      a: `Card, UPI or netbanking in the app${
        config?.allowPayAfterService
          ? ', or pay after the service where that is offered'
          : ''
      }. Every booking ends with a GST invoice you can download.`,
    },
  ]
}

export function ServicesFaq({ config }: { config: BusinessConfig | null }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-bg">
      {faqFor(config).map((item) => (
        <li key={item.q}>
          <details className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown
                className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted">
              {item.a}
            </p>
          </details>
        </li>
      ))}
    </ul>
  )
}
