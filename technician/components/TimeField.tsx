'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Sheet, inputClass } from './ui'

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const pad = (n: number) => String(n).padStart(2, '0')

type Parts = { h: number; m: number; pm: boolean }

/** "20:30" → { h: 8, m: 30, pm: true } */
function parse(v: string): Parts {
  const [hh = 0, mm = 0] = v.split(':').map(Number)
  return { h: hh % 12 || 12, m: mm, pm: hh >= 12 }
}

function format({ h, m, pm }: Parts) {
  return `${pad((h % 12) + (pm ? 12 : 0))}:${pad(m)}`
}

function display(v: string) {
  const { h, m, pm } = parse(v)
  return `${h}:${pad(m)} ${pm ? 'PM' : 'AM'}`
}

/**
 * A time input that opens a bottom sheet with scroll wheels, the picker people
 * already know from their phone's clock. The native `type="time"` popup is a
 * desktop dropdown on Chrome that spills off a phone-width screen and ignores
 * the app's type and colours.
 */
export function TimeField({ label: title, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Parts>(() => parse(value))
  // A minute saved off the 5-minute grid gets its own row. Keyed to the saved
  // value, not the draft, so the wheel doesn't grow or shrink mid-scroll.
  const saved = parse(value).m
  const minutes = MINUTES.includes(saved) ? MINUTES : [...MINUTES, saved].sort((a, b) => a - b)

  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-ink-2">{title}</span>
      <button
        type="button"
        onClick={() => {
          setDraft(parse(value))
          setOpen(true)
        }}
        className={cn(inputClass, 'num flex items-center justify-between text-left font-bold')}
      >
        {display(value)}
        <Clock className="size-4 text-muted" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="relative mx-auto max-w-xs">
          {/* The band the chosen row sits in. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-xl bg-canvas ring-1 ring-line" />
          <div className="relative grid grid-cols-[1fr_auto_1fr_1fr] items-center">
            <Wheel label="Hour" items={HOURS.map(String)} index={HOURS.indexOf(draft.h)} onIndex={(i) => setDraft((d) => ({ ...d, h: HOURS[i] ?? d.h }))} />
            <span aria-hidden className="num pb-0.5 text-2xl font-extrabold text-ink">:</span>
            <Wheel label="Minute" items={minutes.map(pad)} index={minutes.indexOf(draft.m)} onIndex={(i) => setDraft((d) => ({ ...d, m: minutes[i] ?? d.m }))} />
            <Wheel label="AM or PM" items={['AM', 'PM']} index={draft.pm ? 1 : 0} onIndex={(i) => setDraft((d) => ({ ...d, pm: i === 1 }))} />
          </div>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="lg"
            className="flex-[1.6]"
            onClick={() => {
              onChange(format(draft))
              setOpen(false)
            }}
          >
            Set {display(format(draft))}
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

const ROW = 48
const VISIBLE = 5

/**
 * One scroll-snapping column. The row that settles in the middle is the value;
 * tapping a row or pressing ↑/↓ moves it there too.
 */
function Wheel({ label, items, index, onIndex }: { label: string; items: string[]; index: number; onIndex: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  // Start on the saved value. Only on mount: afterwards the scroll position
  // is the source of truth and `index` follows it.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ROW
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const go = (i: number) => {
    const next = Math.max(0, Math.min(items.length - 1, i))
    ref.current?.scrollTo({ top: next * ROW, behavior: 'smooth' })
    onIndex(next)
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={(e) => {
        const el = e.currentTarget
        cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => {
          const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)))
          if (i !== index) onIndex(i)
        })
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') go(index + 1)
        else if (e.key === 'ArrowUp') go(index - 1)
        else return
        e.preventDefault()
      }}
      className="no-scrollbar snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none [mask-image:linear-gradient(to_bottom,transparent,#000_32%,#000_68%,transparent)] focus-visible:ring-2 focus-visible:ring-brand/40"
      style={{ height: ROW * VISIBLE, paddingBlock: ROW * ((VISIBLE - 1) / 2) }}
    >
      {items.map((it, i) => (
        <button
          key={it}
          type="button"
          role="option"
          aria-selected={i === index}
          tabIndex={-1}
          onClick={() => go(i)}
          className={cn(
            'num flex w-full snap-center items-center justify-center transition-[color,font-size] duration-150',
            i === index ? 'text-[26px] font-extrabold text-ink' : Math.abs(i - index) === 1 ? 'text-xl font-bold text-ink-2' : 'text-lg font-semibold text-faint'
          )}
          style={{ height: ROW }}
        >
          {it}
        </button>
      ))}
    </div>
  )
}
