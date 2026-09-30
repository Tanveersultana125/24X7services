/**
 * Shapes shared by the AI chat and call agents. Answers are structured rather
 * than free text so every reply renders the same way: causes as a list,
 * safety in its own callout, uncertainty always said out loud.
 */

export type Intent = 'diagnose' | 'error' | 'troubleshoot' | 'repair' | 'parts' | 'notes' | 'explain'

export interface AnswerSection {
  heading: string
  items: string[]
  ordered?: boolean
}

export interface PartSuggestion {
  name: string
  sku?: string
  inVan?: boolean
  likely?: boolean
}

export interface AiAnswer {
  lead?: string
  sections: AnswerSection[]
  parts?: PartSuggestion[]
  /** Shown in an amber callout. */
  safety?: string
  /** Shown muted under the answer: what the assistant is not sure of. */
  caution?: string
  /** Editable service notes the technician can save to the job. */
  notes?: { diagnosis: string; action: string; recommendation: string }
  /** Plain-language text for the customer. */
  customer?: { technical: string; simple: string }
  /** Tappable follow-ups, e.g. error codes to pick from. */
  suggestions?: string[]
}

export interface AiMessage {
  id: string
  role: 'tech' | 'ai'
  at: string
  text?: string
  intent?: Intent
  image?: { url: string; name: string }
  answer?: AiAnswer
}

export interface AiThread {
  id: string
  jobId?: string
  title: string
  startedAt: string
  updatedAt: string
  messages: AiMessage[]
}

export type CallPurpose = 'confirm' | 'eta' | 'details' | 'reschedule' | 'status' | 'followup'

/** How the simulated customer answers — the demo's stand-in for a real line. */
export type CallScenario = 'cooperative' | 'reschedule' | 'escalate' | 'unresolved'

export type CallResult = 'confirmed' | 'reschedule_requested' | 'escalated' | 'informed' | 'resolved' | 'follow_up'

export interface CallLine {
  speaker: 'ai' | 'customer'
  text: string
}

export interface CallRecord {
  id: string
  jobId: string
  purpose: CallPurpose
  scenario: CallScenario
  at: string
  durationSec: number
  transcript: CallLine[]
  result: CallResult
  summary: {
    result: string
    eta?: string
    request?: string
    reschedule?: { date: string; time: string; reason: string }
    satisfaction?: string
    resolved?: boolean
    followUp: boolean
    escalation?: string
  }
  saved: boolean
}
