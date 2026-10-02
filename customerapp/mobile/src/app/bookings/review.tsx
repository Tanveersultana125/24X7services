// PORT-PENDING: /bookings/review — port of frontend/app/bookings/review/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Review" showBack />}>
      <Text className="mt-6 text-muted">/bookings/review</Text>
    </Screen>
  )
}
