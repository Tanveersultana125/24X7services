import { useCallback } from 'react'

import { mockRequest } from '@/lib/mock/request'
import { TICKETS, type MockMessage, type MockTicket } from '@/lib/mock/support'
import { useAsync, type AsyncState } from '@/lib/useAsync'

/**
 * Support conversations: the list, one thread, starting one, and sending a
 * message. The backend swap replaces these with the tickets callables and a
 * live listener on the thread; the screens poll `useTicket` meanwhile.
 *
 * The mock answers each message after a short pause, so the chat has the
 * rhythm of a real one.
 */

export type SupportMessage = MockMessage
export type SupportTicket = MockTicket

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Every conversation, most recently active first. */
export function fetchTickets(): Promise<SupportTicket[]> {
  return mockRequest(copy([...TICKETS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
}

export function useTickets(): AsyncState<SupportTicket[]> {
  return useAsync(fetchTickets)
}

export function fetchTicket(id: string): Promise<SupportTicket | null> {
  return mockRequest(copy(TICKETS.find((t) => t.id === id) ?? null))
}

export function useTicket(id: string): AsyncState<SupportTicket | null> {
  return useAsync(useCallback(() => fetchTicket(id), [id]))
}

const AUTO_REPLY =
  'Thanks for writing in. A support specialist has your message and will reply here, usually within 10 minutes.'

function reply(ticket: SupportTicket, text: string): void {
  setTimeout(() => {
    const now = new Date().toISOString()
    ticket.messages.push({ id: `m${ticket.messages.length + 1}`, from: 'agent', text, at: now })
    ticket.updatedAt = now
  }, 2500)
}

/** Opens a conversation with its first message. */
export async function createTicket(input: { topicId: string; subject: string; bookingId?: string; message: string }): Promise<SupportTicket> {
  await mockRequest(undefined)
  const now = new Date().toISOString()
  const ticket: SupportTicket = {
    id: `T-${Math.floor(2100 + Math.random() * 800)}`,
    topicId: input.topicId,
    subject: input.subject,
    ...(input.bookingId ? { bookingId: input.bookingId } : {}),
    status: 'open',
    updatedAt: now,
    messages: [{ id: 'm1', from: 'customer', text: input.message.trim(), at: now }],
  }
  TICKETS.unshift(ticket)
  reply(ticket, AUTO_REPLY)
  return copy(ticket)
}

/** Adds the customer's message to a thread; a resolved one opens again. */
export async function sendMessage(ticketId: string, text: string): Promise<void> {
  await mockRequest(undefined)
  const ticket = TICKETS.find((t) => t.id === ticketId)
  if (!ticket) throw new Error('That conversation could not be found.')
  const now = new Date().toISOString()
  ticket.messages.push({ id: `m${ticket.messages.length + 1}`, from: 'customer', text: text.trim(), at: now })
  ticket.status = 'open'
  ticket.updatedAt = now
  reply(ticket, 'Thanks, noted. Let us look into it and come back to you here.')
}
