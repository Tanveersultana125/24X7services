// PORT-PENDING: /services/detail — port of frontend/app/services/detail/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Detail" showBack />}>
      <Text className="mt-6 text-muted">/services/detail</Text>
    </Screen>
  )
}
