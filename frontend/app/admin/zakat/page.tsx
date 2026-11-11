'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, RotateCcw, Save, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api } from '@/lib/api'
import type { ZakatAuto, ZakatCalculation } from '@/components/zakat/types'
import { algeriaToday } from '@/components/analytics/period-picker'
import { da, dateLabel, num } from '@/components/analytics/format'

const NISAB_GRAMS = 85
const RATE = 0.025
const LUNAR_YEAR_DAYS = 354

function shift(day: string, days: number) {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "1 500 000" / "1500000,50" → 1500000.5 ; empty → 0 */
function parseAmount(text: string): number {
  const cleaned = text.replace(/[\s  ]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isFinite(n) && n > 0 ? n : 0
}

function hijriLabel(day: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${day}T12:00:00Z`))
  } catch {
    return ''
  }
}

export default function ZakatPage() {
  const today = algeriaToday()
  const [to, setTo] = useState(today)
  const [from, setFrom] = useState(shift(today, -(LUNAR_YEAR_DAYS - 1)))

  const [auto, setAuto] = useState<ZakatAuto | null>(null)
  const [autoLoading, setAutoLoading] = useState(true)
  const [stock, setStock] = useState('')
  const [sales, setSales] = useState('')
  const [ateliers, setAteliers] = useState('')
  const [salaries, setSalaries] = useState('')
  const [otherCharges, setOtherCharges] = useState('')
  const [goldPrice, setGoldPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [history, setHistory] = useState<ZakatCalculation[]>([])
  const [deleting, setDeleting] = useState<ZakatCalculation | null>(null)

  const loadAuto = useCallback(async () => {
    setAutoLoading(true)
    try {
      const a = await api.zakat.auto(from, to)
      setAuto(a)
      setStock(String(Math.round(a.stockValue)))
      setSales(String(Math.round(a.salesValue)))
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement')
    } finally {
      setAutoLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    loadAuto()
  }, [loadAuto])

  const loadHistory = useCallback(async () => {
    try {
      const r = await api.zakat.list()
      setHistory(r.calculations)
      // Prefill the gold price with the last one used
      setGoldPrice((g) => (g || !r.calculations[0] ? g : String(r.calculations[0].goldPricePerGram)))
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement')
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const values = {
    stock: parseAmount(stock),
    sales: parseAmount(sales),
    ateliers: parseAmount(ateliers),
    salaries: parseAmount(salaries),
    otherCharges: parseAmount(otherCharges),
    gold: parseAmount(goldPrice),
  }
  const result = useMemo(() => {
    const base = values.stock + values.sales - values.ateliers - values.salaries - values.otherCharges
    const nisab = NISAB_GRAMS * values.gold
    const reached = values.gold > 0 && base > 0 && base >= nisab
    return { base, nisab, reached, zakat: reached ? base * RATE : 0 }
  }, [values.stock, values.sales, values.ateliers, values.salaries, values.otherCharges, values.gold])

  const autoEdited =
    auto && (Math.round(values.stock) !== Math.round(auto.stockValue) || Math.round(values.sales) !== Math.round(auto.salesValue))

  const save = async () => {
    if (!values.gold) return toast.error("Saisissez le prix du gramme d'or pour calculer le nisab")
    setSaving(true)
    try {
      await api.zakat.save({
        periodFrom: from,
        periodTo: to,
        stockValue: values.stock,
        salesValue: values.sales,
        ateliers: values.ateliers,
        salaries: values.salaries,
        otherCharges: values.otherCharges,
        goldPricePerGram: values.gold,
        notes: notes.trim() || undefined,
      })
      toast.success('Calcul enregistré')
      setNotes('')
      loadHistory()
    } catch (e: any) {
      toast.error(e.message || "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const togglePaid = async (c: ZakatCalculation) => {
    try {
      await api.zakat.update(c.id, { isPaid: !c.isPaid })
      loadHistory()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.zakat.remove(deleting.id)
      toast.success('Calcul supprimé')
      setDeleting(null)
      loadHistory()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const hijri = hijriLabel(to)

  return (
    <AdminLayout>
      <div className="space-y-6" dir="ltr">
        <div>
          <h1 className="text-2xl font-bold">Calcul de la Zakat — Loud Styles</h1>
          <p className="text-sm text-muted-foreground">
            Zakat = 2,5 % de (stock + ventes − ateliers − salaires − autres charges), si le montant atteint le nisab (85 g d&apos;or).
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* Inputs */}
          <div className="space-y-5">
            <section className="rounded-lg border bg-background p-4">
              <h2 className="mb-3 font-semibold">Année de zakat</h2>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label htmlFor="z-from">Du</Label>
                  <Input id="z-from" type="date" className="h-10 w-44" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="z-to">Au (date de la zakat)</Label>
                  <Input id="z-to" type="date" className="h-10 w-44" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} />
                </div>
                <Button variant="outline" className="h-10" onClick={() => setFrom(shift(to, -(LUNAR_YEAR_DAYS - 1)))}>
                  Année lunaire ({LUNAR_YEAR_DAYS} j)
                </Button>
              </div>
              {hijri && <p className="mt-2 text-sm text-muted-foreground">Date de la zakat : {dateLabel(to)} · {hijri}</p>}
            </section>

            <section className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">Calculé automatiquement</h2>
                {autoEdited && (
                  <Button variant="ghost" size="sm" onClick={loadAuto}><RotateCcw className="mr-1.5 h-4 w-4" /> Valeurs calculées</Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AmountField
                  id="z-stock"
                  label="Stock (au coût de fabrication)"
                  value={stock}
                  onChange={setStock}
                  loading={autoLoading}
                  hint={auto ? `${num(auto.stockUnits)} articles en stock, valeur actuelle` : undefined}
                />
                <AmountField
                  id="z-sales"
                  label="Ventes livrées sur la période"
                  value={sales}
                  onChange={setSales}
                  loading={autoLoading}
                  hint={auto ? `${num(auto.deliveredOrders)} commandes livrées · ${num(auto.itemsSold)} articles` : undefined}
                />
              </div>
              {auto && auto.productsWithoutCost > 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {num(auto.productsWithoutCost)} produit(s) sans coût de fabrication ne comptent pas dans la valeur du stock.{' '}
                    <Link href="/admin/analytics/profit" className="font-medium underline">Les compléter</Link>
                  </span>
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">Vous pouvez corriger ces montants avant d&apos;enregistrer.</p>
            </section>

            <section className="rounded-lg border bg-background p-4">
              <h2 className="mb-3 font-semibold">À déduire (à saisir)</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <AmountField id="z-ateliers" label="Ateliers" value={ateliers} onChange={setAteliers} />
                <AmountField id="z-salaries" label="Salaires" value={salaries} onChange={setSalaries} />
                <AmountField id="z-other" label="Autres charges" value={otherCharges} onChange={setOtherCharges} hint="Loyer, transport, publicité…" />
              </div>
            </section>

            <section className="rounded-lg border bg-background p-4">
              <h2 className="mb-3 font-semibold">Nisab</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <AmountField
                  id="z-gold"
                  label="Prix du gramme d'or (DA)"
                  value={goldPrice}
                  onChange={setGoldPrice}
                  hint="Prix du jour de l'or 24 carats"
                />
                <div className="space-y-1">
                  <Label>Nisab (85 g d&apos;or)</Label>
                  <p className="flex h-10 items-center rounded-md border bg-muted/40 px-3 font-medium tabular-nums">
                    {values.gold ? da(result.nisab) : '—'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Result */}
          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <section className="rounded-lg border bg-background p-4">
              <h2 className="mb-3 font-semibold">Résultat</h2>
              <dl className="space-y-1.5 text-sm">
                <Line label="Stock" value={da(values.stock)} />
                <Line label="+ Ventes" value={da(values.sales)} />
                <Line label="− Ateliers" value={da(values.ateliers)} />
                <Line label="− Salaires" value={da(values.salaries)} />
                <Line label="− Autres charges" value={da(values.otherCharges)} />
                <div className="my-2 border-t" />
                <Line label="Montant soumis à la zakat" value={da(result.base)} strong />
                <Line label="Nisab" value={values.gold ? da(result.nisab) : '—'} />
              </dl>

              <div className={`mt-4 rounded-lg p-4 text-center ${!values.gold ? 'bg-muted/40' : result.reached ? 'bg-emerald-50 ring-1 ring-emerald-300' : 'bg-slate-50 ring-1 ring-slate-200'}`}>
                {!values.gold ? (
                  <p className="text-sm text-muted-foreground">Saisissez le prix du gramme d&apos;or pour connaître le nisab.</p>
                ) : result.reached ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Zakat à payer (2,5 %)</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">{da(result.zakat)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold">Nisab non atteint</p>
                    <p className="mt-1 text-sm text-muted-foreground">Pas de zakat due sur cette base.</p>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-1.5">
                <Label htmlFor="z-notes">Note (optionnel)</Label>
                <Textarea id="z-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ex. Zakat 1448, payée à…" />
              </div>
              <Button className="mt-3 w-full" onClick={save} disabled={saving || autoLoading}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer ce calcul
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">Calcul indicatif : en cas de doute, demandez l&apos;avis d&apos;un imam ou d&apos;un savant.</p>
            </section>
          </aside>
        </div>

        {/* History */}
        <section className="rounded-lg border bg-background p-4">
          <h2 className="mb-3 font-semibold">Historique</h2>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun calcul enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="py-2 text-left">Date de la zakat</th>
                    <th className="py-2 text-left">Période</th>
                    <th className="py-2 text-right">Stock</th>
                    <th className="py-2 text-right">Ventes</th>
                    <th className="py-2 text-right">Déductions</th>
                    <th className="py-2 text-right">Montant soumis</th>
                    <th className="py-2 text-right">Zakat</th>
                    <th className="py-2 text-center">Payée</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => {
                    const toDay = isoDay(c.periodTo)
                    return (
                      <tr key={c.id} className="border-b last:border-0 align-top">
                        <td className="py-2">
                          <span className="font-medium">{dateLabel(toDay)}</span>
                          <span className="block text-xs text-muted-foreground">{hijriLabel(toDay)}</span>
                          {c.notes && <span className="block max-w-xs text-xs text-muted-foreground">{c.notes}</span>}
                        </td>
                        <td className="py-2 text-muted-foreground">{dateLabel(isoDay(c.periodFrom))} → {dateLabel(toDay)}</td>
                        <td className="py-2 text-right tabular-nums whitespace-nowrap">{da(c.stockValue)}</td>
                        <td className="py-2 text-right tabular-nums whitespace-nowrap">{da(c.salesValue)}</td>
                        <td className="py-2 text-right tabular-nums whitespace-nowrap">{da(c.ateliers + c.salaries + c.otherCharges)}</td>
                        <td className="py-2 text-right tabular-nums whitespace-nowrap">{da(c.base)}</td>
                        <td className="py-2 text-right font-semibold tabular-nums whitespace-nowrap">
                          {c.zakatDue > 0 ? da(c.zakatDue) : <span className="font-normal text-muted-foreground">Nisab non atteint</span>}
                        </td>
                        <td className="py-2 text-center">
                          <Switch checked={c.isPaid} onCheckedChange={() => togglePaid(c)} aria-label="Zakat payée" />
                        </td>
                        <td className="py-2 text-right">
                          <button type="button" onClick={() => setDeleting(c)} className="text-muted-foreground hover:text-red-600" aria-label="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce calcul ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le calcul du {deleting ? dateLabel(isoDay(deleting.periodTo)) : ''} sera supprimé de l&apos;historique.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}

/** Stored dates are Algeria midnight; read them back as the Algeria calendar day. */
function isoDay(value: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date(value))
}

function AmountField({
  id, label, value, onChange, hint, loading = false,
}: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string; loading?: boolean }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d\s.,]/g, ''))}
          placeholder="0"
          className="h-10 pr-10 text-right tabular-nums"
          disabled={loading}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'DA'}
        </span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-semibold' : ''}`}>
      <dt className={strong ? '' : 'text-muted-foreground'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
