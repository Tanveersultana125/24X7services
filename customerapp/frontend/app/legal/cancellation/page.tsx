import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Cancellation and refunds' }

/**
 * The figures here — the free window, the fee, the refund period — live in
 * `config/business` and are shown from it on the cancellation dialog itself,
 * which is the number a customer is actually charged. This page describes the
 * shape of the policy rather than restating those numbers, so a config change
 * cannot leave this document contradicting the app.
 */
const SECTIONS: readonly LegalSection[] = [
  {
    heading: 'Cancelling before the visit',
    paragraphs: [
      'Cancelling with enough notice is free and the visit fee comes back in full. Cancelling closer to your slot costs a small fee, because by then the window has been held for you and a technician’s day has been planned around it.',
      'The exact notice period and the exact fee are shown in the app before you confirm, and the figure you see is the figure applied.',
    ],
  },
  {
    heading: 'Moving a booking instead',
    paragraphs: [
      'Changing the time is free, up to the limit shown on the booking. If the time no longer suits you, moving it costs nothing where cancelling might.',
    ],
  },
  {
    heading: 'Once the visit has started',
    paragraphs: [
      'Once a technician has set out, cancelling is a conversation with support rather than a button — there is a person travelling, and what is fair depends on where they have got to.',
      'If you decline the repair after the inspection, that is not a cancellation. The visit fee stands, because the inspection happened, and nothing further is charged.',
    ],
  },
  {
    heading: 'If we cancel',
    paragraphs: [
      'If we cannot send anyone — nobody available, or something on our side goes wrong — you are refunded in full and we say so. No fee applies in either direction.',
      'If a technician does not arrive within your window and we have not told you why, tell us and we will refund the visit fee.',
    ],
  },
  {
    heading: 'How refunds are paid',
    paragraphs: [
      'Refunds go back to whatever paid — the same card, the same UPI handle, the same account. We cannot send one somewhere else.',
      'We issue it immediately; your bank decides when it lands, usually within a few working days. The expected period is shown when you cancel.',
    ],
  },
  {
    heading: 'Work that was not right',
    paragraphs: [
      'A completed repair carries a service warranty. If the same fault comes back while it is valid, the return visit costs nothing — that is the first thing to ask for, and usually the thing that actually fixes it.',
      'Where a return visit is not the answer, tell support what happened and we will settle it.',
    ],
  },
]

export default function Page() {
  return (
    <LegalPage
      title="Cancellation and refunds"
      updated="1 September 2026"
      intro="Plans change. This is what it costs when they do, and what happens to money you have already paid."
      sections={SECTIONS}
    />
  )
}
