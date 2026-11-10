'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Parcel, WhatsappTemplate, WhatsappTemplateInput } from './types'
import { FAILURE_REASONS, GROUP_LABELS, STATUS_GROUPS, statusBadgeClass } from './status'
import { PLACEHOLDERS, renderTemplate } from './whatsapp'

const EMPTY: WhatsappTemplateInput = { name: '', body: '', statuses: [], reasons: [], sortOrder: 10, isActive: true }

// Example parcel for the live preview
const SAMPLE: Parcel = {
  id: 'sample', tracking: 'yal-ABC123', orderId: 'o', yalidineOrderId: 'ORD-001234',
  lastStatus: 'Tentative échouée', lastStatusReason: 'Client ne répond pas', lastStatusAt: null,
  paymentStatus: null, paymentId: null, isStopdesk: true, stopdeskId: null, stopdeskName: 'Agence de Bab Ezzouar',
  toWilayaId: 16, toWilayaName: 'Alger', toCommuneName: 'Bab Ezzouar', currentCenterName: null, currentWilayaName: null,
  productList: null, price: 8800, deliveryFee: 450, freeshipping: false, hasExchange: false, label: null,
  dateCreation: null, dateExpedition: null, deletedAt: null, lastSyncedAt: '',
  order: {
    id: 'o', orderNumber: 'ORD-001234', customerName: 'Amina', customerPhone: '0550000000', deliveryType: 'PICKUP',
    deliveryAddress: null, deliveryDetails: null, total: 8800, subtotal: 8350, deliveryFee: 450, notes: null,
    callCenterStatus: 'CONFIRMED', deliveryStatus: 'IN_TRANSIT', createdAt: '', city: null, deliveryDesk: null,
  },
}

export function WhatsappTemplatesManager() {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<WhatsappTemplate | 'new' | null>(null)
  const [deleting, setDeleting] = useState<WhatsappTemplate | null>(null)

  const load = () => {
    setLoading(true)
    api.whatsappTemplates
      .list(true)
      .then((r) => setTemplates(r.templates))
      .catch((e) => toast.error(e.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (t: WhatsappTemplate) => {
    const { id, ...data } = t
    try {
      await api.whatsappTemplates.update(id, { ...data, isActive: !t.isActive })
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.whatsappTemplates.remove(deleting.id)
      toast.success('Message supprimé')
      setDeleting(null)
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Messages que les agents envoient depuis la fiche d&apos;un colis. Les messages liés à un statut sont proposés en premier
          quand le colis a ce statut; les messages sans statut sont proposés pour tous les colis.
        </p>
        <Button onClick={() => setEditing('new')}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau message
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className={`rounded-lg border bg-background p-4 ${t.isActive ? '' : 'opacity-60'}`}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.statuses.length === 0 ? (
                      <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Tous les statuts</span>
                    ) : (
                      t.statuses.map((s) => (
                        <span key={s} className={`rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass(s)}`}>{s}</span>
                      ))
                    )}
                    {t.reasons.map((r) => (
                      <span key={r} className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={t.isActive} onCheckedChange={() => toggleActive(t)} aria-label="Actif" />
                  <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(t)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </div>
              <p className="whitespace-pre-line rounded-md bg-muted/40 p-2 text-sm" dir="auto">{t.body}</p>
            </div>
          ))}
          {templates.length === 0 && <p className="text-sm text-muted-foreground">Aucun message.</p>}
        </div>
      )}

      {editing && (
        <TemplateDialog
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>Les agents ne pourront plus envoyer ce message. Vous pouvez aussi le désactiver à la place.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TemplateDialog({ template, onClose, onSaved }: { template: WhatsappTemplate | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<WhatsappTemplateInput>(() =>
    template ? { name: template.name, body: template.body, statuses: template.statuses, reasons: template.reasons, sortOrder: template.sortOrder, isActive: template.isActive } : EMPTY
  )
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const preview = useMemo(() => renderTemplate(form.body, SAMPLE), [form.body])

  const toggle = (key: 'statuses' | 'reasons', value: string) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))

  const insertPlaceholder = (key: string) => {
    const el = bodyRef.current
    const token = `{${key}}`
    if (!el) return setForm((f) => ({ ...f, body: f.body + token }))
    const start = el.selectionStart ?? form.body.length
    const end = el.selectionEnd ?? form.body.length
    const body = form.body.slice(0, start) + token + form.body.slice(end)
    setForm((f) => ({ ...f, body }))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      if (template) await api.whatsappTemplates.update(template.id, form)
      else await api.whatsappTemplates.create(form)
      toast.success('Message enregistré')
      onSaved()
    } catch (e: any) {
      toast.error(e.message || "Erreur d'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Modifier le message' : 'Nouveau message'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Nom (visible par les agents)</Label>
              <Input id="tpl-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex. Sorti en livraison" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">Message</Label>
              <Textarea id="tpl-body" ref={bodyRef} rows={7} dir="auto" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <div className="flex flex-wrap gap-1">
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => insertPlaceholder(p.key)}
                    className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-xs hover:bg-muted"
                    title={p.label}
                  >
                    {`{${p.key}}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Aperçu</Label>
              <p className="min-h-[3rem] whitespace-pre-line rounded-md border border-green-200 bg-green-50 p-3 text-sm" dir="auto">
                {preview || <span className="text-muted-foreground">…</span>}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="tpl-active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label htmlFor="tpl-active">Actif</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="tpl-order">Ordre</Label>
                <Input id="tpl-order" type="number" min={0} className="h-9 w-20" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Proposer pour ces statuts</Label>
              <p className="mb-2 text-xs text-muted-foreground">Aucun coché = proposé pour tous les colis.</p>
              <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border p-3">
                {(Object.keys(STATUS_GROUPS) as Array<keyof typeof STATUS_GROUPS>).map((g) => (
                  <div key={g}>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{GROUP_LABELS[g]}</p>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {STATUS_GROUPS[g].map((s) => (
                        <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox checked={form.statuses.includes(s)} onCheckedChange={() => toggle('statuses', s)} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Seulement pour ces raisons (optionnel)</Label>
              <div className="mt-2 grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                {FAILURE_REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={form.reasons.includes(r)} onCheckedChange={() => toggle('reasons', r)} />
                    {r}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={saving || !form.name.trim() || !form.body.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
