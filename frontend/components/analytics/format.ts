// Formatting for the analytics pages. Numbers are wrapped in a left-to-right isolate so they
// read correctly when the admin runs right-to-left (Arabic locale).

const ltr = (text: string) => `⁦${text}⁩`

export function da(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return ltr(`${Math.round(value).toLocaleString('fr-FR')} DA`)
}

/** Short form for chart axes: 1,2 M / 850 k */
export function daShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`
  if (abs >= 1_000) return `${Math.round(value / 1_000).toLocaleString('fr-FR')} k`
  return String(Math.round(value))
}

export function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return ltr(value.toLocaleString('fr-FR'))
}

export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !isFinite(value)) return '—'
  return ltr(`${value.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 })} %`)
}

/** Change vs previous period, or null when there is no base to compare to. */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Label for a chart bucket (bucket = YYYY-MM-DD of the bucket start). */
export function bucketLabel(bucket: string, groupBy: string, long = false): string {
  const [y, m, d] = bucket.split('-').map(Number)
  if (groupBy === 'year') return String(y)
  if (groupBy === 'month') return `${MONTHS[m - 1]} ${long ? y : String(y).slice(2)}`
  if (groupBy === 'week') return `${long ? 'Semaine du ' : ''}${d} ${MONTHS[m - 1]}${long ? ` ${y}` : ''}`
  return `${d} ${MONTHS[m - 1]}${long ? ` ${y}` : ''}`
}

export function dateLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
