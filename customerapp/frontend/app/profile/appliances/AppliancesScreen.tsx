'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { ChevronRight, PackageOpen, Trash2, WashingMachine } from 'lucide-react'
import {
  COL,
  SUB,
  userApplianceInputSchema,
  type CatalogAppliance,
  type UserApplianceInput,
} from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { fetchAppliances } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { relativeTime } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

/**
 * The machines in this customer's home that we know about.
 *
 * They are added by booking, not by filling in a form — the details come from
 * what was told to us when the job was booked, which is the only moment anyone
 * is willing to look behind a fridge for a model number. This screen is where
 * they are reviewed, and where one that has been thrown out is removed.
 */

interface SavedAppliance extends UserApplianceInput {
  id: string
  lastServicedAt?: number
}

export function AppliancesScreen() {
  return (
    <ProfileShell title="My appliances"
      signedOut={
        <SignInPrompt
          icon={WashingMachine}
          title="Your appliances"
          description="Save the make and model of what you own and booking a repair takes two taps. Log in to see yours."
        />
      }
    >
      {(user) => <ApplianceList uid={user.uid} />}
    </ProfileShell>
  )
}

/**
 * The heading in the body, under the bar.
 *
 * The bar says where you are while you scroll; this says what you are looking
 * at, in the customer's words, at a size worth reading. The profile screen
 * itself is built the same way — "Profile" in the bar, "Your account" on the
 * page.
 */
function PageTitle() {
  return (
    <h1 className="mt-6 text-2xl font-bold leading-tight text-ink">
      Your appliances
    </h1>
  )
}

function ApplianceList({ uid }: { uid: string }) {
  const toast = useToast()
  const [deleting, setDeleting] = useState<SavedAppliance | null>(null)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    const [snap, catalog] = await Promise.all([
      getDocs(collection(db(), COL.users, uid, SUB.appliances)),
      fetchAppliances(),
    ])

    const saved: SavedAppliance[] = []
    for (const document of snap.docs) {
      const parsed = userApplianceInputSchema.safeParse(document.data())
      if (!parsed.success) continue
      const lastServicedAt = document.data().lastServicedAt
      saved.push({
        id: document.id,
        ...parsed.data,
        ...(typeof lastServicedAt === 'number' ? { lastServicedAt } : {}),
      })
    }

    return { saved, catalog }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, reloadKey])

  const data = useAsync(load)

  async function remove(appliance: SavedAppliance): Promise<void> {
    setBusy(true)
    try {
      await deleteDoc(doc(db(), COL.users, uid, SUB.appliances, appliance.id))
      setDeleting(null)
      setReloadKey((key) => key + 1)
      toast.show('Removed.')
    } catch {
      toast.show('We could not remove that. Please try again.', {
        tone: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  const nameOf = (applianceId: string): string =>
    data.data?.catalog.find((a: CatalogAppliance) => a.id === applianceId)
      ?.name ?? applianceId

  if (data.status === 'loading') {
    return (
      <SkeletonGroup label="Loading appliances" className="mt-6 flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </SkeletonGroup>
    )
  }

  if (data.status === 'error') {
    return (
      <ErrorState
        className="py-16"
        onRetry={data.reload}
        retrying={data.refreshing}
      />
    )
  }

  if ((data.data?.saved.length ?? 0) === 0) {
    return (
      <>
        <PageTitle />
        <EmptyState
          className="py-14"
          icon={PackageOpen}
          title="No appliances yet"
          description="Appliances are saved from the details you give when you book, so the next booking for the same machine is two taps shorter."
          action={{ label: 'Explore our services', href: '/services' }}
        />
      </>
    )
  }

  return (
    <>
      <PageTitle />

      <ul className="mt-4 flex flex-col gap-3">
        {data.data?.saved.map((appliance) => (
          <li key={appliance.id}>
            <Card className="overflow-hidden">
              <Link
                href={
                  `/profile/appliances/detail?id=${appliance.id}` as Route
                }
                className="flex items-start gap-3 p-4 hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {appliance.nickname ?? nameOf(appliance.applianceId)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[
                      appliance.brandId.toUpperCase(),
                      nameOf(appliance.applianceId),
                      appliance.type,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {appliance.modelNumber ? (
                    <p className="mt-0.5 text-xs text-muted">
                      Model {appliance.modelNumber}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted">
                    {appliance.lastServicedAt
                      ? `Last serviced ${relativeTime(appliance.lastServicedAt)}`
                      : 'Not serviced by us yet'}
                  </p>
                </div>
                <ChevronRight
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </Link>
              <button
                type="button"
                onClick={() => setDeleting(appliance)}
                className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-border text-sm font-medium text-error hover:bg-error-soft"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </button>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
        loading={busy}
        destructive
        title="Remove this appliance?"
        description="Its service history stays on the bookings it belongs to. Only the saved shortcut goes."
        confirmLabel="Remove"
      />
    </>
  )
}
