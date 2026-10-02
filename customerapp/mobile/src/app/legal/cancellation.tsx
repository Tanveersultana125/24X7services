// PORT-PENDING: /legal/cancellation — port of frontend/app/legal/cancellation/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Cancellation" showBack />}>
      <Text className="mt-6 text-muted">/legal/cancellation</Text>
    </Screen>
  )
}
