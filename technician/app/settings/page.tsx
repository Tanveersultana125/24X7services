'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, ChevronRight, Clock, Headset, KeyRound, Languages, Landmark, LogOut, Power, Radar, RotateCcw, Smartphone, UserRound } from 'lucide-react'
import { Button, Card, Field, Page, ScreenHeader, SectionTitle, Segmented, Sheet, Toggle, inputClass } from '@/components/ui'
import { REQUIRE_LOGIN, useStore } from '@/lib/store'
import type { Settings } from '@/lib/types'

export default function SettingsPage() {
  const store = useStore()
  const router = useRouter()
  const { settings: s, updateSettings } = store
  const [sheet, setSheet] = useState<null | 'payment' | 'account' | 'logout'>(null)
  const notify = (k: keyof Settings['notify'], v: boolean) => updateSettings({ notify: { ...s.notify, [k]: v } })

  return (
    <>
      <ScreenHeader back="/profile" title="Settings" />
      <Page className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <section>
              <SectionTitle>Availability</SectionTitle>
              <Card className="divide-y divide-line">
                <Line icon={<Power className="size-4" />} title="Online for new requests" sub={store.online ? 'Dispatch can send you jobs' : 'You won’t receive requests'}>
                  <Toggle checked={store.online} onChange={store.setOnline} label="Online" tone="success" />
                </Line>
                <div className="p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                    <Clock className="size-4 text-ink-2" /> Working hours
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Shift starts">
                      <input type="time" value={s.shiftStart} onChange={(e) => updateSettings({ shiftStart: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Shift ends">
                      <input type="time" value={s.shiftEnd} onChange={(e) => updateSettings({ shiftEnd: e.target.value })} className={inputClass} />
                    </Field>
                  </div>
                  <p className="mt-2 text-xs font-medium text-muted">Emergency requests can still reach you outside these hours if you stay online.</p>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="flex items-center gap-2 text-sm font-extrabold">
                      <Radar className="size-4 text-ink-2" /> Service radius
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
                </div>
              </Card>
            </section>

            <section>
              <SectionTitle>Language</SectionTitle>
              <Card className="p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
                  <Languages className="size-4 text-ink-2" /> App language
                </p>
                <Segmented
                  value={s.language}
                  onChange={(v) => updateSettings({ language: v })}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'हिन्दी', label: 'हिन्दी' },
                    { value: 'తెలుగు', label: 'తెలుగు' },
                  ]}
                />
              </Card>
            </section>
          </div>

          <div className="space-y-5">
            <section>
              <SectionTitle>Notifications</SectionTitle>
              <Card className="divide-y divide-line">
                <Line icon={<Bell className="size-4" />} title="New service requests">
                  <Toggle checked={s.notify.requests} onChange={(v) => notify('requests', v)} label="New requests" />
                </Line>
                <Line icon={<Bell className="size-4" />} title="Emergency requests" sub="Full-screen alert with sound">
                  <Toggle checked={s.notify.emergency} onChange={(v) => notify('emergency', v)} label="Emergency" />
                </Line>
                <Line icon={<Bell className="size-4" />} title="Schedule changes & cancellations">
                  <Toggle checked={s.notify.schedule} onChange={(v) => notify('schedule', v)} label="Schedule" />
                </Line>
                <Line icon={<Bell className="size-4" />} title="Payments & ratings">
                  <Toggle checked={s.notify.payments} onChange={(v) => notify('payments', v)} label="Payments" />
                </Line>
                <Line icon={<Bell className="size-4" />} title="Alert sound">
                  <Toggle checked={s.notify.sound} onChange={(v) => notify('sound', v)} label="Sound" />
                </Line>
              </Card>
            </section>

            <section>
              <SectionTitle>Account</SectionTitle>
              <Card className="divide-y divide-line">
                <Nav icon={<Landmark className="size-4" />} title="Payment settings" sub={`${s.bank} · ${s.upi}`} onClick={() => setSheet('payment')} />
                <Nav icon={<UserRound className="size-4" />} title="Account settings" sub="Password, fingerprint, devices" onClick={() => setSheet('account')} />
                <Link href="/support" className="flex items-center gap-3 p-4 hover:bg-canvas">
                  <span className="grid size-9 place-items-center rounded-lg bg-canvas text-ink-2">
                    <Headset className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-extrabold">Help &amp; Support</span>
                  <ChevronRight className="size-4 text-faint" />
                </Link>
                <Nav icon={<RotateCcw className="size-4" />} title="Reset demo data" sub="Reload today’s sample jobs" onClick={() => store.resetDemo()} />
              </Card>
            </section>

            {REQUIRE_LOGIN && (
            <button
              type="button"
              onClick={() => setSheet('logout')}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-danger/30 bg-card text-base font-extrabold text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-5" /> Logout
            </button>
            )}
            <p className="text-center text-xs font-semibold text-faint">24X7 Technician Partner · v0.1.0</p>
          </div>
        </div>
      </Page>

      <Sheet open={sheet === 'payment'} onClose={() => setSheet(null)} title="Payment settings">
        <div className="space-y-4">
          <Field label="Payout bank account">
            <input value={s.bank} onChange={(e) => updateSettings({ bank: e.target.value })} className={inputClass} />
          </Field>
          <Field label="UPI ID for collections" hint="Shown to customers on the bill QR">
            <input value={s.upi} onChange={(e) => updateSettings({ upi: e.target.value })} className={inputClass} />
          </Field>
          <Button size="lg" className="w-full" onClick={() => setSheet(null)}>
            Save
          </Button>
        </div>
      </Sheet>

      <Sheet open={sheet === 'account'} onClose={() => setSheet(null)} title="Account settings">
        <div className="divide-y divide-line">
          <Line icon={<KeyRound className="size-4" />} title="Change password" sub="Last changed 42 days ago">
            <ChevronRight className="size-4 text-faint" />
          </Line>
          <Line icon={<Smartphone className="size-4" />} title="Fingerprint sign-in" sub="This device">
            <Toggle checked onChange={() => {}} label="Fingerprint sign-in" />
          </Line>
          <Line icon={<Smartphone className="size-4" />} title="Signed-in devices" sub="1 active · this phone">
            <ChevronRight className="size-4 text-faint" />
          </Line>
        </div>
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
            Logout
          </Button>
        </div>
      </Sheet>
    </>
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
