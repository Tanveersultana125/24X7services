// PORT-PENDING: /bookings/progress — port of frontend/app/bookings/progress/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Progress" showBack />}>
      <Text className="mt-6 text-muted">/bookings/progress</Text>
    </Screen>
  )
}
