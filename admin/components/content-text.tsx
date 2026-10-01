'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, MessageSquareQuote, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useStore } from '@/lib/store'
import type { Faq, Testimonial } from '@/lib/types'
import { useToast } from './toast'
import { Button, Card, CardHeader, Chip, Empty, Field, inputClass, Modal, Toggle } from './ui'

const nextId = (prefix: string, ids: string[]) => `${prefix}-${Math.max(0, ...ids.map((x) => Number(x.split('-')[1]) || 0)) + 1}`

/* ------------------------------------------------------------------ FAQs */

export function FaqsTab() {
  const store = useStore()
  const toast = useToast()
  const can = { create: store.can('content', 'create'), edit: store.can('content', 'edit'), del: store.can('content', 'delete') }
  const faqs = store.content.faqs
  const [form, setForm] = useState<Faq | null>(null)
  const [deleting, setDeleting] = useState<Faq | null>(null)

  const move = (i: number, d: -1 | 1) => {
    const f = faqs[i]!
    store.updateContent(
      (c) => {
        const list = [...c.faqs]
        const [x] = list.splice(i, 1)
        list.splice(i + d, 0, x!)
        return { ...c, faqs: list }
      },
      { action: 'Reordered FAQ', target: f.q, old: `#${i + 1}`, new: `#${i + 1 + d}` }
    )
  }

  return (
    <Card>
      <CardHeader
        title="FAQs"
        sub={`${faqs.filter((f) => f.visible).length} of ${faqs.length} shown in the customer app, in this order`}
        action={
          <Button size="sm" disabled={!can.create} onClick={() => setForm({ id: '', q: '', a: '', category: 'Visits', visible: true })}>
            <Plus /> Add FAQ
          </Button>
        }
      />
      <ol className="divide-y divide-line">
        {faqs.map((f, i) => (
          <li key={f.id} className={cn('flex gap-3 px-5 py-3.5', !f.visible && 'bg-canvas/50')}>
            <div className="flex shrink-0 flex-col">
              <button type="button" aria-label="Move up" disabled={!can.edit || i === 0} onClick={() => move(i, -1)} className="grid size-6 place-items-center rounded text-faint hover:bg-canvas hover:text-ink disabled:opacity-30">
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={!can.edit || i === faqs.length - 1}
                onClick={() => move(i, 1)}
                className="grid size-6 place-items-center rounded text-faint hover:bg-canvas hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>
            <div className={cn('min-w-0 flex-1', !f.visible && 'opacity-60')}>
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                {f.q} <Chip tone="neutral" dot={false} className="h-5 px-1.5 text-[10px]">{f.category}</Chip>
                {!f.visible && <Chip tone="neutral">Hidden</Chip>}
              </p>
              <p className="mt-0.5 text-sm font-medium text-muted">{f.a}</p>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <Toggle
                size="sm"
                checked={f.visible}
                label={`Show “${f.q}”`}
                onChange={(v) => {
                  if (!can.edit) return
                  store.updateContent((c) => ({ ...c, faqs: c.faqs.map((x) => (x.id === f.id ? { ...x, visible: v } : x)) }), {
                    action: v ? 'Showed FAQ' : 'Hid FAQ',
                    target: f.q,
                    old: v ? 'Hidden' : 'Visible',
                    new: v ? 'Visible' : 'Hidden',
                  })
                  toast(`FAQ ${v ? 'shown' : 'hidden'} in draft`)
                }}
              />
              <button type="button" aria-label="Edit FAQ" disabled={!can.edit} onClick={() => setForm(f)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-canvas hover:text-ink disabled:opacity-40">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" aria-label="Delete FAQ" disabled={!can.del} onClick={() => setDeleting(f)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {form && (
        <FaqForm
          initial={form}
          onClose={() => setForm(null)}
          onSave={(f) => {
            if (!f.id) {
              const nf = { ...f, id: nextId('FQ', faqs.map((x) => x.id)) }
              store.updateContent((c) => ({ ...c, faqs: [...c.faqs, nf] }), { action: 'Added FAQ', target: nf.q })
              toast('FAQ added to draft')
            } else {
              const before = faqs.find((x) => x.id === f.id)!
              store.updateContent((c) => ({ ...c, faqs: c.faqs.map((x) => (x.id === f.id ? f : x)) }), {
                action: 'Edited FAQ',
                target: f.q,
                old: before.a !== f.a ? before.a : before.q !== f.q ? before.q : undefined,
                new: before.a !== f.a ? f.a : before.q !== f.q ? f.q : undefined,
              })
              toast('FAQ saved to draft')
            }
            setForm(null)
          }}
        />
      )}
      <ConfirmDelete
        open={!!deleting}
        what="FAQ"
        name={deleting?.q}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          store.updateContent((c) => ({ ...c, faqs: c.faqs.filter((x) => x.id !== deleting.id) }), { action: 'Deleted FAQ', target: deleting.q })
          toast('FAQ deleted from draft')
          setDeleting(null)
        }}
      />
    </Card>
  )
}

function FaqForm({ initial, onSave, onClose }: { initial: Faq; onSave: (f: Faq) => void; onClose: () => void }) {
  const [f, setF] = useState(initial)
  return (
    <Modal
      open
      onClose={onClose}
      title={initial.id ? 'Edit FAQ' : 'Add FAQ'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!f.q.trim() || !f.a.trim()} onClick={() => onSave({ ...f, q: f.q.trim(), a: f.a.trim() })}>
            Save to draft
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <Field label="Category">
          <input className={inputClass} list="faq-cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <datalist id="faq-cats">
            {['Visits', 'Prices', 'Warranty', 'Brands', 'Payments'].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Question">
          <input className={inputClass} value={f.q} maxLength={120} onChange={(e) => setF({ ...f, q: e.target.value })} />
        </Field>
        <Field label="Answer">
          <textarea className={inputClass} rows={4} value={f.a} maxLength={500} onChange={(e) => setF({ ...f, a: e.target.value })} />
        </Field>
        <label className="flex items-center justify-between text-sm font-semibold">
          Visible to customers
          <Toggle checked={f.visible} label="Visible" onChange={(v) => setF({ ...f, visible: v })} />
        </label>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------- Testimonials */

export function TestimonialsTab() {
  const store = useStore()
  const toast = useToast()
  const can = { create: store.can('content', 'create'), edit: store.can('content', 'edit'), del: store.can('content', 'delete') }
  const list = store.content.testimonials
  const [form, setForm] = useState<Testimonial | null>(null)
  const [deleting, setDeleting] = useState<Testimonial | null>(null)
  return (
    <Card>
      <CardHeader
        title="Testimonials"
        sub={`${list.filter((t) => t.visible).length} shown on the homepage`}
        action={
          <Button size="sm" disabled={!can.create} onClick={() => setForm({ id: '', name: '', area: '', appliance: '', rating: 5, text: '', visible: true })}>
            <Plus /> Add testimonial
          </Button>
        }
      />
      {list.length === 0 ? (
        <Empty icon={<MessageSquareQuote />} title="No testimonials yet" />
      ) : (
        <ul className="grid gap-4 p-5 md:grid-cols-2">
          {list.map((t) => (
            <li key={t.id} className={cn('flex flex-col rounded-card border border-line p-4', !t.visible && 'bg-canvas/50')}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex gap-0.5" aria-label={`${t.rating} stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('size-3.5', i < t.rating ? 'fill-warning text-warning' : 'text-line-strong')} />
                  ))}
                </span>
                <Toggle
                  size="sm"
                  checked={t.visible}
                  label={`Show ${t.name}`}
                  onChange={(v) => {
                    if (!can.edit) return
                    store.updateContent((c) => ({ ...c, testimonials: c.testimonials.map((x) => (x.id === t.id ? { ...x, visible: v } : x)) }), {
                      action: v ? 'Showed testimonial' : 'Hid testimonial',
                      target: t.name,
                      old: v ? 'Hidden' : 'Visible',
                      new: v ? 'Visible' : 'Hidden',
                    })
                    toast(`Testimonial ${v ? 'shown' : 'hidden'} in draft`)
                  }}
                />
              </div>
              <p className={cn('mt-2 flex-1 text-sm font-medium text-ink-2', !t.visible && 'opacity-60')}>“{t.text}”</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted">
                  <span className="font-bold text-ink">{t.name}</span> · {t.area} · {t.appliance}
                </p>
                <span className="flex shrink-0 gap-1">
                  <button type="button" aria-label="Edit testimonial" disabled={!can.edit} onClick={() => setForm(t)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-canvas hover:text-ink disabled:opacity-40">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" aria-label="Delete testimonial" disabled={!can.del} onClick={() => setDeleting(t)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-40">
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {form && (
        <TestimonialForm
          initial={form}
          onClose={() => setForm(null)}
          onSave={(t) => {
            if (!t.id) {
              const nt = { ...t, id: nextId('TS', list.map((x) => x.id)) }
              store.updateContent((c) => ({ ...c, testimonials: [...c.testimonials, nt] }), { action: 'Added testimonial', target: nt.name })
              toast('Testimonial added to draft')
            } else {
              store.updateContent((c) => ({ ...c, testimonials: c.testimonials.map((x) => (x.id === t.id ? t : x)) }), { action: 'Edited testimonial', target: t.name })
              toast('Testimonial saved to draft')
            }
            setForm(null)
          }}
        />
      )}
      <ConfirmDelete
        open={!!deleting}
        what="testimonial"
        name={deleting?.name}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          store.updateContent((c) => ({ ...c, testimonials: c.testimonials.filter((x) => x.id !== deleting.id) }), { action: 'Deleted testimonial', target: deleting.name })
          toast('Testimonial deleted from draft')
          setDeleting(null)
        }}
      />
    </Card>
  )
}

function TestimonialForm({ initial, onSave, onClose }: { initial: Testimonial; onSave: (t: Testimonial) => void; onClose: () => void }) {
  const [t, setT] = useState(initial)
  return (
    <Modal
      open
      onClose={onClose}
      title={initial.id ? 'Edit testimonial' : 'Add testimonial'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!t.name.trim() || !t.text.trim()} onClick={() => onSave(t)}>
            Save to draft
          </Button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer name">
            <input className={inputClass} value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} />
          </Field>
          <Field label="Area">
            <input className={inputClass} value={t.area} onChange={(e) => setT({ ...t, area: e.target.value })} />
          </Field>
        </div>
        <Field label="Appliance" hint="e.g. Samsung AC">
          <input className={inputClass} value={t.appliance} onChange={(e) => setT({ ...t, appliance: e.target.value })} />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-bold text-ink-2">Rating</span>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={t.rating === n} aria-label={`${n} stars`} onClick={() => setT({ ...t, rating: n })} className="p-0.5">
                <Star className={cn('size-6', n <= t.rating ? 'fill-warning text-warning' : 'text-line-strong')} />
              </button>
            ))}
          </div>
        </div>
        <Field label="Testimonial">
          <textarea className={inputClass} rows={3} maxLength={280} value={t.text} onChange={(e) => setT({ ...t, text: e.target.value })} />
        </Field>
        <label className="flex items-center justify-between text-sm font-semibold">
          Visible on homepage
          <Toggle checked={t.visible} label="Visible" onChange={(v) => setT({ ...t, visible: v })} />
        </label>
      </div>
    </Modal>
  )
}

export function ConfirmDelete({ open, what, name, onClose, onConfirm, warning }: { open: boolean; what: string; name?: string; onClose: () => void; onConfirm: () => void; warning?: React.ReactNode }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete ${what}?`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">
        <span className="font-bold text-ink">{name}</span> will be removed{what === 'media file' ? ' from the library.' : ' from the draft. Customers keep seeing it until you publish.'}
      </p>
      {warning}
    </Modal>
  )
}
