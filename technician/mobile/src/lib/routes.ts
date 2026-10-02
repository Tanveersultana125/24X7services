import type { Href } from 'expo-router'
import type { Job } from './types'

/**
 * Detail screens take `?id=`, the same URLs the web app uses (a static export
 * cannot serve a dynamic segment, and keeping them identical keeps every link
 * portable). typedRoutes checks the path; the query is ours to get right.
 */
export function jobHref(job: Pick<Job, 'id' | 'status'>): Href {
  return (job.status === 'request' ? `/request?id=${job.id}` : `/jobs/detail?id=${job.id}`) as Href
}

export function stepHref(step: 'diagnosis' | 'parts' | 'bill' | 'confirm' | 'detail', id: string): Href {
  return `/jobs/${step}?id=${id}` as Href
}
