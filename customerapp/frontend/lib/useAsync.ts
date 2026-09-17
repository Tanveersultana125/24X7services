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

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | undefined
  error: unknown
  /** Re-runs the loader; whatever is on screen stays there while it does. */
  reload: () => void
  /** True only for a reload, so a retry does not blank the page. */
  refreshing: boolean
}

export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [status, setStatus] = useState<AsyncStatus>('loading')
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<unknown>(undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    // A second run must not let a slow first response overwrite it.
    let live = true

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
        if (live) setRefreshing(false)
      })

    return () => {
      live = false
    }
  }, [load, nonce])

  // The spinner is turned on where the retry was pressed, not inside the
  // effect: a setState in an effect body costs an extra render pass for
  // something an event handler already knows.
  const reload = useCallback(() => {
    setRefreshing(true)
    setNonce((n) => n + 1)
  }, [])

  return { status, data, error, reload, refreshing }
}
