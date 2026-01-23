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
    XCircle,
    Calendar,
    Download,
    Edit,
    Loader2,
    Search
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
    const [receptions, setReceptions] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedReception, setSelectedReception] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentType, setPaymentType] = useState<'TOTAL' | 'PARTIAL'>('TOTAL')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [receptionsResponse, productsResponse] = await Promise.all([
                api.getReceptions() as any,
                api.products.getAll({ limit: 10000 }) as any
            ])
            setReceptions(receptionsResponse.receptions || [])
            setProducts(productsResponse.products || [])
        } catch (error) {
            console.error('Failed to fetch data', error)
            toast.error('Erreur lors du chargement des données')
        } finally {
            setIsLoading(false)
        }
    }

    const calculateCost = (reception: any) => {
        return reception.items.reduce((total: number, item: any) => {
            // Find product to get buying price
            // Item might have product details or just name/ref. 
            // The item object from reception usually has productName/reference.
            const product = products.find(p => p.name === item.productName || p.reference === item.reference)
            const buyingPrice = product?.buyingPrice || 0
            return total + (buyingPrice * item.quantity)
        }, 0)
    }

    const handleOpenPaymentModal = (reception: any) => {
        setSelectedReception(reception)
        const cost = calculateCost(reception)
        // If we tracked partial payments, we'd subtract them here. 
        // For now, assuming standard flow.
        setPaymentAmount(cost.toString())
        setPaymentType('TOTAL')
        setPaymentModalOpen(true)
    }

    const handleSavePayment = async () => {
        if (!selectedReception) return

        const cost = calculateCost(selectedReception)
        let noteUpdate = ''
        let newStatus = 'PAID'

        if (paymentType === 'PARTIAL') {
            const amount = parseFloat(paymentAmount)
            if (isNaN(amount) || amount <= 0) {
                toast.error('Montant invalide')
                return
            }
            const rest = cost - amount
            noteUpdate = ` | Paiement Partiel: ${amount.toLocaleString()} DA (Reste: ${rest.toLocaleString()} DA)`
            newStatus = 'PARTIALLY_PAID' // Assuming backend supports or we handle via notes + PENDING
            // If backend enum is strict (PAID/PENDING), we might keep PENDING but add note.
            // Let's assume PENDING for partial if backend doesn't support PARTIAL.
            newStatus = 'PENDING'
        }

        const updatedNotes = (selectedReception.notes || '') + noteUpdate

        try {
            // Optimistic update
            setReceptions(prev => prev.map(r =>
                r.id === selectedReception.id ? {
                    ...r,
                    paymentStatus: paymentType === 'TOTAL' ? 'PAID' : 'PENDING',
                    notes: updatedNotes
                } : r
            ))

            await api.updateReception(selectedReception.id, {
                paymentStatus: paymentType === 'TOTAL' ? 'PAID' : 'PENDING',
                notes: updatedNotes
            })

            toast.success('Paiement enregistré')
            setPaymentModalOpen(false)
            fetchData() // Refresh to be safe
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
            fetchData() // Revert
        }
    }

    const handleExportExcel = () => {
        try {
            const exportData = filteredReceptions.map(r => {
                const cost = calculateCost(r)
                return {
                    'Date': new Date(r.date).toLocaleDateString(),
                    'Heure': new Date(r.createdAt).toLocaleTimeString(),
                    'Atelier': r.atelier,
                    'Articles': r.items.length,
                    'Détail Articles': r.items.map((i: any) => `${i.quantity}x ${i.productName} (${i.size})`).join(', '),
                    'Coût Calculé (DA)': cost,
                    'Statut Paiement': r.paymentStatus === 'PAID' ? 'PAYÉ' : 'EN ATTENTE',
                    'Notes': r.notes || ''
                }
            })

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Réceptions Ateliers")

            // Adjust column widths
            const wscols = [
                { wch: 12 }, // Date
                { wch: 10 }, // Heure
                { wch: 25 }, // Atelier
                { wch: 10 }, // Nb Articles
                { wch: 50 }, // Détail
                { wch: 15 }, // Coût
                { wch: 15 }, // Statut
                { wch: 30 }  // Notes
            ]
            ws['!cols'] = wscols

            XLSX.writeFile(wb, `Stock_Ateliers_${new Date().toISOString().split('T')[0]}.xlsx`)
            toast.success('Export Excel téléchargé !')
        } catch (error) {
            console.error('Export error', error)
            toast.error('Erreur lors de l\'export')
        }
    }

    // Filter only Atelier receptions and search term
    const filteredReceptions = receptions.filter(r => {
        // Assume anything that is NOT a "Retour" or "Echange" is an Atelier reception if source is set?
        // Or simply check if 'atelier' field corresponds to known ateliers?
        // For now, user said "show only ateliers entrees". Usually identified by 'atelier' field not being empty.
        // Assuming strict filter isn't easy without known list, but usually 'atelier' field holds the name.
        const isAtelier = r.atelier && r.atelier.trim().length > 0
        const isNotReturn = !r.atelier.toLowerCase().includes('retour client')
        const matchesSearch = r.atelier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        return isAtelier && isNotReturn && matchesSearch
    })

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            Historique des Réceptions Atelier
                        </h1>
                        <p className="text-muted-foreground">Suivi des entrées de stock, coûts calculés et paiements</p>
                    </div>
                    <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Excel
                    </Button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un atelier..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sessions de Réception</CardTitle>
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
                                            <TableHead>Détails</TableHead>
                                            <TableHead>Coût Calculé</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReceptions.map((reception) => {
                                            const cost = calculateCost(reception)
                                            return (
                                                <TableRow key={reception.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{new Date(reception.date).toLocaleDateString()}</div>
                                                        <div className="text-xs text-muted-foreground">{new Date(reception.createdAt).toLocaleTimeString()}</div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {reception.atelier}
                                                        {reception.notes && <div className="text-xs text-muted-foreground italic max-w-[200px] truncate">{reception.notes}</div>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <span className="font-bold">{reception.items.length}</span> articles
                                                        </div>
                                                        <div className="text-xs text-muted-foreground max-w-[300px] truncate">
                                                            {reception.items.slice(0, 3).map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                                                            {reception.items.length > 3 && '...'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-blue-600">
                                                            {cost.toLocaleString()} DA
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={reception.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                                                            className={`cursor-pointer ${reception.paymentStatus === 'PAID' ? 'bg-green-600' : 'bg-yellow-500 text-white'}`}
                                                            onClick={() => handleOpenPaymentModal(reception)}
                                                        >
                                                            {reception.paymentStatus === 'PAID' ? (
                                                                <div className="flex items-center">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    PAYÉ
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    EN ATTENTE
                                                                </div>
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleOpenPaymentModal(reception)}
                                                        >
                                                            Gérer Paiement
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Modal */}
                <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Gestion du Paiement - {selectedReception?.atelier}</DialogTitle>
                        </DialogHeader>
                        {selectedReception && (
                            <div className="py-4 space-y-4">
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Coût Total Calculé:</span>
                                        <span className="font-bold text-lg">{calculateCost(selectedReception).toLocaleString()} DA</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Type de Paiement</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={paymentType === 'TOTAL' ? 'default' : 'outline'}
                                            className="flex-1"
                                            onClick={() => {
                                                setPaymentType('TOTAL')
                                                setPaymentAmount(calculateCost(selectedReception).toString())
                                            }}
                                        >
                                            Total
                                        </Button>
                                        <Button
                                            variant={paymentType === 'PARTIAL' ? 'default' : 'outline'}
                                            className="flex-1"
                                            onClick={() => {
                                                setPaymentType('PARTIAL')
                                                setPaymentAmount('')
                                            }}
                                        >
                                            Partiel
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Montant Payé (DA)</Label>
                                    <Input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        disabled={paymentType === 'TOTAL'}
                                    />
                                </div>

                                {paymentType === 'PARTIAL' && paymentAmount && (
                                    <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm flex justify-between">
                                        <span>Reste à payer:</span>
                                        <span className="font-bold">
                                            {(calculateCost(selectedReception) - (parseFloat(paymentAmount) || 0)).toLocaleString()} DA
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleSavePayment}>Confirmer Paiement</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    )
}

