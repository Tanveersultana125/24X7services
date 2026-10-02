// PORT-PENDING: /profile/notifications — port of frontend/app/profile/notifications/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Notifications" showBack />}>
      <Text className="mt-6 text-muted">/profile/notifications</Text>
    </Screen>
  )
}
