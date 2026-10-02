// PORT-PENDING: /search — port of frontend/app/search/page.tsx
import { Screen, Header } from '@/components/Screen'
import { Text } from '@/components/ui/Text'

export default function Placeholder() {
  return (
    <Screen tab={false} header={<Header title="Search" showBack />}>
      <Text className="mt-6 text-muted">/search</Text>
    </Screen>
  )
}
