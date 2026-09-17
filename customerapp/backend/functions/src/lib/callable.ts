import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { z } from 'zod'
import { REGION } from './options'
import {
  CALLABLES,
  type CallableInput,
  type CallableName,
  type CallableResult,
} from '@app/shared'

/**
 * The one way a callable is defined.
 *
 * It takes the name from the shared registry, so the input schema, the result
 * schema and whether sign-in is required are not restated here and cannot drift
 * from what the frontend's client believes. A handler receives input that has
 * already been parsed, and its return value is parsed on the way out — a
 * handler that returns the wrong shape fails here rather than at the far end of
 * a fetch, on a phone, as a blank screen.
 *
 * The exported const name is the deployed function name, so it must match the
 * registry key. `assertCallableNames` in index.ts checks that.
 */

export interface Caller {
  /** Null on the callables that do not require sign-in. */
  uid: string | null
  /** Present once App Check is enforced in Phase 6. */
  appId: string | undefined
}

/**
 * What a customer is told when something fails for a reason that is ours. The
 * real cause goes to the log; a stack trace or a Firestore message on screen
 * tells the customer nothing and tells everyone else too much.
 */
const GENERIC = 'Something went wrong. Please try again.'

export function defineCallable<N extends CallableName>(
  name: N,
  handler: (input: CallableInput<N>, caller: Caller) => Promise<CallableResult<N>>
) {
  const spec = CALLABLES[name]

  // The region is named here as well as globally. It is the one option whose
  // absence is invisible until a customer's call 404s, so it does not rely on
  // module evaluation order being what anyone expected.
  return onCall({ region: REGION }, async (request: CallableRequest<unknown>) => {
    const uid = request.auth?.uid ?? null

    if (spec.auth && uid === null) {
      throw new HttpsError('unauthenticated', 'Please sign in to continue.')
    }

    const parsed = spec.input.safeParse(request.data)
    if (!parsed.success) {
      // The first issue's message is written for a person — the schemas carry
      // copy like "Enter a valid 6-digit pincode" for exactly this.
      const issue = parsed.error.issues[0]
      throw new HttpsError(
        'invalid-argument',
        issue?.message ?? 'That request was not valid.'
      )
    }

    try {
      const result = await handler(parsed.data as CallableInput<N>, {
        uid,
        appId: request.app?.appId,
      })
      return spec.result.parse(result)
    } catch (error) {
      // A handler that threw HttpsError chose its own wording deliberately.
      if (error instanceof HttpsError) throw error

      if (error instanceof z.ZodError) {
        logger.error(`${name}: handler returned an invalid result`, {
          issues: error.issues,
        })
      } else {
        logger.error(`${name}: unhandled failure`, { error })
      }
      throw new HttpsError('internal', GENERIC)
    }
  })
}

/**
 * Every callable that exists is deployed under its registry name. Called once
 * from index.ts with the exported handlers, so a typo in an export name is a
 * boot failure in the emulator rather than a 404 that reads as a network error
 * on a customer's phone.
 */
export function assertCallableNames(
  exported: Partial<Record<CallableName, unknown>>
): void {
  for (const key of Object.keys(exported)) {
    if (!(key in CALLABLES)) {
      throw new Error(
        `Exported callable "${key}" is not in the shared CALLABLES registry.`
      )
    }
  }
}
