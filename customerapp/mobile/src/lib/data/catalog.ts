import { useCallback } from 'react'
import type { Category, Question, Service } from '@app/shared/catalog-v2'

import { CATEGORIES, QUESTIONS, SERVICES } from '@/lib/mock/catalog'
import { mockRequest } from '@/lib/mock/request'
import { useAsync, type AsyncState } from '@/lib/useAsync'

/**
 * The catalog, as screens ask for it. Each read is a plain async function
 * (what the backend swap replaces) and a hook over it (what a screen calls).
 * Today the functions answer from lib/mock; tomorrow they read Firestore, and
 * no screen changes.
 *
 * Every hook returns the useAsync shape — status, data, error, reload — so a
 * screen draws its skeleton, its content, its empty state and its error state
 * from the same four fields. An empty list is `ready` with `[]`; a missing
 * item is `ready` with `null`. Neither is an error.
 */

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order

/** Top-level categories, or the children of `parentId`. */
export function fetchCategories(parentId: string | null = null): Promise<Category[]> {
  const list = CATEGORIES.filter((c) => (c.parentId ?? null) === parentId).sort(byOrder)
  return mockRequest(list)
}

export function fetchCategory(id: string): Promise<Category | null> {
  return mockRequest(CATEGORIES.find((c) => c.id === id) ?? null)
}

/** The category and every category under it, at any depth. */
function withDescendants(id: string): Set<string> {
  const ids = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const c of CATEGORIES) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id)
        grew = true
      }
    }
  }
  return ids
}

/** Services in a category, including those in its sub-categories. */
export function fetchServices(categoryId: string): Promise<Service[]> {
  const ids = withDescendants(categoryId)
  return mockRequest(SERVICES.filter((s) => ids.has(s.categoryId)))
}

export function fetchService(id: string): Promise<Service | null> {
  return mockRequest(SERVICES.find((s) => s.id === id) ?? null)
}

/** What Home shows under "Most booked". */
export function fetchPopularServices(): Promise<Service[]> {
  return mockRequest(SERVICES.filter((s) => s.popular))
}

/**
 * Services whose name, category or highlights have a word starting with each
 * word typed. Prefixes, not substrings: "ac" finds the AC, not "machine".
 */
export function searchServices(term: string): Promise<Service[]> {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return mockRequest([])
  const names = new Map(CATEGORIES.map((c) => [c.id, c.name]))
  const hits = SERVICES.filter((s) => {
    const text = [s.name, names.get(s.categoryId) ?? '', ...s.highlights].join(' ').toLowerCase()
    const tokens = text.split(/[^a-z0-9]+/).filter(Boolean)
    return words.every((word) => tokens.some((token) => token.startsWith(word)))
  })
  return mockRequest(hits)
}

/**
 * The questions a booking for `serviceId` asks: its own, then those of its
 * category and every category above it, in `order`.
 */
export function fetchQuestions(serviceId: string): Promise<Question[]> {
  const service = SERVICES.find((s) => s.id === serviceId)
  if (!service) return mockRequest([])
  const chain = new Set<string>()
  let at: Category | undefined = CATEGORIES.find((c) => c.id === service.categoryId)
  while (at) {
    chain.add(at.id)
    const parent: string | undefined = at.parentId
    at = parent ? CATEGORIES.find((c) => c.id === parent) : undefined
  }
  const list = QUESTIONS.filter(
    (q) => q.serviceId === serviceId || (q.categoryId !== undefined && chain.has(q.categoryId))
  ).sort(byOrder)
  return mockRequest(list)
}

/** The top-level category above `id` (itself, when it is top-level). */
function rootOf(id: string): Category | undefined {
  let at = CATEGORIES.find((c) => c.id === id)
  while (at?.parentId) {
    const parent: string = at.parentId
    at = CATEGORIES.find((c) => c.id === parent)
  }
  return at
}

/** One sub-category and its services, a section on the category page. */
export interface CategorySection {
  category: Category
  services: Service[]
}

/**
 * Everything the category page draws: the top-level category, one section per
 * sub-category that has services, and which section to open on (the one asked
 * for, when a sub-category was). Null when there is no such category.
 */
export interface CategoryPage {
  root: Category
  sections: CategorySection[]
  initialSectionId: string | null
}

export function fetchCategoryPage(id: string): Promise<CategoryPage | null> {
  const root = rootOf(id)
  if (!root) return mockRequest(null)
  const subs = CATEGORIES.filter((c) => c.parentId === root.id).sort(byOrder)
  // A category with no sub-categories is its own single section.
  const groups = subs.length ? subs : [root]
  const sections = groups
    .map((category) => ({
      category,
      services: SERVICES.filter((s) => withDescendants(category.id).has(s.categoryId)),
    }))
    .filter((section) => section.services.length > 0)
  return mockRequest({ root, sections, initialSectionId: id === root.id ? null : id })
}

/** A service with the category it sits in and the top-level one above that. */
export interface ServicePage {
  service: Service
  category: Category | null
  root: Category | null
}

export function fetchServicePage(id: string): Promise<ServicePage | null> {
  const service = SERVICES.find((s) => s.id === id)
  if (!service) return mockRequest(null)
  return mockRequest({
    service,
    category: CATEGORIES.find((c) => c.id === service.categoryId) ?? null,
    root: rootOf(service.categoryId) ?? null,
  })
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCategories(parentId: string | null = null): AsyncState<Category[]> {
  return useAsync(useCallback(() => fetchCategories(parentId), [parentId]))
}

export function useCategory(id: string): AsyncState<Category | null> {
  return useAsync(useCallback(() => fetchCategory(id), [id]))
}

export function useServices(categoryId: string): AsyncState<Service[]> {
  return useAsync(useCallback(() => fetchServices(categoryId), [categoryId]))
}

export function useService(id: string): AsyncState<Service | null> {
  return useAsync(useCallback(() => fetchService(id), [id]))
}

export function usePopularServices(): AsyncState<Service[]> {
  return useAsync(fetchPopularServices)
}

export function useQuestions(serviceId: string): AsyncState<Question[]> {
  return useAsync(useCallback(() => fetchQuestions(serviceId), [serviceId]))
}

export function useCategoryPage(id: string): AsyncState<CategoryPage | null> {
  return useAsync(useCallback(() => fetchCategoryPage(id), [id]))
}

export function useServicePage(id: string): AsyncState<ServicePage | null> {
  return useAsync(useCallback(() => fetchServicePage(id), [id]))
}
