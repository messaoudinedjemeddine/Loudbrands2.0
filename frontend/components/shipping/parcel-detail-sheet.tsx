'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Copy, ExternalLink, Loader2, MapPin, MessageCircle, Package, Phone, Printer, Store, Truck, User, XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ParcelDetail, WhatsappTemplate } from './types'
import { formatDA, formatDateTime, PAYMENT_LABELS, statusBadgeClass, timeAgo } from './status'
import { matchTemplates, renderTemplate, toWhatsappNumber, whatsappAppLink } from './whatsapp'

interface Props {
  tracking: string | null
  mode: 'admin' | 'agent'
  templates: WhatsappTemplate[]
  onClose: () => void
  onChanged?: () => void
}

export function ParcelDetailSheet({ tracking, mode, templates, onClose, onChanged }: Props) {
  const [parcel, setParcel] = useState<ParcelDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOtherTemplates, setShowOtherTemplates] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!tracking) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setParcel(null)
    setShowOtherTemplates(false)
    api.parcels
      .get(tracking)
      .then((p) => !cancelled && setParcel(p))
      .catch((e) => !cancelled && setError(e.message || 'Erreur de chargement'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [tracking])

  const order = parcel?.order || null
  const phone = toWhatsappNumber(order?.customerPhone)
  const matched = useMemo(() => (parcel ? matchTemplates(templates, parcel) : null), [templates, parcel])

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copié`),
      () => toast.error('Copie impossible')
    )
  }

  const cancelParcel = async () => {
    if (!parcel) return
    setCancelling(true)
    try {
      await api.parcels.cancel(parcel.tracking)
      toast.success(`Colis ${parcel.tracking} annulé chez Yalidine`)
      setConfirmCancel(false)
      onChanged?.()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Impossible d'annuler le colis")
    } finally {
      setCancelling(false)
    }
  }

  const items = order?.items || []
  const destination = [parcel?.toCommuneName, parcel?.toWilayaName].filter(Boolean).join(', ')

  return (
    <Sheet open={!!tracking} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b sticky top-0 bg-background z-10">
          <SheetTitle className="flex items-center gap-2 font-mono text-lg">
            {tracking}
            {tracking && (
              <button
                type="button"
                onClick={() => copy(tracking, 'N° de suivi')}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Copier le numéro de suivi"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {parcel?.lastStatus && (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(parcel.lastStatus)}`}>
                  {parcel.lastStatus}
                </span>
              )}
              {parcel?.lastStatusAt && (
                <span className="text-muted-foreground" title={formatDateTime(parcel.lastStatusAt)}>
                  {timeAgo(parcel.lastStatusAt)}
                </span>
              )}
              {parcel?.deletedAt && (
                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">Supprimé chez Yalidine</span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {error && <p className="m-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {parcel && (
          <div className="space-y-5 px-5 py-4">
            {parcel.lastStatusReason && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <span className="font-semibold">Raison : </span>
                {parcel.lastStatusReason}
              </div>
            )}

            {/* Customer */}
            <section className="rounded-lg border p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <User className="h-4 w-4" /> Client
              </h3>
              {order ? (
                <div className="space-y-2 text-sm">
                  <p className="text-base font-semibold">{order.customerName}</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${order.customerPhone}`} className="font-mono hover:underline" dir="ltr">
                      {order.customerPhone}
                    </a>
                    <button type="button" onClick={() => copy(order.customerPhone, 'Téléphone')} className="text-muted-foreground hover:text-foreground" aria-label="Copier le téléphone">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </p>
                  <p className="flex items-start gap-2">
                    {parcel.isStopdesk ? <Store className="mt-0.5 h-4 w-4 text-muted-foreground" /> : <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                    <span>
                      {parcel.isStopdesk ? (
                        <>Bureau : <strong>{parcel.stopdeskName || order.deliveryDesk?.name || '—'}</strong></>
                      ) : (
                        order.deliveryAddress || 'Adresse non renseignée'
                      )}
                      {destination && <span className="block text-muted-foreground">{destination}</span>}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-muted-foreground">
                    <span>Commande <strong className="text-foreground">{order.orderNumber}</strong></span>
                    <span>du {formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="rounded-md bg-amber-50 p-2 text-amber-800">
                    Aucune commande liée dans l&apos;application (colis probablement créé directement sur Yalidine).
                    Yalidine masque les coordonnées du client.
                  </p>
                  {destination && <p className="pt-1"><MapPin className="mr-1 inline h-4 w-4 text-muted-foreground" />{destination}</p>}
                  {parcel.yalidineOrderId?.trim() && <p className="text-muted-foreground">Réf. Yalidine : {parcel.yalidineOrderId}</p>}
                </div>
              )}
            </section>

            {/* WhatsApp */}
            <section className="rounded-lg border border-green-200 bg-green-50/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-800">
                <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
              </h3>
              {!phone ? (
                <p className="text-sm text-muted-foreground">
                  {order ? 'Numéro de téléphone invalide.' : 'Pas de numéro: aucune commande liée.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {matched && matched.suggested.length + matched.general.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun message prévu pour ce statut.</p>
                  )}
                  {matched?.suggested.map((t) => (
                    <TemplateButton key={t.id} template={t} parcel={parcel} phone={phone} highlight />
                  ))}
                  {matched?.general.map((t) => (
                    <TemplateButton key={t.id} template={t} parcel={parcel} phone={phone} />
                  ))}
                  {matched && matched.others.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="text-xs font-medium text-green-800 underline-offset-2 hover:underline"
                        onClick={() => setShowOtherTemplates((v) => !v)}
                      >
                        {showOtherTemplates ? 'Masquer les autres messages' : `Autres messages (${matched.others.length})`}
                      </button>
                      {showOtherTemplates && matched.others.map((t) => (
                        <TemplateButton key={t.id} template={t} parcel={parcel} phone={phone} />
                      ))}
                    </>
                  )}
                  <a
                    href={whatsappAppLink(phone)}
                    className="inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" /> Ouvrir la discussion sans message
                  </a>
                </div>
              )}
            </section>

            {/* Parcel */}
            <section className="rounded-lg border p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Package className="h-4 w-4" /> Colis
              </h3>
              {items.length > 0 ? (
                <ul className="mb-3 space-y-1 text-sm">
                  {items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>
                        {it.quantity}× {it.product.name}
                        {(it.size || it.productSize?.size) && <span className="text-muted-foreground"> ({it.size || it.productSize?.size})</span>}
                      </span>
                      <span className="whitespace-nowrap text-muted-foreground">{formatDA(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                parcel.productList && <p className="mb-3 whitespace-pre-line text-sm">{parcel.productList}</p>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Montant à encaisser</dt>
                <dd className="text-right font-semibold">{formatDA(parcel.price)}</dd>
                <dt className="text-muted-foreground">Frais de livraison</dt>
                <dd className="text-right">{formatDA(parcel.deliveryFee)}{parcel.freeshipping ? ' (offerts)' : ''}</dd>
                <dt className="text-muted-foreground">Livraison</dt>
                <dd className="text-right">{parcel.isStopdesk ? 'Bureau (stop desk)' : 'À domicile'}</dd>
                {parcel.currentCenterName && (
                  <>
                    <dt className="text-muted-foreground">Position actuelle</dt>
                    <dd className="text-right">{parcel.currentCenterName}</dd>
                  </>
                )}
                {mode === 'admin' && (
                  <>
                    <dt className="text-muted-foreground">Paiement Yalidine</dt>
                    <dd className="text-right">{parcel.paymentStatus ? PAYMENT_LABELS[parcel.paymentStatus] || parcel.paymentStatus : '—'}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Créé le</dt>
                <dd className="text-right">{formatDateTime(parcel.dateCreation)}</dd>
              </dl>
            </section>

            {/* Timeline */}
            <section className="rounded-lg border p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Truck className="h-4 w-4" /> Historique
              </h3>
              {parcel.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Pas encore d&apos;historique.</p>
              ) : (
                <ol className="relative ms-2 border-s border-border">
                  {parcel.history.map((h, i) => (
                    <li key={h.id} className="mb-3 ms-4 last:mb-0">
                      <span className={`absolute -start-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <p className={`text-sm ${i === 0 ? 'font-semibold' : ''}`}>{h.status}</p>
                      {h.reason && <p className="text-xs text-red-700">{h.reason}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(h.occurredAt)}
                        {(h.centerName || h.wilayaName) && ` · ${h.centerName || h.wilayaName}`}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Admin actions */}
            {mode === 'admin' && (
              <section className="flex flex-wrap gap-2 pb-4">
                {parcel.label && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={parcel.label} target="_blank" rel="noopener noreferrer">
                      <Printer className="mr-2 h-4 w-4" /> Bordereau
                    </a>
                  </Button>
                )}
                {parcel.lastStatus === 'En préparation' && !parcel.deletedAt && (
                  <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setConfirmCancel(true)}>
                    <XCircle className="mr-2 h-4 w-4" /> Annuler le colis
                  </Button>
                )}
              </section>
            )}
          </div>
        )}

        <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler le colis {parcel?.tracking} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le colis sera supprimé chez Yalidine et la commande{order ? ` ${order.orderNumber}` : ''} n&apos;aura plus de numéro de suivi.
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  cancelParcel()
                }}
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oui, annuler le colis
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}

function TemplateButton({
  template, parcel, phone, highlight = false,
}: { template: WhatsappTemplate; parcel: ParcelDetail; phone: string; highlight?: boolean }) {
  const text = renderTemplate(template.body, parcel)
  return (
    <div className={`rounded-md border bg-background p-3 ${highlight ? 'border-green-400 shadow-sm' : ''}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {template.name}
          {highlight && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-green-800">conseillé</span>}
        </span>
        <Button size="sm" className="h-8 bg-green-600 text-white hover:bg-green-700" asChild>
          <a href={whatsappAppLink(phone, text)}>
            <MessageCircle className="mr-1.5 h-4 w-4" /> Envoyer
          </a>
        </Button>
      </div>
      <p className="whitespace-pre-line text-sm text-muted-foreground" dir="auto">{text}</p>
    </div>
  )
}
