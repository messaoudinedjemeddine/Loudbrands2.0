'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Loader2, Table2 } from 'lucide-react'
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { AnalyticsOverview } from '@/components/analytics/types'
import { defaultPeriod, Period, PeriodPicker } from '@/components/analytics/period-picker'
import { bucketLabel, da, daShort, dateLabel, delta, num, pct } from '@/components/analytics/format'

// Categorical slots 1–2 of the validated palette (dataviz skill): revenue = blue, profit = orange.
const REVENUE_COLOR = '#2a78d6'
const PROFIT_COLOR = '#eb6834'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod('thisMonth'))
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.analytics
      .overview({ from: period.from, to: period.to, groupBy: period.groupBy })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message || 'Erreur de chargement'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [period.from, period.to, period.groupBy])

  const t = data?.totals
  const p = data?.previous
  const groupBy = data?.period.groupBy || 'day'

  return (
    <AdminLayout>
      {/* French page: keep left-to-right even when the admin runs in Arabic (RTL) */}
      <div className="space-y-6" dir="ltr">
        {/* Header + filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analyses — Loud Styles</h1>
            <p className="text-sm text-muted-foreground">
              Chiffre d&apos;affaires compté quand Yalidine marque le colis « Livré » (produits seulement, hors livraison).
            </p>
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>

        {data && (
          <p className="text-sm text-muted-foreground">
            Du <strong className="text-foreground">{dateLabel(data.period.from)}</strong> au{' '}
            <strong className="text-foreground">{dateLabel(data.period.to)}</strong>
            {' '}· comparé au {dateLabel(data.period.previous.from)} – {dateLabel(data.period.previous.to)}
            {loading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />}
          </p>
        )}

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!data && loading && (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}

        {data && t && p && (
          <div className={`space-y-6 ${loading ? 'opacity-60' : ''}`}>
            {t.costMissingItems > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {num(t.costMissingItems)} article(s) vendu(s) sans coût de fabrication : le profit affiché est surestimé.{' '}
                  <Link href="/admin/analytics/profit" className="font-medium underline">Voir les produits sans coût</Link>
                </span>
              </div>
            )}

            {/* KPI tiles */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi label="Chiffre d'affaires" value={da(t.revenue)} change={delta(t.revenue, p.revenue)} hint={`${num(t.itemsSold)} articles vendus`} />
              <Kpi label="Profit brut" value={da(t.profit)} change={delta(t.profit, p.profit)} hint={`Marge ${pct(t.margin)} · coût ${da(t.cost)}`} />
              <Kpi label="Commandes livrées" value={num(t.deliveredOrders)} change={delta(t.deliveredOrders, p.deliveredOrders)} hint={`Panier moyen ${da(t.averageOrder)}`} />
              <Kpi
                label="Taux de livraison"
                value={pct(t.deliveryRate)}
                change={t.deliveryRate !== null && p.deliveryRate !== null ? t.deliveryRate - p.deliveryRate : null}
                changeUnit="pts"
                hint={`${num(t.deliveredOrders)} livrées · ${num(t.returnedOrders)} retours`}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi small label="Retours sur la période" value={num(t.returnedOrders)} change={delta(t.returnedOrders, p.returnedOrders)} invert hint={`Ventes perdues ${da(t.returnedValue)}`} />
              <Kpi small label="En cours de livraison (maintenant)" value={num(data.pipeline.orders)} hint={`${da(data.pipeline.value)} à encaisser`} />
              <Kpi small label="Nouvelles commandes" value={num(data.orders.created)} hint={`${num(data.orders.confirmed)} confirmées · ${num(data.orders.canceled)} annulées`} />
            </div>

            {/* Chart */}
            <section className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">Chiffre d&apos;affaires et profit</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)}>
                  <Table2 className="mr-1.5 h-4 w-4" /> {showTable ? 'Graphique' : 'Tableau'}
                </Button>
              </div>
              {showTable ? (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background text-xs uppercase text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 text-left">Période</th>
                        <th className="py-2 text-right">CA</th>
                        <th className="py-2 text-right">Coût</th>
                        <th className="py-2 text-right">Profit</th>
                        <th className="py-2 text-right">Livrées</th>
                        <th className="py-2 text-right">Retours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.series.map((s) => (
                        <tr key={s.bucket} className="border-b last:border-0">
                          <td className="py-1.5">{bucketLabel(s.bucket, groupBy, true)}</td>
                          <td className="py-1.5 text-right tabular-nums">{da(s.revenue)}</td>
                          <td className="py-1.5 text-right tabular-nums">{da(s.cost)}</td>
                          <td className="py-1.5 text-right tabular-nums">{da(s.profit)}</td>
                          <td className="py-1.5 text-right tabular-nums">{num(s.delivered)}</td>
                          <td className="py-1.5 text-right tabular-nums">{num(s.returned)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-80" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e7e5e4" />
                      <XAxis
                        dataKey="bucket"
                        tickFormatter={(b) => bucketLabel(b, groupBy)}
                        tick={{ fontSize: 12, fill: '#52514e' }}
                        tickLine={false}
                        axisLine={{ stroke: '#d6d3d1' }}
                        minTickGap={16}
                      />
                      <YAxis tickFormatter={daShort} tick={{ fontSize: 12, fill: '#52514e' }} tickLine={false} axisLine={false} width={56} />
                      <Tooltip content={<ChartTooltip groupBy={groupBy} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={28}
                        iconType="circle"
                        formatter={(v) => <span className="text-sm text-foreground">{v}</span>}
                      />
                      <Bar isAnimationActive={false} dataKey="revenue" name="Chiffre d'affaires" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Line isAnimationActive={false} dataKey="profit" name="Profit brut" stroke={PROFIT_COLOR} strokeWidth={2} dot={data.series.length <= 31 ? { r: 4, strokeWidth: 2, stroke: '#fff' } : false} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Breakdown tables */}
            <div className="grid gap-4 xl:grid-cols-2">
              <TableCard title="Meilleurs produits (livrés)" empty={data.topProducts.length === 0}>
                <thead>
                  <tr><Th>Produit</Th><Th end>Qté</Th><Th end>CA</Th><Th end>Profit</Th><Th end>Marge</Th></tr>
                </thead>
                <tbody>
                  {data.topProducts.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <Td>
                        {r.name}
                        {r.costMissing && <span className="ml-1.5 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-800">coût manquant</span>}
                      </Td>
                      <Td end>{num(r.qty)}</Td><Td end>{da(r.revenue)}</Td><Td end>{da(r.profit)}</Td><Td end>{pct(r.margin)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>

              <TableCard title="Par catégorie" empty={data.categories.length === 0}>
                <thead>
                  <tr><Th>Catégorie</Th><Th end>Qté</Th><Th end>CA</Th><Th end>Profit</Th><Th end>Marge</Th></tr>
                </thead>
                <tbody>
                  {data.categories.map((r) => (
                    <tr key={r.name} className="border-b last:border-0">
                      <Td>{r.name}</Td><Td end>{num(r.qty)}</Td><Td end>{da(r.revenue)}</Td><Td end>{da(r.profit)}</Td><Td end>{pct(r.margin)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>

              <TableCard title="Par wilaya" empty={data.wilayas.length === 0} className="xl:col-span-2">
                <thead>
                  <tr><Th>Wilaya</Th><Th end>Livrées</Th><Th end>Retours</Th><Th end>Taux de livraison</Th><Th end>CA</Th></tr>
                </thead>
                <tbody>
                  {data.wilayas.map((r) => (
                    <tr key={r.name} className="border-b last:border-0">
                      <Td>{r.name}</Td><Td end>{num(r.delivered)}</Td><Td end>{num(r.returned)}</Td><Td end>{pct(r.deliveryRate, 0)}</Td><Td end>{da(r.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function Kpi({
  label, value, hint, change, changeUnit = '%', invert = false, small = false,
}: { label: string; value: string; hint?: string; change?: number | null; changeUnit?: '%' | 'pts'; invert?: boolean; small?: boolean }) {
  const hasChange = change !== null && change !== undefined && isFinite(change)
  const good = hasChange && (invert ? change! < 0 : change! > 0)
  const bad = hasChange && (invert ? change! > 0 : change! < 0)
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-bold tabular-nums ${small ? 'text-xl' : 'text-2xl'}`}>{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        {hasChange && (
          <span className={`inline-flex items-center font-medium ${good ? 'text-emerald-700' : bad ? 'text-red-700' : ''}`}>
            {change! >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {`⁦${change! >= 0 ? '+' : ''}${change!.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${changeUnit}⁩`}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, groupBy }: any) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-semibold">{bucketLabel(s.bucket, groupBy, true)}</p>
      <Row color={REVENUE_COLOR} label="Chiffre d'affaires" value={da(s.revenue)} />
      <Row color={PROFIT_COLOR} label="Profit brut" value={da(s.profit)} />
      <Row label="Coût de fabrication" value={da(s.cost)} />
      <Row label="Commandes livrées" value={num(s.delivered)} />
      <Row label="Retours" value={num(s.returned)} />
    </div>
  )
}

function Row({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color ? <span className="h-2 w-2 rounded-full" style={{ background: color }} /> : <span className="w-2" />}
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function TableCard({ title, empty, children, className = '' }: { title: string; empty: boolean; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border bg-background p-4 ${className}`}>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {empty ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucune vente livrée sur la période.</p>
      ) : (
        <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>
      )}
    </section>
  )
}

const Th = ({ children, end = false }: { children: React.ReactNode; end?: boolean }) => (
  <th className={`border-b py-2 text-xs font-semibold uppercase text-muted-foreground ${end ? 'text-right' : 'text-left'}`}>{children}</th>
)
const Td = ({ children, end = false }: { children: React.ReactNode; end?: boolean }) => (
  <td className={`py-1.5 ${end ? 'text-right tabular-nums whitespace-nowrap' : ''}`}>{children}</td>
)
