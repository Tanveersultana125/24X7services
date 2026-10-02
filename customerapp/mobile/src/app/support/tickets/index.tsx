// PORT-PENDING: /support/tickets — port of frontend/app/support/tickets/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Tickets" showBack />}>
      <Text className="mt-6 text-muted">/support/tickets</Text>
    </Screen>
  )
}
