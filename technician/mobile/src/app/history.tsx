import { useState } from 'react'
import { View } from 'react-native'
import { History } from 'lucide-react-native'
import { ActiveFilters, FilterButton, NO_FILTERS, applyFilters, type FilterState } from '@/components/Filters'
import { ApplianceGlyph, BrandTag } from '@/components/glyphs'
import { Card, Empty, FilterChip, Icon, Page, ScreenHeader, Segmented, StatusChip, Tappable, Text } from '@/components/ui'
import { APPLIANCE_LABEL, inr } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { dayLabel, earned, isToday, thisMonth, withinDays } from '@/lib/format'
import { jobHref } from '@/lib/routes'
import { useStore } from '@/lib/store'
import type { Job } from '@/lib/types'

type Range = 'today' | 'week' | 'month'

const RANGE: Record<Range, (iso: string) => boolean> = {
  today: isToday,
  week: (iso) => withinDays(iso, 7),
  month: thisMonth,
}

export default function HistoryScreen() {
  const { jobs } = useStore()
  const [range, setRange] = useState<Range>('week')
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)
  const [outcome, setOutcome] = useState<'all' | 'closed' | 'cancelled'>('all')

  // History is finished work only; open jobs live on the Jobs board.
  const finished = applyFilters(
    jobs.filter((j) => (j.status === 'closed' || j.status === 'cancelled') && RANGE[range](j.scheduledAt)),
    filters
  )
  const rows = finished.filter((j) => outcome === 'all' || j.status === outcome).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

  const completed = finished.filter((j) => j.status === 'closed')
  const cancelled = finished.filter((j) => j.status === 'cancelled')
  const total = completed.reduce((s, j) => s + earned(j), 0)

  const groups = rows.reduce<Record<string, Job[]>>((g, j) => {
    const k = dayLabel(j.scheduledAt)
    ;(g[k] ??= []).push(j)
    return g
  }, {})

  return (
    <>
      <ScreenHeader back="/jobs" title="Job history" subtitle="Completed and cancelled jobs" />
      <Page className="gap-4">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ]}
        />

        <View className="flex-row flex-wrap gap-2">
          {(
            [
              ['all', 'All', finished.length],
              ['closed', 'Completed', completed.length],
              ['cancelled', 'Cancelled', cancelled.length],
            ] as const
          ).map(([k, label, n]) => (
            <FilterChip key={k} active={outcome === k} onClick={() => setOutcome(k)}>
              <Text>
                {label} <Text className="num opacity-70">{n}</Text>
              </Text>
            </FilterChip>
          ))}
        </View>

        <Card className="flex-row">
          <View className="flex-1 items-center p-3">
            <Text className="num text-xl font-extrabold text-success">{completed.length}</Text>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">Completed</Text>
          </View>
          <View className="flex-1 items-center border-l border-line p-3">
            <Text className="num text-xl font-extrabold text-muted">{cancelled.length}</Text>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">Cancelled</Text>
          </View>
          <View className="flex-1 items-center border-l border-line p-3">
            <Text className="num text-xl font-extrabold">{inr(total)}</Text>
            <Text className="text-[11px] font-bold uppercase tracking-wide text-muted">Billed</Text>
          </View>
        </Card>

        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-sm font-bold text-muted">
            {rows.length} record{rows.length === 1 ? '' : 's'}
          </Text>
          <FilterButton value={filters} onChange={setFilters} />
        </View>
        <ActiveFilters value={filters} onChange={setFilters} />

        {rows.length === 0 ? (
          <Empty icon={<Icon as={History} className="size-5" />} title="Nothing in this range" body="Change the period or clear filters." />
        ) : (
          // Grouped by day — the web's desktop table has no phone counterpart.
          <View className="gap-5">
            {Object.entries(groups).map(([day, list]) => (
              <View key={day}>
                <View className="mb-2 flex-row items-baseline justify-between">
                  <Text className="text-xs font-extrabold uppercase tracking-wider text-faint">{day}</Text>
                  <Text className="num text-xs font-extrabold text-faint">{inr(list.reduce((s, j) => s + earned(j), 0))}</Text>
                </View>
                <Card className="overflow-hidden">
                  {list.map((j, i) => (
                    <Tappable
                      key={j.id}
                      href={jobHref(j)}
                      className={cn('flex-row items-center gap-3 p-3 active:bg-canvas active:opacity-100', i > 0 && 'border-t border-line')}
                    >
                      <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                        <ApplianceGlyph appliance={j.appliance} className="text-brand" />
                      </View>
                      <View className="min-w-0 flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <BrandTag brand={j.brand} />
                          <Text numberOfLines={1} className="shrink text-sm font-extrabold">
                            {APPLIANCE_LABEL[j.appliance]}
                          </Text>
                        </View>
                        <Text numberOfLines={1} className="mt-0.5 text-xs font-medium text-muted">
                          {j.customer.name} · {j.service}
                        </Text>
                      </View>
                      <View className="items-end gap-1">
                        <Text className="num text-sm font-extrabold">{j.status === 'closed' ? inr(earned(j)) : '—'}</Text>
                        <StatusChip status={j.status} className="self-end" />
                      </View>
                    </Tappable>
                  ))}
                </Card>
              </View>
            ))}
          </View>
        )}
      </Page>
    </>
  )
}
