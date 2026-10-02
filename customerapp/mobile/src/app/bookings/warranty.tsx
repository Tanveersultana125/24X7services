// PORT-PENDING: /bookings/warranty — port of frontend/app/bookings/warranty/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Warranty" showBack />}>
      <Text className="mt-6 text-muted">/bookings/warranty</Text>
    </Screen>
  )
}
