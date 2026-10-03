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
 * The four under the search field on Services, as a two-by-two grid. The
 * label is short enough to sit whole in half of the narrowest phone; the
 * query is the full term from the list above, so a tap still lands.
 */
export const SERVICES_SEARCH_CHIPS = [
  { label: 'AC service', query: 'AC service' },
  { label: 'Washer repair', query: 'Washing machine repair' },
  { label: 'Fridge repair', query: 'Refrigerator repair' },
  { label: 'AC deep clean', query: 'AC deep clean' },
] as const
