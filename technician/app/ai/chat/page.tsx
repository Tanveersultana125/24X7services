'use client'

import { useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, Camera, X } from 'lucide-react'
import { AiMark } from '@/components/ai/AiMark'
import { AnswerView } from '@/components/ai/AnswerView'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { ScreenHeader } from '@/components/ui'
import { INTENT_LABEL, INTENT_TOPIC, answer, detectIntent, detectScope, greeting, inspectImage, type AiContext } from '@/lib/ai/engine'
import type { AiAnswer, AiMessage, AiThread, Intent } from '@/lib/ai/types'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, type Appliance } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { time } from '@/lib/format'
import { stepHref } from '@/lib/routes'
import { useJob, useStore } from '@/lib/store'

export default function AiChatPage() {
  return (
    <Suspense>
      <AiChat />
    </Suspense>
  )
}

const QUICK: Intent[] = ['diagnose', 'error', 'troubleshoot', 'repair', 'parts', 'notes', 'explain']

/** Follow-up chips the answers offer, mapped back to quick actions. */
const PICK_INTENT: Record<string, Intent> = {
  'Troubleshooting steps': 'troubleshoot',
  'Repair steps': 'repair',
  'Required parts': 'parts',
  'Generate service notes': 'notes',
  'Explain to customer': 'explain',
}

const uid = () => Math.random().toString(36).slice(2, 10)

/** Photos are kept on the device, so shrink them before they go in storage. */
function shrink(file: File, max = 1280): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onerror = rej
    r.onload = () => {
      const img = new Image()
      img.onerror = rej
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
        res(c.toDataURL('image/jpeg', 0.82))
      }
      img.src = r.result as string
    }
    r.readAsDataURL(file)
  })
}

