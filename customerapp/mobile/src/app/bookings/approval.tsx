// PORT-PENDING: /bookings/approval — port of frontend/app/bookings/approval/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Approval" showBack />}>
      <Text className="mt-6 text-muted">/bookings/approval</Text>
    </Screen>
  )
}
