'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/status'

/**
 * Short confirmations and failures. Anything the customer has to act on belongs
 * in a Modal or an inline error instead — a toast can be missed, and a payment
 * or a cancellation is not something to find out about in passing.
 *
 * The viewport is a single aria-live region so a screen reader announces each
 * message once, in order, without the toasts stealing focus.
 */

export interface ToastOptions {
  tone?: Extract<Tone, 'neutral' | 'success' | 'error'> | 'warning'
  /** Milliseconds on screen. Errors default to longer than confirmations. */
  duration?: number
}

interface ToastItem extends Required<ToastOptions> {
  id: number
  message: string
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>')
  }
  return ctx
}

const icons = {
  neutral: Info,
  success: Check,
  warning: TriangleAlert,
  error: TriangleAlert,
} as const

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const tone = options.tone ?? 'neutral'
      const duration =
        options.duration ?? (tone === 'error' ? 6000 : 3500)
      const id = nextId.current
      nextId.current += 1

      setToasts((current) => [...current, { id, message, tone, duration }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      )
    },
    [dismiss]
  )

  // Timers outlive the component if a route change unmounts the provider.
  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // Sits above the bottom nav and clears the home indicator.
        className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+var(--safe-bottom))] z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-2.5',
                'rounded-card border border-border bg-ink px-4 py-3 text-sm text-bg shadow-raised'
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  toast.tone === 'success' && 'text-success',
                  toast.tone === 'warning' && 'text-warning',
                  toast.tone === 'error' && 'text-error'
                )}
                aria-hidden="true"
              />
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="-m-2 p-2 text-bg/70 hover:text-bg"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
