// PORT-PENDING: /profile/membership — port of frontend/app/profile/membership/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Membership" showBack />}>
      <Text className="mt-6 text-muted">/profile/membership</Text>
    </Screen>
  )
}
