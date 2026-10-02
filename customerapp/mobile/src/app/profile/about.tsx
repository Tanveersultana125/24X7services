// PORT-PENDING: /profile/about — port of frontend/app/profile/about/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="About" showBack />}>
      <Text className="mt-6 text-muted">/profile/about</Text>
    </Screen>
  )
}
