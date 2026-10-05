import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SlidersHorizontal } from 'lucide-react-native'
import { APPLIANCES, APPLIANCE_LABEL, BRANDS, BRAND_LABEL, type Appliance, type Brand } from '@/lib/catalog'
import { STATUS_FILTERS, inFilter, type StatusFilter } from '@/lib/status'
import type { Job } from '@/lib/types'
import { ApplianceGlyph } from './glyphs'
import { Button, FilterChip, Icon, Sheet, Tappable, Text } from './ui'

export interface FilterState {
  brands: Brand[]
  appliances: Appliance[]
  statuses: StatusFilter[]
}

export const NO_FILTERS: FilterState = { brands: [], appliances: [], statuses: [] }

export function applyFilters(jobs: Job[], f: FilterState): Job[] {
  return jobs.filter(
    (j) =>
      (!f.brands.length || f.brands.includes(j.brand)) &&
      (!f.appliances.length || f.appliances.includes(j.appliance)) &&
      (!f.statuses.length || f.statuses.some((s) => inFilter(j.status, s)))
  )
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

/** The Brand / Appliance / Status filter, as a button that opens a sheet. */
export function FilterButton({ value, onChange, hideStatus }: { value: FilterState; onChange: (f: FilterState) => void; hideStatus?: boolean }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const count = value.brands.length + value.appliances.length + value.statuses.length

  return (
    <>
      <Tappable
        onPress={() => {
          setDraft(value)
          setOpen(true)
        }}
        className="relative h-10 shrink-0 flex-row items-center gap-2 self-start rounded-xl border border-line-strong bg-card px-3"
      >
        <Icon as={SlidersHorizontal} className="size-4" />
        <Text className="text-sm font-bold">Filters</Text>
        {count > 0 && (
          <View className="size-5 items-center justify-center rounded-full bg-brand">
            <Text className="num text-[11px] font-extrabold text-white">{count}</Text>
          </View>
        )}
      </Tappable>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filter jobs">
        <View className="gap-5">
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Brand</Text>
            <View className="flex-row flex-wrap gap-2">
              {BRANDS.map((b) => (
                <FilterChip key={b} active={draft.brands.includes(b)} onClick={() => setDraft((d) => ({ ...d, brands: toggle(d.brands, b) }))}>
                  {BRAND_LABEL[b]}
                </FilterChip>
              ))}
            </View>
          </View>
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Service</Text>
            <View className="flex-row flex-wrap gap-2">
              {APPLIANCES.map((a) => (
                <FilterChip key={a} active={draft.appliances.includes(a)} onClick={() => setDraft((d) => ({ ...d, appliances: toggle(d.appliances, a) }))}>
                  <ApplianceGlyph appliance={a} className="size-4" />
                  {APPLIANCE_LABEL[a]}
                </FilterChip>
              ))}
            </View>
          </View>
          {!hideStatus && (
            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_FILTERS.map((s) => (
                  <FilterChip key={s.key} active={draft.statuses.includes(s.key)} onClick={() => setDraft((d) => ({ ...d, statuses: toggle(d.statuses, s.key) }))}>
                    {s.label}
                  </FilterChip>
                ))}
              </View>
            </View>
          )}
          <View className="flex-row gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="lg" className="flex-1" onPress={() => setDraft(NO_FILTERS)}>
              Clear all
            </Button>
            <Button
              size="lg"
              className="flex-[1.5]"
              onPress={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Apply filters
            </Button>
          </View>
        </View>
      </Sheet>
    </>
  )
}

/** Applied filters as removable chips under the toolbar. */
export function ActiveFilters({ value, onChange }: { value: FilterState; onChange: (f: FilterState) => void }) {
  const items = [
    ...value.brands.map((b) => ({ label: BRAND_LABEL[b], clear: () => onChange({ ...value, brands: value.brands.filter((x) => x !== b) }) })),
    ...value.appliances.map((a) => ({ label: APPLIANCE_LABEL[a], clear: () => onChange({ ...value, appliances: value.appliances.filter((x) => x !== a) }) })),
    ...value.statuses.map((s) => ({ label: STATUS_FILTERS.find((f) => f.key === s)!.label, clear: () => onChange({ ...value, statuses: value.statuses.filter((x) => x !== s) }) })),
  ]
  if (!items.length) return null
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 grow-0" contentContainerClassName="gap-2 px-4">
      {items.map((i) => (
        <Tappable
          key={i.label}
          onPress={i.clear}
          accessibilityLabel={`${i.label}, Remove filter`}
          className="h-8 shrink-0 flex-row items-center gap-1.5 rounded-pill bg-brand-soft px-3"
        >
          <Text className="text-xs font-bold text-brand">{i.label}</Text>
          <Text className="text-xs font-bold text-brand">×</Text>
        </Tappable>
      ))}
      <Tappable onPress={() => onChange(NO_FILTERS)} className="h-8 shrink-0 justify-center px-2">
        <Text className="text-xs font-bold text-muted">Clear</Text>
      </Tappable>
    </ScrollView>
  )
}
