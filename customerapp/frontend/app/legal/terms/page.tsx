import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/LegalPage'
import { BRAND_DISCLAIMER } from '@/config/brand'

export const metadata: Metadata = { title: 'Terms of Service' }

const SECTIONS: readonly LegalSection[] = [
  {
    heading: 'What we do',
    paragraphs: [
      'We arrange repair, servicing, installation and maintenance of home appliances at your address, carried out by technicians we have verified and trained.',
      BRAND_DISCLAIMER,
    ],
  },
  {
    heading: 'What you pay, and when',
    paragraphs: [
      'Booking a visit costs a visit fee, shown before you confirm. It covers the technician coming out and inspecting the appliance, and it is payable whether or not any repair follows.',
      'Anything beyond that is quoted on site, itemised into parts and labour, and starts only after you approve it. You may approve all of it, some of it, or none of it. What you do not approve is not done and is not charged.',
      'Every price shown includes GST. A tax invoice is issued when the job is complete.',
    ],
  },
  {
    heading: 'Your slot',
    paragraphs: [
      'A booking is for a two-hour window, not an exact time. Your technician calls before setting off.',
      'Booking online holds your window until the visit fee is paid. If it is not paid within the hold period, the window is released and the booking is cancelled.',
      'You can move a booking a limited number of times, shown on the booking itself. Cancellation terms are in the cancellation policy.',
    ],
  },
  {
    heading: 'Access and safety',
    paragraphs: [
      'Someone aged 18 or over needs to be at the address for the visit, with the appliance reachable and the power and water supply available where the work needs them.',
      'Our technician may decline to work where it would be unsafe — an unsound electrical supply, standing water, an appliance mounted in a way that cannot be reached safely. The visit fee still applies, because the visit still happened.',
    ],
  },
  {
    heading: 'The work, and the warranty',
    paragraphs: [
      'Completed work carries a service warranty for the period shown on the booking. It covers the work described on the invoice and the parts we supplied, and it does not cover a different fault, damage from misuse or power surges, or anything done by somebody else afterwards.',
      'A third-party repair can affect a manufacturer warranty that is still running. We tell you this before you book, and it is your decision.',
    ],
  },
  {
    heading: 'When something goes wrong',
    paragraphs: [
      'Tell us. Where we have got something wrong we will put it right — a return visit, a re-do, or a refund, whichever actually fixes it.',
      'What we are responsible for is the work we did. We are not responsible for a fault that was already developing, for the age of an appliance, or for losses beyond the repair itself.',
    ],
  },
  {
    heading: 'Your account',
    paragraphs: [
      'Your mobile number is your account. Keep access to it; anyone who can receive your code can sign in.',
      'You can close your account at any time from Settings. Invoices already issued are kept because tax law requires it, with your name removed.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'When these terms change, the version you agreed to is recorded against your account and you are asked to agree to the new one. Nothing is applied retrospectively to a booking already made.',
    ],
  },
]

export default function Page() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="1 September 2026"
      intro="These are the terms you agree to when you book through this app. They are written to be read, not to be got past."
      sections={SECTIONS}
    />
  )
}
