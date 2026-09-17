import type { Metadata } from 'next'
import { MediaScreen } from './MediaScreen'

export const metadata: Metadata = { title: 'Photos and video' }

export default function Page() {
  return <MediaScreen />
}
