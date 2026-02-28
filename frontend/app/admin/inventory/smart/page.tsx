'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    FileSpreadsheet,
    AlertTriangle
} from 'lucide-react'
import { api } from '@/lib/api'
import { yalidineAPI } from '@/lib/yalidine-api'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import Image from 'next/image'

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
    size: string | null
    quantity: number
    oldStock: number
    newStock: number
    orderNumber?: string
    trackingNumber?: string
    notes?: string
    operationType?: 'entree' | 'sortie' | 'echange' | 'retour'
}

// Scoped uniqueness: each operation type has its own "already scanned" list.
// A Yalidine tracking can be scanned once per section (Sortie, Échange, Retour).
const STORAGE_KEY_SORTIE = 'scanned-yalidine-sortie'
const STORAGE_KEY_ECHANGE = 'scanned-yalidine-echange'
const STORAGE_KEY_RETOUR = 'scanned-yalidine-retour'

// Shared Helper for Yalidine Product Lists
const parseYalidineProductList = (productList: string) => {
    if (!productList) return []

    // 1. Try existing newline-based parsing first (it's stricter and preferred if formatted correctly)
    const lines = productList.split('\n').filter(line => line.trim())
    const legacyItems: any[] = []
    let legacyMatchCount = 0

    for (const line of lines) {
        // Regex to match "2x Product Name (Size)" (Legacy format)
        const match = line.trim().match(/^(\d+)x\s+(.+?)(?:\s+\(([^)]+)\))?$/)
        if (match) {
            const quantity = parseInt(match[1])
            const productName = match[2].trim()
            const size = match[3]?.trim() || ''

            legacyItems.push({
                originalLine: line.trim(),
                quantity,
                productName,
                size
            })
            legacyMatchCount++
        }
    }

    // If we matched lines successfully using the old format, return them
    // We require at least some matches to consider it a legacy format success
    if (legacyMatchCount > 0 && legacyMatchCount >= lines.length / 2) {
        return legacyItems
    }

    // 2. Try New Single-Line Parsing (for "Product (Size)1x Product (Size)1x..." format)
    const items: any[] = []

    // Regex: 
    // ([^(]+?)    -> Group 1: Product Name (lazy, anything until opening paren)
    // \s*         -> Optional whitespace
    // \(([^)]+)\) -> Group 2: Size (inside parens)
    // \s*         -> Optional whitespace
    // (\d+x)?     -> Group 3: Optional Quantity (digits followed by 'x')
    const regex = /([^(]+?)\s*\(([^)]+)\)\s*(\d+x)?/g

    let match
    while ((match = regex.exec(productList)) !== null) {
        const productName = match[1].trim()
        const size = match[2].trim()
        const quantityStr = match[3] // "1x", "2x" or undefined

        let quantity = 1
        if (quantityStr) {
            quantity = parseInt(quantityStr.replace('x', '')) || 1
        }

        // Basic noise filter: product name should be reasonable length
        if (productName && productName.length > 2 && size) {
            items.push({
                originalLine: match[0].trim(),
                quantity,
                productName,
                size
            })
        }
    }

    return items
}

// Helper function to check if product is a shoe
const isShoeProduct = (product: any): boolean => {
    if (!product) return false
    const categorySlug = product.category?.slug?.toLowerCase() || ''
    const categoryName = product.category?.name?.toLowerCase() || ''
    return categorySlug.includes('shoe') ||
        categorySlug.includes('chaussure') ||
        categoryName.includes('shoe') ||
        categoryName.includes('chaussure')
}

// Helper function to check if a size is a valid shoe size
const isValidShoeSize = (size: string): boolean => {
    const shoeSizes = ['36', '37', '38', '39', '40', '41']
    return shoeSizes.includes(size)
}

// Helper function to check if a size is a regular product size (not shoe)
const isRegularSize = (size: string): boolean => {
    const regularSizes = ['M', 'L', 'XL', 'XXL', 'XXXL']
    return regularSizes.includes(size.toUpperCase())
}

// Helper function to filter products based on size type
// If size is provided, filter products to match the size type (shoes vs regular products)
const filterProductsBySizeType = (products: any[], size: string): any[] => {
    if (!size) return products // No size provided, return all products

    const isShoeSize = isValidShoeSize(size)
    const isRegularProductSize = isRegularSize(size)

    if (isShoeSize) {
        // Size is a shoe size (36-41), only return shoes
        return products.filter((p: any) => isShoeProduct(p))
    } else if (isRegularProductSize) {
        // Size is a regular product size (M, L, XL, XXL, XXXL), exclude shoes
        return products.filter((p: any) => !isShoeProduct(p))
    }

    // Unknown size type, return all products
    return products
}

// Helper function to find the best matching product
// Prioritizes products that:
// 1. Have the exact size required
// 2. Have exact name match
// 3. Have the shortest name (to avoid matching "Chassures X" when searching for "X")
const findBestMatchingProduct = (products: any[], searchName: string, requiredSize?: string): any | null => {
    if (products.length === 0) return null

    const searchLower = searchName.toLowerCase().trim()

    // Score products based on match quality
    const scoredProducts = products.map((product: any) => {
        const productNameLower = product.name.toLowerCase()
        let score = 0

        // Check if product has the required size
        if (requiredSize) {
            const hasSize = product.sizes?.some((s: any) => s.size === requiredSize)
            if (hasSize) {
                score += 1000 // Big bonus for having the required size
            } else {
                // If size is required but product doesn't have it, heavily penalize
                return { product, score: -1000 }
            }
        }

        // Exact name match gets highest priority
        if (productNameLower === searchLower) {
            score += 500
        }
        // Product name starts with search term
        else if (productNameLower.startsWith(searchLower)) {
            score += 300
        }
        // Product name contains search term (but not at start)
        else if (productNameLower.includes(searchLower)) {
            score += 100
        }
        // Search term contains product name (less ideal)
        else if (searchLower.includes(productNameLower)) {
            score += 50
        }

        // Prefer shorter product names (to avoid matching "Chassures X" when searching for "X")
        // This helps when "Djabadour El Hemma Bordeau" matches both:
        // - "Djabadour El Hemma Bordeau" (shorter, better)
        // - "Chassures Djabadour El Hemma Bordeau" (longer, less ideal)
        const nameLength = productNameLower.length
        const searchLength = searchLower.length
        if (nameLength <= searchLength + 5) { // Product name is close to search length
            score += 20
        }

        return { product, score }
    })

    // Filter out products with negative scores (missing required size)
    const validProducts = scoredProducts.filter((item: any) => item.score >= 0)

    if (validProducts.length === 0) return null

    // Sort by score (highest first) and return the best match
    validProducts.sort((a: any, b: any) => b.score - a.score)
    return validProducts[0].product
}

