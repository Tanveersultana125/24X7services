// PORT-PENDING: /login/name — port of frontend/app/login/name/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Name" showBack />}>
      <Text className="mt-6 text-muted">/login/name</Text>
    </Screen>
  )
}
