'use client'

import {
  APPLIANCE_IDS,
  type ApplianceId,
  type CatalogIssue,
  type CatalogService,
  type ServiceKey,
} from '@app/shared'
import {
  fetchDiagnosisRule,
  fetchIssuesFor,
  fetchServicesFor,
} from './catalog'
import { formatPaise } from './format'

/**
 * The search screen's assistant: a customer describes the trouble in their own
 * words and gets back what it probably is, what to try, and the visit to book.
 *
 * It is not a language model. It reads the message for an appliance, a kind of
 * job and a symptom, and answers from the same catalog the rest of the app
 * shows — the issues, the diagnosis rules our technicians wrote, the services
 * and their fees. That keeps every answer one we would stand behind, keeps it
 * free to run, and lets it work in the backend-free demo, where the catalog is
 * in the cache and nothing else is.
 *
 * Hinglish is folded into English before matching, because "fridge thanda nahi
 * kar raha" is how a good share of customers will actually type it.
 */

export interface AssistantAction {
  label: string
  href: string
  /** The one thing to do next. Everything else is secondary. */
  primary?: boolean
}

export interface AssistantReply {
  text: string
  /** The symptom it matched, shown as the heading of the answer. */
  issue?: string
  causes?: string[]
  tips?: string[]
  actions?: AssistantAction[]
  /** Tappable answers to the question the reply just asked. */
  quickReplies?: string[]
}

/** What carries from one message to the next. */
export interface AssistantContext {
  applianceId?: ApplianceId
}

const APPLIANCE_NAMES: Record<ApplianceId, string> = {
  'washing-machine': 'Washing Machine',
  'air-conditioner': 'AC',
  refrigerator: 'Fridge',
  geyser: 'Geyser',
  microwave: 'Microwave',
}

/** Tested in order; the first appliance whose pattern matches wins. */
const APPLIANCE_PATTERNS: Array<[ApplianceId, RegExp]> = [
  ['washing-machine', /washing|washer|laundry|\bdrum\b|\bspin/],
  ['refrigerator', /fridge|frige|refrigerat|freezer/],
  ['air-conditioner', /\bac\b|\ba\.c\b|air ?con|aircon|split unit|window unit/],
  ['geyser', /geyser|geysar|gyser|water heater|hot water|\bheater\b/],
  ['microwave', /microwave|\boven\b|\botg\b/],
]

/** Hinglish and common misspellings, rewritten into words the catalog uses. */
const FOLDS: Array<[RegExp, string]> = [
  [/\b(thanda|thandi|thanda nahi)\b/g, 'cooling'],
  [/\b(garam|garm)\b/g, 'hot heating'],
  [/\b(awaaz|awaz|aawaz|avaaz|shor)\b/g, 'noise'],
  [/\b(pani|paani)\b/g, 'water'],
  [/\b(tapak|tapakna|tapak raha|tapakta)\b/g, 'leaking drip'],
  [/\b(badboo|badbu|smell aa)\b/g, 'smell'],
  [/\b(baraf|barf)\b/g, 'ice'],
  [/\b(chal nahi|chalu nahi|on nahi|start nahi|band ho)\w*/g, 'not switching on'],
  [/\b(ghoom|ghum)\w*/g, 'spinning'],
  [/\b(kharab|kaam nahi|work nahi)\w*/g, 'not working'],
  [/\b(lagwana|lagana|fitting)\b/g, 'install'],
  [/\b(nikalna|hatana)\b/g, 'uninstall'],
  [/\bnahi\b|\bnhi\b|\bnai\b/g, 'not'],
]

