'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { ChevronRight, FileText } from 'lucide-react'
import { COL, invoiceSchema, type Invoice } from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { Card } from '@/components/ui/Card'
import { ToneBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { db } from '@/lib/firebase'
import { formatDateTime, formatPaise } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * Every invoice we have issued this customer, newest first.
 *
 * Called "Invoices" and not "Payments" because that is what is actually here: a
 * record of bills, not a wallet. There are no saved cards in this app — Razorpay
 * holds those — and a screen called Payments that cannot show a card is a screen
 * that disappoints everyone who opens it.
 */
export function PaymentsScreen() {
  return (
    <ProfileShell title="Invoices"
      signedOut={
        <SignInPrompt
          icon={FileText}
          title="Your invoices"
          description="Every bill we have issued you, with its GST breakdown, is here. Sign in to open them."
        />
      }
    >
      {(user) => <InvoiceList uid={user.uid} />}
    </ProfileShell>
  )
}

function InvoiceList({ uid }: { uid: string }) {
  const load = useCallback(async (): Promise<Invoice[]> => {
    const snap = await getDocs(
      query(
        collection(db(), COL.invoices),
        where('uid', '==', uid),
        orderBy('issuedAt', 'desc'),
        limit(100)
      )
    )
    const invoices: Invoice[] = []
    for (const document of snap.docs) {
      const parsed = invoiceSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (parsed.success) invoices.push(parsed.data)
    }
    return invoices
  }, [uid])

  const invoices = useAsync(load)

  if (invoices.status === 'loading') {
    return (
      <SkeletonGroup label="Loading invoices" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </SkeletonGroup>
    )
  }

  if (invoices.status === 'error') {
    return (
      <ErrorState
        className="py-16"
        onRetry={invoices.reload}
        retrying={invoices.refreshing}
      />
    )
  }

  if ((invoices.data?.length ?? 0) === 0) {
    return (
      <EmptyState
        className="py-16"
        icon={FileText}
        title="No invoices yet"
        description="A GST invoice is issued the moment a job is complete, and every one of them collects here."
      />
    )
  }

  return (
    <Card className="mt-5 overflow-hidden">
      <ul>
        {invoices.data?.map((invoice) => (
          <li key={invoice.id} className="border-b border-border last:border-b-0">
            <Link
              href={`/bookings/invoice?id=${invoice.bookingId}` as Route}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {invoice.number}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDateTime(invoice.issuedAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-ink">
                  {formatPaise(invoice.price.total)}
                </p>
                <ToneBadge
                  className="mt-1"
                  tone={invoice.price.due > 0 ? 'warning' : 'success'}
                  label={invoice.price.due > 0 ? 'Due' : 'Paid'}
                />
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-muted"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
