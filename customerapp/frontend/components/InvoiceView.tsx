import type { Invoice } from '@app/shared'
import { Card } from '@/components/ui/Card'
import { ToneBadge } from '@/components/StatusBadge'
import { formatDateTime, formatPaise } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * The GST invoice, on screen. Everything on it — seller name, GSTIN, SAC code,
 * the tax split — comes from the invoice document the completion trigger wrote,
 * never from config read at render time. An invoice has to keep saying what it
 * said on the day it was issued, even after the business changes address.
 *
 * DECISION NEEDED: the legal name, GSTIN, address, SAC code and rate are seeded
 * as placeholders and must be confirmed with the CA before this is issued to a
 * real customer.
 */

export interface InvoiceViewProps {
  invoice: Invoice
  className?: string
}

export function InvoiceView({ invoice, className }: InvoiceViewProps) {
  const interState = invoice.price.igst > 0

  return (
    <Card className={cn('overflow-hidden', className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Tax invoice
          </p>
          <p className="mt-1 text-lg font-bold text-ink">{invoice.number}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatDateTime(invoice.issuedAt)}
          </p>
        </div>
        <ToneBadge
          tone={invoice.paymentStatus === 'paid' ? 'success' : 'warning'}
          label={invoice.paymentStatus === 'paid' ? 'Paid' : 'Payment due'}
        />
      </header>

      <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2">
        <Party
          heading="From"
          name={invoice.seller.legalName}
          lines={[invoice.seller.address, `GSTIN: ${invoice.seller.gstin}`]}
        />
        <Party
          heading="To"
          name={invoice.buyer.name}
          lines={[invoice.buyer.address]}
        />
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Invoice line items</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th scope="col" className="px-4 py-2 font-medium">
              Description
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, index) => (
            <tr key={`${line.label}-${index}`} className="border-b border-border">
              <td className="px-4 py-2.5 text-ink">{line.label}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                {formatPaise(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="flex flex-col gap-2 p-4 text-sm">
        <Line label="Taxable value" value={invoice.price.taxable} muted />
        {interState ? (
          <Line
            label={`IGST @ ${invoice.gstRate}%`}
            value={invoice.price.igst}
            muted
          />
        ) : (
          <>
            <Line
              label={`CGST @ ${invoice.gstRate / 2}%`}
              value={invoice.price.cgst}
              muted
            />
            <Line
              label={`SGST @ ${invoice.gstRate / 2}%`}
              value={invoice.price.sgst}
              muted
            />
          </>
        )}
        <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
          <dt className="text-base font-semibold text-ink">Total</dt>
          <dd className="text-xl font-bold tabular-nums text-ink">
            {formatPaise(invoice.price.total)}
          </dd>
        </div>
      </dl>

      <footer className="border-t border-border bg-surface p-4 text-xs text-muted">
        <p>SAC code: {invoice.sacCode}</p>
        <p className="mt-1">
          This is a computer-generated invoice and needs no signature.
        </p>
      </footer>
    </Card>
  )
}

function Party({
  heading,
  name,
  lines,
}: {
  heading: string
  name: string
  lines: readonly string[]
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {heading}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{name}</p>
      {lines.map((line) => (
        <p key={line} className="text-xs leading-relaxed text-muted">
          {line}
        </p>
      ))}
    </div>
  )
}

function Line({
  label,
  value,
  muted = false,
}: {
  label: string
  value: number
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? 'text-muted' : 'text-ink'}>{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          muted ? 'text-muted' : 'font-medium text-ink'
        )}
      >
        {formatPaise(value)}
      </dd>
    </div>
  )
}
