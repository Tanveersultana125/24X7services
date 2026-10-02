import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { cn } from '@/lib/cn'

/**
 * Every piece of text in the app goes through this, never react-native's Text.
 *
 * A bare RN Text has no font family, no colour and no size of its own — it
 * renders in the system font, black, at 14 — which is wrong in both themes.
 * The base here is the body style the web app sets on <body>; a className
 * passed in overrides any part of it (cn merges, so `text-sm` replaces
 * `text-base` rather than fighting it).
 *
 * Weight is set with the font-* utilities (font-medium, font-semibold, …),
 * each of which also picks its Manrope file — see global.css.
 */
export interface TextProps extends RNTextProps {
  className?: string
}

export function Text({ className, ...props }: TextProps) {
  return (
    <RNText
      className={cn('font-normal text-base text-ink', className)}
      {...props}
    />
  )
}
