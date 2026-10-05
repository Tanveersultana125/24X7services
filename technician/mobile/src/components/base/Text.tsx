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
  const own = cn(inherited, className)
  // A Text inside a Text takes the outer one's type and colour, as an inline
  // <span> does on the web. Only those classes travel; margins and flex stay.
  return (
    <Inherited.Provider value={typography(own)}>
      <RNText className={cn('font-normal text-base text-ink', own)} {...props} />
    </Inherited.Provider>
  )
}

const TYPE = /^(text-|font-|leading-|tracking-|uppercase$|lowercase$|capitalize$|normal-case$|italic$|not-italic$|num$|underline$|line-through$|no-underline$|opacity-)/

function typography(classes: string): string {
  return classes
    .split(/\s+/)
    .filter((c) => TYPE.test(c) && !/^text-(left|center|right|justify)$/.test(c))
    .join(' ')
}
