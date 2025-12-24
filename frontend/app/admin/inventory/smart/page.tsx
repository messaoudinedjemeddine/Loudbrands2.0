'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Scan,
    PackagePlus,
    PackageMinus,
    History,
    Printer,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Download
} from 'lucide-react'
import { api } from '@/lib/api'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import Image from 'next/image'

// Sound effects (Base64 for reliability)
const SUCCESS_BEEP = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Short beep (placeholder)
const ERROR_BEEP = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Error buzz (placeholder)

export default function InventorySmartPage() {
    const [barcode, setBarcode] = useState('')
    const [mode, setMode] = useState<'add' | 'remove'>('add')
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus lock
    useEffect(() => {
        const focusInput = () => inputRef.current?.focus()
        focusInput()
        window.addEventListener('click', focusInput)
        return () => window.removeEventListener('click', focusInput)
    }, [])

    const playSound = (type: 'success' | 'error') => {
        // In a real app, use real sound files
        // const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3')
        // audio.play().catch(e => console.error('Audio play failed', e))
    }

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!barcode.trim()) return

        setIsLoading(true)
        try {
            const response = await api.products.scanProduct(barcode, mode)

            if (response.success) {
                playSound('success')
                toast.success(response.message)

                // Add to history
                setHistory(prev => [{
                    id: Date.now(),
                    timestamp: new Date(),
                    type: mode,
                    product: response.product,
                    message: response.message,
                    success: true
                }, ...prev].slice(0, 10))
            }
        } catch (error: any) {
            playSound('error')
            const errorMsg = error.response?.data?.error || 'Scan failed'
            toast.error(errorMsg)

            // Add error to history
            setHistory(prev => [{
                id: Date.now(),
                timestamp: new Date(),
                type: mode,
                message: errorMsg,
                success: false,
                barcode: barcode
            }, ...prev].slice(0, 10))
        } finally {
            setIsLoading(false)
            setBarcode('')
        }
    }

    return (
        <AdminLayout>
            <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory 2.0 (Smart Mode)</h1>
                        <p className="text-muted-foreground">High-speed barcode scanning with auto-stock updates</p>
                    </div>
                    <StockLabelsViewer />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                    {/* Main Scanner Area */}
                    <Card className="md:col-span-2 flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Scan className="h-5 w-5" />
                                Scanner Input
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-center items-center gap-8">

                            {/* Mode Toggle */}
                            <div className="flex items-center gap-4 bg-muted p-2 rounded-lg">
                                <span className={`text-sm font-medium ${mode === 'add' ? 'text-muted-foreground' : 'text-primary'}`}>Remove Stock</span>
                                <Switch
                                    checked={mode === 'add'}
                                    onCheckedChange={(checked) => setMode(checked ? 'add' : 'remove')}
                                    className={mode === 'add' ? 'bg-green-500' : 'bg-red-500'}
                                />
                                <span className={`text-sm font-medium ${mode === 'add' ? 'text-primary' : 'text-muted-foreground'}`}>Add Stock</span>
                            </div>

                            {/* Status Indicator */}
                            <div className={`text-6xl font-bold ${mode === 'add' ? 'text-green-500' : 'text-red-500'}`}>
                                {mode === 'add' ? 'ADDING' : 'REMOVING'}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleScan} className="w-full max-w-md">
                                <Input
                                    ref={inputRef}
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="Scan barcode here..."
                                    className="h-16 text-2xl text-center"
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <p className="text-center text-sm text-muted-foreground mt-2">
                                    Focus is locked. Just scan.
                                </p>
                            </form>

                        </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="flex flex-col h-full overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Live Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            <div className="divide-y">
                                {history.length === 0 && (
                                    <div className="p-4 text-center text-muted-foreground">
                                        No scans yet
                                    </div>
                                )}
                                {history.map((item) => (
                                    <div key={item.id} className={`p-4 flex items-start gap-3 ${item.success ? 'bg-background' : 'bg-red-50'}`}>
                                        {item.success ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{item.message}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.timestamp.toLocaleTimeString()}
                                            </p>
                                            {item.product && (
                                                <div className="mt-1 text-xs bg-muted p-1 rounded inline-block">
                                                    Stock: {item.product.oldStock} → {item.product.newStock}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout >
    )
}

function StockLabelsViewer() {
    const [open, setOpen] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [generatingId, setGeneratingId] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchProducts(1)
        }
    }, [open])

    const fetchProducts = async (pageNum: number) => {
        setIsLoading(true)
        try {
            const response = await api.products.getAll({ page: pageNum, limit: 10 }) as any
            setProducts(response.products)
            setTotalPages(response.pagination.pages)
            setPage(pageNum)
        } catch (error) {
            console.error('Failed to fetch products', error)
            toast.error('Failed to load products')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrint = async (product: any) => {
        setGeneratingId(product.id)
        try {
            // Dynamic imports for performance
            const { default: jsPDF } = await import('jspdf')
            const QRCode = await import('qrcode')

            const doc = new jsPDF()
            let y = 10
            let x = 10

            // Title
            doc.setFontSize(16)
            doc.text(`Labels for ${product.name} (${product.reference})`, 10, 10)
            y += 20

            for (const size of product.sizes) {
                // Generate Barcode
                const barcodeValue = `${product.reference}-${size.size}`
                const qrDataUrl = await QRCode.toDataURL(barcodeValue)

                // Check page bounds
                if (y > 250) {
                    doc.addPage()
                    y = 10
                }

                // Draw Label
                doc.setDrawColor(200)
                doc.rect(x, y, 60, 40) // Border

                doc.setFontSize(10)
                doc.text(product.name.substring(0, 20), x + 2, y + 5)

                doc.setFontSize(16)
                doc.text(size.size, x + 45, y + 15)

                doc.addImage(qrDataUrl, 'PNG', x + 2, y + 8, 25, 25)

                doc.setFontSize(8)
                doc.text(barcodeValue, x + 2, y + 38)

                // Grid logic (3 columns)
                x += 65
                if (x > 150) {
                    x = 10
                    y += 45
                }
            }

            doc.save(`${product.reference}-labels.pdf`)
            toast.success('Labels generated!')
        } catch (error) {
            console.error('Label generation failed', error)
            toast.error('Failed to generate labels')
        } finally {
            setGeneratingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Stock Labels Viewer
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Stock Labels Viewer</DialogTitle>
                    <DialogDescription>
                        View and print QR codes for all product sizes.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="text-center py-8">Loading products...</div>
                    ) : (
                        <div className="space-y-4">
                            {products.map(product => (
                                <div key={product.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {product.image && (
                                            <div className="relative w-16 h-16 rounded overflow-hidden">
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold">{product.name}</h3>
                                            <p className="text-sm text-muted-foreground">{product.reference}</p>
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {product.sizes.map((size: any) => (
                                                    <Badge key={size.id} variant="secondary">
                                                        {size.size}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handlePrint(product)}
                                        disabled={generatingId === product.id}
                                    >
                                        {generatingId === product.id ? 'Generating...' : 'Print All Sizes'}
                                        <Printer className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => fetchProducts(page - 1)}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => fetchProducts(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
