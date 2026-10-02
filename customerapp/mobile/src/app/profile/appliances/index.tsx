// PORT-PENDING: /profile/appliances — port of frontend/app/profile/appliances/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Appliances" showBack />}>
      <Text className="mt-6 text-muted">/profile/appliances</Text>
    </Screen>
  )
}
