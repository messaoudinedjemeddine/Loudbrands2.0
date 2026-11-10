// WhatsApp click-to-chat: builds the message from a template and opens the WhatsApp app
// installed on the agent's computer/phone (no API, nothing is sent by the server).

import type { Parcel, WhatsappTemplate } from './types'

export const TRACK_ORDER_URL = 'https://loudbrandss.com/track-order'

export const PLACEHOLDERS: Array<{ key: string; label: string }> = [
  { key: 'nom', label: 'Nom du client' },
  { key: 'tracking', label: 'N° de suivi' },
  { key: 'commande', label: 'N° de commande' },
  { key: 'statut', label: 'Statut Yalidine' },
  { key: 'raison', label: 'Raison (échec)' },
  { key: 'centre', label: 'Bureau / centre' },
  { key: 'wilaya', label: 'Wilaya' },
  { key: 'commune', label: 'Commune' },
  { key: 'prix', label: 'Montant à payer' },
  { key: 'lien_suivi', label: 'Lien de suivi' },
]

export function placeholderValues(parcel: Parcel): Record<string, string> {
  const order = parcel.order
  const amount = parcel.price ?? (order ? Math.round(order.total) : null)
  return {
    nom: order?.customerName?.trim() || '',
    tracking: parcel.tracking,
    commande: order?.orderNumber || parcel.yalidineOrderId?.trim() || '',
    statut: parcel.lastStatus || '',
    raison: parcel.lastStatusReason || '',
    centre: parcel.stopdeskName || parcel.currentCenterName || '',
    wilaya: parcel.toWilayaName || '',
    commune: parcel.toCommuneName || '',
    prix: amount !== null ? amount.toLocaleString('fr-FR') : '',
    lien_suivi: TRACK_ORDER_URL,
  }
}

export function renderTemplate(body: string, parcel: Parcel): string {
  const values = placeholderValues(parcel)
  return body
    .replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match))
    .replace(/\(\s*\)/g, '') // "({raison})" with no reason
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

/** Templates that fit this parcel: specific ones (matching status/reason) first, then general ones. */
export function matchTemplates(templates: WhatsappTemplate[], parcel: Parcel) {
  const status = parcel.lastStatus || ''
  const reason = parcel.lastStatusReason || ''
  const fits = (t: WhatsappTemplate) =>
    (t.statuses.length === 0 || t.statuses.includes(status)) && (t.reasons.length === 0 || t.reasons.includes(reason))
  const active = templates.filter((t) => t.isActive)
  return {
    suggested: active.filter((t) => fits(t) && t.statuses.length > 0),
    general: active.filter((t) => fits(t) && t.statuses.length === 0),
    others: active.filter((t) => !fits(t)),
  }
}

/** "0550 12 34 56" / "+213550123456" / "550123456" → "213550123456". Returns null if unusable. */
export function toWhatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  const first = phone.split(/[,;/]|\s{2,}/).find((p) => p.replace(/\D/g, '').length >= 9) || phone
  let digits = first.replace(/\D/g, '')
  if (digits.startsWith('00213')) digits = digits.slice(2)
  if (digits.startsWith('213')) return digits.length === 12 || digits.length === 11 ? digits : null
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.length === 9 || digits.length === 8 ? `213${digits}` : null
}

/** Opens the installed WhatsApp app (Windows/Mac desktop app or phone app) with the message ready. */
export function whatsappAppLink(phone: string, text?: string): string {
  return `whatsapp://send?phone=${phone}${text ? `&text=${encodeURIComponent(text)}` : ''}`
}
