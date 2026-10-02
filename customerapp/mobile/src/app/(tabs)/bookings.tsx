// PORT-PENDING: /bookings — port of frontend/app/bookings/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={true} header={<Header title="Bookings" />}>
      <Text className="mt-6 text-muted">/bookings</Text>
    </Screen>
  )
}
