'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Inbox, Wrench } from 'lucide-react'
import {
  repairItemTotal,
  type Booking,
  type RepairItem,
  type RepairRequest,
} from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Chip'
import { ConfirmModal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { StickyCTA, StickySpacer } from '@/components/StickyCTA'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { useRepairRequests } from '@/lib/useRepairRequests'
import { formatPaise, relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * "This also needs doing." The customer's answer.
 *
 * This screen is the promise the whole app is built on, so it is the one screen
 * that never nudges. Each item can be ticked or left, every price is broken
 * into the part and the work, and declining everything is offered as plainly as
 * approving everything — not buried, not greyed, not phrased as a mistake.
 *
 * What the customer is agreeing to is stated as a number before they agree to
 * it, and the server prices it again from the same items afterwards. Nothing
 * here computes what will be charged; this total is what they are about to say
 * yes to, and the one that comes back is what it actually costs.
 */
export function ApprovalScreen() {
  return (
    <BookingShell title="Approve the repair">
      {({ booking }) => <Approval booking={booking} />}
    </BookingShell>
  )
}

function Approval({ booking }: { booking: Booking }) {
  const { requests, loading } = useRepairRequests(booking.id)
  const pending = requests.find((request) => request.status === 'pending')
  const answered = requests.filter((request) => request.status !== 'pending')

  if (loading) return null

  return (
    <>
      {pending ? (
        <PendingRequest booking={booking} request={pending} />
      ) : answered.length > 0 ? (
        <>
          <p className="mt-5 text-sm text-muted">
            Nothing is waiting on you. This is what you decided.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {answered.map((request) => (
              <AnsweredRequest key={request.id} request={request} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          className="py-16"
          icon={Inbox}
          title="Nothing to approve"
          description="If your expert finds something that needs doing beyond the inspection, the quote appears here."
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function PendingRequest({
  booking,
  request,
}: {
  booking: Booking
  request: RepairRequest
}) {
  const router = useRouter()
  const toast = useToast()
  const [approved, setApproved] = useState<string[]>(
    request.items.map((item) => item.id)
  )
  const [confirming, setConfirming] = useState<'approve' | 'decline' | null>(null)
  const [saving, setSaving] = useState(false)

  const extra = request.items
    .filter((item) => approved.includes(item.id))
    .reduce((total, item) => total + repairItemTotal(item), 0)

  async function respond(ids: string[]): Promise<void> {
    setSaving(true)
    try {
      await callFn('respondToRepairRequest', {
        bookingId: booking.id,
        requestId: request.id,
        approvedItemIds: ids,
      })
      toast.show(
        ids.length === 0
          ? 'Declined. Only the visit fee applies.'
          : 'Approved. Your expert can carry on.',
        { tone: 'success' }
      )
      router.replace(`/bookings/progress?id=${booking.id}`)
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setSaving(false)
      setConfirming(null)
    }
  }

  return (
    <>
      <section className="mt-5">
        <div className="flex items-start gap-3">
          <Wrench className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink">
              Your expert found something else
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              Quoted {relativeTime(request.createdAt)}
            </p>
          </div>
        </div>

        <Card className="mt-4 p-4">
          <p className="text-sm leading-relaxed text-ink">{request.reason}</p>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted">
          Tick what you want done
        </h2>

        <ul className="flex flex-col gap-2">
          {request.items.map((item) => (
            <li key={item.id}>
              <ItemRow
                item={item}
                checked={approved.includes(item.id)}
                onToggle={() =>
                  setApproved((current) =>
                    current.includes(item.id)
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id]
                  )
                }
              />
            </li>
          ))}
        </ul>

        <Card className="mt-4 p-4">
          <p className="text-sm leading-relaxed text-muted">
            You can approve some of it, all of it, or none of it. Whatever you
            leave unticked will not be done and will not be charged. The visit
            fee of {formatPaise(booking.price.visitFee)} applies either way,
            because your expert has already come out and inspected it.
          </p>
        </Card>

        <Button
          className="mt-4"
          variant="ghost"
          fullWidth
          onClick={() => setConfirming('decline')}
        >
          Decline everything
        </Button>
      </section>

      <StickySpacer />

      <StickyCTA
        detail={
          <div>
            <p className="text-xs text-muted">
              {approved.length} of {request.items.length} approved
            </p>
            <p className="text-base font-bold text-ink">
              + {formatPaise(extra)}
            </p>
          </div>
        }
      >
        <Button
          onClick={() => setConfirming('approve')}
          disabled={approved.length === 0}
        >
          Approve
        </Button>
      </StickyCTA>

      <ConfirmModal
        open={confirming === 'approve'}
        onClose={() => setConfirming(null)}
        onConfirm={() => void respond(approved)}
        loading={saving}
        title={
          approved.length === request.items.length
            ? 'Approve the whole repair?'
            : `Approve ${approved.length} of ${request.items.length} items?`
        }
        description={`This adds ${formatPaise(
          extra
        )} to your bill, on top of the visit fee. Your expert starts as soon as you confirm.`}
        confirmLabel="Yes, go ahead"
      />

      <ConfirmModal
        open={confirming === 'decline'}
        onClose={() => setConfirming(null)}
        onConfirm={() => void respond([])}
        loading={saving}
        destructive
        title="Decline the repair?"
        description="Nothing further will be done. You still pay the visit fee for the inspection, and your expert will put the appliance back as they found it."
        confirmLabel="Decline"
      />
    </>
  )
}

function ItemRow({
  item,
  checked,
  onToggle,
}: {
  item: RepairItem
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        'flex w-full items-start gap-3 rounded-card border p-4 text-left',
        'transition-colors duration-[var(--duration-fast)]',
        checked ? 'border-ink ring-1 ring-ink' : 'border-border hover:border-ink'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2',
          checked ? 'border-ink bg-ink text-bg' : 'border-border'
        )}
        aria-hidden="true"
      >
        {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">
          {item.label}
        </span>
        {/* Split out, because "₹1,100" and "₹850 of parts plus ₹250 of work"
            are the same number and only one of them can be argued with. */}
        <span className="mt-1 block text-xs text-muted">
          Parts {formatPaise(item.partPaise)} · Labour{' '}
          {formatPaise(item.labourPaise)}
        </span>
      </span>

      <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
        {formatPaise(repairItemTotal(item))}
      </span>
    </button>
  )
}

function AnsweredRequest({ request }: { request: RepairRequest }) {
  const approvedItems = request.items.filter((item) =>
    request.approvedItemIds.includes(item.id)
  )
  const total = approvedItems.reduce(
    (sum, item) => sum + repairItemTotal(item),
    0
  )

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-ink">{request.reason}</p>
        <Tag>
          {request.status === 'approved'
            ? 'Approved'
            : request.status === 'partially_approved'
              ? 'Part approved'
              : 'Declined'}
        </Tag>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {request.items.map((item) => {
          const taken = request.approvedItemIds.includes(item.id)
          return (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className={taken ? 'text-ink' : 'text-muted line-through'}>
                {item.label}
              </span>
              <span
                className={cn(
                  'tabular-nums',
                  taken ? 'font-medium text-ink' : 'text-muted'
                )}
              >
                {formatPaise(repairItemTotal(item))}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 border-t border-border pt-3 text-sm">
        <span className="text-muted">Added to your bill: </span>
        <span className="font-bold text-ink">{formatPaise(total)}</span>
      </p>
    </Card>
  )
}
