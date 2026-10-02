// PORT-PENDING: /bookings/invoice — port of frontend/app/bookings/invoice/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Invoice" showBack />}>
      <Text className="mt-6 text-muted">/bookings/invoice</Text>
    </Screen>
  )
}
