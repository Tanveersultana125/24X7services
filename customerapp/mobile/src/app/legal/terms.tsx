// PORT-PENDING: /legal/terms — port of frontend/app/legal/terms/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Terms" showBack />}>
      <Text className="mt-6 text-muted">/legal/terms</Text>
    </Screen>
  )
}
