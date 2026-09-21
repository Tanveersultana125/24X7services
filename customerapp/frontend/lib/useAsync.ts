'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Load something once the component is mounted, with the three states every
 * screen in this app has to render: loading, loaded, failed.
 *
 * It exists because a static export has no server to fetch on. Every screen
 * mounts empty and fills in, so every screen needs the same skeleton / content /
 * error shape, and writing that by hand five times is five chances to forget
 * the error branch.
 *
 * The loader must be stable — wrap it in useCallback — because a new function
 * identity on every render would re-run the fetch on every render.
 */

export type AsyncStatus = 'loading' | 'ready' | 'error'

/**
 * How long a screen may sit on its skeleton before it admits defeat.
 *
 * There is a fourth state no screen renders and every screen could reach:
 * neither loaded nor failed. Firestore does not give up on an unreachable
 * backend — it queues the read and retries for as long as the tab is open —
 * so a cold cache with no route to the server produces a promise that never
 * settles, and the customer watches a shimmering grid for as long as they are
 * willing to. It is the single most common way this app breaks in development,
 * where it means the emulators are not running, and it is what a customer in a
 * tunnel gets too.
 *
 * A deadline turns that into the error state the screen already knows how to
 * draw, with the Try Again button already wired to it. Fifteen seconds is far
 * longer than any read here takes on a bad connection and far shorter than
 * forever.
 */
const DEFAULT_TIMEOUT_MS = 15_000

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | undefined
  error: unknown
  /** Re-runs the loader; whatever is on screen stays there while it does. */
  reload: () => void
  /** True only for a reload, so a retry does not blank the page. */
  refreshing: boolean
}

export interface AsyncOptions {
  /** Override the deadline, or pass 0 to wait as long as it takes. */
  timeoutMs?: number
}

export function useAsync<T>(
  load: () => Promise<T>,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: AsyncOptions = {}
): AsyncState<T> {
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    // A second run must not let a slow first response overwrite it.
    let live = true

    // Nothing here cancels the loader — a promise cannot be called off, and a
    // Firestore read that lands late is still a good read. The deadline stops
    // the screen waiting on it, and if the answer turns up afterwards the
    // branches below still take it and replace the error with the content.
    const deadline =
      timeoutMs > 0
        ? setTimeout(() => {
            if (!live) return
            setError(
              new Error(`Loading timed out after ${timeoutMs}ms`, {
                cause: 'timeout',
              })
            )
            setStatus('error')
            setRefreshing(false)
          }, timeoutMs)
        : undefined

    load()
      .then((result) => {
        if (!live) return
        setData(result)
        setError(undefined)
        setStatus('ready')
      })
      .catch((caught: unknown) => {
        if (!live) return
        setError(caught)
        setStatus('error')
      })
      .finally(() => {
        if (!live) return
        clearTimeout(deadline)
        setRefreshing(false)
      })

    return () => {
      live = false
      clearTimeout(deadline)
    }
  }, [load, nonce, timeoutMs])

  // The spinner is turned on where the retry was pressed, not inside the
  // effect: a setState in an effect body costs an extra render pass for
  // something an event handler already knows.
  const reload = useCallback(() => {
    setRefreshing(true)
    setNonce((n) => n + 1)
  }, [])

  return { status, data, error, reload, refreshing }
}
