'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowUpDown, Download, Loader2, Pencil, Search } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import type { ProfitProduct, ProfitReport } from '@/components/analytics/types'
import { defaultPeriod, Period, PeriodPicker } from '@/components/analytics/period-picker'
import { da, dateLabel, num, pct } from '@/components/analytics/format'

type SortKey = 'name' | 'price' | 'costPrice' | 'unitProfit' | 'unitMargin' | 'stock' | 'sold' | 'revenue' | 'profit' | 'margin'

export default function ProfitPage() {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod('thisMonth'))
  const [data, setData] = useState<ProfitReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'profit', dir: 'desc' })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.analytics
      .profit({ from: period.from, to: period.to })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message || 'Erreur de chargement'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [period.from, period.to])

  const rows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    const filtered = data.products.filter(
      (p) =>
        (!onlyMissing || p.costMissing) &&
        (!q || p.name.toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    )
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = a[sort.key] as number | string | null
      const vb = b[sort.key] as number | string | null
      if (va === vb) return 0
      if (va === null) return 1
      if (vb === null) return -1
      return (va > vb ? 1 : -1) * dir
    })
  }, [data, search, onlyMissing, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))

  const exportCsv = () => {
    if (!data) return
    const header = ['Produit', 'Référence', 'Catégorie', 'Prix', 'Coût', 'Profit/unité', 'Marge/unité %', 'Stock', 'Vendus', 'CA', 'Coût total', 'Profit', 'Marge %']
    const lines = rows.map((p) => [
      p.name, p.reference || '', p.category, p.price, p.costPrice, p.unitProfit,
      p.unitMargin === null ? '' : p.unitMargin.toFixed(1), p.stock, p.sold, p.revenue, p.cost, p.profit,
      p.margin === null ? '' : p.margin.toFixed(1),
    ])
    const csv = [header, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `profit-loud-styles-${data.period.from}_${data.period.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const t = data?.totals

  return (
    <AdminLayout>
      {/* French page: keep left-to-right even when the admin runs in Arabic (RTL) */}
      <div className="space-y-6" dir="ltr">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analyses de Profit — Loud Styles</h1>
            <p className="text-sm text-muted-foreground">Profit = prix de vente − coût de fabrication, sur les articles livrés.</p>
          </div>
          <PeriodPicker value={period} onChange={setPeriod} showGroupBy={false} />
        </div>

        {data && (
          <p className="text-sm text-muted-foreground">
            Ventes livrées du <strong className="text-foreground">{dateLabel(data.period.from)}</strong> au{' '}
            <strong className="text-foreground">{dateLabel(data.period.to)}</strong>
            {loading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />}
          </p>
        )}
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!data && loading && (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}

        {data && t && (
          <div className={`space-y-6 ${loading ? 'opacity-60' : ''}`}>
            {data.productsWithoutCost > 0 && (
              <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {num(data.productsWithoutCost)} produit(s) n&apos;ont pas de coût de fabrication : leur profit est compté comme 100 % du prix.
                </span>
                <Button size="sm" variant="outline" className="border-amber-400 bg-white" onClick={() => setOnlyMissing(true)}>
                  Les afficher
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Tile label="Chiffre d'affaires" value={da(t.revenue)} hint={`${num(t.itemsSold)} articles livrés`} />
              <Tile label="Coût de fabrication" value={da(t.cost)} hint={t.costMissingItems ? `${num(t.costMissingItems)} article(s) sans coût` : undefined} />
              <Tile label="Profit brut" value={da(t.profit)} hint={`Marge ${pct(t.margin)}`} strong />
              <Tile label="Profit moyen / commande" value={da(t.deliveredOrders ? t.profit / t.deliveredOrders : 0)} hint={`${num(t.deliveredOrders)} commandes livrées`} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Tile small label="Stock (unités)" value={num(data.stock.units)} />
              <Tile small label="Valeur du stock au coût" value={da(data.stock.costValue)} />
              <Tile small label="Valeur du stock à la vente" value={da(data.stock.retailValue)} hint={`Profit potentiel ${da(data.stock.retailValue - data.stock.costValue)}`} />
            </div>

            {/* Categories */}
            <section className="rounded-lg border bg-background p-4">
              <h2 className="mb-2 font-semibold">Par catégorie</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="py-2 text-left">Catégorie</th>
                      <th className="py-2 text-right">Produits</th>
                      <th className="py-2 text-right">Vendus</th>
                      <th className="py-2 text-right">CA</th>
                      <th className="py-2 text-right">Coût</th>
                      <th className="py-2 text-right">Profit</th>
                      <th className="py-2 text-right">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map((c) => (
                      <tr key={c.name} className="border-b last:border-0">
                        <td className="py-1.5">{c.name}</td>
                        <td className="py-1.5 text-right tabular-nums">{num(c.products)}</td>
                        <td className="py-1.5 text-right tabular-nums">{num(c.sold)}</td>
                        <td className="py-1.5 text-right tabular-nums">{da(c.revenue)}</td>
                        <td className="py-1.5 text-right tabular-nums">{da(c.cost)}</td>
                        <td className="py-1.5 text-right font-medium tabular-nums">{da(c.profit)}</td>
                        <td className="py-1.5 text-right tabular-nums">{pct(c.margin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Products */}
            <section className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="font-semibold">Produits ({num(rows.length)})</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, référence, catégorie…" className="h-9 w-64 pl-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="only-missing" checked={onlyMissing} onCheckedChange={setOnlyMissing} />
                    <Label htmlFor="only-missing" className="text-sm">Sans coût seulement</Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" /> CSV</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <SortTh k="name" sort={sort} onSort={toggleSort}>Produit</SortTh>
                      <SortTh k="price" sort={sort} onSort={toggleSort} end>Prix</SortTh>
                      <SortTh k="costPrice" sort={sort} onSort={toggleSort} end>Coût</SortTh>
                      <SortTh k="unitProfit" sort={sort} onSort={toggleSort} end>Profit / unité</SortTh>
                      <SortTh k="stock" sort={sort} onSort={toggleSort} end>Stock</SortTh>
                      <SortTh k="sold" sort={sort} onSort={toggleSort} end>Vendus</SortTh>
                      <SortTh k="revenue" sort={sort} onSort={toggleSort} end>CA</SortTh>
                      <SortTh k="profit" sort={sort} onSort={toggleSort} end>Profit</SortTh>
                      <SortTh k="margin" sort={sort} onSort={toggleSort} end>Marge</SortTh>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => <ProductRow key={p.id} p={p} />)}
                    {rows.length === 0 && (
                      <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">Aucun produit.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function ProductRow({ p }: { p: ProfitProduct }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-2">
        <div className="flex items-center gap-2">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded bg-muted" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{p.name}</p>
            <p className="truncate text-xs text-muted-foreground">{[p.reference, p.category].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
      </td>
      <td className="py-2 text-right tabular-nums whitespace-nowrap">{da(p.price)}</td>
      <td className="py-2 text-right tabular-nums whitespace-nowrap">
        {p.costMissing ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">non renseigné</span> : da(p.costPrice)}
      </td>
      <td className="py-2 text-right tabular-nums whitespace-nowrap">
        {p.costMissing ? '—' : <>{da(p.unitProfit)} <span className="text-xs text-muted-foreground">({pct(p.unitMargin, 0)})</span></>}
      </td>
      <td className="py-2 text-right tabular-nums">{num(p.stock)}</td>
      <td className="py-2 text-right tabular-nums">{num(p.sold)}</td>
      <td className="py-2 text-right tabular-nums whitespace-nowrap">{da(p.revenue)}</td>
      <td className="py-2 text-right font-medium tabular-nums whitespace-nowrap">{da(p.profit)}</td>
      <td className="py-2 text-right tabular-nums">{pct(p.margin)}</td>
      <td className="py-2 text-right">
        <Link href={`/admin/products/${p.id}/edit`} className="inline-flex text-muted-foreground hover:text-foreground" title="Modifier le produit (coût)">
          <Pencil className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  )
}

function Tile({ label, value, hint, small = false, strong = false }: { label: string; value: string; hint?: string; small?: boolean; strong?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${strong ? 'border-emerald-300 bg-emerald-50' : 'bg-background'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-bold tabular-nums ${small ? 'text-xl' : 'text-2xl'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SortTh({
  k, sort, onSort, end = false, children,
}: { k: SortKey; sort: { key: SortKey; dir: 'asc' | 'desc' }; onSort: (k: SortKey) => void; end?: boolean; children: React.ReactNode }) {
  const active = sort.key === k
  return (
    <th className={`py-2 font-semibold ${end ? 'text-right' : 'text-left'}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 uppercase hover:text-foreground ${active ? 'text-foreground' : ''}`}>
        {children}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </button>
    </th>
  )
}
