/**
 * Searches that land on something every time: each one is a word the search
 * index holds, so a tap never ends on "nothing matched". Shown under the
 * search field on Services and on an empty search screen.
 */
export const TRENDING_SEARCHES = [
  'AC service',
  'Washing machine repair',
  'Refrigerator repair',
  'AC deep clean',
  'Geyser installation',
  'Microwave repair',
] as const

/**
 * The four shortcuts under the search field on Services, as a two-by-two
 * grid. Each one opens its service on the appliance page — no search in
 * between, so a tap lands on the right page every time, with or without a
 * connection to the search function. Labels are short enough to sit whole in
 * half of the narrowest phone.
 */
export const SERVICES_QUICK_LINKS = [
  { label: 'AC service', applianceId: 'air-conditioner', serviceKey: 'service' },
  { label: 'Washer repair', applianceId: 'washing-machine', serviceKey: 'repair' },
  { label: 'Fridge repair', applianceId: 'refrigerator', serviceKey: 'repair' },
  { label: 'AC deep clean', applianceId: 'air-conditioner', serviceKey: 'deep-clean' },
] as const
