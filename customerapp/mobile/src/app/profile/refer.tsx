// PORT-PENDING: /profile/refer — port of frontend/app/profile/refer/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Refer" showBack />}>
      <Text className="mt-6 text-muted">/profile/refer</Text>
    </Screen>
  )
}
