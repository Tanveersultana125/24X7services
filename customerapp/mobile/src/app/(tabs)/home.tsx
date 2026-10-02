// PORT-PENDING: /home — port of frontend/app/home/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={true} header={<Header title="Home" />}>
      <Text className="mt-6 text-muted">/home</Text>
    </Screen>
  )
}
