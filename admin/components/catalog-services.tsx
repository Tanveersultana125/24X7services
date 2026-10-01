'use client'

import { useState } from 'react'
import { ImagePlus, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, inr, type Appliance, type Brand } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'
import { DraftDot, NumberInput } from './catalog-shared'
import { ApplianceGlyph } from './glyphs'
import { MediaPicker, MediaThumb } from './media'
import { useToast } from './toast'
import { Button, Card, Chip, Field, Modal, Toggle, inputClass } from './ui'

/** One card per appliance line: what customers see, and the services under it. */
export function ServicesTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('catalog', 'edit')
  const [picking, setPicking] = useState<Appliance | null>(null)
  const [editing, setEditing] = useState<Appliance | null>(null)
  const [adding, setAdding] = useState<Appliance | null>(null)

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {APPLIANCES.map((a) => {
          const s = store.catalog.services[a]
          const live = store.catalogPublished.services[a]
          const draft = JSON.stringify(s) !== JSON.stringify(live)
          const from = Math.min(...s.types.filter((t) => t.enabled).map((t) => t.price), Infinity)
          return (
            <Card key={a} className={cn('flex flex-col overflow-hidden', !s.enabled && 'opacity-80')}>
              <div className="relative">
                <MediaThumb src={s.image} className="aspect-[16/7] w-full" cover />
                {canEdit && (
                  <Button size="xs" variant="secondary" className="absolute bottom-3 right-3 bg-card/95" onClick={() => setPicking(a)}>
                    <ImagePlus /> Change image
                  </Button>
                )}
                {!s.enabled && (
                  <span className="absolute left-3 top-3">
                    <Chip tone="neutral" className="bg-card">
                      Hidden from customers
                    </Chip>
                  </span>
                )}
              </div>
              <div className="flex items-start gap-3 px-5 pt-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <ApplianceGlyph appliance={a} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-extrabold">
                    {s.name} <DraftDot show={draft} />
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium leading-snug text-muted">{s.description}</p>
                </div>
                <Toggle
                  checked={s.enabled}
                  label={`${s.name} enabled`}
                  onChange={(v) => {
                    if (!canEdit) return
                    store.updateCatalog(
                      (c) => {
                        c.services[a].enabled = v
                        return c
                      },
                      { action: v ? 'Enabled service' : 'Disabled service', target: s.name, old: v ? 'Disabled' : 'Enabled', new: v ? 'Enabled' : 'Disabled' }
                    )
                    toast(`${s.name} ${v ? 'enabled' : 'disabled'} in the draft`)
                  }}
                />
              </div>
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-faint">
                  Service types · from <span className="num text-ink-2">{Number.isFinite(from) ? inr(from) : '—'}</span>
                </p>
                {canEdit && (
                  <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                    <Pencil className="size-3" /> Edit details
                  </button>
                )}
              </div>
              <ul className="flex-1 divide-y divide-line border-t border-line">
                {s.types.map((t, i) => {
                  const was = live.types.find((x) => x.name === t.name)
                  return (
                    <li key={t.name} className="flex items-center gap-3 px-5 py-2">
                      <Toggle
                        size="sm"
                        checked={t.enabled}
                        label={`${t.name} offered`}
                        onChange={(v) => {
                          if (!canEdit) return
                          store.updateCatalog(
                            (c) => {
                              c.services[a].types[i]!.enabled = v
                              return c
                            },
                            { action: v ? 'Enabled service type' : 'Disabled service type', target: `${s.name} · ${t.name}`, old: v ? 'Disabled' : 'Enabled', new: v ? 'Enabled' : 'Disabled' }
                          )
                        }}
                      />
                      <span className={cn('min-w-0 flex-1 truncate text-sm font-semibold', !t.enabled && 'text-faint line-through')}>{t.name}</span>
                      <NumberInput
                        className="w-28"
                        label={`${s.name} ${t.name} price`}
                        value={t.price}
                        disabled={!canEdit}
                        changed={!was || was.price !== t.price}
                        onCommit={(v) => {
                          store.updateCatalog(
                            (c) => {
                              c.services[a].types[i]!.price = v
                              return c
                            },
                            { action: 'Changed price', target: `${s.name} · ${t.name}`, old: inr(t.price), new: inr(v) }
                          )
                          toast(`${s.name} ${t.name}: ${inr(t.price)} → ${inr(v)}`)
                        }}
                      />
                      {canEdit && (
                        <button
                          type="button"
                          aria-label={`Remove ${t.name}`}
                          onClick={() => {
                            store.updateCatalog(
                              (c) => {
                                c.services[a].types.splice(i, 1)
                                return c
                              },
                              { action: 'Removed service type', target: `${s.name} · ${t.name}`, old: inr(t.price) }
                            )
                            toast(`${t.name} removed from ${s.name}`)
                          }}
                          className="grid size-8 shrink-0 place-items-center rounded-md text-faint hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
              {canEdit && (
                <div className="border-t border-line px-5 py-3">
                  <Button size="sm" variant="ghost" className="-ml-2" onClick={() => setAdding(a)}>
                    <Plus /> Add service type
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <MediaPicker
        open={!!picking}
        onClose={() => setPicking(null)}
        category="service"
        title={picking ? `${APPLIANCE_LABEL[picking]} image` : ''}
        onPick={(m) => {
          if (!picking) return
          const s = store.catalog.services[picking]
          store.updateCatalog(
            (c) => {
              c.services[picking].image = m.url
              return c
            },
            { action: 'Changed service image', target: s.name, old: s.image.split('/').pop(), new: m.name }
          )
          toast(`${s.name} image changed in the draft`)
        }}
      />
      {editing && <EditService appliance={editing} onClose={() => setEditing(null)} />}
      {adding && <AddType appliance={adding} onClose={() => setAdding(null)} />}
    </>
  )
}

function EditService({ appliance, onClose }: { appliance: Appliance; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const s = store.catalog.services[appliance]
  const [name, setName] = useState(s.name)
  const [desc, setDesc] = useState(s.description)
  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${APPLIANCE_LABEL[appliance]}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || !desc.trim() || (name === s.name && desc === s.description)}
            onClick={() => {
              store.updateCatalog(
                (c) => {
                  c.services[appliance].name = name.trim()
                  c.services[appliance].description = desc.trim()
                  return c
                },
                {
                  action: 'Edited service details',
                  target: APPLIANCE_LABEL[appliance],
                  old: name !== s.name ? s.name : 'description',
                  new: name !== s.name ? name.trim() : 'updated',
                }
              )
              toast(`${name.trim()} updated in the draft`)
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Name shown to customers">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Description" hint={`${desc.length}/180`}>
          <textarea value={desc} maxLength={180} rows={3} onChange={(e) => setDesc(e.target.value)} className={inputClass} />
        </Field>
      </div>
    </Modal>
  )
}

function AddType({ appliance, onClose }: { appliance: Appliance; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const s = store.catalog.services[appliance]
  const [name, setName] = useState('')
  const [price, setPrice] = useState('499')
  const taken = s.types.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())
  return (
    <Modal
      open
      onClose={onClose}
      title={`Add service type · ${s.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || taken || !(Number(price) > 0)}
            onClick={() => {
              store.updateCatalog(
                (c) => {
                  c.services[appliance].types.push({ name: name.trim(), price: Number(price), enabled: true })
                  return c
                },
                { action: 'Added service type', target: `${s.name} · ${name.trim()}`, new: inr(Number(price)) }
              )
              toast(`${name.trim()} added to ${s.name}`)
              onClose()
            }}
          >
            <Plus /> Add
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Service name" className="col-span-2" hint={taken ? <span className="font-semibold text-danger">Already offered</span> : 'e.g. Annual maintenance, Stand fitting'}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Annual maintenance" className={inputClass} />
        </Field>
        <Field label="Starting price (₹)" className="col-span-2">
          <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputClass} num`} />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- Brands */

/** The four brands the network is certified for: logo, artwork, and what each covers. */
export function BrandsTab() {
  const store = useStore()
  const toast = useToast()
  const canEdit = store.can('catalog', 'edit')
  const [picking, setPicking] = useState<{ brand: Brand; field: 'logo' | 'image' } | null>(null)
  const [managing, setManaging] = useState<Brand | null>(null)
  const [tagline, setTagline] = useState<Brand | null>(null)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {BRANDS.map((b) => {
          const d = store.catalog.brands[b]
          const draft = JSON.stringify(d) !== JSON.stringify(store.catalogPublished.brands[b])
          const covered = APPLIANCES.filter((a) => store.settings.matrix[b][a])
          return (
            <Card key={b} className={cn('flex flex-col overflow-hidden', !d.enabled && 'opacity-80')}>
              <div className="relative">
                <MediaThumb src={d.image} className="aspect-[16/8] w-full" cover />
                <span className="absolute bottom-3 left-3 grid h-12 w-28 place-items-center rounded-lg bg-card p-2 shadow-card ring-1 ring-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.logo} alt={`${d.name} logo`} className="max-h-full max-w-full object-contain" />
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 px-5 pt-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-extrabold">
                    {BRAND_LABEL[b]} <DraftDot show={draft} />
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-medium text-muted">{d.tagline}</p>
                </div>
                <Toggle
                  checked={d.enabled}
                  label={`${d.name} enabled`}
                  onChange={(v) => {
                    if (!canEdit) return
                    store.updateCatalog(
                      (c) => {
                        c.brands[b].enabled = v
                        return c
                      },
                      { action: v ? 'Enabled brand' : 'Disabled brand', target: d.name, old: v ? 'Disabled' : 'Enabled', new: v ? 'Enabled' : 'Disabled' }
                    )
                    toast(`${d.name} ${v ? 'enabled' : 'disabled'} in the draft`)
                  }}
                />
              </div>
              <div className="px-5 pt-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-faint">
                  Supported services · {covered.length}/{APPLIANCES.length}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {APPLIANCES.map((a) => (
                    <span
                      key={a}
                      title={APPLIANCE_LABEL[a]}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-md border px-1.5 text-[11px] font-bold',
                        covered.includes(a) ? 'border-brand/20 bg-brand-soft text-brand' : 'border-line bg-canvas text-faint line-through'
                      )}
                    >
                      <ApplianceGlyph appliance={a} className="size-3.5" />
                      {APPLIANCE_LABEL[a] === 'Washing Machine' ? 'Washer' : APPLIANCE_LABEL[a] === 'Refrigerator' ? 'Fridge' : APPLIANCE_LABEL[a]}
                    </span>
                  ))}
                </div>
              </div>
              {canEdit && (
                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-line p-4 pt-3 [&>button]:mt-1">
                  <Button size="xs" variant="secondary" onClick={() => setPicking({ brand: b, field: 'logo' })}>
                    <ImagePlus /> Edit logo
                  </Button>
                  <Button size="xs" variant="secondary" onClick={() => setPicking({ brand: b, field: 'image' })}>
                    <ImagePlus /> Edit image
                  </Button>
                  <Button size="xs" variant="secondary" onClick={() => setTagline(b)}>
                    <Pencil /> Tagline
                  </Button>
                  <Button size="xs" variant="secondary" onClick={() => setManaging(b)}>
                    <Settings2 /> Services
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <MediaPicker
        open={!!picking}
        onClose={() => setPicking(null)}
        category={picking?.field === 'logo' ? 'brand' : undefined}
        title={picking ? `${BRAND_LABEL[picking.brand]} ${picking.field}` : ''}
        onPick={(m) => {
          if (!picking) return
          const { brand, field } = picking
          const before = store.catalog.brands[brand][field]
          store.updateCatalog(
            (c) => {
              c.brands[brand][field] = m.url
              return c
            },
            { action: field === 'logo' ? 'Replaced brand logo' : 'Replaced brand image', target: BRAND_LABEL[brand], old: before.split('/').pop(), new: m.name }
          )
          toast(`${BRAND_LABEL[brand]} ${field} changed in the draft`)
        }}
      />
      {managing && <ManageServices brand={managing} onClose={() => setManaging(null)} />}
      {tagline && <EditTagline brand={tagline} onClose={() => setTagline(null)} />}
    </>
  )
}

function EditTagline({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const d = store.catalog.brands[brand]
  const [v, setV] = useState(d.tagline)
  return (
    <Modal
      open
      onClose={onClose}
      title={`${d.name} tagline`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!v.trim() || v === d.tagline}
            onClick={() => {
              store.updateCatalog(
                (c) => {
                  c.brands[brand].tagline = v.trim()
                  return c
                },
                { action: 'Edited brand tagline', target: d.name, old: d.tagline, new: v.trim() }
              )
              toast('Tagline updated in the draft')
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <Field label="Shown under the logo in the customer app" hint={`${v.length}/60`}>
        <input value={v} maxLength={60} onChange={(e) => setV(e.target.value)} className={inputClass} />
      </Field>
    </Modal>
  )
}

/** Which appliance lines a brand covers — the same switches as the Availability tab. */
function ManageServices({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const store = useStore()
  const toast = useToast()
  const row = store.settings.matrix[brand]
  return (
    <Modal
      open
      onClose={onClose}
      title={`${BRAND_LABEL[brand]} · supported services`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <p className="mb-3 text-sm font-medium text-muted">Applies immediately: a switched-off line disappears from customer booking and from technician offers.</p>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {APPLIANCES.map((a) => (
          <li key={a} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand">
              <ApplianceGlyph appliance={a} className="size-4" />
            </span>
            <span className="flex-1 text-sm font-bold">{APPLIANCE_LABEL[a]}</span>
            <Toggle
              checked={row[a]}
              label={`${BRAND_LABEL[brand]} ${APPLIANCE_LABEL[a]}`}
              onChange={(v) => {
                store.updateSettings((s) => ({ matrix: { ...s.matrix, [brand]: { ...s.matrix[brand], [a]: v } } }))
                store.record({ module: 'catalog', action: v ? 'Enabled service' : 'Disabled service', target: `${BRAND_LABEL[brand]} ${APPLIANCE_LABEL[a]}`, old: v ? 'Disabled' : 'Enabled', new: v ? 'Enabled' : 'Disabled' })
                toast(`${BRAND_LABEL[brand]} ${APPLIANCE_LABEL[a]} ${v ? 'enabled' : 'disabled'}`)
              }}
            />
          </li>
        ))}
      </ul>
    </Modal>
  )
}
