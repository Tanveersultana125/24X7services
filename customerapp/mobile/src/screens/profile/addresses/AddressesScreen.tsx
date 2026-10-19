import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { MapPin, MapPinOff, Plus } from 'lucide-react-native'
import { addressSchema, COL, SUB, type Address, type AddressInput } from '@app/shared'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { AddressCard } from '@/components/AddressCard'
import { BottomSheet, ConfirmModal } from '@/components/ui/Overlay'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { useToast } from '@/components/Toast'
import { fetchServiceAreas } from '@/lib/catalog'
import { db } from '@/lib/firebase'
import { useAsync } from '@/lib/useAsync'
import { AddressForm } from '@/screens/profile/addresses/AddressForm'

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

export function AddressesScreen() {
  return (
    <ProfileShell
      title="Saved addresses"
      signedOut={
        <SignInPrompt
          icon={MapPin}
          title="Where we come to"
          description="Your saved addresses live on your account. Log in and the places we come to show up here."
        />
      }
    >
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
      const parsed = addressSchema.safeParse({ id: document.id, ...document.data() })
      if (parsed.success) addresses.push(parsed.data)
    }
    return { addresses, serviced: new Set(areas.map((area) => area.pincode)) }
    // reloadKey is the point: bumping it re-runs the load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, reloadKey])

  const data = useAsync(load)

  async function save(input: AddressInput, id?: string): Promise<void> {
    setBusy(true)
    try {
      const ref = id
        ? doc(db(), COL.users, uid, SUB.addresses, id)
        : doc(collection(db(), COL.users, uid, SUB.addresses))
      await setDoc(ref, { ...input, updatedAt: Date.now(), ...(id ? {} : { createdAt: Date.now() }) }, { merge: true })
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
      toast.show('We could not remove that. Please try again.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const serviced = data.data?.serviced ?? new Set<string>()

  return (
    <>
      {data.status === 'loading' ? (
        <SkeletonGroup label="Loading addresses" className="mt-6 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </SkeletonGroup>
      ) : data.status === 'error' ? (
        <ErrorState className="py-16" onRetry={data.reload} retrying={data.refreshing} />
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
          {/* Above the list, not under it. On an account with four addresses
              the button under them is off the bottom of the screen, and
              "where do I add one" is the only question this screen gets. */}
          <Tappable
            onPress={() => setEditing('new')}
            className="-mx-4 flex-row items-center gap-3 border-b border-border px-4 py-4 active:bg-surface active:opacity-100"
          >
            <Icon as={Plus} className="size-5 shrink-0 text-brand" />
            <Text className="text-base font-semibold text-brand">Add another address</Text>
          </Tappable>

          <View className="mt-4 gap-3">
            {data.data?.addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                serviceable={serviced.has(address.pincode)}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </View>
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
            {...(editing === 'new' ? {} : { initial: editing })}
            servicedPincodes={serviced}
            saving={busy}
            onSave={(input) => void save(input, editing === 'new' ? undefined : editing.id)}
          />
        ) : null}
      </BottomSheet>

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove(deleting)
        }}
        loading={busy}
        destructive
        title="Remove this address?"
        description="Past bookings keep the address they were made against, so nothing in your history changes."
        confirmLabel="Remove"
      />
    </>
  )
}
