'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Save, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    price: number
    wholesalePrice: number | null
    image: string
    stock: number
    reference: string
}

export default function WholesalePricesPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [changes, setChanges] = useState<Map<string, number | null>>(new Map())

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            const res = await api.admin.getProducts({ limit: 1000 }) as any
            setProducts(res.products || [])
        } catch (error) {
            console.error('Failed to load products:', error)
            toast.error('Failed to load products')
        }
    }

    const handlePriceChange = (productId: string, value: string) => {
        const newChanges = new Map(changes)
        const numValue = value === '' ? null : parseFloat(value)
        newChanges.set(productId, numValue)
        setChanges(newChanges)
    }

    const handleSave = async () => {
        if (changes.size === 0) {
            toast.info('No changes to save')
            return
        }

        setLoading(true)
        try {
            const updates = Array.from(changes.entries()).map(([id, wholesalePrice]) => ({
                id,
                wholesalePrice
            }))

            await api.admin.updateWholesalePrices(updates)
            toast.success(`Updated ${updates.length} wholesale prices`)
            setChanges(new Map())
            loadProducts() // Reload to show updated values
        } catch (error) {
            console.error('Save failed:', error)
            toast.error('Failed to save wholesale prices')
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Liste Prix Gros</h1>
                        <p className="text-muted-foreground">Gérer les prix de gros pour tous les produits</p>
                    </div>
                    <Button onClick={handleSave} disabled={loading || changes.size === 0} size="lg">
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer {changes.size > 0 && `(${changes.size})`}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Rechercher par nom ou référence..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produit</TableHead>
                                    <TableHead>Référence</TableHead>
                                    <TableHead>Prix Normal</TableHead>
                                    <TableHead>Prix Gros</TableHead>
                                    <TableHead>Stock</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map(product => {
                                    const currentValue = changes.has(product.id)
                                        ? changes.get(product.id)
                                        : product.wholesalePrice

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 relative bg-muted rounded overflow-hidden">
                                                        {product.image && (
                                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{product.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {product.reference || '-'}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {product.price.toLocaleString()} DA
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        className="w-32"
                                                        placeholder="Prix gros"
                                                        value={currentValue ?? ''}
                                                        onChange={e => handlePriceChange(product.id, e.target.value)}
                                                    />
                                                    <span className="text-sm text-muted-foreground">DA</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {product.stock}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
