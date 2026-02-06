'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    CheckCircle2,
    Calendar,
    Download,
    Loader2,
    Search,
    Plus
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { api } from '@/lib/api'
import * as XLSX from 'xlsx'

export default function AteliersPage() {
    const [ateliers, setAteliers] = useState<{ id: string; name: string }[]>([])
    const [receptions, setReceptions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // New Atelier
    const [newAtelierName, setNewAtelierName] = useState('')
    const [isAddingAtelier, setIsAddingAtelier] = useState(false)

    // Payment Modal
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedReception, setSelectedReception] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [isSavingPayment, setIsSavingPayment] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [receptionsRes, ateliersRes] = await Promise.all([
                api.getReceptions() as Promise<{ receptions: any[] }>,
                api.getAteliers() as Promise<{ ateliers: { id: string; name: string }[] }>
            ])
            setReceptions(receptionsRes.receptions || [])
            setAteliers(ateliersRes.ateliers || [])
        } catch (error) {
            console.error('Failed to fetch data', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setIsLoading(false)
        }
    }

    const atelierName = (r: any) => r.atelier?.name ?? r.atelierLegacy ?? '—'
    const restToPay = (r: any) => (r.totalCost ?? 0) - (r.amountPaid ?? 0)

    const handleAddAtelier = async () => {
        const name = newAtelierName.trim()
        if (!name) {
            toast.error('Nom d\'atelier requis')
            return
        }
        setIsAddingAtelier(true)
        try {
            await api.createAtelier({ name })
            toast.success('Atelier ajouté')
            setNewAtelierName('')
            fetchData()
        } catch (e: any) {
            toast.error(e?.message || 'Erreur lors de l\'ajout')
        } finally {
            setIsAddingAtelier(false)
        }
    }

    const handleOpenPaymentModal = (reception: any) => {
        setSelectedReception(reception)
        setPaymentAmount(String(reception.amountPaid ?? 0))
        setPaymentModalOpen(true)
    }

    const handleSavePayment = async () => {
        if (!selectedReception) return
        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount < 0) {
            toast.error('Montant invalide')
            return
        }
        setIsSavingPayment(true)
        try {
            await api.updateReception(selectedReception.id, { amountPaid: amount })
            toast.success('Paiement enregistré')
            setPaymentModalOpen(false)
            fetchData()
        } catch (e: any) {
            toast.error(e?.message || 'Erreur lors de la mise à jour')
        } finally {
            setIsSavingPayment(false)
        }
    }

    const paymentStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return 'PAYÉ'
            case 'PARTIAL': return 'PARTIEL'
            default: return 'EN ATTENTE'
        }
    }

    /** Strip size suffix so "product1-xl" and "product1-xxl" → "product1" (one row per product) */
    const baseProductName = (name: string, size?: string | null): string => {
        if (!name || typeof name !== 'string') return ''
        const s = name.trim()
        const sizes = ['XXXL', 'XXL', 'XL', 'L', 'M']
        let out = s
        for (const sz of sizes) {
            const re = new RegExp(`[-\\s]${sz}$`, 'i')
            if (re.test(out)) {
                out = out.replace(re, '').trim()
                break
            }
        }
        return out || s
    }

    /** Normalize size for column: M, L, XL, XXL, XXXL */
    const normalizeSize = (size: string | null | undefined): 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | null => {
        if (!size || typeof size !== 'string') return null
        const u = size.trim().toUpperCase()
        if (['M', 'L', 'XL', 'XXL', 'XXXL'].includes(u)) return u as 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
        return null
    }

    const handleExportExcel = () => {
        try {
            const exportData = filteredReceptions.map(r => ({
                'Date': new Date(r.date).toLocaleDateString(),
                'Heure': new Date(r.createdAt).toLocaleTimeString(),
                'Atelier': atelierName(r),
                'Articles': r.items?.length ?? 0,
                'Coût Total (DA)': r.totalCost ?? 0,
                'Montant Payé (DA)': r.amountPaid ?? 0,
                'Reste à Payer (DA)': restToPay(r),
                'Statut': paymentStatusLabel(r.paymentStatus),
                'Notes': r.notes || ''
            }))
            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Réceptions Ateliers')
            XLSX.writeFile(wb, `Stock_Ateliers_${new Date().toISOString().split('T')[0]}.xlsx`)
            toast.success('Export Excel téléchargé !')
        } catch (e) {
            console.error(e)
            toast.error('Erreur lors de l\'export')
        }
    }

    /** Advanced export: one sheet per atelier; each sheet lists products (one row per product) with M/L/XL/XXL/XXXL, total, price, payment */
    const handleExportExcelAdvanced = () => {
        try {
            const SIZE_COLS = ['M', 'L', 'XL', 'XXL', 'XXXL'] as const
            const receptionsByAtelier = new Map<string, { name: string; receptions: typeof filteredReceptions }>()
            filteredReceptions.forEach(r => {
                const name = atelierName(r)
                const key = (r.atelierId || name || '').toString() || 'Sans atelier'
                if (!receptionsByAtelier.has(key)) {
                    receptionsByAtelier.set(key, { name, receptions: [] })
                }
                receptionsByAtelier.get(key)!.receptions.push(r)
            })

            const wb = XLSX.utils.book_new()
            receptionsByAtelier.forEach(({ name, receptions: atelierReceptions }) => {
                const byProduct = new Map<string, { M: number; L: number; XL: number; XXL: number; XXXL: number; totalQty: number; unitCostSum: number; costQty: number }>()
                atelierReceptions.forEach(reception => {
                    const items = reception.items || []
                    items.forEach((item: { productName: string; reference?: string; size?: string | null; quantity: number; unitCost?: number }) => {
                        const base = baseProductName(item.productName, item.size)
                        const key = base || item.productName || item.reference || 'Sans nom'
                        const sizeCol = normalizeSize(item.size)
                        const qty = item.quantity ?? 0
                        const unitCost = Number(item.unitCost) || 0

                        if (!byProduct.has(key)) {
                            byProduct.set(key, { M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0, totalQty: 0, unitCostSum: 0, costQty: 0 })
                        }
                        const row = byProduct.get(key)!
                        row.totalQty += qty
                        row.unitCostSum += unitCost * qty
                        row.costQty += qty
                        if (sizeCol) row[sizeCol] += qty
                    })
                })

                const sheetData = [
                    ['Nom produit', ...SIZE_COLS, 'Quantité totale', 'Prix unitaire (DA)', 'Montant (DA)'],
                    ...Array.from(byProduct.entries()).map(([productName, row]) => {
                        const unitPrice = row.costQty > 0 ? row.unitCostSum / row.costQty : 0
                        const payment = row.totalQty * unitPrice
                        return [
                            productName,
                            row.M || '',
                            row.L || '',
                            row.XL || '',
                            row.XXL || '',
                            row.XXXL || '',
                            row.totalQty,
                            Math.round(unitPrice * 100) / 100,
                            Math.round(payment * 100) / 100
                        ]
                    })
                ]
                const ws = XLSX.utils.aoa_to_sheet(sheetData)
                const sheetName = (name || 'Atelier').replace(/[\s:*?\/\\\[\]]/g, '_').slice(0, 31)
                XLSX.utils.book_append_sheet(wb, ws, sheetName)
            })

            if (wb.SheetNames.length === 0) {
                toast.info('Aucune réception à exporter.')
                return
            }
            XLSX.writeFile(wb, `Ateliers_Produits_${new Date().toISOString().split('T')[0]}.xlsx`)
            toast.success('Export Excel (un onglet par atelier) téléchargé !')
        } catch (e) {
            console.error(e)
            toast.error('Erreur lors de l\'export avancé')
        }
    }

    const filteredReceptions = receptions.filter(r => {
        const name = atelierName(r).toLowerCase()
        const isNotReturn = !name.includes('retour client')
        const matches = name.includes(searchTerm.toLowerCase()) || (r.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
        return isNotReturn && matches
    })

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            Ateliers & Réceptions
                        </h1>
                        <p className="text-muted-foreground">Gérer les ateliers et le suivi des réceptions (coûts et paiements)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handleExportExcel} variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Excel Réceptions
                        </Button>
                        <Button onClick={handleExportExcelAdvanced} className="bg-green-600 hover:bg-green-700">
                            <Download className="h-4 w-4 mr-2" />
                            Excel Avancé (1 onglet / atelier)
                        </Button>
                    </div>
                </div>

                {/* Ateliers: add new */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ateliers</CardTitle>
                        <p className="text-sm text-muted-foreground">Ajouter un atelier pour l’utiliser comme source lors des entrées de stock.</p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <Label>Nouvel atelier</Label>
                            <Input
                                placeholder="Ex: Atelier Alger"
                                value={newAtelierName}
                                onChange={(e) => setNewAtelierName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddAtelier()}
                            />
                        </div>
                        <Button onClick={handleAddAtelier} disabled={isAddingAtelier || !newAtelierName.trim()}>
                            {isAddingAtelier ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                            Ajouter
                        </Button>
                        {ateliers.length > 0 && (
                            <div className="w-full mt-4">
                                <Label className="text-sm font-medium">Ateliers déjà créés</Label>
                                <div className="mt-2 rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Nom de l&apos;atelier</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ateliers.map((a, i) => (
                                                <TableRow key={a.id}>
                                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell className="font-medium">{a.name}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un atelier..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sessions de Réception</CardTitle>
                        <p className="text-sm text-muted-foreground">Coût total et montant payé viennent de la base de données.</p>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                <p className="text-muted-foreground">Chargement...</p>
                            </div>
                        ) : filteredReceptions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Aucune réception trouvée.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Atelier</TableHead>
                                            <TableHead>Coût Total (DB)</TableHead>
                                            <TableHead>Payé</TableHead>
                                            <TableHead>Reste à payer</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReceptions.map((reception) => (
                                            <TableRow key={reception.id}>
                                                <TableCell>
                                                    <div className="font-medium">{new Date(reception.date).toLocaleDateString()}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(reception.createdAt).toLocaleTimeString()}</div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {atelierName(reception)}
                                                    {reception.notes && <div className="text-xs text-muted-foreground italic max-w-[200px] truncate">{reception.notes}</div>}
                                                </TableCell>
                                                <TableCell>{(reception.totalCost ?? 0).toLocaleString()} DA</TableCell>
                                                <TableCell>{(reception.amountPaid ?? 0).toLocaleString()} DA</TableCell>
                                                <TableCell className="font-medium">{restToPay(reception).toLocaleString()} DA</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={reception.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                                                        className={`cursor-pointer ${reception.paymentStatus === 'PAID' ? 'bg-green-600' : 'bg-yellow-500 text-white'}`}
                                                        onClick={() => handleOpenPaymentModal(reception)}
                                                    >
                                                        {paymentStatusLabel(reception.paymentStatus)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenPaymentModal(reception)}>
                                                        Gérer Paiement
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Paiement — {selectedReception && atelierName(selectedReception)}</DialogTitle>
                        </DialogHeader>
                        {selectedReception && (
                            <div className="py-4 space-y-4">
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Coût total :</span>
                                        <span className="font-bold text-lg">{(selectedReception.totalCost ?? 0).toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Déjà payé :</span>
                                        <span>{(selectedReception.amountPaid ?? 0).toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Reste à payer :</span>
                                        <span>{restToPay(selectedReception).toLocaleString()} DA</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Montant payé (DA)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Statut : montant ≥ coût total → PAYÉ ; 0 &lt; montant &lt; coût → PARTIEL ; sinon EN ATTENTE.
                                </p>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleSavePayment} disabled={isSavingPayment}>
                                {isSavingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Enregistrer
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}
