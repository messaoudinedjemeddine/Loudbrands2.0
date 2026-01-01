'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Scan,
    PackagePlus,
    PackageMinus,
    History,
    Printer,
    Search,
    Download,
    Tag,
    ArrowUp,
    ArrowDown,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    RotateCcw,
    FileSpreadsheet
} from 'lucide-react'
import { api } from '@/lib/api'
import { yalidineAPI } from '@/lib/yalidine-api'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'

const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

interface StockMovement {
    id: string
    timestamp: Date
    type: 'in' | 'out'
    barcode: string
    productName: string
    productReference: string
    size: string
    quantity: number
    oldStock: number
    newStock: number
    orderNumber?: string
    trackingNumber?: string
    notes?: string
}

// Shared Helper for Yalidine Product Lists
const parseYalidineProductList = (productList: string) => {
    if (!productList) return []

    const items: any[] = []
    const lines = productList.split('\n').filter(line => line.trim())

    for (const line of lines) {
        // Regex to match "2x Product Name (Size)"
        const match = line.trim().match(/^(\d+)x\s+(.+?)(?:\s+\(([^)]+)\))?$/)
        if (match) {
            const quantity = parseInt(match[1])
            const productName = match[2].trim()
            const size = match[3]?.trim() || ''

            items.push({
                originalLine: line.trim(),
                quantity,
                productName,
                size
            })
        }
    }

    return items
}

export default function InventorySmartPage() {
    const [activeTab, setActiveTab] = useState('labels')
    const [history, setHistory] = useState<StockMovement[]>([])

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('inventory-history')
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory)
                setHistory(parsed.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                })))
            } catch (e) {
                console.error('Failed to load history', e)
            }
        }
    }, [])

    // Save history to localStorage whenever it changes
    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem('inventory-history', JSON.stringify(history))
        }
    }, [history])

    const addToHistory = (movement: StockMovement) => {
        setHistory(prev => [movement, ...prev].slice(0, 1000)) // Keep last 1000 entries
    }

    return (
        <AdminLayout>
            <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestion d'Inventaire Intelligent</h1>
                    <p className="text-muted-foreground">Contrôle professionnel de l'inventaire avec scan de codes-barres</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="labels" className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Étiquettes
                        </TabsTrigger>
                        <TabsTrigger value="stock-in" className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4" />
                            Entrée
                        </TabsTrigger>
                        <TabsTrigger value="stock-out" className="flex items-center gap-2">
                            <ArrowDown className="h-4 w-4" />
                            Sortie
                        </TabsTrigger>
                        <TabsTrigger value="echange" className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Échange
                        </TabsTrigger>
                        <TabsTrigger value="retour" className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Retour
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Hist.
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden mt-4">
                        <TabsContent value="labels" className="h-full m-0">
                            <LabelsSection />
                        </TabsContent>
                        <TabsContent value="stock-in" className="h-full m-0">
                            <StockInSection onStockAdded={addToHistory} />
                        </TabsContent>
                        <TabsContent value="stock-out" className="h-full m-0">
                            <StockOutSection onStockRemoved={addToHistory} history={history} />
                        </TabsContent>
                        <TabsContent value="echange" className="h-full m-0">
                            <EchangeSection onStockRemoved={addToHistory} history={history} />
                        </TabsContent>
                        <TabsContent value="retour" className="h-full m-0">
                            <RetourSection onStockAdded={addToHistory} history={history} />
                        </TabsContent>
                        <TabsContent value="history" className="h-full m-0">
                            <HistoryTable data={history} title="Historique Global" showFilters={true} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </AdminLayout>
    )
}

