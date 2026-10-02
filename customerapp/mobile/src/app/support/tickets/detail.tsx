// PORT-PENDING: /support/tickets/detail — port of frontend/app/support/tickets/detail/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Detail" showBack />}>
      <Text className="mt-6 text-muted">/support/tickets/detail</Text>
    </Screen>
  )
}
