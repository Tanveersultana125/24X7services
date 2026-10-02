// PORT-PENDING: /book/details — port of frontend/app/book/details/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Details" showBack />}>
      <Text className="mt-6 text-muted">/book/details</Text>
    </Screen>
  )
}
