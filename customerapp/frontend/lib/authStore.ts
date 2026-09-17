'use client'

import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'

/**
 * Who is signed in, as an external store.
 *
 * Firebase already keeps this outside React and pushes changes at us, so the
 * same shape Phase 2 used for localStorage applies: one subscription for the
 * whole app, a snapshot read during render, and a server snapshot for the
 * prerendered HTML — which can only ever say "nobody, not known yet".
 *
 * `ready` matters more here than anywhere else. Restoring a session from
 * IndexedDB takes a moment, and a screen that treats "not known yet" as
 * "signed out" bounces a signed-in customer to the login screen every time
 * they open the app.
 */

export interface AuthSnapshot {
  user: User | null
  /** False until Firebase has reported once. */
  ready: boolean
}

const SERVER_SNAPSHOT: AuthSnapshot = { user: null, ready: false }

let snapshot: AuthSnapshot = SERVER_SNAPSHOT
const listeners = new Set<() => void>()
let unsubscribe: (() => void) | null = null

function emit(next: AuthSnapshot): void {
  snapshot = next
  for (const listener of listeners) listener()
}

export const authStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener)

    // One Firebase subscription however many components are watching.
    if (!unsubscribe) {
      unsubscribe = onAuthStateChanged(auth(), (user) => {
        emit({ user, ready: true })
      })
    }

    return () => {
      listeners.delete(listener)
      // The subscription is deliberately left open. Tearing it down when the
      // last component unmounts and rebuilding it on the next screen throws
      // away `ready`, and every navigation would flicker through signed-out.
    }
  },

  getSnapshot(): AuthSnapshot {
    return snapshot
  },

  getServerSnapshot(): AuthSnapshot {
    return SERVER_SNAPSHOT
  },
}
