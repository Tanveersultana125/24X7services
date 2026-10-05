import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names so a caller's override actually wins. Without twMerge,
 * `<Button className="px-6">` leaves both px-4 and px-6 on the element and the
 * winner is whichever Tailwind emitted last.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
