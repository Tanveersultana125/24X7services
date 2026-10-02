// PORT-PENDING: /services — port of frontend/app/services/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={true} header={<Header title="Services" />}>
      <Text className="mt-6 text-muted">/services</Text>
    </Screen>
  )
}
