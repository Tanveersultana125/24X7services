import { z } from 'zod'
import {
  messageAuthorSchema,
  supportCategorySchema,
  ticketAssigneeSchema,
  ticketStatusSchema,
} from './enums'
import { pincodeSchema } from './catalog'
import { phoneSchema } from './user'

export const supportTicketSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1),
  bookingId: z.string().min(1).optional(),
  category: supportCategorySchema,
  subject: z.string().min(1),
  status: ticketStatusSchema,
  /** Starts on `ai`; any escalation moves it to `human` and never back. */
  assignee: ticketAssigneeSchema,
  lastMessageAt: z.number().int().min(0),
  lastMessagePreview: z.string().max(160).optional(),
  createdAt: z.number().int().min(0),
  updatedAt: z.number().int().min(0),
})
export type SupportTicket = z.infer<typeof supportTicketSchema>

export const supportMessageSchema = z.object({
  id: z.string().min(1),
  author: messageAuthorSchema,
  text: z.string().max(2000),
  attachmentPath: z.string().min(1).optional(),
  /** Tappable follow-ups the assistant offered with this message. */
  quickReplies: z.array(z.string().min(1)).default([]),
  at: z.number().int().min(0),
})
export type SupportMessage = z.infer<typeof supportMessageSchema>

export const createTicketInputSchema = z.object({
  category: supportCategorySchema,
  bookingId: z.string().min(1).optional(),
  message: z.string().trim().min(1, 'Tell us what happened').max(2000),
})
export type CreateTicketInput = z.infer<typeof createTicketInputSchema>

export const sendMessageInputSchema = z.object({
  ticketId: z.string().min(1),
  text: z.string().trim().max(2000),
  attachmentPath: z.string().min(1).optional(),
}).refine((v) => v.text.length > 0 || Boolean(v.attachmentPath), {
  message: 'Type a message or attach a photo',
  path: ['text'],
})
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>

// ---------------------------------------------------------------------------
// Waitlist, for pincodes not served yet
// ---------------------------------------------------------------------------

export const waitlistInputSchema = z.object({
  pincode: pincodeSchema,
  phone: phoneSchema.optional(),
})
export type WaitlistInput = z.infer<typeof waitlistInputSchema>

// ---------------------------------------------------------------------------
// In-app notifications
// ---------------------------------------------------------------------------

export const notificationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  /** Internal route to open when tapped. */
  href: z.string().startsWith('/').optional(),
  bookingId: z.string().min(1).optional(),
  readAt: z.number().int().min(0).optional(),
  at: z.number().int().min(0),
})
export type AppNotification = z.infer<typeof notificationSchema>
