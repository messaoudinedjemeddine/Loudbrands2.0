'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GroupBy } from './types'

export type PresetKey =
  | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all' | 'custom'

export interface Period {
  preset: PresetKey
  from: string
  to: string
  groupBy: GroupBy | 'auto'
}

const PRESET_LABELS: Record<PresetKey, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  last7: '7 derniers jours',
  last30: '30 derniers jours',
  thisWeek: 'Cette semaine',
  thisMonth: 'Ce mois',
  lastMonth: 'Mois dernier',
  thisYear: 'Cette année',
  lastYear: 'Année dernière',
  all: 'Depuis le début',
  custom: 'Personnalisé…',
}

/** Today in Algeria as YYYY-MM-DD. */
export function algeriaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date())
}

function shift(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function presetRange(preset: PresetKey, current?: { from: string; to: string }): { from: string; to: string } {
  const today = algeriaToday()
  const [y, m] = today.split('-').map(Number)
  const pad = (v: number) => String(v).padStart(2, '0')
  switch (preset) {
    case 'today': return { from: today, to: today }
    case 'yesterday': return { from: shift(today, -1), to: shift(today, -1) }
    case 'last7': return { from: shift(today, -6), to: today }
    case 'last30': return { from: shift(today, -29), to: today }
    case 'thisWeek': {
      const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7 // Monday = 0
      return { from: shift(today, -dow), to: today }
    }
    case 'thisMonth': return { from: `${y}-${pad(m)}-01`, to: today }
    case 'lastMonth': {
      const ly = m === 1 ? y - 1 : y
      const lm = m === 1 ? 12 : m - 1
      return { from: `${ly}-${pad(lm)}-01`, to: shift(`${y}-${pad(m)}-01`, -1) }
    }
    case 'thisYear': return { from: `${y}-01-01`, to: today }
    case 'lastYear': return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` }
    case 'all': return { from: '2024-01-01', to: today }
    case 'custom': return current || { from: shift(today, -29), to: today }
  }
}

export function defaultPeriod(preset: PresetKey = 'thisMonth'): Period {
  return { preset, ...presetRange(preset), groupBy: 'auto' }
}

interface Props {
  value: Period
  onChange: (p: Period) => void
  showGroupBy?: boolean
}

export function PeriodPicker({ value, onChange, showGroupBy = true }: Props) {
  const today = algeriaToday()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.preset}
        onValueChange={(preset: PresetKey) => onChange({ ...value, preset, ...presetRange(preset, value) })}
      >
        <SelectTrigger className="h-10 w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(PRESET_LABELS) as PresetKey[]).map((k) => (
            <SelectItem key={k} value={k}>{PRESET_LABELS[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.preset === 'custom' && (
        <div className="flex items-center gap-1" dir="ltr">
          <Input
            type="date"
            className="h-10 w-40"
            value={value.from}
            max={value.to}
            onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
            aria-label="Date de début"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type="date"
            className="h-10 w-40"
            value={value.to}
            min={value.from}
            max={today}
            onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
            aria-label="Date de fin"
          />
        </div>
      )}

      {showGroupBy && (
        <Select value={value.groupBy} onValueChange={(groupBy: Period['groupBy']) => onChange({ ...value, groupBy })}>
          <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Regrouper : auto</SelectItem>
            <SelectItem value="day">Par jour</SelectItem>
            <SelectItem value="week">Par semaine</SelectItem>
            <SelectItem value="month">Par mois</SelectItem>
            <SelectItem value="year">Par année</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