function AiChat() {
  const params = useSearchParams()
  const job = useJob(params.get('id'))
  const store = useStore()
  const threadParam = params.get('t')
  const startIntent = params.get('q') as Intent | null

  const existing = useMemo(() => (threadParam ? store.aiThreads.find((t) => t.id === threadParam) : undefined), [threadParam, store.aiThreads])
  const [pick, setPick] = useState<{ brand?: AiContext['brand']; appliance?: Appliance }>({})
  const ctx: AiContext = job
    ? { brand: job.brand, appliance: job.appliance, issue: job.issue, model: job.model, diagnosis: job.diagnosis }
    : { brand: pick.brand, appliance: pick.appliance }

  const [thread, setThread] = useState<AiThread>(() => {
    if (existing) return existing
    const at = new Date().toISOString()
    const messages: AiMessage[] = [{ id: uid(), role: 'ai', at, answer: greeting(ctx) }]
    // Opened from a job's "Find parts" or "Service notes" shortcut: answer
    // that straight away.
    const start = startIntent && QUICK.includes(startIntent) ? startIntent : null
    if (start) {
      messages.push(
        { id: uid(), role: 'tech', at, text: INTENT_LABEL[start], intent: start },
        { id: uid(), role: 'ai', at, intent: start, answer: answer(ctx, { intent: start }) }
      )
    }
    return { id: uid(), jobId: job?.id, title: start ? INTENT_TOPIC[start] : 'New conversation', startedAt: at, updatedAt: at, messages }
  })
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [savedNotes, setSavedNotes] = useState<Set<string>>(new Set())
  const dockRef = useRef<HTMLDivElement>(null)
  // Room to leave under the last message: everything from the top of the
  // pinned composer to the bottom of the screen, bottom nav included. Measured,
  // because the chips and hint wrap differently on every phone width.
  const [dockSpace, setDockSpace] = useState(240)
  const fileRef = useRef<HTMLInputElement>(null)

  const push = (msgs: AiMessage[], title?: string) =>
    setThread((t) => ({ ...t, messages: [...t.messages, ...msgs], updatedAt: new Date().toISOString(), title: t.title === 'New conversation' && title ? title : t.title }))

  // Save under the job as it grows. Only conversations that went past the
  // greeting are worth keeping.
  // The store hands out new functions on every change, so reach the latest
  // one through a ref — depending on it directly would save in a loop.
  const saveRef = useRef(store.saveThread)
  useEffect(() => {
    saveRef.current = store.saveThread
  })
  useEffect(() => {
    if (thread.messages.some((m) => m.role === 'tech')) saveRef.current(thread)
  }, [thread])

  const reply = (produce: () => AiAnswer | Promise<AiAnswer>, intent?: Intent) => {
    setThinking(true)
    // A beat of "thinking" reads better than an instant wall of text.
    setTimeout(async () => {
      let a: AiAnswer
      try {
        a = await produce()
      } catch {
        a = { lead: 'Something went wrong reading that. Please try again.', sections: [] }
      }
      setThinking(false)
      push([{ id: uid(), role: 'ai', at: new Date().toISOString(), intent, answer: a }])
    }, 650)
  }

  const run = (intent: Intent, label = INTENT_LABEL[intent]) => {
    push([{ id: uid(), role: 'tech', at: new Date().toISOString(), text: label, intent }], INTENT_TOPIC[intent])
    reply(() => answer(ctx, { intent }), intent)
  }

  const send = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    setText('')
    // In a general chat the first message may name the appliance itself.
    let c = ctx
    if (!job) {
      const found = detectScope(t)
      if (found.appliance || found.brand) {
        const next = { brand: found.brand ?? pick.brand, appliance: found.appliance ?? pick.appliance }
        setPick(next)
        c = { ...ctx, ...next }
      }
    }
    const intent = detectIntent(t)
    push([{ id: uid(), role: 'tech', at: new Date().toISOString(), text: t }], intent ? INTENT_TOPIC[intent] : t.slice(0, 40))
    reply(() => answer(c, { text: t, intent: intent === 'error' ? 'error' : undefined }), intent)
  }

  const onPick = (s: string) => {
    const appliance = APPLIANCES.find((a) => APPLIANCE_LABEL[a] === s)
    if (!job && appliance) {
      setPick((p) => ({ ...p, appliance }))
      push([{ id: uid(), role: 'tech', at: new Date().toISOString(), text: s }], `${APPLIANCE_LABEL[appliance]} help`)
      reply(() => ({ lead: `Got it — ${APPLIANCE_LABEL[appliance]}. Which brand, and what’s the problem? You can also use the quick actions below.`, sections: [], suggestions: BRANDS.map((b) => BRAND_LABEL[b]) }))
      return
    }
    const brand = BRANDS.find((b) => BRAND_LABEL[b] === s)
    if (!job && brand) {
      setPick((p) => ({ ...p, brand }))
      push([{ id: uid(), role: 'tech', at: new Date().toISOString(), text: s }])
      reply(() => ({ lead: `${BRAND_LABEL[brand]} ${pick.appliance ? APPLIANCE_LABEL[pick.appliance] : ''} — describe the symptom or pick a quick action.`, sections: [] }))
      return
    }
    const intent = PICK_INTENT[s]
    if (intent) return run(intent, s)
    // Error codes from the "which code?" list.
    const last = [...thread.messages].reverse().find((m) => m.role === 'ai')
    if (last?.intent === 'error') {
      push([{ id: uid(), role: 'tech', at: new Date().toISOString(), text: s, intent: 'error' }])
      return reply(() => answer(ctx, { text: s, intent: 'error' }), 'error')
    }
    send(s)
  }

  const onPhoto = async (file: File) => {
    try {
      const url = await shrink(file)
      push([{ id: uid(), role: 'tech', at: new Date().toISOString(), image: { url, name: file.name } }], 'Photo check')
      reply(() => inspectImage(url))
    } catch {
      push([{ id: uid(), role: 'ai', at: new Date().toISOString(), answer: { lead: 'That file could not be opened as a photo.', sections: [] } }])
    }
  }

  useEffect(() => {
    const el = dockRef.current
    if (!el) return
    const measure = () => setDockSpace(Math.max(0, window.innerHeight - el.getBoundingClientRect().top))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }, [thread.messages.length, thinking, dockSpace])

  return (
    <>
      <ScreenHeader back={job ? stepHref('detail', job.id) : ('/ai' as Route)} title="AI Technician Assistant" subtitle="24×7 Technical Support" />

      {/* Job context, so the technician never has to retype it. */}
      <div className="sticky top-[calc(3.5rem+var(--safe-top))] z-20 border-b border-line bg-canvas/95 px-4 py-2.5 backdrop-blur lg:top-16">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {ctx.appliance ? (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <ApplianceGlyph appliance={ctx.appliance} className="size-6" />
            </span>
          ) : (
            <AiMark size={40} />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13.5px] font-extrabold">
              {ctx.brand && <BrandTag brand={ctx.brand} />}
              <span className="truncate">{ctx.appliance ? APPLIANCE_LABEL[ctx.appliance] : 'General assistance'}</span>
            </p>
            <p className="truncate text-xs font-semibold text-muted">
              {job ? `${job.issue} · ${job.id}` : ctx.appliance ? 'No job linked — describe the symptom' : 'No job linked — pick an appliance'}
            </p>
          </div>
          {job?.model && <span className="hidden max-w-[40%] truncate rounded-md bg-card px-2 py-1 text-[11px] font-bold text-ink-2 ring-1 ring-line sm:block">{job.model}</span>}
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 pt-4" style={{ paddingBottom: dockSpace + 16 }}>
        <ol className="space-y-4">
          {thread.messages.map((m) =>
            m.role === 'ai' ? (
              <li key={m.id} className="animate-slide-up flex gap-2.5">
                <AiMark size={28} className="mt-0.5" />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-card p-3.5 shadow-card">
                  {m.answer && (
                    <AnswerView
                      answer={m.answer}
                      onPick={onPick}
                      notesSaved={savedNotes.has(m.id)}
                      onSaveNotes={
                        job
                          ? (n) => {
                              store.saveServiceNotes(job.id, n)
                              setSavedNotes((s) => new Set(s).add(m.id))
                            }
                          : undefined
                      }
                    />
                  )}
                  <p className="num mt-2 text-[10.5px] font-semibold text-faint">{time(m.at)}</p>
                </div>
              </li>
            ) : (
              <li key={m.id} className="animate-slide-up flex justify-end">
                <div className="max-w-[82%]">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image.url} alt="Uploaded appliance photo" className="max-h-60 rounded-2xl rounded-br-md border border-line object-cover" />
                  ) : (
                    <p className={cn('rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px] font-semibold text-white', m.intent ? 'bg-brand-ink' : 'bg-brand')}>{m.text}</p>
                  )}
                  <p className="num mt-1 text-right text-[10.5px] font-semibold text-faint">{time(m.at)}</p>
                </div>
              </li>
            )
          )}
          {thinking && (
            <li className="flex gap-2.5" aria-live="polite">
              <AiMark size={28} />
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-card px-4 py-3.5">
                <span className="sr-only">Assistant is thinking</span>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="animate-typing size-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </li>
          )}
        </ol>
      </main>

      {/* Quick actions + composer, pinned above the bottom nav. */}
      <div ref={dockRef} className="fixed inset-x-0 bottom-[calc(64px+var(--safe-bottom))] z-30 border-t border-line bg-card/95 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto max-w-3xl">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 pt-2.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                disabled={thinking}
                onClick={() => run(q)}
                className="h-9 shrink-0 rounded-pill border border-line-strong bg-card px-3.5 text-[12.5px] font-bold text-ink-2 transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {INTENT_LABEL[q]}
              </button>
            ))}
          </div>
          <form
            className="flex items-end gap-2 px-4 pb-3 pt-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              if (!thinking) send(text)
            }}
          >
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a photo" className="grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong text-ink-2 hover:border-brand hover:text-brand">
              <Camera className="size-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onPhoto(f)
                e.target.value = ''
              }}
            />
            <div className="relative min-w-0 flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!thinking) send(text)
                  }
                }}
                rows={1}
                placeholder={ctx.appliance ? 'Ask a question…' : 'Appliance and problem…'}
                className="no-scrollbar block max-h-32 min-h-11 w-full resize-none rounded-xl border border-line-strong bg-card px-3.5 py-2.5 pr-9 text-[15px] focus:border-brand"
              />
              {text && (
                <button type="button" onClick={() => setText('')} aria-label="Clear" className="absolute right-2 top-2.5 grid size-6 place-items-center rounded-full text-faint hover:text-ink">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button type="submit" disabled={!text.trim() || thinking} aria-label="Send" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white disabled:bg-line-strong">
              <ArrowUp className="size-5" />
            </button>
          </form>
          <p className="px-4 pb-2 text-center text-[10.5px] font-medium text-faint">AI guidance — confirm with your own checks.</p>
        </div>
      </div>
    </>
  )
}
