// PORT-PENDING: /services/appliance — port of frontend/app/services/appliance/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Appliance" showBack />}>
      <Text className="mt-6 text-muted">/services/appliance</Text>
    </Screen>
  )
}
