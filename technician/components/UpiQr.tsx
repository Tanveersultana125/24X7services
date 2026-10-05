'use client'

import { useMemo } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/lib/cn'

/**
 * The standard UPI payment link every UPI app (GPay, PhonePe, Paytm, BHIM)
 * reads from a QR. With an amount it opens pre-filled; without one the
 * customer types it, like a shop's counter scanner.
 */
export function upiLink({ upi, name, amount, note }: { upi: string; name: string; amount?: number; note?: string }) {
  // Built by hand rather than with URLSearchParams: some UPI apps show "+"
  // for spaces and reject "%40" in the payee address.
  const enc = (v: string) => encodeURIComponent(v).replace(/%40/g, '@')
  const q = [`pa=${enc(upi)}`, `pn=${enc(name)}`, 'cu=INR']
  if (amount) q.push(`am=${amount.toFixed(2)}`)
  if (note) q.push(`tn=${enc(note)}`)
  return `upi://pay?${q.join('&')}`
}

/** A real, scannable QR for `text`, drawn as one SVG path so it stays crisp at any size. */
export function QrCode({ text, className, label = 'Payment QR code' }: { text: string; className?: string; label?: string }) {
  const { size, d } = useMemo(() => {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
    let path = ''
    for (let y = 0; y < modules.size; y++)
      for (let x = 0; x < modules.size; x++) if (modules.get(y, x)) path += `M${x} ${y}h1v1h-1z`
    return { size: modules.size, d: path }
  }, [text])

  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className={cn('rounded-xl bg-white', className)} role="img" aria-label={label} shapeRendering="crispEdges">
      <path d={d} fill="#0b1220" />
    </svg>
  )
}

/** Saves the QR as a PNG the technician can print or send. */
export async function downloadQr(text: string, filename: string) {
  const url = await QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 2, width: 1024, color: { dark: '#0b1220', light: '#ffffff' } })
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
