import type { Route } from 'next'
import type { Job } from './types'

/**
 * Detail screens take `?id=` because a static export cannot serve a dynamic
 * segment. typedRoutes checks the path; the query is ours to get right.
 */
export function jobHref(job: Pick<Job, 'id' | 'status'>): Route {
  return (job.status === 'request' ? `/request/?id=${job.id}` : `/jobs/detail/?id=${job.id}`) as Route
}

export function stepHref(step: 'diagnosis' | 'parts' | 'bill' | 'confirm' | 'detail', id: string): Route {
  return `/jobs/${step}/?id=${id}` as Route
}
