'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, CircleCheck, ChevronRight, Clock, Download, Headset, KeyRound, Languages, Landmark, LogOut, Power, QrCode as QrIcon, Radar, RotateCcw, Share2, Smartphone, UserRound } from 'lucide-react'
import { TimeField } from '@/components/TimeField'
import { QrCode, downloadQr, upiLink } from '@/components/UpiQr'
import { Avatar, Button, Card, Field, Page, ScreenHeader, SectionTitle, Segmented, Sheet, Toggle, inputClass } from '@/components/ui'
import { chime } from '@/lib/chime'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { inShift, shiftHours } from '@/lib/shift'
import { useStore, useTick } from '@/lib/store'
import type { Settings } from '@/lib/types'

type SheetName = 'payment' | 'scanner' | 'account' | 'password' | 'devices' | 'logout'

const NOTIFY_LABEL: Record<keyof Settings['notify'], string> = {
  requests: 'New request alerts',
  emergency: 'Emergency alerts',
  schedule: 'Schedule alerts',
  payments: 'Payment & rating alerts',
  sound: 'Alert sound',
}

export default function SettingsPage() {
  const store = useStore()
  const router = useRouter()
  const t = useT()
  const now = useTick(60_000)
  const { settings: s, updateSettings } = store
  const [sheet, setSheet] = useState<null | SheetName>(null)
  const [toast, setToast] = useState<string | null>(null)
  const notify = (k: keyof Settings['notify'], v: boolean) => {
    updateSettings({ notify: { ...s.notify, [k]: v } })
    if (k === 'sound' && v) chime()
    flash(`${NOTIFY_LABEL[k]} ${v ? 'on' : 'off'}`)
  }
  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const onShift = inShift(s, new Date(now))
  // store.jobs already drops requests outside the radius, so this count moves
  // with the slider.
  const waiting = store.jobs.filter((j) => j.status === 'request').length
  const passwordAge = Math.floor((now - new Date(s.passwordChangedAt).getTime()) / 86_400_000)

  return (
    <>
      <ScreenHeader back="/profile" title={t('Settings')} />
      <Page className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <section>
              <SectionTitle>{t('Availability')}</SectionTitle>
              <Card className="divide-y divide-line">
                <Line icon={<Power className="size-4" />} title={t('Online for new requests')} sub={t(store.online ? 'Dispatch can send you jobs' : 'You won’t receive requests')}>
                  <Toggle checked={store.online} onChange={store.setOnline} label="Online" tone="success" />
                </Line>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-extrabold">
                      <Clock className="size-4 text-ink-2" /> {t('Working hours')}
                    </p>
                    <span dir="auto" className={cn('num rounded-pill px-2.5 py-1 text-[11px] font-extrabold', onShift ? 'bg-success-soft text-success' : 'bg-canvas text-muted')}>
                      {t(onShift ? 'On shift now · {h} h' : 'Off shift now · {h} h', { h: shiftHours(s) })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TimeField label={t('Shift starts')} value={s.shiftStart} onChange={(v) => updateSettings({ shiftStart: v })} />
                    <TimeField label={t('Shift ends')} value={s.shiftEnd} onChange={(v) => updateSettings({ shiftEnd: v })} />
                  </div>
                  <p dir="auto" className="mt-2 text-xs font-medium text-muted">{t('Emergency requests can still reach you outside these hours if you stay online.')}</p>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="flex items-center gap-2 text-sm font-extrabold">
                      <Radar className="size-4 text-ink-2" /> {t('Service radius')}
                    </p>
                    <span className="num text-sm font-extrabold text-brand">{s.radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={25}
                    value={s.radiusKm}
                    onChange={(e) => updateSettings({ radiusKm: Number(e.target.value) })}
                    className="h-11 w-full accent-[#2547d0]"
                    aria-label="Service radius in kilometres"
                  />
                  <div className="num flex justify-between text-[11px] font-semibold text-faint">
                    <span>3 km</span>
                    <span>25 km</span>
                  </div>
                  <p dir="auto" className="num mt-2 text-xs font-medium text-muted">
                    {t(
                      waiting === 0 ? 'No waiting requests within {km} km' : waiting === 1 ? '{n} waiting request within {km} km' : '{n} waiting requests within {km} km',
                      { n: waiting, km: s.radiusKm }
                    )}
                  </p>
                </div>
              </Card>
            </section>

            <section>
              <SectionTitle>{t('Language')}</SectionTitle>
              <Card className="p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                  <Languages className="size-4 text-ink-2" /> {t('App language')}
                </p>
                <Segmented
                  value={s.language}
                  onChange={(v) => updateSettings({ language: v })}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'हिन्दी', label: 'हिन्दी' },
                    { value: 'తెలుగు', label: 'తెలుగు' },
                    { value: 'اردو', label: 'اردو' },
                  ]}
                />
              </Card>
            </section>
          </div>

          <div className="space-y-5">
            <section>
              <SectionTitle>{t('Notifications')}</SectionTitle>
              <Card className="divide-y divide-line">
                <Line icon={<Bell className="size-4" />} title={t('New service requests')}>
                  <Toggle checked={s.notify.requests} onChange={(v) => notify('requests', v)} label="New requests" />
                </Line>
                <Line icon={<Bell className="size-4" />} title={t('Emergency requests')} sub={t('Full-screen alert with sound')}>
                  <Toggle checked={s.notify.emergency} onChange={(v) => notify('emergency', v)} label="Emergency" />
                </Line>
                <Line icon={<Bell className="size-4" />} title={t('Schedule changes & cancellations')}>
                  <Toggle checked={s.notify.schedule} onChange={(v) => notify('schedule', v)} label="Schedule" />
                </Line>
                <Line icon={<Bell className="size-4" />} title={t('Payments & ratings')}>
                  <Toggle checked={s.notify.payments} onChange={(v) => notify('payments', v)} label="Payments" />
                </Line>
                <Line icon={<Bell className="size-4" />} title={t('Alert sound')}>
                  <Toggle checked={s.notify.sound} onChange={(v) => notify('sound', v)} label="Sound" />
                </Line>
              </Card>
            </section>

            <section>
              <SectionTitle>{t('Account')}</SectionTitle>
              <Card className="divide-y divide-line">
                <Nav icon={<QrIcon className="size-4" />} title={t('My payment scanner')} sub={t('Your UPI QR for customers to scan')} onClick={() => setSheet('scanner')} />
                <Nav icon={<Landmark className="size-4" />} title={t('Payment settings')} sub={`${s.bank} · ${s.upi}`} onClick={() => setSheet('payment')} />
                <Nav icon={<UserRound className="size-4" />} title={t('Account settings')} sub={t('Password, fingerprint, devices')} onClick={() => setSheet('account')} />
                <Link href="/support" className="flex items-center gap-3 p-4 hover:bg-canvas">
                  <span className="grid size-9 place-items-center rounded-lg bg-canvas text-ink-2">
                    <Headset className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-extrabold">{t('Help & Support')}</span>
                  <ChevronRight className="size-4 text-faint" />
                </Link>
                <Nav
                  icon={<RotateCcw className="size-4" />}
                  title={t('Reset demo data')}
                  sub={t('Reload today’s sample jobs')}
                  onClick={() => {
                    store.resetDemo()
                    flash('Demo data reset')
                  }}
                />
              </Card>
            </section>
            <button
              type="button"
              onClick={() => setSheet('logout')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-danger/30 bg-card text-base font-extrabold text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-5" /> {t('Logout')}
            </button>
            <p className="text-center text-xs font-semibold text-faint">24X7 Technician Partner · v0.1.0</p>
          </div>
        </div>
      </Page>

      <PaymentSheet
        open={sheet === 'payment'}
        onClose={() => setSheet(null)}
        onSave={(bank, upi) => {
          updateSettings({ bank, upi })
          setSheet(null)
          flash('Payment settings saved')
        }}
      />

      <ScannerSheet open={sheet === 'scanner'} onClose={() => setSheet(null)} onEdit={() => setSheet('payment')} flash={flash} />

      <Sheet open={sheet === 'account'} onClose={() => setSheet(null)} title={t('Account settings')}>
        <div className="-mx-4 -my-4 divide-y divide-line">
          <Nav
            icon={<KeyRound className="size-4" />}
            title="Change password"
            sub={passwordAge <= 0 ? 'Changed today' : `Last changed ${passwordAge} day${passwordAge === 1 ? '' : 's'} ago`}
            onClick={() => setSheet('password')}
          />
          <Line icon={<Smartphone className="size-4" />} title="Fingerprint sign-in" sub={s.fingerprint ? 'On for this device' : 'Off · sign in with OTP'}>
            <Toggle
              checked={s.fingerprint}
              onChange={(v) => {
                updateSettings({ fingerprint: v })
                flash(`Fingerprint sign-in ${v ? 'on' : 'off'}`)
              }}
              label="Fingerprint sign-in"
            />
          </Line>
          <Nav
            icon={<Smartphone className="size-4" />}
            title="Signed-in devices"
            sub={`${s.devices.length + 1} active · this phone${s.devices.length ? ` + ${s.devices.length} more` : ''}`}
            onClick={() => setSheet('devices')}
          />
        </div>
      </Sheet>

      <PasswordSheet
        open={sheet === 'password'}
        onClose={() => setSheet('account')}
        onSave={() => {
          updateSettings({ passwordChangedAt: new Date().toISOString() })
          setSheet('account')
          flash('Password updated')
        }}
      />

      <Sheet open={sheet === 'devices'} onClose={() => setSheet('account')} title="Signed-in devices">
        <ul className="-mx-4 -my-4 divide-y divide-line">
          <li className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
              <Smartphone className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">This phone</p>
              <p className="text-xs font-medium text-success">Active now</p>
            </div>
          </li>
          {s.devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
                <Smartphone className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{d.name}</p>
                <p className="text-xs font-medium text-muted">Last active {ago(d.lastActive)}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  updateSettings({ devices: s.devices.filter((x) => x.id !== d.id) })
                  flash(`Signed out ${d.name.split(' · ')[0]}`)
                }}
              >
                Sign out
              </Button>
            </li>
          ))}
        </ul>
        {s.devices.length === 0 && <p className="mt-6 text-center text-xs font-medium text-muted">No other device is signed in to your account.</p>}
      </Sheet>

      <Sheet open={sheet === 'logout'} onClose={() => setSheet(null)} title="Log out?">
        <p className="text-sm text-muted">You’ll go offline and stop receiving requests. Jobs in progress stay assigned to you.</p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => setSheet(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            onClick={() => {
              store.setOnline(false)
              store.signOut()
              router.replace('/login')
            }}
          >
            {t('Logout')}
          </Button>
        </div>
      </Sheet>

      {toast && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+0.75rem)] z-[80] flex justify-center px-4">
          <p className="animate-slide-up flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-float">
            <CircleCheck className="size-4 text-[#4ade80]" /> {toast}
          </p>
        </div>
      )}
    </>
  )
}

