'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Database, Loader2, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { SyncReport as Report, SyncState } from './types'
import { formatDA, formatDate, formatDateTime, statusBadgeClass, timeAgo } from './status'

export function SyncReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [state, setState] = useState<SyncState | null>(null)
  const [loading, setLoading] = useState(true)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([api.parcels.report(50), api.parcels.syncStatus()])
      setReport(r)
      setState(s)
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => {
      if (poll.current) clearInterval(poll.current)
    }
  }, [load])

  const watchUntilDone = () => {
    if (poll.current) clearInterval(poll.current)
    poll.current = setInterval(async () => {
      const s = await api.parcels.syncStatus().catch(() => null)
      if (!s) return
      setState(s)
      if (!s.running) {
        if (poll.current) clearInterval(poll.current)
        poll.current = null
        if (s.lastRun?.ok) toast.success(`Synchro complète terminée : ${s.lastRun.parcels} colis`)
        else toast.error(`Synchro échouée : ${s.lastRun?.error || 'erreur inconnue'}`)
        load()
      }
    }, 3000)
  }

  const startFullSync = async () => {
    try {
      await api.parcels.sync('full')
      toast.info('Synchro complète lancée (1 à 3 minutes)…')
      setState((s) => (s ? { ...s, running: 'full' } : s))
      watchUntilDone()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const running = state?.running
  const last = state?.lastRun

  return (
    <div className="space-y-5">
      {/* Sync status */}
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <p className="flex items-center gap-2 font-semibold"><Database className="h-4 w-4" /> Synchronisation Yalidine</p>
          {running ? (
            <p className="mt-1 text-muted-foreground">Synchro {running === 'full' ? 'complète' : 'rapide'} en cours…</p>
          ) : last ? (
            <p className="mt-1 text-muted-foreground">
              Dernière synchro {last.mode === 'full' ? 'complète' : 'rapide'} {timeAgo(last.finishedAt)} ({formatDateTime(last.finishedAt)}) —{' '}
              {last.ok ? `${last.parcels} colis, ${last.historyRows} étapes, ${last.apiCalls} appels API` : <span className="text-red-700">échec : {last.error}</span>}
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">Pas encore de synchro depuis le dernier redémarrage du serveur. Les webhooks continuent de mettre à jour les colis.</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Synchro rapide automatique toutes les 20 min · webhooks en temps réel.</p>
        </div>
        <Button variant="outline" onClick={startFullSync} disabled={!!running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Synchro complète
        </Button>
      </div>

      {loading && !report ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : report && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Colis Yalidine sans commande" value={report.parcelsWithoutOrder.count} hint="Créés directement sur Yalidine ou commande supprimée" />
            <Stat label="Commandes avec un suivi inconnu" value={report.ordersWithUnknownTracking.count} hint="N° de suivi absent ou supprimé chez Yalidine" warn />
            <Stat label="Commandes confirmées sans suivi" value={report.confirmedOrdersWithoutTracking.count} hint="Confirmées mais aucun colis créé" warn />
          </div>

          <Section title="Commandes confirmées sans n° de suivi" count={report.confirmedOrdersWithoutTracking.count}>
            {report.confirmedOrdersWithoutTracking.items.map((o) => (
              <Row key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link>
                <span>{o.customerName}</span>
                <span className="font-mono text-xs" dir="ltr">{o.customerPhone}</span>
                <span className="text-muted-foreground">{formatDate(o.createdAt)}</span>
              </Row>
            ))}
          </Section>

          <Section title="Commandes dont le n° de suivi est inconnu de Yalidine" count={report.ordersWithUnknownTracking.count}>
            {report.ordersWithUnknownTracking.items.map((o) => (
              <Row key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link>
                <span className="font-mono text-xs">{o.trackingNumber}</span>
                <span>{o.customerName}</span>
                <span className="text-muted-foreground">{formatDate(o.createdAt)}</span>
              </Row>
            ))}
          </Section>

          <Section title="Colis Yalidine sans commande dans l'application" count={report.parcelsWithoutOrder.count}>
            {report.parcelsWithoutOrder.items.map((p) => (
              <Row key={p.tracking}>
                <span className="font-mono text-xs font-semibold">{p.tracking}</span>
                <span className={`w-fit rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass(p.lastStatus)}`}>{p.lastStatus || '—'}</span>
                <span>{[p.toCommuneName, p.toWilayaName].filter(Boolean).join(', ')}</span>
                <span className="text-muted-foreground">{formatDA(p.price)} · {formatDate(p.dateCreation)}</span>
              </Row>
            ))}
          </Section>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, hint, warn = false }: { label: string; value: number; hint: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${warn && value > 0 ? 'border-orange-300 bg-orange-50' : 'bg-background'}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value.toLocaleString('fr-FR')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null
  return (
    <details className="rounded-lg border bg-background" open={count <= 20}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
        {title} <span className="text-muted-foreground">({count.toLocaleString('fr-FR')}{count > 50 ? ', 50 premiers affichés' : ''})</span>
      </summary>
      <div className="divide-y border-t">{children}</div>
    </details>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 px-4 py-2 text-sm sm:grid-cols-4">{children}</div>
}
