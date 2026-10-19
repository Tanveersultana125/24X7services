import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { addressSchema, COL, SUB, type Address, type AddressInput } from '@app/shared'

import { db } from '@/lib/firebase'

/**
 * The address book under a customer's user document.
 *
 * Deleting one does not touch any booking it was used for. A booking copies its
 * address at the moment it is created, precisely so that tidying up here cannot
 * rewrite where a past job happened.
 */

/** Every saved address that parses; one that does not is left out, not fatal. */
export async function fetchAddresses(uid: string): Promise<Address[]> {
  const snap = await getDocs(collection(db(), COL.users, uid, SUB.addresses))
  const addresses: Address[] = []
  for (const document of snap.docs) {
    const parsed = addressSchema.safeParse({ id: document.id, ...document.data() })
    if (parsed.success) addresses.push(parsed.data)
  }
  return addresses
}

/**
 * Saves an address: over the one with `id` when given, as a new document
 * otherwise. Only a new one is stamped with `createdAt`.
 */
export async function saveAddress(uid: string, input: AddressInput, id?: string): Promise<void> {
  const ref = id
    ? doc(db(), COL.users, uid, SUB.addresses, id)
    : doc(collection(db(), COL.users, uid, SUB.addresses))
  await setDoc(ref, { ...input, updatedAt: Date.now(), ...(id ? {} : { createdAt: Date.now() }) }, { merge: true })
}

/** Removes one saved address. */
export async function deleteAddress(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db(), COL.users, uid, SUB.addresses, id))
}
