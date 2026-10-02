// PORT-PENDING: /profile/warranties — port of frontend/app/profile/warranties/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Warranties" showBack />}>
      <Text className="mt-6 text-muted">/profile/warranties</Text>
    </Screen>
  )
}
