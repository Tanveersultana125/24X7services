'use client'

import { createContext, useContext } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The full app menu — the desktop sidebar — as a drawer on a phone. Any
 * screen header drops in a MenuButton; AppShell owns the drawer itself.
 */
export const MenuContext = createContext<(open: boolean) => void>(() => {})

export function MenuButton({ className, inverted }: { className?: string; inverted?: boolean }) {
  const setOpen = useContext(MenuContext)
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => setOpen(true)}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full lg:hidden',
        inverted ? 'bg-white/10 text-white hover:bg-white/15' : 'text-ink hover:bg-canvas',
        className
      )}
    >
      <Menu className="size-5" />
    </button>
  )
}
