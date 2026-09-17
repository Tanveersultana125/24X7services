'use client'

import { useCallback, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { MapPinOff, Plus } from 'lucide-react'
import {
  addressInputSchema,
  addressSchema,
  COL,
  SUB,
  type Address,
  type AddressInput,
  type AddressLabel,
} from '@app/shared'

import { ProfileShell } from '@/components/ProfileShell'
import { AddressCard } from '@/components/AddressCard'
import { BottomSheet } from '@/components/BottomSheet'
import { ConfirmModal } from '@/components/Modal'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton, SkeletonGroup } from '@/components/SkeletonLoader'
import { useToast } from '@/components/Toast'
import { fetchServiceAreas } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { useAsync } from '@/lib/useAsync'

/**
 * The address book.
 *
 * Addresses in areas we do not cover stay in the list and say so, rather than
 * disappearing — a customer who moves, or who keeps a parent's address here,
 * needs to see it and be told why it cannot be booked against.
 *
 * Deleting one does not touch any booking it was used for. A booking copies its
 * address at the moment it is created, precisely so that tidying up here cannot
 * rewrite where a past job happened.
 */

const LABELS: ReadonlyArray<{ value: AddressLabel; text: string }> = [
  { value: 'home', text: 'Home' },
  { value: 'office', text: 'Office' },
  { value: 'other', text: 'Other' },
]

export function AddressesScreen() {
  return (
    <ProfileShell title="Saved addresses">
      {(user) => <AddressBook uid={user.uid} />}
    </ProfileShell>
  )
}

function AddressBook({ uid }: { uid: string }) {
  const toast = useToast()
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    const [snap, areas] = await Promise.all([
      getDocs(collection(db(), COL.users, uid, SUB.addresses)),
      fetchServiceAreas(),
    ])
    const addresses: Address[] = []
    for (const document of snap.docs) {
      const parsed = addressSchema.safeParse({
        id: document.id,
        ...document.data(),
      })
      if (parsed.success) addresses.push(parsed.data)
    }
    return {
      addresses,
      serviced: new Set(areas.map((area) => area.pincode)),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, reloadKey])

  const data = useAsync(load)

  async function save(input: AddressInput, id?: string): Promise<void> {
    setBusy(true)
    try {
      const ref = id
        ? doc(db(), COL.users, uid, SUB.addresses, id)
        : doc(collection(db(), COL.users, uid, SUB.addresses))
      await setDoc(
        ref,
        { ...input, updatedAt: Date.now(), ...(id ? {} : { createdAt: Date.now() }) },
        { merge: true }
      )
      setEditing(null)
      setReloadKey((key) => key + 1)
      toast.show('Saved.', { tone: 'success' })
    } catch {
      toast.show('We could not save that. Please try again.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function remove(address: Address): Promise<void> {
    setBusy(true)
    try {
      await deleteDoc(doc(db(), COL.users, uid, SUB.addresses, address.id))
      setDeleting(null)
      setReloadKey((key) => key + 1)
      toast.show('Address removed.')
    } catch {
      toast.show('We could not remove that. Please try again.', {
        tone: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  const serviced = data.data?.serviced ?? new Set<string>()

  return (
    <>
      {data.status === 'loading' ? (
        <SkeletonGroup label="Loading addresses" className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </SkeletonGroup>
      ) : data.status === 'error' ? (
        <ErrorState
          className="py-16"
          onRetry={data.reload}
          retrying={data.refreshing}
        />
      ) : (data.data?.addresses.length ?? 0) === 0 ? (
        <EmptyState
          className="py-16"
          icon={MapPinOff}
          title="No addresses yet"
          description="Add one here, or the first time you book — either way it is saved for next time."
          action={{ label: 'Add an address', onClick: () => setEditing('new') }}
        />
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3">
            {data.data?.addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                serviceable={serviced.has(address.pincode)}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>

          <Button
            className="mt-4"
            variant="secondary"
            fullWidth
            onClick={() => setEditing('new')}
            iconLeft={<Plus className="size-4" aria-hidden="true" />}
          >
            Add a new address
          </Button>
        </>
      )}

      <BottomSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        dismissable={!busy}
        title={editing === 'new' ? 'Add an address' : 'Edit address'}
      >
        {editing ? (
          <AddressForm
            initial={editing === 'new' ? undefined : editing}
            servicedPincodes={serviced}
            saving={busy}
            onSave={(input) =>
              save(input, editing === 'new' ? undefined : editing.id)
            }
          />
        ) : null}
      </BottomSheet>

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && void remove(deleting)}
        loading={busy}
        destructive
        title="Remove this address?"
        description="Past bookings keep the address they were made against, so nothing in your history changes."
        confirmLabel="Remove"
      />
    </>
  )
}

// ---------------------------------------------------------------------------

function AddressForm({
  initial,
  servicedPincodes,
  saving,
  onSave,
}: {
  initial?: Address
  servicedPincodes: ReadonlySet<string>
  saving: boolean
  onSave: (input: AddressInput) => void
}) {
  const [label, setLabel] = useState<AddressLabel>(initial?.label ?? 'home')
  const [customLabel, setCustomLabel] = useState(initial?.customLabel ?? '')
  const [flat, setFlat] = useState(initial?.flat ?? '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [landmark, setLandmark] = useState(initial?.landmark ?? '')
  const [city, setCity] = useState(initial?.city ?? 'Hyderabad')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit(event: React.FormEvent): void {
    event.preventDefault()

    const parsed = addressInputSchema.safeParse({
      label,
      customLabel: customLabel.trim() || undefined,
      flat,
      area,
      landmark: landmark.trim() || undefined,
      city,
      pincode,
    })

    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }

    setErrors({})
    onSave(parsed.data)
  }

  const notServiced =
    pincode.length === 6 && !servicedPincodes.has(pincode)

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Save as</legend>
        <div className="mt-2 flex gap-2">
          {LABELS.map((option) => (
            <Chip
              key={option.value}
              selected={label === option.value}
              onClick={() => setLabel(option.value)}
            >
              {option.text}
            </Chip>
          ))}
        </div>
      </fieldset>

      {label === 'other' ? (
        <Input
          label="Name this address"
          value={customLabel}
          onChange={(event) => setCustomLabel(event.target.value.slice(0, 30))}
          placeholder="Mum's place"
        />
      ) : null}

      <Input
        label="Flat / house number and building"
        required
        value={flat}
        onChange={(event) => setFlat(event.target.value)}
        error={errors.flat}
        autoComplete="address-line1"
      />
      <Input
        label="Area / locality"
        required
        value={area}
        onChange={(event) => setArea(event.target.value)}
        error={errors.area}
        autoComplete="address-level3"
      />
      <Input
        label="Landmark (optional)"
        value={landmark}
        onChange={(event) => setLandmark(event.target.value)}
      />
      <Input
        label="City"
        required
        value={city}
        onChange={(event) => setCity(event.target.value)}
        error={errors.city}
        autoComplete="address-level2"
      />
      <Input
        label="Pincode"
        required
        value={pincode}
        onChange={(event) =>
          setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))
        }
        error={errors.pincode}
        inputMode="numeric"
        autoComplete="postal-code"
        // Saved anyway, and flagged. Someone keeping a second home here should
        // not be stopped from writing it down.
        hint={
          notServiced
            ? 'We do not service this pincode yet — you can still save it.'
            : undefined
        }
      />

      <Button type="submit" fullWidth loading={saving}>
        Save address
      </Button>
    </form>
  )
}
