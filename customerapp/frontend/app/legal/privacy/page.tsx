import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/LegalPage'

export const metadata: Metadata = { title: 'Privacy Policy' }

const SECTIONS: readonly LegalSection[] = [
  {
    heading: 'What we collect',
    paragraphs: [
      'Only what a visit needs. Specifically:',
    ],
    points: [
      'Your mobile number, which is your account and how your technician reaches you.',
      'Your name, and an email address if you give us one.',
      'The addresses you save, so somebody can come to them.',
      'What you tell us is wrong with an appliance, and any photos or video you attach.',
      'Your bookings, what they cost, and the invoices and warranties they produce.',
      'Support conversations, including anything you attach to them.',
    ],
  },
  {
    heading: 'What we do not collect',
    paragraphs: [
      'We do not store card numbers, UPI details or bank details. Payments happen inside Razorpay’s own window and those details never reach this app.',
      'We do not track your location in the background. The map on a live booking shows your technician moving, not you.',
      'We do not sell anything about you, and we do not send marketing you did not ask for.',
    ],
  },
  {
    heading: 'Who sees it',
    paragraphs: [
      'Your technician sees what they need to do the job: your name, the address, the appliance, what you said is wrong, and anything you attached.',
      'Our support team sees your bookings and your conversations when you contact us.',
      'Razorpay processes payments and holds the payment details. Google, through Firebase, hosts the data.',
      'Nobody else, unless the law requires it.',
    ],
  },
  {
    heading: 'Where it lives',
    paragraphs: [
      'The database, the file storage and the functions that read them all run in Google’s Mumbai region. Your data stays in India.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'Your profile, addresses, saved appliances and support conversations are kept while your account is open, and removed when you close it.',
      'Invoices are kept for as long as tax law requires, with your name removed when you close your account. What is left is a record of a transaction, not of a person.',
    ],
  },
  {
    heading: 'What you can do',
    paragraphs: [
      'Your name, email, addresses and saved appliances are all editable in your profile, and every booking, invoice and warranty is readable there.',
      'Closing your account is in Settings and takes effect immediately.',
      'If you want a copy of what we hold, or something corrected that you cannot change yourself, ask through Support.',
    ],
  },
  {
    heading: 'Notifications',
    paragraphs: [
      'If you turn on notifications, we use them for the booking you are in — an expert assigned, on the way, a quote that needs your answer. Not for offers.',
    ],
  },
]

export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="1 September 2026"
      intro="A stranger comes to your home, so you are entitled to know exactly what we know about you and why. This says it plainly."
      sections={SECTIONS}
    />
  )
}
