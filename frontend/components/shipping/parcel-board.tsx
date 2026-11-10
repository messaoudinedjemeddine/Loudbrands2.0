'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Loader2, MapPin, RefreshCw, Search, Store, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Parcel, ParcelStats, StatusGroup, SyncState, WhatsappTemplate } from './types'
import {
  ALL_STATUSES, formatDA, formatDateTime, GROUP_LABELS, GROUP_STYLES, PAYMENT_LABELS, statusBadgeClass, timeAgo,
} from './status'
import { ParcelDetailSheet } from './parcel-detail-sheet'

interface Props {
  mode: 'admin' | 'agent'
}

const PAGE_SIZE = 25
const GROUP_ORDER: Array<StatusGroup | 'all'> = ['all', 'READY', 'IN_TRANSIT', 'DONE', 'RETURNED']

export function ParcelBoard({ mode }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [group, setGroup] = useState<StatusGroup | 'all'>('all')
  const [status, setStatus] = useState('all')
  const [delivery, setDelivery] = useState('all')
  const [payment, setPayment] = useState('all')
  const [linked, setLinked] = useState('all')
  const [page, setPage] = useState(1)

  const [parcels, setParcels] = useState<Parcel[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [stats, setStats] = useState<ParcelStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [syncing, setSyncing] = useState(false)
  const requestId = useRef(0)

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  // Any filter change → back to page 1
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, group, status, delivery, payment, linked])

  const filters = {
    q: debouncedSearch,
    group: status === 'all' ? group : 'all',
    status,
    stopdesk: delivery === 'all' ? undefined : delivery === 'desk' ? 'true' : 'false',
    paymentStatus: mode === 'admin' ? payment : 'all',
    linked: mode === 'admin' ? linked : 'all',
  }
  const filterKey = JSON.stringify(filters)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const f = JSON.parse(filterKey)
      const [list, st] = await Promise.all([
        api.parcels.list({ ...f, page, pageSize: PAGE_SIZE }),
        api.parcels.stats({ ...f }),
      ])
      if (id !== requestId.current) return // a newer request is in flight
      setParcels(list.parcels)
      setTotal(list.total)
      setTotalPages(list.totalPages)
      setStats(st)
    } catch (e: any) {
      if (id === requestId.current) setError(e.message || 'Erreur de chargement')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [filterKey, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    api.whatsappTemplates.list().then((r) => setTemplates(r.templates)).catch(() => setTemplates([]))
    api.parcels.syncStatus().then(setSyncState).catch(() => {})
  }, [])

  const runSync = async () => {
    setSyncing(true)
    try {
      const run = await api.parcels.sync('incremental')
      toast.success(`Synchronisé avec Yalidine : ${run.parcels} colis mis à jour`)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'La synchronisation a échoué')
    } finally {
      setSyncing(false)
      api.parcels.syncStatus().then(setSyncState).catch(() => {})
    }
  }

  const hasFilters = !!(debouncedSearch || group !== 'all' || status !== 'all' || delivery !== 'all' || payment !== 'all' || linked !== 'all')
  const resetFilters = () => {
    setSearch('')
    setGroup('all')
    setStatus('all')
    setDelivery('all')
    setPayment('all')
    setLinked('all')
  }

  const lastSync = syncState?.lastSuccessAt

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{mode === 'agent' ? 'Suivi des colis' : 'Expédition Yalidine'}</h1>
          <p className="text-sm text-muted-foreground">
            {stats ? `${stats.total.toLocaleString('fr-FR')} colis` : '…'}
            {lastSync && <> · synchronisé {timeAgo(lastSync)}</>}
          </p>
        </div>
        <Button variant="outline" onClick={runSync} disabled={syncing}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Synchroniser
        </Button>
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {GROUP_ORDER.map((g) => {
          const count = g === 'all' ? stats?.total : stats?.groups[g]
          const active = group === g && status === 'all'
          const style = g === 'all' ? null : GROUP_STYLES[g]
          return (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGroup(g)
                setStatus('all')
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                active ? (style ? style.card : 'border-primary bg-primary/5') : 'bg-background hover:bg-muted/50'
              } ${g === 'all' ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {style && <span className={`h-2 w-2 rounded-full ${style.dot}`} />}
                {g === 'all' ? 'Tous' : GROUP_LABELS[g]}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums">
                {count === undefined ? <Skeleton className="h-7 w-12" /> : count.toLocaleString('fr-FR')}
              </div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 2xl:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, n° de suivi ou n° de commande…"
            className="h-11 ps-9 pe-9 text-base"
            autoFocus
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Effacer">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 sm:w-52"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {ALL_STATUSES.filter((s) => (stats?.statuses[s] || 0) > 0 || s === status).map((s) => (
                <SelectItem key={s} value={s}>
                  {s} {stats?.statuses[s] ? `(${stats.statuses[s]})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={delivery} onValueChange={setDelivery}>
            <SelectTrigger className="h-11 sm:w-48"><SelectValue placeholder="Livraison" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Domicile + bureau</SelectItem>
              <SelectItem value="home">À domicile</SelectItem>
              <SelectItem value="desk">Bureau (stop desk)</SelectItem>
            </SelectContent>
          </Select>
          {mode === 'admin' && (
            <>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="h-11 sm:w-40"><SelectValue placeholder="Paiement" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous paiements</SelectItem>
                  {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label} {stats?.payments[k] ? `(${stats.payments[k]})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={linked} onValueChange={setLinked}>
                <SelectTrigger className="h-11 sm:w-56"><SelectValue placeholder="Commande" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Avec ou sans commande</SelectItem>
                  <SelectItem value="true">Liés à une commande</SelectItem>
                  <SelectItem value="false">Sans commande</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {total.toLocaleString('fr-FR')} résultat{total > 1 ? 's' : ''}
          <button type="button" onClick={resetFilters} className="underline-offset-2 hover:underline">Réinitialiser</button>
        </div>
      )}

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* List */}
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="hidden grid-cols-[1.1fr_1.4fr_1.2fr_1.4fr_0.8fr] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Suivi</span>
          <span>Client</span>
          <span>Destination</span>
          <span>Statut</span>
          <span className="text-right">Montant</span>
        </div>

        {loading && parcels.length === 0 ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3"><Skeleton className="h-10 w-full" /></div>
            ))}
          </div>
        ) : parcels.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">Aucun colis trouvé.</p>
        ) : (
          <ul className={`divide-y ${loading ? 'opacity-60' : ''}`}>
            {parcels.map((p) => (
              <li key={p.tracking}>
                <button
                  type="button"
                  onClick={() => setSelected(p.tracking)}
                  className="grid w-full grid-cols-1 gap-1 px-4 py-3 text-left hover:bg-muted/40 focus:bg-muted/40 focus:outline-none md:grid-cols-[1.1fr_1.4fr_1.2fr_1.4fr_0.8fr] md:items-center md:gap-3"
                >
                  <div className="flex items-center justify-between gap-2 md:block">
                    <span className="font-mono text-sm font-semibold">{p.tracking}</span>
                    <span className="block text-xs text-muted-foreground">{p.order?.orderNumber || '—'}</span>
                  </div>
                  <div className="min-w-0">
                    {p.order ? (
                      <>
                        <span className="block truncate text-sm font-medium">{p.order.customerName}</span>
                        <span className="block font-mono text-xs text-muted-foreground" dir="ltr">{p.order.customerPhone}</span>
                      </>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Sans commande liée</span>
                    )}
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-sm">
                    {p.isStopdesk ? <Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{[p.toCommuneName, p.toWilayaName].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  <div className="min-w-0">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(p.lastStatus)}`}>
                      {p.lastStatus || 'Inconnu'}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground" title={formatDateTime(p.lastStatusAt)}>
                      {p.lastStatusReason ? <span className="text-red-700">{p.lastStatusReason} · </span> : null}
                      {timeAgo(p.lastStatusAt)}
                    </span>
                  </div>
                  <div className="text-sm font-medium md:text-right">
                    {formatDA(p.price)}
                    {mode === 'admin' && p.paymentStatus && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground md:ml-0 md:block">
                        {PAYMENT_LABELS[p.paymentStatus] || p.paymentStatus}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ParcelDetailSheet
        tracking={selected}
        mode={mode}
        templates={templates}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </div>
  )
}
