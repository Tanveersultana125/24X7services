import type { Metadata } from 'next'
import { IssueScreen } from './IssueScreen'

export const metadata: Metadata = { title: 'What is wrong' }

export default function Page() {
  return <IssueScreen />
}
