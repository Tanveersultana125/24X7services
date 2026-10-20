import { useState } from 'react'
import { Platform, Share, View } from 'react-native'
import { useLocalSearchParams, type Href } from 'expo-router'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { CircleCheck, Download, FileText } from 'lucide-react-native'
import { formatPaise } from '@app/shared'
import type { Booking, Service } from '@app/shared/catalog-v2'

import { Header, Screen, StickyCTA } from '@/components/Screen'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Skeleton, SkeletonGroup, SkeletonText } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Text } from '@/components/ui/Text'
import { brand } from '@/config/brand'
import { useBooking } from '@/lib/data/bookings'
import { useServicesByIds } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { useTokenColors } from '@/lib/useTokenColors'
import { PriceBreakup } from '@/screens/cart/PriceBreakup'
import { longDate } from '@/screens/checkout/when'

/**
 * The bill for a finished job, laid out as an invoice: who it is from, who it
 * is to, what was done and what it cost. It exists only once the job is done;
 * before that the price can still change (an approved repair adds to it), so
 * the screen says when it will appear instead of showing a draft.
 *
 * Download makes a plain HTML copy and hands it to the share sheet, so it can
 * be saved to Files, mailed or sent on WhatsApp. On the web it downloads.
 */

interface Line {
  key: string
  name: string
  detail: string | null
  qty: number
  amount: number
}

function linesOf(booking: Booking, services: Service[] | undefined): Line[] {
  return booking.items.map((item) => {
    const service = services?.find((s) => s.id === item.serviceId)
    const variant = service?.variants.find((v) => v.id === item.variantId)
    return {
      key: `${item.serviceId}:${item.variantId ?? ''}`,
      name: service?.name ?? 'Service',
      detail: variant?.label ?? null,
      qty: item.qty,
      amount: item.unitPrice * item.qty,
    }
  })
}

/** The day the job was finished, or the day it was booked for. */
function invoiceDate(booking: Booking): string {
  const done = [...booking.timeline].reverse().find((event) => event.status === 'completed')
  return done ? done.at.slice(0, 10) : booking.slot.date
}

export function InvoiceScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = typeof params.id === 'string' ? params.id : ''
  const booking = useBooking(id)
  const data = booking.data
  const services = useServicesByIds(data?.items.map((item) => item.serviceId) ?? [])
  const ready = data?.status === 'completed'
  const lines = data ? linesOf(data, services.data) : []

  return (
    <Screen
      header={<Header title="Invoice" subtitle={data ? `INV-${data.id}` : undefined} showBack backFallback={`/booking/${id}` as Href} />}
      footer={ready && data ? <DownloadBar booking={data} lines={lines} /> : null}
    >
      {booking.status === 'loading' ? (
        <SkeletonGroup label="Loading invoice" className="mt-4 gap-4">
          <Skeleton className="h-24" />
          <SkeletonText lines={4} />
          <Skeleton className="h-40" />
        </SkeletonGroup>
      ) : booking.status === 'error' ? (
        <ErrorState className="mt-10" onRetry={booking.reload} retrying={booking.refreshing} />
      ) : !data ? (
        <ErrorState className="mt-10" kind="notFound" />
      ) : !ready ? (
        <EmptyState
          className="mt-10"
          icon={FileText}
          title="Your invoice appears after the job is done"
          description="The final bill can still change during the visit, so we issue the invoice once your professional marks the job complete."
          action={{ label: 'Back to booking', href: `/booking/${data.id}` as Href }}
        />
      ) : (
        <InvoiceBody booking={data} lines={lines} loadingNames={services.status === 'loading'} />
      )}
    </Screen>
  )
}

