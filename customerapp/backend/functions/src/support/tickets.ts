import { HttpsError } from 'firebase-functions/v2/https'
import {
  bookingSchema,
  COL,
  SUB,
  supportTicketSchema,
  type SupportCategory,
} from '@app/shared'
import { db } from '../lib/admin'
import { defineCallable } from '../lib/callable'

/**
 * Support: a thread per problem, with a first reply that arrives immediately.
 *
 * The rules refuse every client write to `supportTickets` and its messages,
 * which is what lets the reply be written in the same transaction as the
 * question — `lastMessageAt` and the preview can never disagree with what is
 * actually in the thread, and a client cannot post as `agent`.
 *
 * DECISION NEEDED: the shared schema calls the first responder `ai`, and it is
 * not one. What is below is a router: it reads the category and the booking and
 * answers with what the app already knows, which is genuinely most of what
 * people ask — where is my expert, what will this cost, how do I cancel. It
 * never guesses, and it offers a human on every reply.
 *
 * Making it an actual assistant is a Claude API call from `replyTo` below, and
 * it needs three things: an `ANTHROPIC_API_KEY` Cloud Functions secret, the
 * `@anthropic-ai/sdk` dependency, and a decision about what the booking data
 * put in the prompt may be used for. `claude-haiku-4-5` is the sensible starting
 * model for this shape of task; `claude-opus-5` if the answers need to reason
 * over the booking history rather than restate it. Until someone owns that
 * decision, a router that never invents an answer is the safer thing to ship.
 */

const CATEGORY_SUBJECT: Record<SupportCategory, string> = {
  booking: 'About a booking',
  payment: 'About a payment',
  technician: 'About the expert',
  warranty: 'About a warranty',
  brand_not_listed: 'A brand we do not list',
  account: 'About your account',
  other: 'Something else',
}

/** What the router can answer without inventing anything. */
const CATEGORY_REPLY: Record<SupportCategory, { text: string; quickReplies: string[] }> = {
  booking: {
    text: 'Thanks — we have this. Your booking screen shows the live status and, once an expert is on the way, where they are. If you need the slot moved or cancelled, both are on that screen too.',
    quickReplies: ['I want to reschedule', 'I want to cancel', 'Talk to a person'],
  },
  payment: {
    text: 'Thanks — we have this. Every booking shows what has been paid and what is outstanding, and the invoice for a finished job is on the booking. Refunds go back to the card or account that paid, and the bank decides exactly when they land.',
    quickReplies: ['I was charged twice', 'Where is my refund', 'Talk to a person'],
  },
  technician: {
    text: 'Thanks — we have this. If your expert has not arrived in the window you booked, tell us and we will chase them. Nothing is repaired without your approval, and no work should have started without your start code.',
    quickReplies: ['Nobody arrived', 'Work started without my code', 'Talk to a person'],
  },
  warranty: {
    text: 'Thanks — we have this. The warranty on the booking lists exactly what it covers. If the same fault has come back while it is valid, the return visit costs nothing — tell us the booking and we will arrange it.',
    quickReplies: ['The same fault is back', 'What does it cover', 'Talk to a person'],
  },
  brand_not_listed: {
    text: 'Thanks — tell us the brand and the appliance and we will say whether we can help. We add brands as we find experts trained on them, so a no today is not always a no.',
    quickReplies: ['Talk to a person'],
  },
  account: {
    text: 'Thanks — we have this. Your name, addresses and saved appliances are all editable in your profile, and you can delete your account from there too.',
    quickReplies: ['I cannot sign in', 'Delete my account', 'Talk to a person'],
  },
  other: {
    text: 'Thanks — we have this. Tell us as much as you can and a person will pick it up.',
    quickReplies: ['Talk to a person'],
  },
}

const HANDOVER =
  'A person will pick this up shortly. You will see their reply here.'

function preview(text: string): string {
  return text.slice(0, 160)
}