// Labels Section
function LabelsSection() {
    const [products, setProducts] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [generatingId, setGeneratingId] = useState<string | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        fetchProducts(1)
    }, [])

    const fetchProducts = async (pageNum: number, search?: string) => {
        setIsLoading(true)
        try {
            const response = await api.products.getAll({
                page: pageNum,
                limit: 20,
                search: search || undefined
            }) as any
            setProducts(response.products || [])
            setTotalPages(response.pagination?.pages || 1)
            setPage(pageNum)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Échec du chargement des produits', error)
            }
            toast.error('Échec du chargement des produits')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchProducts(1, searchQuery)
    }

    const handlePrint = async (product: any) => {
        if (!product) {
            toast.error('Produit introuvable')
            return
        }
        
        setGeneratingId(product.id)
        try {
            // Check if product is an accessory (no sizes or category is accessoires)
            const categorySlug = product?.category?.slug?.toLowerCase() || ''
            const isAccessoire = categorySlug.includes('accessoire') || 
                                categorySlug.includes('accessories') ||
                                !product.sizes || 
                                product.sizes.length === 0

            // User Request: 11cm width x 15cm height
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [110, 150]
            })

            let col = 0
            let row = 0
            const colWidth = 55 // 110mm / 2
            const rowHeight = 75 // 150mm / 2

            if (isAccessoire) {
                // For accessories: use total stock and product reference only (no size)
                const totalStock = product?.stock || 0
                const barcodeValue = product?.reference || product?.id || 'N/A'

                // Generate labels based on total stock
                for (let i = 0; i < totalStock; i++) {
                    // Determine x,y based on grid
                    const x = col * colWidth
                    const y = row * rowHeight

                    const qrDataUrl = await QRCode.toDataURL(barcodeValue)

                    // Draw Border (Optional, helps visual separation)
                    doc.setDrawColor(200)
                    doc.rect(x + 2, y + 2, colWidth - 4, rowHeight - 4)

                    // Product Name (Truncated)
                    doc.setFontSize(8)
                    doc.text((product.name || 'Produit').substring(0, 25), x + 5, y + 10)

                    // QR Code (Centered)
                    // 35x35mm QR code
                    doc.addImage(qrDataUrl, 'PNG', x + 10, y + 15, 35, 35)

                    // Barcode Value (Small text at bottom)
                    doc.setFontSize(7)
                    doc.text(barcodeValue, x + 5, y + 55)

                    // Advance Grid
                    col++
                    if (col >= 2) {
                        col = 0
                        row++
                    }

                    // New Page if grid full (2x2 = 4 items)
                    if (row >= 2) {
                        doc.addPage()
                        col = 0
                        row = 0
                    }
                }
            } else {
                // For products with sizes: use existing logic
                for (const size of product?.sizes || []) {
                    // Determine x,y based on grid
                    const x = col * colWidth
                    const y = row * rowHeight

                    const barcodeValue = `${product.reference}-${size.size}`
                    const qrDataUrl = await QRCode.toDataURL(barcodeValue)

                    // Draw Border (Optional, helps visual separation)
                    doc.setDrawColor(200)
                    doc.rect(x + 2, y + 2, colWidth - 4, rowHeight - 4)

                    // Product Name (Truncated)
                    doc.setFontSize(8)
                    doc.text((product.name || 'Produit').substring(0, 25), x + 5, y + 10)

                    // QR Code (Centered)
                    // 35x35mm QR code
                    doc.addImage(qrDataUrl, 'PNG', x + 10, y + 15, 35, 35)

                    // Barcode Value (Small text at bottom)
                    doc.setFontSize(7)
                    doc.text(barcodeValue, x + 5, y + 55)

                    // Advance Grid
                    col++
                    if (col >= 2) {
                        col = 0
                        row++
                    }

                    // New Page if grid full (2x2 = 4 items)
                    if (row >= 2) {
                        doc.addPage()
                        col = 0
                        row = 0
                    }
                }
            }

            // Save
            doc.save(`${product.reference}-labels.pdf`)
            toast.success('Étiquettes générées (11x15cm) !')
        } catch (error) {
            console.error('Échec de la génération des étiquettes', error)
            toast.error('Échec de la génération des étiquettes')
        } finally {
            setGeneratingId(null)
        }
    }

    const filteredProducts = products.filter(p => 
        p != null && p != undefined
    ).filter(p =>
        !searchQuery ||
        p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p?.reference?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Étiquettes Produits
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
                {/* Search */}
                <form onSubmit={handleSearch} className="mb-3">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Rechercher par nom ou référence..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 h-9 text-sm"
                        />
                        <Button type="submit" variant="outline" size="sm" className="h-9">
                            <Search className="h-4 w-4 mr-1.5" />
                            Rechercher
                        </Button>
                    </div>
                </form>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Chargement des produits...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            Aucun produit trouvé
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredProducts.filter(p => p != null).map(product => (
                                <div
                                    key={product?.id || Math.random()}
                                    className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                                            {(() => {
                                                const imageUrl = product.image || product.images?.[0]?.url || product.images?.[0]
                                                return imageUrl ? (
                                                    <Image
                                                        src={imageUrl}
                                                        alt={product.name || 'Product'}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized={imageUrl?.startsWith('http') || imageUrl?.includes('cloudinary.com')}
                                                        onError={(e) => {
                                                            // Fallback if image fails to load
                                                            const target = e.target as HTMLImageElement
                                                            target.style.display = 'none'
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                                        No Image
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm truncate">{product?.name || 'Produit sans nom'}</h3>
                                            <p className="text-xs text-muted-foreground truncate">{product?.reference || 'N/A'}</p>
                                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                                {(() => {
                                                    const categorySlug = product.category?.slug?.toLowerCase() || ''
                                                    const isAccessoire = categorySlug.includes('accessoire') || 
                                                                        categorySlug.includes('accessories') ||
                                                                        !product.sizes || 
                                                                        product.sizes.length === 0
                                                    
                                                    if (isAccessoire) {
                                                        return (
                                                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                                Accessoire - Stock: {product.stock || 0}
                                                            </Badge>
                                                        )
                                                    } else {
                                                        return (product.sizes || []).map((size: any) => (
                                                            <Badge key={size.id} variant="secondary" className="text-xs px-1.5 py-0">
                                                                {size.size} ({size.stock || 0})
                                                            </Badge>
                                                        ))
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => {
                                                setSelectedProduct(product)
                                                setShowPreview(true)
                                            }}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => handlePrint(product)}
                                            disabled={generatingId === product.id}
                                        >
                                            {generatingId === product.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Printer className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-3 pt-3 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={page <= 1}
                            onClick={() => fetchProducts(page - 1, searchQuery)}
                        >
                            Précédent
                        </Button>
                        <span className="flex items-center px-3 text-sm">
                            Page {page} sur {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={page >= totalPages}
                            onClick={() => fetchProducts(page + 1, searchQuery)}
                        >
                            Suivant
                        </Button>
                    </div>
                )}
            </CardContent>

            {/* Label Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Aperçu des Étiquettes - {selectedProduct?.name || 'Produit'}</DialogTitle>
                        <DialogDescription>
                            {(() => {
                                const categorySlug = selectedProduct?.category?.slug?.toLowerCase() || ''
                                const isAccessoire = categorySlug.includes('accessoire') || 
                                                    categorySlug.includes('accessories') ||
                                                    !selectedProduct?.sizes || 
                                                    selectedProduct.sizes.length === 0
                                return isAccessoire 
                                    ? `Format du code-barres : ${selectedProduct?.reference} (Accessoire - Stock total: ${selectedProduct?.stock || 0})`
                                    : `Format du code-barres : ${selectedProduct?.reference}-TAILLE`
                            })()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {(() => {
                            const categorySlug = selectedProduct?.category?.slug?.toLowerCase() || ''
                            const isAccessoire = categorySlug.includes('accessoire') || 
                                                categorySlug.includes('accessories') ||
                                                !selectedProduct?.sizes || 
                                                selectedProduct?.sizes.length === 0

                            if (isAccessoire) {
                                // Show single preview for accessory with total stock
                                const barcodeValue = selectedProduct?.reference || selectedProduct?.id
                                const totalStock = selectedProduct?.stock || 0
                                return (
                                    <div className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-bold">{selectedProduct?.name || 'Produit sans nom'}</p>
                                                <p className="text-sm text-muted-foreground">Accessoire (Pas de taille)</p>
                                                <p className="text-xs text-muted-foreground font-mono">{barcodeValue}</p>
                                            </div>
                                            <Badge variant="secondary">Stock total : {totalStock}</Badge>
                                        </div>
                                        <div className="bg-muted p-4 rounded text-center">
                                            <p className="text-xs text-muted-foreground mb-2">
                                                {totalStock} étiquette(s) sera(ont) générée(s) lors de l'impression
                                            </p>
                                            <p className="font-mono text-sm">{barcodeValue}</p>
                                        </div>
                                    </div>
                                )
                            } else {
                                // Show preview for products with sizes
                                return selectedProduct?.sizes?.map((size: any) => {
                                    const barcodeValue = `${selectedProduct.reference}-${size.size}`
                                    return (
                                        <div key={size.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="font-bold">{selectedProduct?.name || 'Produit sans nom'}</p>
                                                    <p className="text-sm text-muted-foreground">Taille : {size.size}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{barcodeValue}</p>
                                                </div>
                                                <Badge variant="secondary">Stock : {size.stock || 0}</Badge>
                                            </div>
                                            <div className="bg-muted p-4 rounded text-center">
                                                <p className="text-xs text-muted-foreground mb-2">Le code QR sera généré lors de l'impression</p>
                                                <p className="font-mono text-sm">{barcodeValue}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

// Stock In Section
function StockInSection({ onStockAdded }: { onStockAdded: (movement: StockMovement) => void }) {
    const [atelier, setAtelier] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')

    // Session state
    const [sessionItems, setSessionItems] = useState<any[]>([])
    const [barcode, setBarcode] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!barcode.trim()) return

        setIsLoading(true)
        try {
            const barcodeValue = barcode.trim()
            let reference = barcodeValue
            let size: string | null = null

            // Strategy 1: Try exact reference match first (for accessories)
            // Search for product by reference (exact match)
            let response = await api.products.getAll({ search: barcodeValue, limit: 100 }) as any
            let products = response.products || []
            let product = products.find((p: any) => p.reference === barcodeValue)
            
            // If not found, try broader search
            if (!product) {
                response = await api.products.getAll({ limit: 1000 }) as any
                products = response.products || []
                product = products.find((p: any) => p.reference === barcodeValue)
            }
            
            if (product) {
                // Check if it's an accessory FIRST
                const categorySlug = product.category?.slug?.toLowerCase() || ''
                const isAccessoire = categorySlug.includes('accessoire') || 
                                    categorySlug.includes('accessories') ||
                                    !product.sizes || 
                                    product.sizes.length === 0
                
                if (isAccessoire) {
                    // It's an accessory - use reference only, no size
                    reference = barcodeValue
                    size = null
                    // Skip to adding item - don't check for size format
                } else {
                    // Product has sizes - check if barcode includes size
                    const parts = barcodeValue.split('-')
                    if (parts.length >= 2) {
                        const possibleSize = parts[parts.length - 1]
                        const possibleReference = parts.slice(0, -1).join('-')
                        
                        if (possibleReference === product.reference) {
                            const sizeObj = product.sizes?.find((s: any) => s.size === possibleSize)
                            if (sizeObj) {
                                reference = possibleReference
                                size = possibleSize
                            } else {
                                toast.error(`Taille "${possibleSize}" introuvable pour "${product.name}"`)
                                return
                            }
                        } else {
                            // Barcode doesn't match REFERENCE-SIZE format
                            toast.error(`Produit "${product.name}" nécessite une taille. Format: ${product.reference}-TAILLE`)
                            return
                        }
                    } else {
                        // Barcode is just reference, but product needs size
                        toast.error(`Produit "${product.name}" nécessite une taille. Format: ${product.reference}-TAILLE`)
                        return
                    }
                }
            } else {
                // Strategy 2: Try parsing as REFERENCE-SIZE format
                const parts = barcodeValue.split('-')
                if (parts.length >= 2) {
                    const possibleSize = parts[parts.length - 1]
                    const possibleReference = parts.slice(0, -1).join('-')
                    
                    // Search for product by reference
                    if (!product) {
                        // Try searching with the possible reference
                        response = await api.products.getAll({ search: possibleReference, limit: 50 }) as any
                        products = response.products || []
                    }
                    product = products.find((p: any) => p.reference === possibleReference)
                    
                    if (product) {
                        // Check if product is an accessory
                        const categorySlug = product.category?.slug?.toLowerCase() || ''
                        const isAccessoire = categorySlug.includes('accessoire') || 
                                            categorySlug.includes('accessories') ||
                                            !product.sizes || 
                                            product.sizes.length === 0
                        
                        if (isAccessoire) {
                            // It's an accessory - ignore the size part, use reference only
                            reference = product.reference
                            size = null
                        } else {
                            // Product has sizes, validate the size
                            const sizeObj = product.sizes?.find((s: any) => s.size === possibleSize)
                            if (sizeObj) {
                                reference = possibleReference
                                size = possibleSize
                            } else {
                                toast.error(`Taille "${possibleSize}" introuvable pour "${product.name}"`)
                                return
                            }
                        }
                    } else {
                        // Product not found - try searching by partial match
                        product = products.find((p: any) => 
                            p.reference?.toLowerCase().includes(barcodeValue.toLowerCase()) ||
                            barcodeValue.toLowerCase().includes(p.reference?.toLowerCase())
                        )
                        
                        if (product) {
                            // Check if it's an accessory
                            const categorySlug = product.category?.slug?.toLowerCase() || ''
                            const isAccessoire = categorySlug.includes('accessoire') || 
                                                categorySlug.includes('accessories') ||
                                                !product.sizes || 
                                                product.sizes.length === 0
                            
                            if (isAccessoire && product.reference === barcodeValue) {
                                reference = product.reference
                                size = null
                            } else {
                                toast.error(`Référence "${barcodeValue}" introuvable ou format incorrect`)
                                return
                            }
                        } else {
                            toast.error(`Référence "${barcodeValue}" introuvable`)
                            return
                        }
                    }
                } else {
                    // Single part - could be accessory reference
                    // Search for exact match
                    product = products.find((p: any) => p.reference === barcodeValue)
                    
                    if (product) {
                        const categorySlug = product.category?.slug?.toLowerCase() || ''
                        const isAccessoire = categorySlug.includes('accessoire') || 
                                            categorySlug.includes('accessories') ||
                                            !product.sizes || 
                                            product.sizes.length === 0
                        
                        if (isAccessoire) {
                            reference = barcodeValue
                            size = null
                        } else {
                            toast.error(`Produit "${product.name}" nécessite une taille. Format: ${product.reference}-TAILLE`)
                            return
                        }
                    } else {
                        toast.error(`Référence "${barcodeValue}" introuvable`)
                        return
                    }
                }
            }

            // Verify product was found
            if (!product) {
                toast.error(`Référence "${barcodeValue}" introuvable`)
                return
            }

            // Add to session items
            const qty = parseInt(quantity) || 1
            if (qty <= 0) return

            // Check if item already exists in session
            const existingItemIndex = sessionItems.findIndex(
                item => item.product.reference === reference && item.size === size
            )

            if (existingItemIndex >= 0) {
                const newItems = [...sessionItems]
                newItems[existingItemIndex].quantity += qty
                setSessionItems(newItems)
                toast.success(`+${qty} ${product.name}${size ? ` (${size})` : ' (Accessoire)'}`)
            } else {
                setSessionItems(prev => [{
                    product,
                    size: size || null,
                    quantity: qty,
                    reference,
                    barcode: barcode.trim(),
                    timestamp: new Date()
                }, ...prev])
                toast.success(`Ajouté: ${product.name}${size ? ` (${size})` : ' (Accessoire)'}`)
            }

            setBarcode('')
            setQuantity('1')
            inputRef.current?.focus()

        } catch (error: any) {
            toast.error(error.message || 'Erreur scan')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinishReception = async () => {
        if (sessionItems.length === 0) {
            toast.error('Aucun article')
            return
        }

        const targetAtelier = atelier.trim() || "Réception Rapide"

        setIsSaving(true)
        try {
            const payload = {
                atelier: targetAtelier,
                date,
                notes,
                items: sessionItems.map(item => ({
                    productName: item.product.name,
                    reference: item.reference,
                    size: item.size || null, // null for accessories
                    quantity: item.quantity,
                    barcode: item.barcode
                }))
            }

            const result: any = await api.createReception(payload)

            const failures = result.stockUpdates?.filter((u: any) => u.status === 'failed') || []
            if (failures.length > 0) {
                toast.error(`${failures.length} échecs. Vérifiez les références exactes.`)
            } else {
                toast.success(`Stock mis à jour ! (${sessionItems.reduce((a, b) => a + b.quantity, 0)} articles)`)
            }

            // Add to local history
            sessionItems.forEach(item => {
                onStockAdded({
                    id: Date.now().toString() + Math.random(),
                    timestamp: new Date(),
                    type: 'in',
                    barcode: item.barcode,
                    productName: item.product.name,
                    productReference: item.reference,
                    size: item.size || null, // null for accessories
                    quantity: item.quantity,
                    oldStock: 0,
                    newStock: 0,
                    notes: `Reception: ${targetAtelier}`
                })
            })

            // Cleanup but keep values? No, reset for next batch
            setSessionItems([])
            setBarcode('')
            // Don't reset atelier/date to allow continuous work

        } catch (error: any) {
            console.error(error)
            toast.error('Erreur sauvegarde')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <ArrowUp className="h-5 w-5 text-green-500" />
                    Entrée Stock (Réception)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">

                {/* Header Inputs - Compact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border">
                    <div className="space-y-1">
                        <Label className="text-xs">Atelier / Source</Label>
                        <Input
                            value={atelier}
                            onChange={(e) => setAtelier(e.target.value)}
                            placeholder="Ex: Atelier Alger (Optionnel)"
                            className="h-8 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>
                </div>

                {/* Scanning & List Area */}
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                    {/* Left: Scanner */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                        <form onSubmit={handleScan} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Scanner ici..."
                                className="flex-1 h-10"
                                disabled={isLoading || isSaving}
                                autoFocus
                            />
                            <Input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-16 h-10 text-center"
                            />
                            <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                            </Button>
                        </form>

                        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                            <p className="text-sm text-green-800 mb-1">Total Session</p>
                            <p className="text-3xl font-bold text-green-600">
                                {sessionItems.reduce((acc, item) => acc + item.quantity, 0)}
                            </p>
                            <p className="text-xs text-green-700 mt-1">Articles scannés</p>
                        </div>

                        <Button
                            size="lg"
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 mt-auto"
                            onClick={handleFinishReception}
                            disabled={sessionItems.length === 0 || isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                            Valider Stock
                        </Button>
                    </div>

                    {/* Right: List */}
                    <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-white">
                        <div className="flex-1 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produit</TableHead>
                                        <TableHead>Taille</TableHead>
                                        <TableHead className="text-right">Qté</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessionItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                                Scannez des articles pour commencer...
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sessionItems.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="py-2">
                                                    <div className="font-medium text-sm truncate max-w-[150px]">{item.product.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.reference}</div>
                                                </TableCell>
                                                <TableCell className="py-2">{item.size || 'Accessoire'}</TableCell>
                                                <TableCell className="text-right py-2 font-bold">+{item.quantity}</TableCell>
                                                <TableCell className="py-2">
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500"
                                                        onClick={() => {
                                                            const n = [...sessionItems]; n.splice(idx, 1); setSessionItems(n);
                                                        }}>
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Stock Out Section
function StockOutSection({ onStockRemoved, history }: { onStockRemoved: (movement: StockMovement) => void, history: StockMovement[] }) {
    const [yalidineBarcode, setYalidineBarcode] = useState('')
    const [scanLogs, setScanLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleYalidineScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!yalidineBarcode.trim()) return

        setIsLoading(true)
        setScanLogs([]) // Clear previous logs

        try {
            const shipment = await yalidineAPI.getShipment(yalidineBarcode.trim())
            const tracking = shipment.tracking || shipment.tracking_number || shipment.tracking || yalidineBarcode.trim()
            const productList = shipment.product_list || shipment.productList || ''

            if (!productList) {
                toast.error('Aucune liste de produits trouvée dans l\'expédition.')
                setIsLoading(false)
                return
            }

            const parsedItems = parseYalidineProductList(productList)

            if (parsedItems.length === 0) {
                toast.error('Impossible d\'analyser les produits. Format attendu: "2x Produit (Taille)"')
                setIsLoading(false)
                return
            }

            const logs = []
            let successCount = 0

            // Process each item immediately
            for (const item of parsedItems) {
                try {
                    // 1. Find Product
                    const productsResponse = await api.products.getAll({
                        search: item.productName,
                        limit: 10
                    }) as any
                    const products = productsResponse.products || []

                    const product = products.find((p: any) =>
                        p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
                        item.productName.toLowerCase().includes(p.name.toLowerCase())
                    )

                    if (!product) {
                        logs.push({
                            status: 'error',
                            message: `Produit "${item.productName}" introuvable`,
                            item
                        })
                        continue
                    }

                    // 2. Check Size
                    const sizeObj = product.sizes?.find((s: any) => s.size === item.size)
                    if (!sizeObj) {
                        logs.push({
                            status: 'error',
                            message: `Taille "${item.size}" introuvable pour "${product.name}"`,
                            item
                        })
                        continue
                    }

                    // 3. Check Stock
                    if ((sizeObj.stock || 0) < item.quantity) {
                        logs.push({
                            status: 'error',
                            message: `Stock insuffisant pour "${product.name}" (${item.size}). Stock: ${sizeObj.stock}, Requis: ${item.quantity}`,
                            item
                        })
                        continue
                    }

                    // 4. Deduct Stock
                    const barcode = `${product.reference}-${item.size}`
                    for (let i = 0; i < item.quantity; i++) {
                        await api.products.scanProduct(barcode, 'remove')
                    }

                    // 5. Add History
                    const oldStock = sizeObj.stock || 0
                    const newStock = Math.max(0, oldStock - item.quantity)

                    const movement: StockMovement = {
                        id: Date.now().toString() + Math.random(),
                        timestamp: new Date(),
                        type: 'out',
                        barcode,
                        productName: product.name,
                        productReference: product.reference,
                        size: item.size,
                        quantity: item.quantity,
                        oldStock,
                        newStock,
                        orderNumber: tracking,
                        trackingNumber: tracking,
                        notes: `Auto-scan deduction: ${item.originalLine}`
                    }
                    onStockRemoved(movement)

                    logs.push({
                        status: 'success',
                        message: `Retiré ${item.quantity}x ${product.name} (${item.size})`,
                        item
                    })
                    successCount++

                } catch (err: any) {
                    console.error(err)
                    logs.push({
                        status: 'error',
                        message: `Erreur système pour "${item.productName}": ${err.message}`,
                        item
                    })
                }
            }

            setScanLogs(logs)
            if (successCount === parsedItems.length) {
                toast.success(`Succès ! ${successCount} articles traités.`)
                setYalidineBarcode('') // Only clear if fully successful
            } else if (successCount > 0) {
                toast.warning(`Partiellement traité. ${successCount}/${parsedItems.length} succès.`)
            } else {
                toast.error('Aucun article n\'a pu être traité.')
            }

        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la récupération du ticket')
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowDown className="h-5 w-5 text-red-500" />
                    Sortie Stock - Scan Automatique
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
                <div className="w-full max-w-2xl mx-auto space-y-6">
                    {/* Yalidine Barcode Input */}
                    <form onSubmit={handleYalidineScan} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-lg">Scanner le Code-Barres Yalidine</Label>
                            <Input
                                ref={inputRef}
                                value={yalidineBarcode}
                                onChange={(e) => setYalidineBarcode(e.target.value)}
                                placeholder="Scanner ici..."
                                className="h-20 text-2xl text-center font-mono placeholder:text-muted-foreground/50"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || !yalidineBarcode.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Traitement en cours...
                                </>
                            ) : (
                                <>
                                    <Scan className="h-5 w-5 mr-2" />
                                    Traiter le Ticket
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Scan Logs */}
                    {scanLogs.length > 0 && (
                        <Card className="bg-muted/50">
                            <CardBody logs={scanLogs} />
                        </Card>
                    )}
                </div>
                <div className="flex-1 overflow-hidden mt-6 border-t pt-4">
                    <HistoryTable
                        data={history.filter(h => h.type === 'out' && !h.notes?.startsWith('Echange'))}
                        title="Dernières Sorties"
                        showFilters={false}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function CardBody({ logs }: { logs: any[] }) {
    return (
        <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <History className="h-4 w-4" />
                Résultat du Traitement
            </h3>
            <div className="space-y-3">
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-lg border flex items-start gap-3 ${log.status === 'success'
                            ? 'bg-green-50 border-green-200 text-green-900'
                            : 'bg-red-50 border-red-200 text-red-900'
                            }`}
                    >
                        {log.status === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium">{log.item.originalLine}</p>
                            <p className="text-sm opacity-90">{log.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    )
}
// Receptions List Component
function ReceptionsList() {
    const [receptions, setReceptions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editCost, setEditCost] = useState('')
    const [showEditDialog, setShowEditDialog] = useState(false)

    useEffect(() => {
        fetchReceptions()
    }, [])

    const fetchReceptions = async () => {
        setIsLoading(true)
        try {
            const response = await api.getReceptions() as any
            setReceptions(response.receptions || [])
        } catch (error) {
            console.error('Failed to fetch receptions', error)
            toast.error('Erreur lors du chargement des réceptions')
        } finally {
            setIsLoading(false)
        }
    }

    const handleMarkAsPaid = async (reception: any) => {
        if (!confirm(`Marquer la réception de "${reception.atelier}" comme PAYÉE ?`)) return

        try {
            await api.updateReception(reception.id, { paymentStatus: 'PAID' })
            toast.success('Réception marquée comme payée')
            fetchReceptions()
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        }
    }

    const openEditCost = (reception: any) => {
        setEditingId(reception.id)
        setEditCost(reception.totalCost?.toString() || '0')
        setShowEditDialog(true)
    }

    const handleSaveCost = async () => {
        if (!editingId) return

        try {
            await api.updateReception(editingId, { totalCost: parseFloat(editCost) })
            toast.success('Coût mis à jour')
            setShowEditDialog(false)
            fetchReceptions()
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        }
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des Réceptions
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        const exportData = receptions.map(r => ({
                            Date: new Date(r.date).toLocaleDateString(),
                            Atelier: r.atelier,
                            Articles: r.items?.length || 0,
                            Cout_Total: r.totalCost,
                            Statut: r.paymentStatus === 'PAID' ? 'PAYÉ' : 'EN ATTENTE',
                            Notes: r.notes || ''
                        }))
                        exportToExcel(exportData, `Receptions_${new Date().toISOString().split('T')[0]}`)
                        toast.success('Export Excel téléchargé !')
                    }}>
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                        Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchReceptions}>
                        Actualiser
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Atelier</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead>Coût Total</TableHead>
                            <TableHead>Statut Paiement</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Chargement...</TableCell>
                            </TableRow>
                        ) : receptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune réception trouvée</TableCell>
                            </TableRow>
                        ) : (
                            receptions.map((reception) => (
                                <TableRow key={reception.id}>
                                    <TableCell>{new Date(reception.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">
                                        {reception.atelier}
                                        {reception.notes && <div className="text-xs text-muted-foreground">{reception.notes}</div>}
                                    </TableCell>
                                    <TableCell>{reception.items?.length || 0} articles</TableCell>
                                    <TableCell>{reception.totalCost?.toLocaleString()} DA</TableCell>
                                    <TableCell>
                                        <Badge variant={reception.paymentStatus === 'PAID' ? 'default' : 'secondary'} className={reception.paymentStatus === 'PAID' ? 'bg-green-600' : 'bg-yellow-500 text-white'}>
                                            {reception.paymentStatus === 'PAID' ? 'PAYÉ' : 'EN ATTENTE'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditCost(reception)}
                                        >
                                            Modifier Prix
                                        </Button>
                                        {reception.paymentStatus !== 'PAID' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-600 text-green-600 hover:bg-green-50"
                                                onClick={() => handleMarkAsPaid(reception)}
                                            >
                                                Marquer Payé
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le Coût Total</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Coût Total (DA)</Label>
                        <Input
                            type="number"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
                        <Button onClick={handleSaveCost}>Enregistrer</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

// Reusable History Table Component
function HistoryTable({ data, title = "Historique", showFilters = true }: { data: StockMovement[], title?: string, showFilters?: boolean }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState('all')

    const filteredData = data.filter(item => {
        if (filter !== 'all' && item.type !== filter) return false
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                item.productName.toLowerCase().includes(query) ||
                item.productReference.toLowerCase().includes(query) ||
                item.barcode.includes(query) ||
                (item.orderNumber && item.orderNumber.toLowerCase().includes(query)) ||
                (item.trackingNumber && item.trackingNumber.toLowerCase().includes(query))
            )
        }
        return true
    })

    const handleExport = () => {
        const exportData = filteredData.map(item => ({
            Date: item.timestamp.toLocaleString(),
            Type: item.type === 'in' ? 'Entrée' : 'Sortie',
            Produit: item.productName,
            Reference: item.productReference,
            Taille: item.size,
            Quantite: item.quantity,
            Ancien_Stock: item.oldStock,
            Nouveau_Stock: item.newStock,
            Commande_Ticket: item.orderNumber || '',
            Notes: item.notes || ''
        }))
        exportToExcel(exportData, `Inventaire_${title}_${new Date().toISOString().split('T')[0]}`)
        toast.success('Export Excel téléchargé !')
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="h-4 w-4" />
                        {title} ({filteredData.length})
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                        Excel
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden gap-3">
                {showFilters && (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 h-8 text-sm"
                        />
                        <div className="flex gap-1">
                            <Button
                                variant={filter === 'all' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className="h-8 px-2 text-xs"
                            >
                                Tout
                            </Button>
                            <Button
                                variant={filter === 'in' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilter('in')}
                                className="h-8 px-2 text-xs text-green-600"
                            >
                                Entrées
                            </Button>
                            <Button
                                variant={filter === 'out' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setFilter('out')}
                                className="h-8 px-2 text-xs text-red-600"
                            >
                                Sorties
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs w-[140px]">Date</TableHead>
                                <TableHead className="text-xs w-[80px]">Type</TableHead>
                                <TableHead className="text-xs">Produit</TableHead>
                                <TableHead className="text-xs w-[60px]">Taille</TableHead>
                                <TableHead className="text-xs text-right w-[60px]">Qté</TableHead>
                                <TableHead className="text-xs w-[100px]">Info</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                        Aucune donnée
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-xs py-2 whitespace-nowrap">
                                            {item.timestamp.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            {item.type === 'in' ? (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-200 text-green-700 bg-green-50">
                                                    Entrée
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-200 text-red-700 bg-red-50">
                                                    Sortie
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="font-medium text-xs truncate max-w-[180px]" title={item.productName}>
                                                {item.productName}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">{item.productReference}</div>
                                        </TableCell>
                                        <TableCell className="text-xs py-2">{item.size}</TableCell>
                                        <TableCell className="text-xs py-2 text-right font-medium">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="py-2">
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={item.notes || item.orderNumber}>
                                                {item.notes || item.orderNumber || '-'}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

// ------------------------------------------------------------------
// NEW SECTIONS: ECHANGE (Stock Out) & RETOUR (Stock In)
// ------------------------------------------------------------------

function EchangeSection({ onStockRemoved, history }: { onStockRemoved: (movement: StockMovement) => void, history: StockMovement[] }) {
    const [barcode, setBarcode] = useState('')
    const [scanLogs, setScanLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        const code = barcode.trim().toUpperCase()
        if (!code) return

        if (!code.startsWith('ECH-')) {
            toast.error('Format Invalide. Doit commencer par "ECH-"')
            return
        }

        setIsLoading(true)
        setScanLogs([])

        try {
            // 1. Fetch from Yalidine
            const shipment = await yalidineAPI.getShipment(code)
            const tracking = shipment.tracking || code
            const productList = shipment.product_list || shipment.productList || ''

            if (!productList) {
                toast.error('Aucune liste de produits trouvée dans l\'échange.')
                setIsLoading(false)
                return
            }

            const parsedItems = parseYalidineProductList(productList)

            if (parsedItems.length === 0) {
                toast.error('Impossible d\'analyser les produits.')
                setIsLoading(false)
                return
            }

            const logs = []
            let successCount = 0

            // 2. Process Stock OUT
            for (const item of parsedItems) {
                try {
                    // Find Product
                    const productsResponse = await api.products.getAll({ search: item.productName, limit: 10 }) as any
                    const products = productsResponse.products || []
                    const product = products.find((p: any) =>
                        p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
                        item.productName.toLowerCase().includes(p.name.toLowerCase())
                    )

                    if (!product) {
                        logs.push({ status: 'error', message: `Produit "${item.productName}" introuvable`, item })
                        continue
                    }

                    // Check Size
                    const sizeObj = product.sizes?.find((s: any) => s.size === item.size)
                    if (!sizeObj) {
                        logs.push({ status: 'error', message: `Taille "${item.size}" introuvable`, item })
                        continue
                    }

                    // Check Stock
                    if ((sizeObj.stock || 0) < item.quantity) {
                        logs.push({ status: 'error', message: `Stock insuffisant (${sizeObj.stock})`, item })
                        continue
                    }

                    // Deduct Stock
                    for (let i = 0; i < item.quantity; i++) {
                        await api.products.scanProduct(`${product.reference}-${item.size}`, 'remove')
                    }

                    // Log History
                    const movement: StockMovement = {
                        id: Date.now().toString() + Math.random(),
                        timestamp: new Date(),
                        type: 'out',
                        barcode: `${product.reference}-${item.size}`,
                        productName: product.name,
                        productReference: product.reference,
                        size: item.size,
                        quantity: item.quantity,
                        oldStock: sizeObj.stock,
                        newStock: sizeObj.stock - item.quantity,
                        trackingNumber: tracking,
                        notes: `Echange Yalidine: ${code}`
                    }
                    onStockRemoved(movement)

                    logs.push({ status: 'success', message: `Échangé: ${item.quantity}x ${product.name}`, item })
                    successCount++

                } catch (err: any) {
                    logs.push({ status: 'error', message: err.message, item })
                }
            }

            setScanLogs(logs)
            if (successCount === parsedItems.length) {
                toast.success('Échange traité avec succès !')
                setBarcode('')
            } else if (successCount > 0) {
                toast.warning('Traitement partiel.')
            } else {
                toast.error('Échec.')
            }

        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la récupération')
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    return (
        <Card className="h-full flex flex-col border-orange-200 bg-orange-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                    <ArrowDown className="h-5 w-5" />
                    Échange (Sortie Stock)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <form onSubmit={handleScan} className="space-y-4">
                    <Label>Scanner Ticket Échange (ECH-XXXXXX)</Label>
                    <Input
                        ref={inputRef}
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="ECH-..."
                        className="h-16 text-xl text-center font-mono"
                        disabled={isLoading}
                        autoFocus
                    />
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Valider Échange'}
                    </Button>
                </form>

                {scanLogs.length > 0 && <CardBody logs={scanLogs} />}

                <div className="flex-1 overflow-hidden mt-6 border-t pt-4">
                    <HistoryTable
                        data={history.filter(h => h.notes?.includes('Echange'))}
                        title="Historique des Échanges"
                        showFilters={false}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function RetourSection({ onStockAdded, history }: { onStockAdded: (movement: StockMovement) => void, history: StockMovement[] }) {
    const [tracking, setTracking] = useState('')
    const [scanLogs, setScanLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tracking.trim()) return

        setIsLoading(true)
        setScanLogs([])

        try {
            const shipment = await yalidineAPI.getShipment(tracking.trim())
            const productList = shipment.product_list || shipment.productList || ''

            if (!productList) {
                toast.error('Aucune liste de produits trouvée.')
                setIsLoading(false)
                return
            }

            const parsedItems = parseYalidineProductList(productList)
            if (parsedItems.length === 0) {
                toast.error('Produits illisibles.')
                setIsLoading(false)
                return
            }

            const receptionItems = []
            const logs = []

            for (const item of parsedItems) {
                const productsResponse = await api.products.getAll({ search: item.productName, limit: 1 }) as any
                const product = productsResponse.products?.[0]

                if (product) {
                    const sizeObj = product.sizes?.find((s: any) => s.size === item.size)
                    if (sizeObj) {
                        receptionItems.push({
                            productName: product.name,
                            reference: product.reference,
                            size: item.size,
                            quantity: item.quantity,
                            barcode: `${product.reference}-${item.size}`
                        })
                        logs.push({ status: 'success', message: `Retour: ${item.quantity}x ${product.name}`, item })
                    } else {
                        logs.push({ status: 'error', message: `Taille inconnue: ${item.size}`, item })
                    }
                } else {
                    logs.push({ status: 'error', message: `Produit inconnu: ${item.productName}`, item })
                }
            }

            if (receptionItems.length > 0) {
                await api.createReception({
                    atelier: `Retour Client`,
                    totalCost: 0,
                    date: new Date().toISOString(),
                    notes: `Retour Tracking: ${tracking}`,
                    items: receptionItems
                })

                receptionItems.forEach(item => {
                    onStockAdded({
                        id: Date.now().toString() + Math.random(),
                        timestamp: new Date(),
                        type: 'in',
                        barcode: item.barcode || '',
                        productName: item.productName,
                        productReference: item.reference || '',
                        size: item.size,
                        quantity: item.quantity,
                        oldStock: 0,
                        newStock: 0,
                        trackingNumber: tracking,
                        notes: 'Retour Client'
                    })
                })

                toast.success('Retour stocké avec succès !')
                setTracking('')
            } else {
                toast.error('Aucun produit valide à retourner.')
            }

            setScanLogs(logs)

        } catch (error: any) {
            toast.error(error.message || 'Erreur lors du retour')
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    return (
        <Card className="h-full flex flex-col border-blue-200 bg-blue-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                    <ArrowUp className="h-5 w-5" />
                    Retour (Entrée Stock)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <form onSubmit={handleScan} className="space-y-4">
                    <Label>Scanner Tracking Retour</Label>
                    <Input
                        ref={inputRef}
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        placeholder="Yalidine Tracking..."
                        className="h-16 text-xl text-center font-mono"
                        disabled={isLoading}
                        autoFocus
                    />
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Valider Retour'}
                    </Button>
                </form>

                {scanLogs.length > 0 && <CardBody logs={scanLogs} />}

                <div className="flex-1 overflow-hidden mt-6 border-t pt-4">
                    <HistoryTable
                        data={history.filter(h => h.notes?.includes('Retour'))}
                        title="Historique des Retours"
                        showFilters={false}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
