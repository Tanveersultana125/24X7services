// PORT-PENDING: /bookings/completed — port of frontend/app/bookings/completed/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Completed" showBack />}>
      <Text className="mt-6 text-muted">/bookings/completed</Text>
    </Screen>
  )
}
