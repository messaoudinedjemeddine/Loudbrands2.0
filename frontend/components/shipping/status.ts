// Yalidine statuses grouped the same way as the backend (backend/src/services/yalidine-mirror.js).

import type { StatusGroup } from './types'

export const STATUS_GROUPS: Record<Exclude<StatusGroup, 'OTHER'>, string[]> = {
  READY: ['Pas encore expédié', 'A vérifier', 'En préparation', 'Pas encore ramassé', 'Prêt à expédier', 'En passation'],
  IN_TRANSIT: [
    'Ramassé', 'Bloqué', 'Débloqué', 'Transfert', 'Expédié', 'Centre', 'En localisation', 'Vers Wilaya',
    'En transit', 'Reçu à Wilaya', 'En attente du client', 'Prêt pour livreur', 'Sorti en livraison',
    'En attente', 'En alerte', 'Alerte résolue', 'Tentative échouée',
  ],
  DONE: ['Livré'],
  RETURNED: [
    'Echèc livraison', 'Retour vers centre', 'Retourné au centre', 'Retour transfert', 'Retour groupé',
    'Retour à retirer', 'Retour non retiré', 'Colis abandonné', 'Retour vers vendeur', 'Retourné au vendeur',
    'Switch annulé', 'Echange échoué',
  ],
}

export const ALL_STATUSES = [...STATUS_GROUPS.READY, ...STATUS_GROUPS.IN_TRANSIT, ...STATUS_GROUPS.DONE, ...STATUS_GROUPS.RETURNED, 'Annulé']

export const FAILURE_REASONS = [
  'Téléphone injoignable', 'Client ne répond pas', 'Faux numéro', 'Client absent (reporté)',
  'Client absent (échoué)', 'Annulé par le client', 'Commande double', "Le client n'a pas commandé",
  'Produit erroné', 'Produit manquant', 'Produit cassé ou défectueux', 'Client incapable de payer',
  'Wilaya erronée', 'Commune erronée', 'Client no-show', 'Adresse non livrable',
  'Document manquant', 'Produit interdit', 'Produit dangereux', 'Fausse déclaration',
]

export const GROUP_LABELS: Record<StatusGroup, string> = {
  READY: 'En préparation',
  IN_TRANSIT: 'En cours',
  DONE: 'Livrés',
  RETURNED: 'Retours',
  OTHER: 'Autres',
}

export const GROUP_STYLES: Record<StatusGroup, { badge: string; dot: string; card: string }> = {
  READY: { badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', card: 'border-amber-300 bg-amber-50' },
  IN_TRANSIT: { badge: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500', card: 'border-sky-300 bg-sky-50' },
  DONE: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', card: 'border-emerald-300 bg-emerald-50' },
  RETURNED: { badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', card: 'border-orange-300 bg-orange-50' },
  OTHER: { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', card: 'border-slate-300 bg-slate-50' },
}

/** Statuses that need the agent's attention get a stronger style. */
const ALERT_STATUSES = ['Tentative échouée', 'En alerte', 'Echèc livraison', 'Bloqué', 'Retour à retirer']

export function statusGroup(status: string | null | undefined): StatusGroup {
  if (!status) return 'OTHER'
  for (const g of Object.keys(STATUS_GROUPS) as Array<keyof typeof STATUS_GROUPS>) {
    if (STATUS_GROUPS[g].includes(status)) return g
  }
  return 'OTHER'
}

export function statusBadgeClass(status: string | null | undefined): string {
  if (status && ALERT_STATUSES.includes(status)) return 'bg-red-100 text-red-800 border-red-200'
  return GROUP_STYLES[statusGroup(status)].badge
}

export const PAYMENT_LABELS: Record<string, string> = {
  'not-ready': 'Pas prêt',
  ready: 'Prêt',
  receivable: 'À recevoir',
  payed: 'Payé',
}

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Africa/Algiers',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Algiers', day: '2-digit', month: '2-digit', year: 'numeric' })

// The admin can run right-to-left (Arabic locale): wrap numbers/dates in a left-to-right
// isolate so "8 800 DA" and "10/11/2026 20:06" don't render reversed.
const ltr = (text: string) => `\u2066${text}\u2069`

export function formatDateTime(value: string | null | undefined): string {
  return value ? ltr(dateTimeFormat.format(new Date(value))) : '—'
}

export function formatDate(value: string | null | undefined): string {
  return value ? ltr(dateFormat.format(new Date(value))) : '—'
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return ''
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return ltr(`il y a ${minutes} min`)
  const hours = Math.round(minutes / 60)
  if (hours < 24) return ltr(`il y a ${hours} h`)
  const days = Math.round(hours / 24)
  return ltr(`il y a ${days} j`)
}

export function formatDA(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return ltr(`${Math.round(value).toLocaleString('fr-FR')} DA`)
}
