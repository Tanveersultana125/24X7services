'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Fingerprint, Headset, KeyRound, Lock, ShieldCheck, Smartphone } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button, Field, Segmented, Sheet, Toggle, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { DEMO_OTP, TECHNICIAN } from '@/lib/seed'
import { useStore } from '@/lib/store'

type Mode = 'otp' | 'id'

export default function LoginPage() {
  const store = useStore()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('otp')
  const [online, setOnline] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [forgot, setForgot] = useState(false)

  useEffect(() => {
    if (store.ready && store.signedIn) router.replace('/home')
  }, [store.ready, store.signedIn, router])

  function done() {
    store.setOnline(online)
    store.signIn()
    router.replace('/home')
  }

  return (
    <div className="min-h-dvh bg-card lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative overflow-hidden bg-brand-ink px-6 pb-16 pt-[calc(var(--safe-top)+2rem)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border-[40px] border-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full border-[56px] border-white/[0.03]" />
        <Logo inverted />
        <div className="relative mt-10 lg:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Partner console</p>
          <h1 className="mt-2 max-w-md text-[28px] font-extrabold leading-[1.15] tracking-tight lg:text-[40px]">
            Every job, from request to sign-off, in one place.
          </h1>
          <p className="mt-3 max-w-sm text-sm font-medium text-white/65 lg:text-base">
            Samsung, LG, Bosch and IBM washing machines, refrigerators, ovens, ACs and geysers — dispatched around the clock.
          </p>
        </div>
        <dl className="relative mt-10 hidden grid-cols-3 gap-6 border-t border-white/10 pt-6 lg:grid">
          {[
            ['24×7', 'Dispatch desk'],
            ['< 30 s', 'Request window'],
            ['Same day', 'Wallet payouts'],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="text-xl font-extrabold">{v}</dt>
              <dd className="mt-0.5 text-xs font-semibold text-white/55">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Form */}
      <section className="relative -mt-8 rounded-t-3xl bg-card px-5 pb-10 pt-7 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:rounded-none lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm font-medium text-muted">Verified 24X7 technicians only.</p>

          <Segmented
            className="mt-6"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'otp', label: 'Mobile OTP' },
              { value: 'id', label: 'Technician ID' },
            ]}
          />

          <div className="mt-6">{mode === 'otp' ? <OtpForm onDone={done} /> : <IdForm onDone={done} onForgot={() => setForgot(true)} />}</div>

          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-faint">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={() => {
              setScanning(true)
              setTimeout(done, 1400)
            }}
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-line-strong text-[15px] font-extrabold text-ink hover:border-brand hover:text-brand"
          >
            <Fingerprint className="size-6" />
            Use fingerprint
          </button>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
            <div>
              <p className="text-sm font-extrabold">Go online after sign-in</p>
              <p className="text-xs font-medium text-muted">{online ? 'You will start receiving requests' : 'Sign in without taking jobs'}</p>
            </div>
            <Toggle checked={online} onChange={setOnline} label="Go online after sign-in" tone="success" />
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs font-medium leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
            Your session is tied to this device. Sign-ins are logged against your technician ID.
          </p>
          <a href="tel:+914068241000" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-brand">
            <Headset className="size-4" /> Trouble signing in? Partner desk 040 6824 1000
          </a>
        </div>
      </section>

      {scanning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-ink/90 backdrop-blur-sm">
          <div className="flex flex-col items-center text-white">
            <div className="relative grid size-28 place-items-center rounded-full bg-white/10">
              <span className="animate-pulse-ring absolute inset-4 rounded-full bg-white/30" />
              <Fingerprint className="relative size-14" strokeWidth={1.4} />
            </div>
            <p className="mt-5 text-lg font-extrabold">Verifying fingerprint…</p>
            <p className="text-sm font-medium text-white/60">Hold your finger on the sensor</p>
          </div>
        </div>
      )}

      <ForgotSheet open={forgot} onClose={() => setForgot(false)} />
    </div>
  )
}

