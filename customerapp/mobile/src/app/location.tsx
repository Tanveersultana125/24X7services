// PORT-PENDING: /location — port of frontend/app/location/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Location" showBack />}>
      <Text className="mt-6 text-muted">/location</Text>
    </Screen>
  )
}
