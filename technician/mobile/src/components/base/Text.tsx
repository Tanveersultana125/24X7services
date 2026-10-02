import { createContext, useContext } from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { cn } from '@/lib/cn'

/**
 * Every piece of text in the app goes through this, never react-native's Text.
 *
 * A bare RN Text has no font family, no colour and no size of its own, and —
 * unlike the web — takes nothing from the View around it. The base here is
 * the body style the web app sets on <body>; a className passed in overrides
 * any part of it (cn merges, so `text-sm` replaces `text-base`).
 *
 * Weight is set with the font-* utilities (font-medium, font-semibold, …),
 * each of which also picks its Manrope file — see global.css.
 */
export interface TextProps extends RNTextProps {
  className?: string
}

/**
 * CSS inheritance, where the web markup relied on it: a button or chip sets
 * its colour, size and weight once on the box, and every Text and Icon inside
 * picks them up. `<Inherit className="text-sm font-bold text-white">`.
 */
const Inherited = createContext('')

export function Inherit({ className, children }: { className: string; children: React.ReactNode }) {
  const outer = useContext(Inherited)
  return <Inherited.Provider value={cn(outer, className)}>{children}</Inherited.Provider>
}

export function useInherited(): string {
  return useContext(Inherited)
}

export function Text({ className, ...props }: TextProps) {
  const inherited = useContext(Inherited)
  return <RNText className={cn('font-normal text-base text-ink', inherited, className)} {...props} />
}