/** Words that point at a symptom, keyed by the tail of the issue id. */
const SYMPTOM_WORDS: Record<string, string[]> = {
  'not-draining': ['drain', 'not going out', 'water stays', 'standing water'],
  'not-spinning': ['spin', 'drum', 'rotat', 'not turning'],
  leaking: ['leak', 'drip', 'puddle', 'water on the floor', 'water coming out'],
  noisy: ['noise', 'sound', 'loud', 'rattl', 'vibrat', 'shak', 'hum', 'buzz', 'knock', 'rumbl'],
  'not-starting': ['switching on', 'switch on', 'turn on', 'start', 'no power', 'dead', 'not working'],
  'error-code': ['error', 'code', 'blink'],
  'door-stuck': ['door stuck', 'door locked', 'door will not open', 'door not opening', 'door'],
  'not-cooling': ['cool', 'cold', 'warm', 'not chilling'],
  'bad-smell': ['smell', 'odour', 'odor', 'stink'],
  icing: ['ice', 'frost', 'frozen pipe'],
  tripping: ['trip', 'mcb', 'fuse', 'breaker', 'shock', 'spark'],
  'excess-ice': ['ice', 'frost', 'freezer full'],
  'door-seal': ['seal', 'gasket', 'door not closing', 'door'],
  'always-running': ['always running', 'never stops', 'keeps running', 'continuous'],
  'light-out': ['light', 'display', 'bulb'],
  'no-hot-water': ['no hot', 'cold water', 'not heating', 'not hot', 'heating'],
  'slow-heating': ['slow', 'takes long', 'too long'],
  'low-pressure': ['pressure', 'flow', 'trickle'],
  'not-heating': ['not heat', 'cold food', 'food stays cold', 'heat'],
  sparking: ['spark', 'fire', 'flash', 'burning'],
  turntable: ['turntable', 'plate', 'rotat', 'not turning'],
  panel: ['button', 'display', 'panel', 'touch', 'keypad'],
  door: ['door'],
}

/** The kind of job, when the message names one. Repair is the default. */
const JOB_PATTERNS: Array<[ServiceKey, RegExp]> = [
  ['uninstallation', /uninstall|dismount|remov|shift|relocat/],
  ['installation', /install|new (ac|fridge|geyser|machine|microwave)|mount/],
  ['gas-refill', /\bgas\b|refill|recharg/],
  ['deep-clean', /deep ?clean|jet (wash|clean)/],
  ['service', /servic|clean|maintenance|check ?up|routine/],
]

const GREETING = /^(hi|hii+|hello|hey|namaste|namaskar|hola)\b/

function fold(message: string): string {
  let text = ` ${message.toLowerCase()} `
  for (const [pattern, replacement] of FOLDS) {
    text = text.replace(pattern, replacement)
  }
  return text.replace(/\s+/g, ' ').trim()
}

function applianceIn(text: string): ApplianceId | undefined {
  return APPLIANCE_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0]
}

function jobIn(text: string): ServiceKey | undefined {
  return JOB_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0]
}

/** The issue the message most looks like, or nothing if none of it fits. */
function bestIssue(
  text: string,
  issues: readonly CatalogIssue[]
): CatalogIssue | undefined {
  let best: { issue: CatalogIssue; score: number } | undefined
  for (const issue of issues) {
    const label = issue.label.toLowerCase()
    // A tapped quick reply is the label itself: that is the answer outright.
    if (text === label) return issue

    const tail = issue.id.slice(issue.applianceId.length + 1)
    let score = 0
    for (const word of SYMPTOM_WORDS[tail] ?? []) {
      if (text.includes(word)) score += word.includes(' ') ? 3 : 2
    }
    for (const token of label.split(/[^a-z]+/)) {
      if (token.length > 3 && text.includes(token)) score += 1
    }
    if (score > 0 && (!best || score > best.score)) best = { issue, score }
  }
  return best?.issue
}

function serviceHref(service: CatalogService): string {
  return `/services/detail/?a=${service.applianceId}&s=${service.serviceKey}`
}

function bookAction(service: CatalogService): AssistantAction {
  return {
    label: `Book ${service.name} · ${formatPaise(service.visitFee)}`,
    href: serviceHref(service),
    primary: true,
  }
}

