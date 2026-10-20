
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
import { kv } from './storage'

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

/**
 * As much of the signed-in account as the screens read. A Firebase `User`
 * satisfies it, and so does the mock session (lib/data/auth), which is how
 * the app signs in while there is no backend to sign in against.
 */
export type AuthUser = Pick<User, 'uid' | 'displayName' | 'email' | 'phoneNumber' | 'photoURL'>

export interface AuthSnapshot {
  user: AuthUser | null
  /** False until Firebase has reported once. */
  ready: boolean
}

const SERVER_SNAPSHOT: AuthSnapshot = { user: null, ready: false }

let snapshot: AuthSnapshot = SERVER_SNAPSHOT
const listeners = new Set<() => void>()
let unsubscribe: (() => void) | null = null

/** Versioned, so a changed shape is ignored rather than half-read. */
const MOCK_KEY = 'customerapp.mockSession.v1'
/** The last account Firebase reported, so the mock session can step aside for it. */
let firebaseUser: User | null = null
let mockUser: AuthUser | null = readMockUser()

function readMockUser(): AuthUser | null {
  try {
    const raw = kv.getItem(MOCK_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

/** A real Firebase session wins; the mock one stands in when there is none. */
function current(): AuthUser | null {
  return firebaseUser ?? mockUser
}

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
        firebaseUser = user
        emit({ user: current(), ready: true })
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

  /**
   * Starts or ends the mock session. Kept on the device, so a signed-in demo
   * survives a restart the way a Firebase session does.
   */
  setMockUser(user: AuthUser | null): void {
    mockUser = user
    if (user) kv.setItem(MOCK_KEY, JSON.stringify(user))
    else kv.removeItem(MOCK_KEY)
    emit({ user: current(), ready: snapshot.ready })
  },

  getServerSnapshot(): AuthSnapshot {
    return SERVER_SNAPSHOT
  },
}