/**
 * The technician's own counter scanner: a static UPI QR any customer can scan
 * and pay into, the way a shop keeps one by the till. Bills show a QR with the
 * amount filled in; this one leaves the amount to the customer.
 */
function ScannerSheet({ open, onClose, onEdit, flash }: { open: boolean; onClose: () => void; onEdit: () => void; flash: (m: string) => void }) {
  const { settings, tech } = useStore()
  const link = upiLink({ upi: settings.upi, name: tech.name })
  const file = `${tech.name.replace(/\s+/g, '-')}-UPI-QR.png`

  return (
    <Sheet open={open} onClose={onClose} title="My payment scanner">
      <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center gap-3 bg-brand-ink px-4 py-3 text-white">
          <Avatar name={tech.name} photo={tech.photo} size={36} className="ring-2 ring-white/20" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold leading-tight">{tech.name}</p>
            <p className="num truncate text-[11px] font-semibold text-white/60">{tech.id}</p>
          </div>
          <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-extrabold tracking-[0.14em]">UPI</span>
        </div>

        <div className="px-6 pb-3 pt-5">
          <QrCode text={link} className="mx-auto aspect-square w-full max-w-[216px]" label={`UPI QR for ${settings.upi}`} />
          <p className="mt-3 text-center text-[11px] font-semibold text-muted">Scan with GPay, PhonePe, Paytm or any UPI app</p>
        </div>

        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-faint">UPI ID</p>
            <p className="num truncate text-sm font-extrabold">{settings.upi}</p>
          </div>
          <button type="button" onClick={onEdit} className="h-9 shrink-0 rounded-lg px-3 text-sm font-bold text-brand hover:bg-brand-soft">
            Change
          </button>
        </div>
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2.5">
        <Button
          variant="secondary"
          onClick={async () => {
            await downloadQr(link, file)
            flash('Scanner saved as PNG')
          }}
        >
          <Download className="size-4" /> Download
        </Button>
        <Button
          onClick={async () => {
            try {
              if (navigator.share) {
                await navigator.share({ title: `Pay ${tech.name}`, text: `Pay ${tech.name} on UPI: ${settings.upi}` })
                return
              }
              await navigator.clipboard.writeText(settings.upi)
              flash('UPI ID copied')
            } catch {
              /* share sheet dismissed */
            }
          }}
        >
          <Share2 className="size-4" /> Share
        </Button>
      </div>
    </Sheet>
  )
}