export default function InventorySmartPage() {
    const [activeTab, setActiveTab] = useState('labels')
    const [history, setHistory] = useState<StockMovement[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)

    // Load history from backend on mount (high limit so all sorties/entrees show in Dernières Sorties and History tab)
    const HISTORY_LIMIT = 10000
    useEffect(() => {
        const loadHistory = async () => {
            try {
                setIsLoadingHistory(true)
                const response = await api.admin.getStockMovements({ limit: HISTORY_LIMIT }) as any
                const movements = response?.movements || []
                setHistory(movements.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.createdAt),
                    id: item.id
                })))
            } catch (error) {
                console.error('Failed to load history from backend:', error)
                // Fallback to localStorage if backend fails
                const savedHistory = localStorage.getItem('inventory-history')
                if (savedHistory) {
                    try {
                        const parsed = JSON.parse(savedHistory)
                        setHistory(parsed.map((item: any) => ({
                            ...item,
                            timestamp: new Date(item.timestamp)
                        })))
                    } catch (e) {
                        console.error('Failed to load history from localStorage', e)
                    }
                }
            } finally {
                setIsLoadingHistory(false)
            }
        }
        loadHistory()
    }, [])

    const addToHistory = async (movement: StockMovement) => {
        // Add to local state immediately for UI responsiveness (keep same cap as fetch so all sorties show)
        setHistory(prev => [movement, ...prev].slice(0, HISTORY_LIMIT))

        // Save to backend
        try {
            await api.admin.createStockMovement({
                type: movement.type,
                barcode: movement.barcode || null,
                productName: movement.productName,
                productReference: movement.productReference || null,
                size: movement.size || null,
                quantity: movement.quantity,
                oldStock: movement.oldStock || null,
                newStock: movement.newStock || null,
                orderNumber: movement.orderNumber || null,
                trackingNumber: movement.trackingNumber || null,
                notes: movement.notes || null,
                operationType: movement.operationType || null
            })
        } catch (error) {
            console.error('Failed to save movement to backend:', error)
            // Keep in localStorage as backup
            const currentHistory = [movement, ...history].slice(0, HISTORY_LIMIT)
            localStorage.setItem('inventory-history', JSON.stringify(currentHistory))
        }
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
            }, { cache: 'no-store' }) as any
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

            // Get product image URL
            const productImageUrl = product?.images?.[0]?.url || product?.images?.[0] || product?.image || null

            if (isAccessoire) {
                // For accessories: generate QR code with reference only (no size)
                const barcodeValue = product?.reference || product?.id || 'N/A'
                const qrDataUrl = await QRCode.toDataURL(barcodeValue)

                // Determine x,y based on grid
                const x = col * colWidth
                const y = row * rowHeight

                // Draw Border (Optional, helps visual separation)
                doc.setDrawColor(200)
                doc.rect(x + 2, y + 2, colWidth - 4, rowHeight - 4)

                // Product Image (if available) - 20mm height
                if (productImageUrl) {
                    try {
                        doc.addImage(productImageUrl, 'PNG', x + 5, y + 5, 45, 20, undefined, 'FAST')
                    } catch (error) {
                        console.warn('Failed to load product image:', error)
                    }
                }

                // Product Name (Truncated) - below image or at top if no image
                doc.setFontSize(8)
                const nameY = productImageUrl ? y + 28 : y + 10
                doc.text((product.name || 'Produit').substring(0, 25), x + 5, nameY)

                // QR Code (Centered) - 30x30mm
                const qrY = productImageUrl ? y + 35 : y + 20
                doc.addImage(qrDataUrl, 'PNG', x + 12.5, qrY, 30, 30)

                // Barcode Value (Small text at bottom)
                doc.setFontSize(7)
                const barcodeY = productImageUrl ? y + 68 : y + 53
                doc.text(barcodeValue, x + 5, barcodeY)

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
            } else {
                // For products with sizes: generate QR codes for ALL sizes
                // Check if it's a shoe category
                const categorySlug = product.category?.slug?.toLowerCase() || ''
                const isShoes = categorySlug.includes('shoe') || categorySlug.includes('chaussure') || product.category?.name?.toLowerCase().includes('shoe') || product.category?.name?.toLowerCase().includes('chaussure')
                const allSizes = isShoes ? ['36', '37', '38', '39', '40', '41'] : ['M', 'L', 'XL', 'XXL', 'XXXL']

                for (const sizeLabel of allSizes) {
                    // Determine x,y based on grid
                    const x = col * colWidth
                    const y = row * rowHeight

                    const barcodeValue = `${product.reference}-${sizeLabel}`
                    const qrDataUrl = await QRCode.toDataURL(barcodeValue)

                    // Find stock for this size (0 if size doesn't exist)
                    const sizeData = product?.sizes?.find((s: any) => s.size === sizeLabel)
                    const stock = sizeData?.stock || 0

                    // Draw Border (Optional, helps visual separation)
                    doc.setDrawColor(200)
                    doc.rect(x + 2, y + 2, colWidth - 4, rowHeight - 4)

                    // Product Image (if available) - 20mm height
                    if (productImageUrl) {
                        try {
                            doc.addImage(productImageUrl, 'PNG', x + 5, y + 5, 45, 20, undefined, 'FAST')
                        } catch (error) {
                            console.warn('Failed to load product image:', error)
                        }
                    }

                    // Product Name (Truncated) - below image or at top if no image
                    doc.setFontSize(8)
                    const nameY = productImageUrl ? y + 28 : y + 10
                    doc.text((product.name || 'Produit').substring(0, 25), x + 5, nameY)

                    // Size label
                    doc.setFontSize(7)
                    const sizeY = productImageUrl ? y + 32 : y + 14
                    doc.text(`Taille: ${sizeLabel}`, x + 5, sizeY)

                    // QR Code (Centered) - 30x30mm
                    const qrY = productImageUrl ? y + 35 : y + 20
                    doc.addImage(qrDataUrl, 'PNG', x + 12.5, qrY, 30, 30)

                    // Barcode Value (Small text at bottom)
                    doc.setFontSize(7)
                    const barcodeY = productImageUrl ? y + 68 : y + 53
                    doc.text(barcodeValue, x + 5, barcodeY)

                    // Stock info (very small)
                    doc.setFontSize(6)
                    doc.text(`Stock: ${stock}`, x + 5, barcodeY + 4)

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
                                                const imageUrl = product.image || product.images?.[0]?.url || product.images?.[0] || ''
                                                return imageUrl && imageUrl !== '/placeholder.svg' ? (
                                                    <img
                                                        key={`${product?.id}-${imageUrl}`}
                                                        src={imageUrl}
                                                        alt={product.name || 'Product'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = '/placeholder.svg'
                                                            target.onerror = null
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
                                const imageUrl = selectedProduct?.images?.[0]?.url || selectedProduct?.images?.[0] || selectedProduct?.image || null
                                return (
                                    <div className="border rounded-lg p-4">
                                        <div className="flex items-center gap-4 mb-4">
                                            {imageUrl && (
                                                <div className="relative w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                                                    <Image
                                                        key={`preview-acc-${selectedProduct?.id}-${imageUrl}`}
                                                        src={imageUrl}
                                                        alt={selectedProduct?.name || 'Product'}
                                                        fill
                                                        className="object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement
                                                            target.src = '/placeholder.svg'
                                                        }}
                                                        unoptimized={imageUrl.startsWith('http')}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
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
                                                        1 étiquette sera générée lors de l'impression
                                                    </p>
                                                    <p className="font-mono text-sm">{barcodeValue}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            } else {
                                // Show preview for products with sizes - show ALL sizes
                                const categorySlug = selectedProduct?.category?.slug?.toLowerCase() || ''
                                const isShoes = categorySlug.includes('shoe') || categorySlug.includes('chaussure') || selectedProduct?.category?.name?.toLowerCase().includes('shoe') || selectedProduct?.category?.name?.toLowerCase().includes('chaussure')
                                const allSizes = isShoes ? ['36', '37', '38', '39', '40', '41'] : ['M', 'L', 'XL', 'XXL', 'XXXL']
                                const imageUrl = selectedProduct?.images?.[0]?.url || selectedProduct?.images?.[0] || selectedProduct?.image || null
                                return allSizes.map((sizeLabel) => {
                                    const barcodeValue = `${selectedProduct.reference}-${sizeLabel}`
                                    const sizeData = selectedProduct?.sizes?.find((s: any) => s.size === sizeLabel)
                                    const stock = sizeData?.stock || 0

                                    return (
                                        <div key={sizeLabel} className="border rounded-lg p-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                {imageUrl && (
                                                    <div className="relative w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                                                        <Image
                                                            key={`preview-${sizeLabel}-${selectedProduct?.id}-${imageUrl}`}
                                                            src={imageUrl}
                                                            alt={`${selectedProduct?.name || 'Product'} - ${sizeLabel}`}
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = '/placeholder.svg'
                                                            }}
                                                            unoptimized={imageUrl.startsWith('http')}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="font-bold">{selectedProduct?.name || 'Produit sans nom'}</p>
                                                            <p className="text-sm text-muted-foreground">Taille : {sizeLabel}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{barcodeValue}</p>
                                                        </div>
                                                        <Badge variant="secondary">Stock : {stock}</Badge>
                                                    </div>
                                                    <div className="bg-muted p-4 rounded text-center">
                                                        <p className="text-xs text-muted-foreground mb-2">Le code QR sera généré lors de l'impression</p>
                                                        <p className="font-mono text-sm">{barcodeValue}</p>
                                                    </div>
                                                </div>
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
    const [ateliers, setAteliers] = useState<{ id: string; name: string }[]>([])
    const [selectedAtelierId, setSelectedAtelierId] = useState<string>('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')

    // Session state
    const [sessionItems, setSessionItems] = useState<any[]>([])
    const [barcode, setBarcode] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        api.getAteliers().then((res: any) => setAteliers(res.ateliers || [])).catch(() => { })
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
                            // Accept the size even if it doesn't exist in product.sizes (stock can be 0)
                            // For shoes, accept shoe sizes (36-41). For regular products, accept any size
                            const isShoes = isShoeProduct(product)
                            if (isShoes && !isValidShoeSize(possibleSize)) {
                                toast.error(`Produit "${product.name}" nécessite une taille de chaussure (36-41). Format: ${product.reference}-TAILLE`)
                                return
                            }
                            reference = possibleReference
                            size = possibleSize
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
                            // Product has sizes - accept the size even if it doesn't exist in product.sizes (stock can be 0)
                            reference = possibleReference
                            size = possibleSize
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
        if (!selectedAtelierId) {
            toast.error('Veuillez sélectionner un atelier / source')
            return
        }

        setIsSaving(true)
        try {
            const payload = {
                atelierId: selectedAtelierId,
                date,
                notes,
                items: sessionItems.map(item => ({
                    productName: item.product.name,
                    reference: item.reference,
                    size: item.size || null,
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
                    notes: `Reception: ${ateliers.find(a => a.id === selectedAtelierId)?.name || 'Atelier'}`,
                    operationType: 'entree'
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
                        <Select value={selectedAtelierId} onValueChange={setSelectedAtelierId}>
                            <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Sélectionner un atelier..." />
                            </SelectTrigger>
                            <SelectContent>
                                {ateliers.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

// Error Modal Component
function ErrorModal({
    isOpen,
    onClose,
    title,
    errors
}: {
    isOpen: boolean
    onClose: () => void
    title: string
    errors: Array<{ productName: string; item: any; message: string }>
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        تم اكتشاف الأخطاء التالية أثناء المسح:
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                    {errors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <div className="font-semibold text-red-800 dark:text-red-200">
                                {error.productName}{error.item.size ? ` (${error.item.size})` : ''}
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                                {error.message}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6">
                    <Button onClick={onClose} variant="destructive">
                        إغلاق
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}



function CardBody({ logs }: { logs: any[] }) {
    return (
        <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log, i) => (
                <div key={i} className={`flex items-start gap-2 text-sm p-2 rounded ${log.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                    {log.status === 'error' ? (
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    )}
                    <span>{log.message}</span>
                </div>
            ))}
        </div>
    )
}

function StockResolutionModal({
    isOpen,
    onClose,
    items,
    tracking,
    onConfirm
}: {
    isOpen: boolean
    onClose: () => void
    items: Array<{
        originalItem: any
        product: any
        requiredSize: string
        availableSizes: Array<{ size: string, stock: number }>
    }>
    tracking: string
    onConfirm: (resolutions: Map<string, string>) => void
}) {
    // Map of valid index -> selected size
    const [selections, setSelections] = useState<Record<number, string>>({})

    useEffect(() => {
        if (isOpen) {
            // Reset selections when opening
            setSelections({})
        }
    }, [isOpen])

    const handleConfirm = () => {
        const resolutionMap = new Map<string, string>()

        // Build map of substitute sizes
        items.forEach((item, index) => {
            if (selections[index]) {
                // Key needs to be unique enough to identify the specific item line in the original scan
                // We'll use product reference + original size as key
                const key = `${item.product.reference}-${item.requiredSize}`
                resolutionMap.set(key, selections[index])
            }
        })

        onConfirm(resolutionMap)
    }

    const allResolved = items.every((_, index) => selections[index])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-amber-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Rupture de Stock - Alternatives Disponibles
                    </DialogTitle>
                    <DialogDescription>
                        Certains articles sont en rupture de stock pour la taille demandée, mais d'autres tailles sont disponibles.
                        Veuillez sélectionner la taille de remplacement à déduire du stock.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-muted/20">
                            <div className="flex items-start gap-4 mb-3">
                                <div className="relative w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                    {item.product.image ? (
                                        <Image
                                            src={item.product.image}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold">{item.product.name}</h4>
                                    <p className="text-sm text-muted-foreground">{item.product.reference}</p>
                                    <div className="mt-1 flex items-center gap-2 text-sm">
                                        <span className="text-red-600 font-medium">Demandé: {item.requiredSize} (Stock: 0)</span>
                                        <span>→</span>
                                        <span className="text-muted-foreground">Qté: {item.originalItem.quantity}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Sélectionner une taille de remplacement:</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {item.availableSizes.map((sizeOption) => (
                                        <Button
                                            key={sizeOption.size}
                                            variant={selections[index] === sizeOption.size ? "default" : "outline"}
                                            className={`justify-between ${selections[index] === sizeOption.size
                                                ? "bg-amber-600 hover:bg-amber-700"
                                                : "hover:border-amber-500"
                                                }`}
                                            onClick={() => setSelections(prev => ({ ...prev, [index]: sizeOption.size }))}
                                            disabled={sizeOption.stock < item.originalItem.quantity}
                                        >
                                            <span>{sizeOption.size}</span>
                                            <Badge variant="secondary" className="ml-2 bg-white/20">
                                                {sizeOption.stock}
                                            </Badge>
                                        </Button>
                                    ))}
                                </div>
                                {item.availableSizes.length === 0 && (
                                    <p className="text-sm text-red-500 italic">Aucune autre taille disponible en stock.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!allResolved}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Confirmer les Substitutions
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function StockOutSection({ onStockRemoved, history }: { onStockRemoved: (movement: StockMovement) => void, history: StockMovement[] }) {
    const [yalidineBarcode, setYalidineBarcode] = useState('')
    const [scanLogs, setScanLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set())
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; errors: Array<{ productName: string; item: any; message: string }> }>({
        isOpen: false,
        errors: []
    })

    // New State for Resolution Modal
    const [resolutionModal, setResolutionModal] = useState<{
        isOpen: boolean
        items: Array<{
            originalItem: any
            product: any
            requiredSize: string
            availableSizes: Array<{ size: string, stock: number }>
        }>
        tracking: string
    }>({
        isOpen: false,
        items: [],
        tracking: ''
    })

    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        const saved = localStorage.getItem(STORAGE_KEY_SORTIE)
        if (saved) {
            try {
                setScannedBarcodes(new Set(JSON.parse(saved)))
            } catch (e) {
                console.error('Failed to load scanned barcodes (Sortie)', e)
            }
        }
    }, [])

    const isBarcodeAlreadyScanned = (barcode: string): boolean => {
        return scannedBarcodes.has(barcode.trim())
    }

    const markBarcodeAsScanned = (barcode: string) => {
        const newSet = new Set(scannedBarcodes)
        newSet.add(barcode.trim())
        setScannedBarcodes(newSet)
        localStorage.setItem(STORAGE_KEY_SORTIE, JSON.stringify(Array.from(newSet)))
    }

    const handleApplyResolution = async (resolutions: Map<string, string>) => {
        setResolutionModal({ isOpen: false, items: [], tracking: '' })
        // Re-run the scan logic but pass the resolutions map
        await processYalidineScan(resolutionModal.tracking, resolutions)
    }

    const handleYalidineScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!yalidineBarcode.trim()) return

        const barcodeKey = yalidineBarcode.trim()
        if (isBarcodeAlreadyScanned(barcodeKey)) {
            setErrorModal({
                isOpen: true,
                errors: [{
                    productName: 'Doublon',
                    item: { size: '' },
                    message: 'Ce tracking a déjà été scanné dans Sortie. Un même tracking ne peut être scanné qu\'une fois par section.'
                }]
            })
            return
        }

        await processYalidineScan(barcodeKey)
    }

    const processYalidineScan = async (barcodeKey: string, resolutions?: Map<string, string>) => {
        setIsLoading(true)
        setScanLogs([])

        try {
            // Skip validation if we are processing a resolution (we assume tracking is valid)
            if (!resolutions) {
                const validation = await api.validateTracking(barcodeKey, 'sortie') as { valid: boolean; message?: string }
                if (!validation.valid) {
                    setErrorModal({
                        isOpen: true,
                        errors: [{
                            productName: 'Tracking déjà utilisé',
                            item: { size: '' },
                            message: validation.message || 'Tracking number already used in Stock Out.'
                        }]
                    })
                    setIsLoading(false)
                    return
                }
            }

            // We might need to fetch shipment again or pass it through. fetching is safer.
            const shipment = await yalidineAPI.getShipment(barcodeKey)
            const tracking = shipment.tracking || shipment.tracking_number || shipment.tracking || barcodeKey
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

            // STEP 1: Validate ALL items first before processing any
            const validationErrors: Array<{ item: any; message: string; productName: string }> = []

            // Pending Resolutions (Out of stock with alternatives)
            const pendingResolutions: Array<{
                originalItem: any
                product: any
                requiredSize: string
                availableSizes: Array<{ size: string, stock: number }>
            }> = []

            const validatedItems: Array<{
                item: any
                product: any
                barcode: string
                size: string
                oldStock: number
                isAccessoire: boolean
                substitutedSize?: string
            }> = []

            // Validate all items first
            for (const item of parsedItems) {
                try {
                    // 1. Find Product
                    const productsResponse = await api.products.getAll({
                        search: item.productName,
                        limit: 20
                    }) as any
                    let products = productsResponse.products || []

                    if (item.size) {
                        products = filterProductsBySizeType(products, item.size)
                    }

                    const product = findBestMatchingProduct(products, item.productName, item.size)

                    if (!product) {
                        validationErrors.push({
                            item,
                            message: `المنتج "${item.productName}" غير موجود`,
                            productName: item.productName
                        })
                        continue
                    }

                    const categorySlug = product.category?.slug?.toLowerCase() || ''
                    const isAccessoire = categorySlug.includes('accessoire') ||
                        categorySlug.includes('accessories') ||
                        !product.sizes ||
                        product.sizes.length === 0

                    let barcode: string
                    let oldStock: number
                    let size: string
                    let substitutedSize = undefined

                    if (isAccessoire) {
                        barcode = product.reference
                        oldStock = product.stock || 0

                        if (oldStock < item.quantity) {
                            validationErrors.push({
                                item,
                                message: `المخزون غير كافٍ. المخزون: ${oldStock}، المطلوب: ${item.quantity}`,
                                productName: product.name
                            })
                            continue
                        }
                        size = ''
                    } else {
                        const isShoes = isShoeProduct(product)

                        // Check if we have a resolved substitution for this item
                        const resolutionKey = `${product.reference}-${item.size}`
                        const resolvedSize = resolutions?.get(resolutionKey)

                        // If substituted, use that size. Otherwise use requested size.
                        const targetSize = resolvedSize || item.size

                        // Find or create size object
                        let sizeObj = product.sizes?.find((s: any) => s.size === targetSize)

                        if (!sizeObj) {
                            if (isShoes && isValidShoeSize(targetSize)) {
                                sizeObj = { size: targetSize, stock: 0 }
                            } else {
                                validationErrors.push({
                                    item,
                                    message: `المقاس "${targetSize}" غير موجود`,
                                    productName: product.name
                                })
                                continue
                            }
                        }

                        // Check Stock logic
                        if ((sizeObj.stock || 0) < item.quantity) {
                            // IF NO SUBSTITUTION was already made, and stock is 0, check for alternatives
                            if (!resolvedSize) {
                                // Find other sizes with sufficient stock
                                const alternatives = (product.sizes || []).filter((s: any) =>
                                    s.size !== item.size && (s.stock || 0) >= item.quantity
                                )

                                if (alternatives.length > 0) {
                                    // Found substitution options!
                                    pendingResolutions.push({
                                        originalItem: item,
                                        product,
                                        requiredSize: item.size,
                                        availableSizes: alternatives
                                    })
                                    continue // Skip adding to validated list for now
                                }
                            }

                            // If we are here, it means either:
                            // 1. It was a substitution attempt that ALSO has no stock (unlikely UI allows this but safety check)
                            // 2. No alternatives exist
                            validationErrors.push({
                                item,
                                message: `المخزون غير كافٍ للمقاس ${targetSize}. المخزون: ${sizeObj.stock}، المطلوب: ${item.quantity}`,
                                productName: product.name
                            })
                            continue
                        }

                        barcode = `${product.reference}-${targetSize}`
                        oldStock = sizeObj.stock || 0
                        size = targetSize
                        if (resolvedSize) substitutedSize = resolvedSize
                    }

                    validatedItems.push({
                        item,
                        product,
                        barcode,
                        size,
                        oldStock,
                        isAccessoire,
                        substitutedSize
                    })
                } catch (err: any) {
                    validationErrors.push({
                        item,
                        message: `خطأ في النظام: ${err.message}`,
                        productName: item.productName
                    })
                }
            }

            // STEP 1.5: Check for Pending Resolutions (Substitutions needed)
            if (pendingResolutions.length > 0) {
                setIsLoading(false)
                setResolutionModal({
                    isOpen: true,
                    items: pendingResolutions,
                    tracking: barcodeKey
                })
                return // Stop processing, wait for user input
            }

            // STEP 2: If ANY validation errors, show error modal
            if (validationErrors.length > 0) {
                setErrorModal({
                    isOpen: true,
                    errors: validationErrors
                })

                setScanLogs(validationErrors.map(e => ({
                    status: 'error',
                    message: `${e.productName}${e.item.size ? ` (${e.item.size})` : ''}: ${e.message}`,
                    item: e.item
                })))
                setIsLoading(false)
                return
            }

            // STEP 3: All items are valid, process them
            const logs = []
            for (const validated of validatedItems) {
                try {
                    for (let i = 0; i < validated.item.quantity; i++) {
                        await api.products.scanProduct(validated.barcode, 'remove')
                    }

                    const newStock = Math.max(0, validated.oldStock - validated.item.quantity)

                    // Note on Substitution
                    const substitutionNote = validated.substitutedSize
                        ? ` (Substitution: ${validated.item.size} -> ${validated.substitutedSize})`
                        : ''

                    const movement: StockMovement = {
                        id: Date.now().toString() + Math.random(),
                        timestamp: new Date(),
                        type: 'out',
                        barcode: validated.barcode,
                        productName: validated.product.name,
                        productReference: validated.product.reference,
                        size: validated.size, // This is the ACTUAL size removed (the substituted one)
                        quantity: validated.item.quantity,
                        oldStock: validated.oldStock,
                        newStock,
                        orderNumber: tracking,
                        trackingNumber: tracking,
                        notes: `Auto-scan deduction: ${validated.item.originalLine}${substitutionNote}`,
                        operationType: 'sortie'
                    }
                    onStockRemoved(movement)

                    logs.push({
                        status: 'success',
                        message: validated.substitutedSize
                            ? `SUBSTITUTION: ${validated.item.quantity}x ${validated.product.name} (${validated.item.size} -> ${validated.substitutedSize})`
                            : `Retiré ${validated.item.quantity}x ${validated.product.name}${validated.size ? ` (${validated.size})` : ''}`,
                        item: validated.item
                    })
                } catch (err: any) {
                    console.error(err)
                    logs.push({
                        status: 'error',
                        message: `خطأ en cours de traitement "${validated.product.name}": ${err.message}`,
                        item: validated.item
                    })
                }
            }

            setScanLogs(logs)
            if (logs.every(log => log.status === 'success')) {
                markBarcodeAsScanned(barcodeKey)
                toast.success(`Succès ! ${logs.length} articles traités.`)
                setYalidineBarcode('')
            } else {
                toast.error('Erreur lors du traitement de certains articles.')
            }

        } catch (error: any) {
            setErrorModal({
                isOpen: true,
                errors: [{
                    productName: 'خطأ في المسح',
                    item: { size: '' },
                    message: error.message || 'خطأ في استرجاع تذكرة Yalidine. يرجى التحقق من الرمز الشريطي والمحاولة مرة أخرى.'
                }]
            })
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }
    return (
        <>
            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ isOpen: false, errors: [] })}
                title="خطأ في المسح"
                errors={errorModal.errors}
            />
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

            <StockResolutionModal
                isOpen={resolutionModal.isOpen}
                onClose={() => setResolutionModal({ isOpen: false, items: [], tracking: '' })}
                items={resolutionModal.items}
                tracking={resolutionModal.tracking}
                onConfirm={handleApplyResolution}
            />
        </>
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

    const atelierDisplayName = (r: any) => r.atelier?.name ?? r.atelierLegacy ?? '—'
    const restToPay = (r: any) => (r.totalCost ?? 0) - (r.amountPaid ?? 0)

    const handleMarkAsPaid = async (reception: any) => {
        if (!confirm(`Marquer la réception de "${atelierDisplayName(reception)}" comme PAYÉE ?`)) return
        try {
            await api.updateReception(reception.id, { amountPaid: reception.totalCost ?? 0 })
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
                            Atelier: atelierDisplayName(r),
                            Articles: r.items?.length || 0,
                            Cout_Total: r.totalCost,
                            Paye: r.amountPaid,
                            Reste: restToPay(r),
                            Statut: r.paymentStatus === 'PAID' ? 'PAYÉ' : r.paymentStatus === 'PARTIAL' ? 'PARTIEL' : 'EN ATTENTE',
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
                                        {atelierDisplayName(reception)}
                                        {reception.notes && <div className="text-xs text-muted-foreground">{reception.notes}</div>}
                                    </TableCell>
                                    <TableCell>{reception.items?.length || 0} articles</TableCell>
                                    <TableCell>{reception.totalCost?.toLocaleString()} DA</TableCell>
                                    <TableCell>
                                        <Badge variant={reception.paymentStatus === 'PAID' ? 'default' : 'secondary'} className={reception.paymentStatus === 'PAID' ? 'bg-green-600' : reception.paymentStatus === 'PARTIAL' ? 'bg-amber-500 text-white' : 'bg-yellow-500 text-white'}>
                                            {reception.paymentStatus === 'PAID' ? 'PAYÉ' : reception.paymentStatus === 'PARTIAL' ? 'PARTIEL' : 'EN ATTENTE'}
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
            Type: item.operationType === 'echange' ? 'Échange' : item.operationType === 'retour' ? 'Retour' : item.type === 'in' ? 'Entrée' : 'Sortie',
            Produit: item.productName,
            Reference: item.productReference,
            Taille: item.size || 'Accessoire',
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
                                            {item.operationType === 'echange' ? (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-200 text-orange-700 bg-orange-50">
                                                    Échange
                                                </Badge>
                                            ) : item.operationType === 'retour' ? (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-200 text-blue-700 bg-blue-50">
                                                    Retour
                                                </Badge>
                                            ) : item.type === 'in' ? (
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
                                        <TableCell className="text-xs py-2">{item.size || 'Accessoire'}</TableCell>
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
// ECHANGE (Stock In: scan ECH-XXXXXX adds items to stock) & RETOUR (Stock In)
// ------------------------------------------------------------------

function EchangeSection({ onStockRemoved, history }: { onStockRemoved: (movement: StockMovement) => void, history: StockMovement[] }) {
    const [barcode, setBarcode] = useState('')
    const [scanLogs, setScanLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set())
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; errors: Array<{ productName: string; item: any; message: string }> }>({
        isOpen: false,
        errors: []
    })
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        const saved = localStorage.getItem(STORAGE_KEY_ECHANGE)
        if (saved) {
            try {
                setScannedBarcodes(new Set(JSON.parse(saved)))
            } catch (e) {
                console.error('Failed to load scanned barcodes (Échange)', e)
            }
        }
    }, [])

    const isBarcodeAlreadyScanned = (barcode: string): boolean => {
        return scannedBarcodes.has(barcode.trim())
    }

    const markBarcodeAsScanned = (barcode: string) => {
        const newSet = new Set(scannedBarcodes)
        newSet.add(barcode.trim())
        setScannedBarcodes(newSet)
        localStorage.setItem(STORAGE_KEY_ECHANGE, JSON.stringify(Array.from(newSet)))
    }

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        const code = barcode.trim().toUpperCase()
        if (!code) return

        if (!code.startsWith('ECH-')) {
            toast.error('Format Invalide. Doit commencer par "ECH-"')
            return
        }

        if (isBarcodeAlreadyScanned(code)) {
            setErrorModal({
                isOpen: true,
                errors: [{
                    productName: 'Doublon',
                    item: { size: '' },
                    message: 'Ce tracking a déjà été scanné dans Échange. Un même tracking ne peut être scanné qu\'une fois par section.'
                }]
            })
            return
        }

        setIsLoading(true)
        setScanLogs([])

        try {
            const validation = await api.validateTracking(code, 'echange') as { valid: boolean; message?: string }
            if (!validation.valid) {
                setErrorModal({
                    isOpen: true,
                    errors: [{
                        productName: 'Tracking déjà utilisé',
                        item: { size: '' },
                        message: validation.message || 'Tracking number already used in Exchange.'
                    }]
                })
                setIsLoading(false)
                return
            }

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

            // STEP 1: Validate ALL items first before processing any
            const validationErrors: Array<{ item: any; message: string; productName: string }> = []
            const validatedItems: Array<{
                item: any
                product: any
                barcode: string
                size: string
                oldStock: number
                isAccessoire: boolean
            }> = []

            // Validate all items first
            for (const item of parsedItems) {
                try {
                    // Find Product
                    const productsResponse = await api.products.getAll({ search: item.productName, limit: 20 }) as any
                    let products = productsResponse.products || []

                    // Filter products by size type if size is provided
                    // This prevents mixing shoes with regular products
                    if (item.size) {
                        products = filterProductsBySizeType(products, item.size)
                    }

                    // Use improved matching that prioritizes products with the required size
                    const product = findBestMatchingProduct(products, item.productName, item.size)

                    if (!product) {
                        validationErrors.push({
                            item,
                            message: `المنتج غير موجود`,
                            productName: item.productName
                        })
                        continue
                    }

                    // Check if product is an accessory
                    const categorySlug = product.category?.slug?.toLowerCase() || ''
                    const isAccessoire = categorySlug.includes('accessoire') ||
                        categorySlug.includes('accessories') ||
                        !product.sizes ||
                        product.sizes.length === 0

                    let barcode: string
                    let oldStock: number
                    let size: string

                    if (isAccessoire) {
                        // Handle accessories - no size needed
                        barcode = product.reference
                        oldStock = product.stock || 0

                        // Check Stock for accessories
                        if (oldStock < item.quantity) {
                            validationErrors.push({
                                item,
                                message: `المخزون غير كافٍ. المخزون: ${oldStock}، المطلوب: ${item.quantity}`,
                                productName: product.name
                            })
                            continue
                        }

                        size = ''
                    } else {
                        // Handle products with sizes
                        const isShoes = isShoeProduct(product)

                        // For shoes, accept shoe sizes (36-41) even if not in product.sizes yet
                        // For regular products, size must exist in product.sizes
                        let sizeObj = product.sizes?.find((s: any) => s.size === item.size)

                        if (!sizeObj) {
                            // If it's a shoe and the size is a valid shoe size, create a virtual size object
                            if (isShoes && isValidShoeSize(item.size)) {
                                sizeObj = { size: item.size, stock: 0 }
                            } else {
                                validationErrors.push({
                                    item,
                                    message: `المقاس "${item.size}" غير موجود`,
                                    productName: product.name
                                })
                                continue
                            }
                        }

                        // Check Stock
                        if ((sizeObj.stock || 0) < item.quantity) {
                            validationErrors.push({
                                item,
                                message: `المخزون غير كافٍ للمقاس ${item.size}. المخزون: ${sizeObj.stock}، المطلوب: ${item.quantity}`,
                                productName: product.name
                            })
                            continue
                        }

                        barcode = `${product.reference}-${item.size}`
                        oldStock = sizeObj.stock || 0
                        size = item.size
                    }

                    // Item is valid, add to validated items
                    validatedItems.push({
                        item,
                        product,
                        barcode,
                        size,
                        oldStock,
                        isAccessoire
                    })
                } catch (err: any) {
                    validationErrors.push({
                        item,
                        message: `خطأ في النظام: ${err.message}`,
                        productName: item.productName
                    })
                }
            }

            // STEP 2: If ANY validation errors, show error modal and DON'T process anything
            if (validationErrors.length > 0) {
                setErrorModal({
                    isOpen: true,
                    errors: validationErrors
                })

                setScanLogs(validationErrors.map(e => ({
                    status: 'error',
                    message: `${e.productName}${e.item.size ? ` (${e.item.size})` : ''}: ${e.message}`,
                    item: e.item
                })))
                setIsLoading(false)
                return
            }

            // STEP 3: All items are valid, process them (Échange = increase stock)
            const logs = []
            for (const validated of validatedItems) {
                try {
                    for (let i = 0; i < validated.item.quantity; i++) {
                        await api.products.scanProduct(validated.barcode, 'add')
                    }

                    const newStock = validated.oldStock + validated.item.quantity

                    const movement: StockMovement = {
                        id: Date.now().toString() + Math.random(),
                        timestamp: new Date(),
                        type: 'in',
                        barcode: validated.barcode,
                        productName: validated.product.name,
                        productReference: validated.product.reference,
                        size: validated.size,
                        quantity: validated.item.quantity,
                        oldStock: validated.oldStock,
                        newStock,
                        trackingNumber: tracking,
                        notes: `Echange Yalidine: ${code}`,
                        operationType: 'echange'
                    }
                    onStockRemoved(movement)

                    logs.push({
                        status: 'success',
                        message: `Échangé: ${validated.item.quantity}x ${validated.product.name}${validated.size ? ` (${validated.size})` : ''}`,
                        item: validated.item
                    })
                } catch (err: any) {
                    logs.push({
                        status: 'error',
                        message: `خطأ في النظام للمنتج "${validated.product.name}": ${err.message}`,
                        item: validated.item
                    })
                }
            }

            setScanLogs(logs)
            if (logs.every(log => log.status === 'success')) {
                // Mark barcode as scanned only if all items processed successfully
                markBarcodeAsScanned(code)
                toast.success('Échange traité avec succès !')
                setBarcode('')
            } else {
                toast.error('Erreur lors du traitement de certains articles.')
            }

        } catch (error: any) {
            setErrorModal({
                isOpen: true,
                errors: [{
                    productName: 'خطأ في المسح',
                    item: { size: '' },
                    message: error.message || 'خطأ في استرجاع تذكرة Yalidine. يرجى التحقق من الرمز الشريطي والمحاولة مرة أخرى.'
                }]
            })
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    return (
        <>
            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ isOpen: false, errors: [] })}
                title="خطأ في مسح التبادل"
                errors={errorModal.errors}
            />
            <Card className="h-full flex flex-col border-orange-200 bg-orange-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                        <ArrowUp className="h-5 w-5" />
                        Échange (Entrée Stock)
                    </CardTitle>
                    <CardDescription>
                        En scannant un ticket ECH-XXXXXX, les articles sont ajoutés au stock (entrée).
                    </CardDescription>
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
        </>
    )
}

function RetourSection({ onStockAdded, history }: { onStockAdded: (movement: StockMovement) => void, history: StockMovement[] }) {
    const [tracking, setTracking] = useState('')
    const [scanLogs, setScanLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [scannedBarcodes, setScannedBarcodes] = useState<Set<string>>(new Set())
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; errors: Array<{ productName: string; item: any; message: string }> }>({
        isOpen: false,
        errors: []
    })
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
        const saved = localStorage.getItem(STORAGE_KEY_RETOUR)
        if (saved) {
            try {
                setScannedBarcodes(new Set(JSON.parse(saved)))
            } catch (e) {
                console.error('Failed to load scanned barcodes (Retour)', e)
            }
        }
    }, [])

    const isBarcodeAlreadyScanned = (barcode: string): boolean => {
        return scannedBarcodes.has(barcode.trim())
    }

    const markBarcodeAsScanned = (barcode: string) => {
        const newSet = new Set(scannedBarcodes)
        newSet.add(barcode.trim())
        setScannedBarcodes(newSet)
        localStorage.setItem(STORAGE_KEY_RETOUR, JSON.stringify(Array.from(newSet)))
    }

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        const trackingKey = tracking.trim()
        if (!trackingKey) return

        if (isBarcodeAlreadyScanned(trackingKey)) {
            setErrorModal({
                isOpen: true,
                errors: [{
                    productName: 'Doublon',
                    item: { size: '' },
                    message: 'Ce tracking a déjà été scanné dans Retour. Un même tracking ne peut être scanné qu\'une fois par section.'
                }]
            })
            return
        }

        setIsLoading(true)
        setScanLogs([])

        try {
            const validation = await api.validateTracking(trackingKey, 'retour') as { valid: boolean; message?: string }
            if (!validation.valid) {
                setErrorModal({
                    isOpen: true,
                    errors: [{
                        productName: 'Tracking déjà utilisé',
                        item: { size: '' },
                        message: validation.message || 'Tracking number already used in Return.'
                    }]
                })
                setIsLoading(false)
                return
            }

            let parsedItems: Array<{ productName: string; reference: string; size: string; quantity: number; barcode?: string }> = []
            const lookupRes = await api.lookupSortieByTracking(trackingKey) as { items?: Array<{ productName: string; productReference?: string; size: string; quantity: number; barcode?: string }>; count?: number }
            if (lookupRes?.items?.length) {
                parsedItems = lookupRes.items.map(i => ({
                    productName: i.productName,
                    reference: i.productReference || '',
                    size: i.size || '',
                    quantity: i.quantity,
                    barcode: i.barcode
                }))
            }
            if (parsedItems.length === 0) {
                const shipment = await yalidineAPI.getShipment(trackingKey)
                const productList = shipment.product_list || shipment.productList || ''
                if (!productList) {
                    toast.error('Aucune liste de produits trouvée. Scannez le code produit ou le tracking Yalidine.')
                    setIsLoading(false)
                    return
                }
                parsedItems = parseYalidineProductList(productList).map((item: any) => ({
                    productName: item.productName,
                    reference: '',
                    size: item.size || '',
                    quantity: item.quantity,
                    barcode: undefined
                }))
            }
            if (parsedItems.length === 0) {
                toast.error('Produits illisibles ou aucun Sortie trouvé pour ce tracking.')
                setIsLoading(false)
                return
            }

            // STEP 1: Validate ALL items first before processing any
            const validationErrors: Array<{ item: any; message: string; productName: string }> = []
            const validatedItems: Array<{
                productName: string
                reference: string
                size: string
                quantity: number
                barcode: string
            }> = []

            for (const item of parsedItems) {
                let product: any = null
                if (item.reference) {
                    const productsResponse = await api.products.getAll({ search: item.reference, limit: 50 }) as any
                    const products = productsResponse.products || []
                    product = products.find((p: any) => p.reference === item.reference)
                }
                if (!product) {
                    const productsResponse = await api.products.getAll({ search: item.productName, limit: 20 }) as any
                    let products = productsResponse.products || []
                    if (item.size) products = filterProductsBySizeType(products, item.size)
                    product = findBestMatchingProduct(products, item.productName, item.size)
                }

                if (!product) {
                    validationErrors.push({
                        item,
                        message: `المنتج غير موجود`,
                        productName: item.productName
                    })
                    continue
                }

                // Check if product is an accessory
                const categorySlug = product.category?.slug?.toLowerCase() || ''
                const isAccessoire = categorySlug.includes('accessoire') ||
                    categorySlug.includes('accessories') ||
                    !product.sizes ||
                    product.sizes.length === 0

                if (isAccessoire) {
                    // Handle accessories - no size needed
                    validatedItems.push({
                        productName: product.name,
                        reference: product.reference,
                        size: '',
                        quantity: item.quantity,
                        barcode: product.reference
                    })
                } else {
                    // Handle products with sizes
                    const isShoes = isShoeProduct(product)

                    // For shoes, accept shoe sizes (36-41) even if not in product.sizes yet
                    // For regular products, size must exist in product.sizes
                    let sizeObj = product.sizes?.find((s: any) => s.size === item.size)

                    if (!sizeObj) {
                        // If it's a shoe and the size is a valid shoe size, accept it
                        if (isShoes && isValidShoeSize(item.size)) {
                            // Accept the shoe size even if not in product.sizes
                            sizeObj = { size: item.size, stock: 0 }
                        } else {
                            validationErrors.push({
                                item,
                                message: `المقاس "${item.size}" غير موجود`,
                                productName: product.name
                            })
                            continue
                        }
                    }

                    validatedItems.push({
                        productName: product.name,
                        reference: product.reference,
                        size: item.size,
                        quantity: item.quantity,
                        barcode: `${product.reference}-${item.size}`
                    })
                }
            }

            // STEP 2: If ANY validation errors, show error modal and DON'T process anything
            if (validationErrors.length > 0) {
                setErrorModal({
                    isOpen: true,
                    errors: validationErrors
                })

                setScanLogs(validationErrors.map(e => ({
                    status: 'error',
                    message: `${e.productName}${e.item.size ? ` (${e.item.size})` : ''}: ${e.message}`,
                    item: e.item
                })))
                setIsLoading(false)
                return
            }

            // STEP 3: All items are valid, process them (use "Retour Client" atelier)
            if (validatedItems.length > 0) {
                const ateliersRes: any = await api.getAteliers()
                const ateliersList = ateliersRes.ateliers || []
                let retourAtelierId = ateliersList.find((a: any) => a.name === 'Retour Client')?.id
                if (!retourAtelierId) {
                    const created = await api.createAtelier({ name: 'Retour Client' }) as any
                    retourAtelierId = created.id
                }
                await api.createReception({
                    atelierId: retourAtelierId,
                    date: new Date().toISOString(),
                    notes: `Retour Tracking: ${trackingKey}`,
                    items: validatedItems
                })

                validatedItems.forEach(item => {
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
                        trackingNumber: trackingKey,
                        notes: 'Retour Client',
                        operationType: 'retour'
                    })
                })

                // Mark barcode as scanned only if all items processed successfully
                markBarcodeAsScanned(trackingKey)
                toast.success('Retour stocké avec succès !')
                setTracking('')

                setScanLogs(validatedItems.map(item => ({
                    status: 'success',
                    message: `Retour: ${item.quantity}x ${item.productName}${item.size ? ` (${item.size})` : ' (Accessoire)'}`,
                    item: { originalLine: `${item.quantity}x ${item.productName}${item.size ? ` (${item.size})` : ''}` }
                })))
            } else {
                toast.error('Aucun produit valide à retourner.')
            }

        } catch (error: any) {
            setErrorModal({
                isOpen: true,
                errors: [{
                    productName: 'خطأ في المسح',
                    item: { size: '' },
                    message: error.message || 'خطأ في استرجاع تذكرة Yalidine. يرجى التحقق من رمز التتبع والمحاولة مرة أخرى.'
                }]
            })
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    return (
        <>
            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ isOpen: false, errors: [] })}
                title="خطأ في مسح الإرجاع"
                errors={errorModal.errors}
            />
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
        </>
    )
}

