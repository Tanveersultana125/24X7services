import type { Metadata } from 'next'
import { BrandScreen } from './BrandScreen'

export const metadata: Metadata = { title: 'Choose a brand' }

export default function Page() {
  return <BrandScreen />
}