/** Edits a draft, so closing the sheet without saving leaves the account as it was. */
function PaymentSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (bank: string, upi: string) => void }) {
  const { settings } = useStore()
  const [bank, setBank] = useState(settings.bank)
  const [upi, setUpi] = useState(settings.upi)
  const [wasOpen, setWasOpen] = useState(open)
  // Reset the draft to the saved values each time the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setBank(settings.bank)
      setUpi(settings.upi)
    }
  }
  const upiOk = /^[\w.-]{2,}@[a-z]{2,}$/i.test(upi.trim())
  const ok = bank.trim().length > 2 && upiOk

  return (
    <Sheet open={open} onClose={onClose} title="Payment settings">
      <div className="space-y-4">
        <Field label="Payout bank account">
          <input value={bank} onChange={(e) => setBank(e.target.value)} className={inputClass} />
        </Field>
        <Field label="UPI ID for collections" hint={upi && !upiOk ? <span className="text-danger">Enter a UPI ID like name@okhdfc</span> : 'Shown to customers on the bill QR'}>
          <input value={upi} onChange={(e) => setUpi(e.target.value)} className={inputClass} autoCapitalize="none" autoCorrect="off" />
        </Field>
        <Button size="lg" className="w-full" disabled={!ok} onClick={() => onSave(bank.trim(), upi.trim())}>
          Save
        </Button>
      </div>
    </Sheet>
  )
}

function PasswordSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    setCurrent('')
    setNext('')
    setAgain('')
  }
  const error =
    next && next.length < 8 ? 'Use at least 8 characters' : next && current && next === current ? 'Pick a password you haven’t used here' : again && again !== next ? 'Passwords don’t match' : null
  const ok = current.length > 0 && next.length >= 8 && next === again && next !== current

  return (
    <Sheet open={open} onClose={onClose} title="Change password">
      <div className="space-y-4">
        <Field label="Current password">
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        </Field>
        <Field label="New password">
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Confirm new password" hint={error ? <span className="text-danger">{error}</span> : 'At least 8 characters'}>
          <input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className={inputClass} />
        </Field>
        <Button size="lg" className="w-full" disabled={!ok} onClick={onSave}>
          Update password
        </Button>
      </div>
    </Sheet>
  )
}

function Line({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        {sub && <p className="truncate text-xs font-medium text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Nav({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left hover:bg-canvas">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold">{title}</span>
        {sub && <span className="block truncate text-xs font-medium text-muted">{sub}</span>}
      </span>
      <ChevronRight className="size-4 text-faint" />
    </button>
  )
}