function allServicesAction(applianceId: ApplianceId): AssistantAction {
  return {
    label: `See all ${APPLIANCE_NAMES[applianceId]} services`,
    href: `/services/appliance/?a=${applianceId}`,
  }
}

function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} mins`
}

const WHICH_APPLIANCE: AssistantReply = {
  text: 'We repair and service five home appliances. Which one needs help?',
  quickReplies: APPLIANCE_IDS.map((id) => APPLIANCE_NAMES[id]),
}

/**
 * Answers one message. The context it returns is the one to pass with the
 * next, so "it is making a noise" after "my fridge…" is still about the fridge.
 */
export async function answer(
  message: string,
  context: AssistantContext
): Promise<{ reply: AssistantReply; context: AssistantContext }> {
  const text = fold(message)
  const named = applianceIn(text)
  const applianceId = named ?? context.applianceId

  // A bare "hi" is a greeting whatever came before it, not a symptom of the
  // appliance still in context.
  if (!named && GREETING.test(text) && text.split(' ').length <= 3) {
    return {
      reply: {
        text: 'Hi! Tell me what is wrong with your appliance — for example, “my fridge is not cooling” — and I will tell you what it usually is and what it costs to fix.',
        quickReplies: WHICH_APPLIANCE.quickReplies,
      },
      context: {},
    }
  }

  if (!applianceId) return { reply: WHICH_APPLIANCE, context }

  const next: AssistantContext = { applianceId }
  const name = APPLIANCE_NAMES[applianceId]
  const services = await fetchServicesFor(applianceId)
  const serviceFor = (key: ServiceKey) =>
    services.find((service) => service.serviceKey === key)

  if (/price|cost|charge|fee|rate|kitna|kitne/.test(text)) {
    return {
      reply: {
        text: `Visit fees for your ${name}. Any repair beyond the visit is quoted on the spot, and nothing starts until you approve it.`,
        actions: services.map((service) => ({
          label: `${service.name} · ${formatPaise(service.visitFee)}`,
          href: serviceHref(service),
        })),
      },
      context: next,
    }
  }

  const job = jobIn(text)
  if (job && job !== 'repair') {
    const service = serviceFor(job)
    if (service) {
      return {
        reply: {
          text: `We can do that. ${service.name}: ${service.description} The visit fee is ${formatPaise(service.visitFee)}${
            service.durationMinutes
              ? ` and it usually takes about ${duration(service.durationMinutes)}`
              : ''
          }.`,
          actions: [bookAction(service), allServicesAction(applianceId)],
        },
        context: next,
      }
    }
  }

  const issues = await fetchIssuesFor(applianceId)
  const issue = bestIssue(text, issues)
  const repair = serviceFor('repair')

  if (!issue) {
    return {
      reply: {
        text: named
          ? `What is your ${name} doing? Pick the closest, or describe it in your own words.`
          : `I did not quite catch that. Which of these is closest to what your ${name} is doing?`,
        quickReplies: issues.slice(0, 6).map((each) => each.label),
      },
      context: next,
    }
  }

  const rule = await fetchDiagnosisRule(issue.id)
  return {
    reply: {
      issue: `${name}: ${issue.label}`,
      text: 'This is what usually causes it. A technician confirms the cause on the visit and quotes the repair before touching anything.',
      causes: rule?.possibleCauses,
      tips: rule?.tips.length ? rule.tips : undefined,
      actions: [
        ...(repair ? [bookAction(repair)] : []),
        allServicesAction(applianceId),
      ],
    },
    context: next,
  }
}

/** Where the conversation starts, and what to tap if typing feels like work. */
export const OPENING: AssistantReply = {
  text: 'Hi, I am the 24X7 assistant. Tell me what is wrong with your appliance and I will tell you what it usually is, what to try first, and what the visit costs.',
  quickReplies: [
    'My fridge is not cooling',
    'Washing machine is making a loud noise',
    'AC is dripping water',
    'Geyser is not heating',
  ],
}