function OtpForm({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState('98855 20471')
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [wait, setWait] = useState(0)
  const [error, setError] = useState('')
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  const digits = phone.replace(/\D/g, '')

  function set(i: number, v: string) {
    const clean = v.replace(/\D/g, '')
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('')
      setOtp([...next, ...Array(6 - next.length).fill('')])
      boxes.current[Math.min(next.length, 5)]?.focus()
      return
    }
    const next = [...otp]
    next[i] = clean
    setOtp(next)
    setError('')
    if (clean && i < 5) boxes.current[i + 1]?.focus()
  }

  if (!sent)
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
          setWait(30)
          setTimeout(() => boxes.current[0]?.focus(), 50)
        }}
      >
        <Field label="Registered mobile number">
          <div className="flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-line-strong bg-canvas px-3 text-base font-bold text-ink-2">
              +91
            </span>
            <input
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(inputClass, 'num rounded-l-none font-bold tracking-wide')}
              placeholder="98xxx xxxxx"
            />
          </div>
        </Field>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={digits.length !== 10}>
          <Smartphone className="size-5" /> Send OTP
        </Button>
      </form>
    )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (otp.join('') === DEMO_OTP) onDone()
        else setError('That code doesn’t match. Check the SMS and try again.')
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-ink-2">Enter the 6-digit code</p>
        <button type="button" onClick={() => setSent(false)} className="text-xs font-bold text-brand">
          Change number
        </button>
      </div>
      <p className="num mt-0.5 text-xs font-medium text-muted">Sent to +91 {phone}</p>
      <div className="mt-3 grid grid-cols-6 gap-2">
        {otp.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            maxLength={6}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d && i > 0) boxes.current[i - 1]?.focus()
            }}
            className={cn(
              'num h-14 w-full rounded-xl border-2 bg-card text-center text-xl font-extrabold transition-colors focus:border-brand',
              error ? 'border-danger' : d ? 'border-ink-2' : 'border-line-strong'
            )}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-bold text-danger">{error}</p>}
      <div className="mt-3 flex items-center justify-between text-xs font-semibold">
        <span className="rounded-md bg-warning-soft px-2 py-1 font-bold text-warning">Demo OTP: {DEMO_OTP}</span>
        {wait > 0 ? (
          <span className="num text-muted">Resend in 0:{String(wait).padStart(2, '0')}</span>
        ) : (
          <button type="button" onClick={() => setWait(30)} className="font-bold text-brand">
            Resend OTP
          </button>
        )}
      </div>
      <Button type="submit" size="lg" className="mt-4 w-full" disabled={otp.join('').length !== 6}>
        Verify &amp; sign in
      </Button>
    </form>
  )
}

function IdForm({ onDone, onForgot }: { onDone: () => void; onForgot: () => void }) {
  const [id, setId] = useState(TECHNICIAN.id)
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onDone()
      }}
      className="space-y-4"
    >
      <Field label="Technician ID">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            value={id}
            onChange={(e) => setId(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            className={cn(inputClass, 'num pl-10 font-bold tracking-wide')}
            placeholder="TCH-XXX-0000"
          />
        </div>
      </Field>
      <Field label="Password" hint="Demo: any 6+ characters">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            className={cn(inputClass, 'px-10')}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <div className="flex justify-end">
        <button type="button" onClick={onForgot} className="text-sm font-bold text-brand">
          Forgot password?
        </button>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={id.length < 6 || pw.length < 6}>
        Sign in
      </Button>
    </form>
  )
}

function ForgotSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose()
        setSent(false)
      }}
      title="Reset password"
    >
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <ShieldCheck className="size-7" />
          </div>
          <p className="mt-3 font-extrabold">Reset link sent</p>
          <p className="mt-1 text-sm text-muted">Check the SMS on your registered number. The link expires in 15 minutes.</p>
          <Button className="mt-5 w-full" onClick={onClose}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
          className="space-y-4"
        >
          <p className="text-sm text-muted">We’ll send a reset link to the mobile number registered against your technician ID.</p>
          <Field label="Technician ID">
            <input defaultValue={TECHNICIAN.id} className={cn(inputClass, 'num font-bold')} />
          </Field>
          <Field label="Registered mobile">
            <input defaultValue="98855 20471" inputMode="numeric" className={cn(inputClass, 'num font-bold')} />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </Sheet>
  )
}
