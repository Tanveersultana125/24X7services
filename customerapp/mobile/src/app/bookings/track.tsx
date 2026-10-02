// PORT-PENDING: /bookings/track — port of frontend/app/bookings/track/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Track" showBack />}>
      <Text className="mt-6 text-muted">/bookings/track</Text>
    </Screen>
  )
}
