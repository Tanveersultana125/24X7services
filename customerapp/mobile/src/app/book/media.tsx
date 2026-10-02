// PORT-PENDING: /book/media — port of frontend/app/book/media/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Media" showBack />}>
      <Text className="mt-6 text-muted">/book/media</Text>
    </Screen>
  )
}