function InvoiceBody({ booking, lines, loadingNames }: { booking: Booking; lines: Line[]; loadingNames: boolean }) {
  const a = booking.address
  return (
    <View className="mt-4">
      <View className="rounded-card border border-border p-4">
        <Text className="text-xl font-bold text-ink">{brand.fullName}</Text>
        <Text className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted">Tax invoice</Text>
        <View className="mt-4 flex-row gap-4">
          <Meta label="Invoice no." value={`INV-${booking.id}`} />
          <Meta label="Date" value={longDate(invoiceDate(booking))} />
        </View>
        <View className="my-4 h-px bg-border" />
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted">Billed to</Text>
        <Text className="mt-1 text-base font-semibold text-ink">{a.line1}</Text>
        <Text className="mt-0.5 text-sm text-muted">{[a.line2, `${a.city} ${a.pincode}`].filter(Boolean).join(', ')}</Text>
      </View>

      <Text accessibilityRole="header" className="mb-2 mt-6 text-lg font-bold text-ink">
        Services
      </Text>
      <View className="rounded-card border border-border px-4">
        {lines.map((line, index) => (
          <View key={line.key} className={cn('flex-row items-start gap-3 py-3', index < lines.length - 1 && 'border-b border-border')}>
            <View className="min-w-0 flex-1">
              {loadingNames ? (
                <Skeleton className="h-4 w-2/3 rounded-md" />
              ) : (
                <Text className="text-sm font-medium text-ink">{line.name}</Text>
              )}
              <Text className="mt-0.5 text-xs text-muted">{[line.detail, `Qty ${line.qty}`].filter(Boolean).join(' · ')}</Text>
            </View>
            <Text className="text-sm text-ink tabular-nums">{formatPaise(line.amount)}</Text>
          </View>
        ))}
      </View>

      <PriceBreakup price={booking.price} className="mt-4" />

      <View className="mt-4 flex-row items-center gap-2 rounded-card bg-success-soft px-4 py-3">
        <Icon as={CircleCheck} className="size-5 text-success" />
        <Text className="flex-1 text-sm text-success">{`Paid ${formatPaise(booking.price.total)} online when you booked. Nothing is due.`}</Text>
      </View>
    </View>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-ink">{value}</Text>
    </View>
  )
}

function DownloadBar({ booking, lines }: { booking: Booking; lines: Line[] }) {
  const toast = useToast()
  const colours = useTokenColors(['ink', 'muted', 'border'])
  const [busy, setBusy] = useState(false)

  async function download(): Promise<void> {
    setBusy(true)
    try {
      await saveInvoice(booking, invoiceHtml(booking, lines, colours))
    } catch {
      toast.show('We could not create the invoice file. Please try again.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <StickyCTA>
      <Button
        fullWidth
        size="lg"
        loading={busy}
        onPress={() => void download()}
        iconLeft={<Icon as={Download} className="size-5 text-white" />}
      >
        Download invoice
      </Button>
    </StickyCTA>
  )
}

/** Native: a file in the cache, then the share sheet. Web: a download, or the share sheet as text. */
async function saveInvoice(booking: Booking, html: string): Promise<void> {
  const name = `Invoice-${booking.id}.html`
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined' && typeof URL !== 'undefined' && 'createObjectURL' in URL) {
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      const link = document.createElement('a')
      link.href = url
      link.download = name
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      return
    }
    await Share.share({ message: `${brand.fullName} invoice INV-${booking.id}: ${formatPaise(booking.price.total)} paid.` })
    return
  }
  const file = new File(Paths.cache, name)
  file.create({ overwrite: true })
  file.write(html)
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available')
  await Sharing.shareAsync(file.uri, { mimeType: 'text/html', UTI: 'public.html', dialogTitle: `Invoice INV-${booking.id}` })
}

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** A self-contained page; the colours are the theme's, read at the time of download. */
function invoiceHtml(booking: Booking, lines: Line[], [ink, muted, border]: readonly string[]): string {
  const a = booking.address
  const p = booking.price
  const row = (label: string, value: string, strong = false) =>
    `<tr${strong ? ' class="total"' : ''}><td>${escape(label)}</td><td class="num">${escape(value)}</td></tr>`
  const items = lines
    .map((l) => row(`${l.name}${l.detail ? ` · ${l.detail}` : ''} × ${l.qty}`, formatPaise(l.amount)))
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice INV-${escape(booking.id)}</title>
<style>body{font-family:system-ui,sans-serif;color:${ink};max-width:640px;margin:24px auto;padding:0 16px}
.muted{color:${muted}}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px 0;border-bottom:1px solid ${border}}
.num{text-align:right;white-space:nowrap}.total td{font-weight:700;border-bottom:none}</style></head><body>
<h1>${escape(brand.fullName)}</h1><p class="muted">Tax invoice</p>
<p>Invoice no. <b>INV-${escape(booking.id)}</b><br>Date <b>${escape(longDate(invoiceDate(booking)))}</b></p>
<p class="muted">Billed to</p><p>${escape([a.line1, a.line2, `${a.city} ${a.pincode}`].filter(Boolean).join(', '))}</p>
<table>${items}</table>
<table>${row('Item total', formatPaise(p.items))}${p.discount > 0 ? row('Discount', `−${formatPaise(p.discount)}`) : ''}${
    p.fees > 0 ? row('Taxes and fee', formatPaise(p.fees)) : ''
  }${row('Total paid', formatPaise(p.total), true)}</table>
<p class="muted">Paid online when the booking was made. Nothing is due.</p></body></html>`
}
