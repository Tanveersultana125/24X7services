'use client'

import { useCallback, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import { Download, FileText } from 'lucide-react'
import { COL, invoiceSchema, type Booking, type Invoice } from '@app/shared'

import { BookingShell } from '@/components/BookingShell'
import { InvoiceView } from '@/components/InvoiceView'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { db, storage } from '@/lib/firebase'
import { useAsync } from '@/lib/useAsync'

/**
 * The GST invoice for a finished job.
 *
 * Read from the invoice document, which the completion trigger wrote with the
 * seller details copied into it. Nothing on this screen reads the business
 * config — an invoice has to keep saying what it said on the day it was issued,
 * and a screen that re-read the config would silently reissue every past
 * invoice under a new address.
 *
 * The PDF is the same document rendered as a file, for anyone who has to hand
 * it to an accountant. If the render failed there is no file and the screen
 * says so, rather than offering a button that downloads nothing.
 */
export function InvoiceScreen() {
  return (
    <BookingShell title="Invoice">
      {({ booking }) => <InvoiceBody booking={booking} />}
    </BookingShell>
  )
}

function InvoiceBody({ booking }: { booking: Booking }) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const invoiceId = booking.invoiceId

  const load = useCallback(async (): Promise<Invoice | null> => {
    if (!invoiceId) return null
    const snap = await getDoc(doc(db(), COL.invoices, invoiceId))
    const parsed = invoiceSchema.safeParse({ id: snap.id, ...snap.data() })
    return parsed.success ? parsed.data : null
  }, [invoiceId])

  const invoice = useAsync(load)

  async function download(path: string): Promise<void> {
    setDownloading(true)
    try {
      // A short-lived URL fetched on demand rather than a link stored on the
      // invoice — a token written into a document outlives what it was for.
      const url = await getDownloadURL(ref(storage(), path))
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.show('We could not open the PDF just now. Please try again.', {
        tone: 'error',
      })
    } finally {
      setDownloading(false)
    }
  }

  if (!invoiceId) {
    return (
      <EmptyState
        className="py-16"
        icon={FileText}
        title="No invoice yet"
        description="An invoice is issued the moment the job is marked complete."
      />
    )
  }

  if (invoice.status === 'loading') {
    return (
      <SkeletonGroup label="Loading invoice" className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-64 w-full" />
      </SkeletonGroup>
    )
  }

  if (invoice.status === 'error' || !invoice.data) {
    return (
      <ErrorState
        className="py-16"
        onRetry={invoice.reload}
        retrying={invoice.refreshing}
      />
    )
  }

  return (
    <>
      <InvoiceView className="mt-5" invoice={invoice.data} />

      {invoice.data.pdfPath ? (
        <Button
          className="mt-4"
          variant="secondary"
          fullWidth
          loading={downloading}
          iconLeft={<Download className="size-4" aria-hidden="true" />}
          onClick={() => void download(invoice.data!.pdfPath as string)}
        >
          Download PDF
        </Button>
      ) : (
        <p className="mt-4 text-center text-xs text-muted">
          The PDF is still being prepared. Everything on it is above.
        </p>
      )}
    </>
  )
}
