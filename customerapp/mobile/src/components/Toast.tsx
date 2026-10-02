import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated'
import { Check, Info, TriangleAlert, X } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/status'
import { Icon } from '@/components/ui/Icon'
import { Tappable } from '@/components/ui/Tappable'
import { Text } from '@/components/ui/Text'

/**
 * Short confirmations and failures. Anything the customer has to act on
 * belongs in a Modal or an inline error instead — a toast can be missed.
 */

export interface ToastOptions {
  tone?: Extract<Tone, 'neutral' | 'success' | 'error'> | 'warning'
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
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const icons = { neutral: Info, success: Check, warning: TriangleAlert, error: TriangleAlert } as const

/** Clears the bottom tab bar, which is where the thumb already is. */
const TAB_BAR_HEIGHT = 72

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const insets = useSafeAreaInsets()

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
      const duration = options.duration ?? (tone === 'error' ? 6000 : 3500)
      const id = nextId.current
      nextId.current += 1
      setToasts((current) => [...current, { id, message, tone, duration }])
      timers.current.set(id, setTimeout(() => dismiss(id), duration))
    },
    [dismiss]
  )

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
      <View
        pointerEvents="box-none"
        accessibilityLiveRegion="polite"
        className="absolute inset-x-0 items-center gap-2 px-4"
        style={{ bottom: TAB_BAR_HEIGHT + insets.bottom + 8 }}
      >
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.duration(200)}
            exiting={FadeOut.duration(150)}
            className="w-full max-w-sm flex-row items-start gap-2.5 rounded-card border border-border bg-ink px-4 py-3 shadow-raised"
          >
            <Icon
              as={icons[toast.tone]}
              className={cn(
                'mt-0.5 size-4 text-bg',
                toast.tone === 'success' && 'text-success',
                toast.tone === 'warning' && 'text-warning',
                toast.tone === 'error' && 'text-error'
              )}
            />
            <Text className="flex-1 text-sm text-bg">{toast.message}</Text>
            <Tappable onPress={() => dismiss(toast.id)} accessibilityLabel="Dismiss" hitSlop={10}>
              <Icon as={X} className="size-4 text-bg opacity-70" />
            </Tappable>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  )
}
