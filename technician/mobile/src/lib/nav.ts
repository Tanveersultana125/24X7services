import { router, type Href } from 'expo-router'
import { useCallback } from 'react'

/**
 * Back returns to the screen the technician came from — the navigation stack
 * remembers it — or, when the screen was opened cold (a notification, a deep
 * link), to the screen's parent.
 */
export function useBack(fallback: Href) {
  return useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace(fallback)
  }, [fallback])
}
