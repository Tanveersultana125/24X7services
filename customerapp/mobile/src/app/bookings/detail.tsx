// PORT-PENDING: /bookings/detail — port of frontend/app/bookings/detail/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Detail" showBack />}>
      <Text className="mt-6 text-muted">/bookings/detail</Text>
    </Screen>
  )
}