export const createSupportTicket = defineCallable(
  'createSupportTicket',
  async ({ category, bookingId, message }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in to continue.')

    // A ticket about a booking has to be about one of theirs, or the thread
    // becomes a way to ask questions about other people's jobs.
    if (bookingId) {
      const snap = await db().collection(COL.bookings).doc(bookingId).get()
      const parsed = bookingSchema.safeParse({ id: snap.id, ...snap.data() })
      if (!snap.exists || !parsed.success || parsed.data.uid !== uid) {
        throw new HttpsError('not-found', 'We could not find that booking.')
      }
    }

    const ticketRef = db().collection(COL.supportTickets).doc()
    const now = Date.now()
    const reply = CATEGORY_REPLY[category]

    const batch = db().batch()

    batch.set(ticketRef, {
      uid,
      bookingId,
      category,
      subject: CATEGORY_SUBJECT[category],
      status: 'open',
      assignee: 'ai',
      lastMessageAt: now + 1,
      lastMessagePreview: preview(reply.text),
      createdAt: now,
      updatedAt: now + 1,
    })

    batch.set(ticketRef.collection(SUB.messages).doc(), {
      author: 'user',
      text: message,
      quickReplies: [],
      at: now,
    })

    // Written with the question, so the thread is never a message the customer
    // sent into silence.
    batch.set(ticketRef.collection(SUB.messages).doc(), {
      author: 'ai',
      text: reply.text,
      quickReplies: reply.quickReplies,
      at: now + 1,
    })

    await batch.commit()

    return { ticketId: ticketRef.id }
  }
)

export const sendSupportMessage = defineCallable(
  'sendSupportMessage',
  async ({ ticketId, text, attachmentPath }, caller) => {
    const uid = caller.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Please sign in to continue.')

    const ticketRef = db().collection(COL.supportTickets).doc(ticketId)
    const snap = await ticketRef.get()
    const parsed = supportTicketSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!snap.exists || !parsed.success || parsed.data.uid !== uid) {
      throw new HttpsError('not-found', 'We could not find that conversation.')
    }
    const ticket = parsed.data

    if (ticket.status === 'resolved') {
      throw new HttpsError(
        'failed-precondition',
        'This conversation is closed. Please start a new one.'
      )
    }

    // An attachment has to be the customer's own file, the same rule booking
    // media follows.
    if (attachmentPath && !attachmentPath.startsWith(`users/${uid}/`)) {
      throw new HttpsError('permission-denied', 'That attachment is not yours.')
    }

    const now = Date.now()
    const batch = db().batch()

    batch.set(ticketRef.collection(SUB.messages).doc(), {
      author: 'user',
      text,
      attachmentPath,
      quickReplies: [],
      at: now,
    })

    // Once a person owns the thread the router stays out of it. Two voices
    // answering the same question is worse than a wait.
    const stillWithTheRouter = ticket.assignee === 'ai'
    const reply = stillWithTheRouter ? CATEGORY_REPLY[ticket.category] : null

    if (reply) {
      batch.set(ticketRef.collection(SUB.messages).doc(), {
        author: 'ai',
        text: reply.text,
        quickReplies: reply.quickReplies,
        at: now + 1,
      })
    }

    batch.update(ticketRef, {
      lastMessageAt: reply ? now + 1 : now,
      lastMessagePreview: preview(reply ? reply.text : text),
      updatedAt: now,
    })

    await batch.commit()

    return { ok: true as const }
  }
)

/**
 * Hand the thread to a person, and never hand it back.
 *
 * Once someone has asked for a human, an automated reply arriving afterwards
 * reads as being fobbed off — so `assignee` moves one way only, and the router
 * above checks it before saying anything.
 */
export const escalateTicket = defineCallable(
  'escalateTicket',
  async ({ ticketId }, caller) => {
    const ticketRef = db().collection(COL.supportTickets).doc(ticketId)
    const snap = await ticketRef.get()
    const parsed = supportTicketSchema.safeParse({ id: snap.id, ...snap.data() })
    if (!snap.exists || !parsed.success || parsed.data.uid !== caller.uid) {
      throw new HttpsError('not-found', 'We could not find that conversation.')
    }

    if (parsed.data.assignee === 'human') return { ok: true as const }

    const now = Date.now()
    const batch = db().batch()

    batch.set(ticketRef.collection(SUB.messages).doc(), {
      author: 'system',
      text: HANDOVER,
      quickReplies: [],
      at: now,
    })
    batch.update(ticketRef, {
      assignee: 'human',
      status: 'in_progress',
      lastMessageAt: now,
      lastMessagePreview: preview(HANDOVER),
      updatedAt: now,
    })

    await batch.commit()

    return { ok: true as const }
  }
)
