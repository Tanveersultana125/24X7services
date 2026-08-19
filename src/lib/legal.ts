/**
 * The policies the footer links to.
 *
 * These were written from what the site already tells people — a 90-day
 * warranty, genuine parts, Telangana-wide doorstep visits, Google sign-in —
 * so nothing here contradicts a claim made elsewhere on the site. They are
 * still a starting draft and not legal advice: a policy is a promise the
 * business makes, and only the business can make it.
 *
 * Set REVIEW_PENDING to false once these have been read and corrected. That
 * removes the notice at the top of each page and nothing else.
 */

export const REVIEW_PENDING = true;

/** Shown on every policy, so one edit changes all four. */
export const LEGAL_UPDATED = "19 August 2026";

export const LEGAL_CONTACT = {
  email: "support@24x7services.in",
  phone: "1800-200-247",
  address: "24X7 Services Pvt. Ltd., Hyderabad, Telangana, India",
};

export type LegalSection = { heading: string; body: string[] };

export type LegalDoc = {
  slug: string;
  /** What the footer calls it. */
  title: string;
  /** The breadcrumb, kept short. */
  crumb: string;
  summary: string;
  sections: LegalSection[];
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    crumb: "Privacy",
    summary:
      "What we collect when you book a repair, why we hold it, and how to have it removed.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you book a visit we ask for your name, phone number, service address, the appliance and the fault, and the slot you want. We need each of these to send a technician to the right door at the right time with the right part.",
          "If you sign in with Google we receive the name, email address and profile picture on that Google account. We never see or store your Google password.",
          "When you leave a review we store what you wrote, your rating, and the name you chose to publish it under.",
          "Our servers keep ordinary technical records of a visit — the pages requested and the time — which is how we notice a page that has broken.",
        ],
      },
      {
        heading: "What we do with it",
        body: [
          "We use your details to carry out the booking, to keep you updated while a technician is on the way, and to answer you if you get in touch afterwards.",
          "A technician sees only what they need for your visit: the address, the appliance, the fault and your contact number.",
          "We do not sell your details, and we do not pass them to anyone for their own marketing.",
        ],
      },
      {
        heading: "Who else handles it",
        body: [
          "Sign-in and our database are run on Google Firebase, so your booking is stored on Google's infrastructure under our account.",
          "Any other service we bring in to run the site is bound to use your details only to do the job we ask of it.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Bookings are kept while the warranty on that repair runs and for as long afterwards as our tax and accounting obligations require.",
          "Published reviews stay up until you ask us to take yours down.",
          "A basket you have not booked is kept so it is still there when you return, and is cleared when you empty it.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "Write to us and we will tell you what we hold about you, correct anything wrong, or delete it where we are not required to keep it.",
          "You can clear the basket and the sign-in on your own browser at any time by signing out and clearing site data.",
          `Reach us at ${LEGAL_CONTACT.email} or ${LEGAL_CONTACT.phone}.`,
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    crumb: "Terms",
    summary: "The terms you agree to when you book a repair, an installation or a plan with us.",
    sections: [
      {
        heading: "Who we are",
        body: [
          `${LEGAL_CONTACT.address}. These terms cover this website and every visit booked through it.`,
          "Using the site or booking a visit means you accept these terms.",
        ],
      },
      {
        heading: "Booking a visit",
        body: [
          "A booking is a request until we confirm it. We confirm the slot, and if we cannot make it we will offer you another.",
          "Please give us an address we can reach and a number we can call. A visit we cannot complete because nobody was there may be charged as a visit.",
          "Someone aged 18 or over must be present while a technician is in your home.",
        ],
      },
      {
        heading: "Prices and payment",
        body: [
          "Prices shown are a starting point. What a repair finally costs depends on the fault and the parts it needs, and the technician will tell you the figure before starting work.",
          "You are told the price before any work begins. Nothing is fitted or charged without your agreement.",
          "Payment is due when the work is finished, by the methods offered at the time.",
        ],
      },
      {
        heading: "What we will and will not do",
        body: [
          "Our technicians are trained on the appliances we list and fit genuine parts.",
          "We may decline a job that is unsafe, that needs a part no longer made, or that an appliance is too far gone to take.",
          "We are not responsible for a fault that was already there and unrelated to the work we did, or for damage caused by someone else's earlier repair.",
        ],
      },
      {
        heading: "Cancelling and rescheduling",
        body: [
          "You can move or cancel a booking before the technician sets out, at no charge.",
          "If we cancel, we will tell you as soon as we know and you will owe nothing.",
          "Refunds are covered by our Refund Policy.",
        ],
      },
      {
        heading: "Reviews you post",
        body: [
          "A review must be your own experience of a visit we carried out.",
          "We publish reviews after checking them and may decline one that is abusive, false, or someone else's private information.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms. The date at the top of this page tells you when they last changed, and the terms that apply to your booking are the ones in force on the day you made it.",
        ],
      },
    ],
  },
  {
    slug: "refund",
    title: "Refund Policy",
    crumb: "Refunds",
    summary: "When a repair is refunded, when it is redone instead, and how long either takes.",
    sections: [
      {
        heading: "If the fault comes back",
        body: [
          "A repair carries a 90-day warranty. If the same fault returns within it, we return and put it right at no charge — that is the first thing we do, before any question of a refund.",
          "Book the return visit the same way you booked the first, or call us and quote the original booking.",
        ],
      },
      {
        heading: "When we refund",
        body: [
          "If we cannot fix the fault we were called for, you do not pay for the repair.",
          "If we return for the same fault and still cannot fix it, we refund what you paid for that repair.",
          "If you were charged for a part that was never fitted, we refund it.",
        ],
      },
      {
        heading: "What is not refunded",
        body: [
          "The visit charge stands where a technician attended, diagnosed the fault and told you the cost, and you chose not to go ahead.",
          "A new and unrelated fault is a new repair, not a failure of the last one.",
          "Damage caused after our visit by misuse, a power surge, or someone else working on the appliance is not covered.",
        ],
      },
      {
        heading: "How to ask",
        body: [
          `Write to ${LEGAL_CONTACT.email} or call ${LEGAL_CONTACT.phone} with your booking reference and what went wrong.`,
          "We will respond within 3 working days and tell you what we can do.",
          "An agreed refund is returned by the method you paid with, normally within 7 to 10 working days.",
        ],
      },
    ],
  },
  {
    slug: "warranty",
    title: "Warranty",
    crumb: "Warranty",
    summary: "What the 90-day warranty on every repair covers, and what falls outside it.",
    sections: [
      {
        heading: "What is covered",
        body: [
          "Every repair we carry out is covered for 90 days from the day of the visit.",
          "The cover is on the work we did and the parts we fitted. If either fails within those 90 days, we return and put it right at no charge.",
          "Parts we fit are genuine, and where the manufacturer gives a longer warranty on a part, that longer warranty stands.",
        ],
      },
      {
        heading: "What is not covered",
        body: [
          "A different fault, or a part we did not touch.",
          "Damage from misuse, a power surge, water ingress, pests, or an attempt to repair the appliance by anyone else after our visit.",
          "Normal wear on consumable items such as filters and gaskets.",
          "An appliance moved or reinstalled by someone else after we serviced it.",
        ],
      },
      {
        heading: "Making a claim",
        body: [
          `Call ${LEGAL_CONTACT.phone} or write to ${LEGAL_CONTACT.email} with the booking reference from your invoice.`,
          "Keep the invoice — it is the proof of the date the warranty runs from.",
          "We will arrange the return visit at a slot that suits you.",
        ],
      },
      {
        heading: "Annual plans",
        body: [
          "An annual maintenance plan covers the scheduled visits and the terms set out on the plan you chose.",
          "Repairs carried out under a plan carry the same 90-day warranty as any other repair.",
        ],
      },
    ],
  },
];

export function legalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}
