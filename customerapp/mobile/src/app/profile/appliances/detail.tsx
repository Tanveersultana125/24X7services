// PORT-PENDING: /profile/appliances/detail — port of frontend/app/profile/appliances/detail/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Detail" showBack />}>
      <Text className="mt-6 text-muted">/profile/appliances/detail</Text>
    </Screen>
  )
}
