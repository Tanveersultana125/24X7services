import { useState } from 'react'
import { View } from 'react-native'
import { router, type Href } from 'expo-router'
import { Check, Inbox, Wrench } from 'lucide-react-native'
import { repairItemTotal, type Booking, type RepairItem, type RepairRequest } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Chip'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { ConfirmModal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { StickyCTA } from '@/components/StickyCTA'
import { useToast } from '@/components/Toast'
import { callFn, friendlyError } from '@/lib/callables'
import { useRepairRequests } from '@/lib/useRepairRequests'
import { formatPaise, relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import { BlockTitle } from '@/screens/bookings/parts'

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
 *
 * The pinned Approve bar is Screen's footer rather than part of the scroll, so
 * the ticks and the open dialog live here, above both, where the list and the
 * bar can share them.
 */

interface ApprovalUi {
  /** Ticked item ids per request. A request not in here has everything ticked. */
  picked: Record<string, string[]>
  setPicked: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  confirming: 'approve' | 'decline' | null
  setConfirming: (next: 'approve' | 'decline' | null) => void
}

function approvedFor(ui: ApprovalUi, request: RepairRequest): string[] {
  return ui.picked[request.id] ?? request.items.map((item) => item.id)
}

function extraFor(request: RepairRequest, approved: string[]): number {
  return request.items
    .filter((item) => approved.includes(item.id))
    .reduce((total, item) => total + repairItemTotal(item), 0)
}

export default function ApprovalScreen() {
  const [picked, setPicked] = useState<Record<string, string[]>>({})
  const [confirming, setConfirming] = useState<'approve' | 'decline' | null>(null)
  const ui: ApprovalUi = { picked, setPicked, confirming, setConfirming }

  return (
    <BookingShell title="Approve the repair" footer={({ booking }) => <ApprovalBar booking={booking} ui={ui} />}>
      {({ booking }) => <Approval booking={booking} ui={ui} />}
    </BookingShell>
  )
}

function Approval({ booking, ui }: { booking: Booking; ui: ApprovalUi }) {
  const { requests, loading } = useRepairRequests(booking.id)
  const pending = requests.find((request) => request.status === 'pending')
  const answered = requests.filter((request) => request.status !== 'pending')

  if (loading) return null

  return (
    <>
      {pending ? (
        <PendingRequest booking={booking} request={pending} ui={ui} />
      ) : answered.length > 0 ? (
        <>
          <Text className="mt-5 text-sm text-muted">Nothing is waiting on you. This is what you decided.</Text>
          <View className="mt-4 gap-3">
            {answered.map((request) => (
              <AnsweredRequest key={request.id} request={request} />
            ))}
          </View>
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

/** The pinned bar: how much is ticked, and the one button that approves it. */
function ApprovalBar({ booking, ui }: { booking: Booking; ui: ApprovalUi }) {
  const { requests, loading } = useRepairRequests(booking.id)
  const pending = requests.find((request) => request.status === 'pending')
  if (loading || !pending) return null

  const approved = approvedFor(ui, pending)
  const extra = extraFor(pending, approved)

  return (
    <StickyCTA
      detail={
        <View>
          <Text className="text-xs text-muted">
            {approved.length} of {pending.items.length} approved
          </Text>
          <Text className="text-base font-bold text-ink">+ {formatPaise(extra)}</Text>
        </View>
      }
    >
      <Button onPress={() => ui.setConfirming('approve')} disabled={approved.length === 0}>
        Approve
      </Button>
    </StickyCTA>
  )
}

// ---------------------------------------------------------------------------

function PendingRequest({ booking, request, ui }: { booking: Booking; request: RepairRequest; ui: ApprovalUi }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const approved = approvedFor(ui, request)
  const extra = extraFor(request, approved)
  const { confirming, setConfirming } = ui

  function toggle(id: string): void {
    ui.setPicked((all) => {
      const current = all[request.id] ?? request.items.map((item) => item.id)
      return {
        ...all,
        [request.id]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      }
    })
  }

  async function respond(ids: string[]): Promise<void> {
    setSaving(true)
    try {
      await callFn('respondToRepairRequest', {
        bookingId: booking.id,
        requestId: request.id,
        approvedItemIds: ids,
      })
      toast.show(ids.length === 0 ? 'Declined. Only the visit fee applies.' : 'Approved. Your expert can carry on.', {
        tone: 'success',
      })
      router.replace(`/bookings/progress?id=${booking.id}` as Href)
    } catch (error) {
      toast.show(friendlyError(error), { tone: 'error' })
    } finally {
      setSaving(false)
      setConfirming(null)
    }
  }

  return (
    <>
      <View className="mt-5">
        <View className="flex-row items-start gap-3">
          <Icon as={Wrench} className="mt-0.5 size-5 text-warning" />
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-lg font-bold text-ink">
              Your expert found something else
            </Text>
            <Text className="mt-0.5 text-xs text-muted">Quoted {relativeTime(request.createdAt)}</Text>
          </View>
        </View>

        <Card className="mt-4 p-4">
          <Text className="text-sm leading-[22px] text-ink">{request.reason}</Text>
        </Card>
      </View>

      <View className="mt-6">
        <BlockTitle className="mb-2">Tick what you want done</BlockTitle>

        <View className="gap-2">
          {request.items.map((item) => (
            <ItemRow key={item.id} item={item} checked={approved.includes(item.id)} onToggle={() => toggle(item.id)} />
          ))}
        </View>

        <Card className="mt-4 p-4">
          <Text className="text-sm leading-[22px] text-muted">
            You can approve some of it, all of it, or none of it. Whatever you leave unticked will not be done and will
            not be charged. The visit fee of {formatPaise(booking.price.visitFee)} applies either way, because your
            expert has already come out and inspected it.
          </Text>
        </Card>

        <Button className="mt-4" variant="ghost" fullWidth onPress={() => setConfirming('decline')}>
          Decline everything
        </Button>
      </View>

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

function ItemRow({ item, checked, onToggle }: { item: RepairItem; checked: boolean; onToggle: () => void }) {
  return (
    <Tappable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={cn(
        'w-full flex-row items-start gap-3 rounded-card p-4 active:opacity-100',
        checked ? 'border-2 border-brand' : 'border border-border active:border-brand'
      )}
    >
      <View
        className={cn(
          'mt-0.5 size-5 shrink-0 items-center justify-center rounded border-2',
          checked ? 'border-brand bg-brand' : 'border-border'
        )}
      >
        {checked ? <Icon as={Check} className="size-3.5 text-white" strokeWidth={3} /> : null}
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-ink">{item.label}</Text>
        {/* Split out, because "₹1,100" and "₹850 of parts plus ₹250 of work"
            are the same number and only one of them can be argued with. */}
        <Text className="mt-1 text-xs text-muted">
          Parts {formatPaise(item.partPaise)} · Labour {formatPaise(item.labourPaise)}
        </Text>
      </View>

      <Text className="shrink-0 text-sm font-bold tabular-nums text-ink">{formatPaise(repairItemTotal(item))}</Text>
    </Tappable>
  )
}

function AnsweredRequest({ request }: { request: RepairRequest }) {
  const approvedItems = request.items.filter((item) => request.approvedItemIds.includes(item.id))
  const total = approvedItems.reduce((sum, item) => sum + repairItemTotal(item), 0)

  return (
    <Card className="p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="min-w-0 flex-1 text-sm leading-[22px] text-ink">{request.reason}</Text>
        <Tag>
          {request.status === 'approved'
            ? 'Approved'
            : request.status === 'partially_approved'
              ? 'Part approved'
              : 'Declined'}
        </Tag>
      </View>

      <View className="mt-3 gap-1.5">
        {request.items.map((item) => {
          const taken = request.approvedItemIds.includes(item.id)
          return (
            <View key={item.id} className="flex-row items-baseline justify-between gap-3">
              <Text className={cn('min-w-0 flex-1 text-sm', taken ? 'text-ink' : 'text-muted line-through')}>
                {item.label}
              </Text>
              <Text className={cn('text-sm tabular-nums', taken ? 'font-medium text-ink' : 'text-muted')}>
                {formatPaise(repairItemTotal(item))}
              </Text>
            </View>
          )
        })}
      </View>

      <View className="mt-3 border-t border-border pt-3">
        <Text className="text-sm text-muted">
          Added to your bill: <Text className="text-sm font-bold text-ink">{formatPaise(total)}</Text>
        </Text>
      </View>
    </Card>
  )
}
