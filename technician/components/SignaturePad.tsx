'use client'

import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

/**
 * The customer signs with a finger. Pointer events cover touch, pen and mouse
 * in one path; `touch-action: none` stops the page scrolling under the stroke.
 */
export function SignaturePad({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(!value)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ratio = window.devicePixelRatio || 1
    const { width, height } = c.getBoundingClientRect()
    c.width = width * ratio
    c.height = height * ratio
    const ctx = c.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f1d57'
    if (value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, width, height)
      img.src = value
    }
    // Drawn once on mount; later strokes are the canvas's own state.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function point(e: React.PointerEvent) {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-line-strong bg-[#fbfcfe]">
        <canvas
          ref={canvas}
          className="block h-40 w-full touch-none"
          aria-label="Customer signature"
          onPointerDown={(e) => {
            drawing.current = true
            canvas.current!.setPointerCapture(e.pointerId)
            const ctx = canvas.current!.getContext('2d')!
            const [x, y] = point(e)
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + 0.1, y + 0.1)
            ctx.stroke()
            setEmpty(false)
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const ctx = canvas.current!.getContext('2d')!
            const [x, y] = point(e)
            ctx.lineTo(x, y)
            ctx.stroke()
          }}
          onPointerUp={() => {
            drawing.current = false
            onChange(canvas.current!.toDataURL('image/png'))
          }}
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-faint">
            Customer signs here
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-line-strong" />
        <span className="pointer-events-none absolute bottom-3 left-6 text-[11px] font-bold uppercase tracking-wider text-faint">× Signature</span>
      </div>
      <button
        type="button"
        onClick={() => {
          const c = canvas.current!
          c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
          setEmpty(true)
          onChange('')
        }}
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-muted hover:bg-canvas hover:text-ink"
      >
        <Eraser className="size-4" /> Clear
      </button>
    </div>
  )
}
