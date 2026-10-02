// PORT-PENDING: /care — port of frontend/app/care/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Care" showBack />}>
      <Text className="mt-6 text-muted">/care</Text>
    </Screen>
  )
}
