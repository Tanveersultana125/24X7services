import { useState } from 'react'
import { View } from 'react-native'
import { Briefcase, Home, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react-native'
import type { Address } from '@app/shared/catalog-v2'

import { ProfileShell, SignInPrompt } from '@/components/ProfileShell'
import { useToast } from '@/components/Toast'
import { Icon } from '@/components/ui/Icon'
import { ConfirmModal } from '@/components/ui/Overlay'
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'
import { useAddresses } from '@/lib/data/account'
import { deleteAddress, setDefaultAddress } from '@/lib/data/profile'
import { cn } from '@/lib/cn'
import { AddressFormSheet } from './AddressFormSheet'

/**
 * The address book. Each card says where it is and what it is called, and
 * carries the three things anyone does to an address: correct it, drop it,
 * or make it the one checkout picks first. Adding and editing share a sheet.
 *
 * The list is fetched again after every change rather than patched by hand,
 * so the default moving on a delete shows up exactly as the backend decided.
 */
export function AddressesScreen() {
  return (
    <ProfileShell
      title="Saved addresses"
      signedOut={
        <SignInPrompt
          icon={MapPin}
          title="Your addresses"
          description="Save home and work once, and checkout fills them in for you. Log in to see yours."
        />
      }
    >
      {() => <AddressBook />}
    </ProfileShell>
  )
}

/** The sheet's state. `n` remounts it per opening, so its fields start fresh. */
type Form = { open: boolean; address: Address | null; n: number }

function AddressBook() {
  const addresses = useAddresses()
  const toast = useToast()
  const [form, setForm] = useState<Form>({ open: false, address: null, n: 0 })
  const [removing, setRemoving] = useState<Address | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const list = addresses.data ?? []

  function openForm(address: Address | null): void {
    setForm((f) => ({ open: true, address, n: f.n + 1 }))
  }

  async function makeDefault(address: Address): Promise<void> {
    setBusy(address.id)
    try {
      await setDefaultAddress(address.id)
      toast.show(`Your ${address.label} address is now the default.`, { tone: 'success' })
      addresses.reload()
    } catch {
      toast.show('We could not change the default. Please try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  async function remove(): Promise<void> {
    if (!removing) return
    setBusy(removing.id)
    try {
      await deleteAddress(removing.id)
      toast.show('Address deleted.', { tone: 'success' })
      setRemoving(null)
      addresses.reload()
    } catch {
      toast.show('We could not delete it. Please try again.', { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  let body: React.ReactNode
  if (addresses.status === 'loading') {
    body = (
      <SkeletonGroup label="Loading addresses" className="gap-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </SkeletonGroup>
    )
  } else if (addresses.status === 'error') {
    body = <ErrorState onRetry={addresses.reload} retrying={addresses.refreshing} />
  } else if (list.length === 0) {
    body = (
      <EmptyState
        icon={MapPin}
        title="No saved addresses"
        description="Add your home or office once, and you will not type it again at checkout."
        action={{ label: 'Add an address', onClick: () => openForm(null) }}
      />
    )
  } else {
    body = (
      <View className="gap-3">
        {list.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            busy={busy === address.id}
            onEdit={() => openForm(address)}
            onDelete={() => setRemoving(address)}
            onMakeDefault={() => void makeDefault(address)}
          />
        ))}
      </View>
    )
  }

  return (
    <View className="pt-4">
      {addresses.status === 'ready' && list.length > 0 ? (
        <Tappable
          onPress={() => openForm(null)}
          className="mb-4 min-h-14 flex-row items-center gap-3 rounded-card border border-dashed border-brand px-4 active:bg-brand-soft active:opacity-100"
        >
          <Icon as={Plus} className="size-5 text-brand" />
          <Text className="text-base font-semibold text-brand">Add a new address</Text>
        </Tappable>
      ) : null}

      {body}

      <AddressFormSheet
        key={form.n}
        open={form.open}
        address={form.address}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        onSaved={() => {
          setForm((f) => ({ ...f, open: false }))
          addresses.reload()
        }}
      />

      <ConfirmModal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void remove()}
        title="Delete this address?"
        description={
          removing?.isDefault
            ? 'It is your default. Your next saved address becomes the default instead.'
            : 'Bookings already made for it are not affected.'
        }
        confirmLabel="Delete"
        destructive
        loading={removing !== null && busy === removing.id}
      />
    </View>
  )
}

const LABEL_ICON = { home: Home, work: Briefcase, other: MapPin } as const

function AddressCard({
  address,
  busy,
  onEdit,
  onDelete,
  onMakeDefault,
}: {
  address: Address
  busy: boolean
  onEdit: () => void
  onDelete: () => void
  onMakeDefault: () => void
}) {
  const line = [address.line1, address.line2, `${address.city} ${address.pincode}`].filter(Boolean).join(', ')
  return (
    <View className={cn('rounded-card border bg-bg', address.isDefault ? 'border-brand' : 'border-border')}>
      <View className="flex-row items-start gap-3 p-4">
        <View className="size-10 items-center justify-center rounded-full bg-brand-soft">
          <Icon as={LABEL_ICON[address.label]} className="size-5 text-brand" />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-base font-semibold capitalize text-ink">{address.label}</Text>
            {address.isDefault ? (
              <View className="rounded-pill bg-brand-soft px-2 py-0.5">
                <Text className="text-xs font-semibold text-brand">Default</Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-1 text-sm leading-[20px] text-muted">{line}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap border-t border-border">
        <CardAction icon={Pencil} label="Edit" onPress={onEdit} hint={`Edit your ${address.label} address`} />
        <CardAction icon={Trash2} label="Delete" onPress={onDelete} hint={`Delete your ${address.label} address`} tone="danger" />
        {address.isDefault ? null : (
          <CardAction icon={Star} label={busy ? 'Saving…' : 'Set as default'} onPress={onMakeDefault} disabled={busy} />
        )}
      </View>
    </View>
  )
}

function CardAction({
  icon,
  label,
  hint,
  onPress,
  disabled = false,
  tone = 'brand',
}: {
  icon: typeof Pencil
  label: string
  hint?: string
  onPress: () => void
  disabled?: boolean
  tone?: 'brand' | 'danger'
}) {
  const colour = tone === 'danger' ? 'text-error' : 'text-brand'
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={hint ?? label}
      accessibilityState={{ disabled }}
      className="min-h-11 flex-row items-center gap-1.5 px-4 active:bg-surface active:opacity-100"
    >
      <Icon as={icon} className={cn('size-4', colour)} />
      <Text className={cn('text-sm font-semibold', colour)}>{label}</Text>
    </Tappable>
  )
}
