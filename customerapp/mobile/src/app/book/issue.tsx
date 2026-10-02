// PORT-PENDING: /book/issue — port of frontend/app/book/issue/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Issue" showBack />}>
      <Text className="mt-6 text-muted">/book/issue</Text>
    </Screen>
  )
}
