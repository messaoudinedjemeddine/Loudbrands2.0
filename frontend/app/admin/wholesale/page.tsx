'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Trash2, Save, ShoppingCart, User, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import Image from 'next/image'

// Wilayas list (same as in other parts of the app)
const WILAYAS = [
    { id: 1, name: 'Adrar' }, { id: 2, name: 'Chlef' }, { id: 3, name: 'Laghouat' }, { id: 4, name: 'Oum El Bouaghi' },
    { id: 5, name: 'Batna' }, { id: 6, name: 'Béjaïa' }, { id: 7, name: 'Biskra' }, { id: 8, name: 'Béchar' },
    { id: 9, name: 'Blida' }, { id: 10, name: 'Bouira' }, { id: 11, name: 'Tamanrasset' }, { id: 12, name: 'Tébessa' },
    { id: 13, name: 'Tlemcen' }, { id: 14, name: 'Tiaret' }, { id: 15, name: 'Tizi Ouzou' }, { id: 16, name: 'Alger' },
    { id: 17, name: 'Djelfa' }, { id: 18, name: 'Jijel' }, { id: 19, name: 'Sétif' }, { id: 20, name: 'Saïda' },
    { id: 21, name: 'Skikda' }, { id: 22, name: 'Sidi Bel Abbès' }, { id: 23, name: 'Annaba' }, { id: 24, name: 'Guelma' },
    { id: 25, name: 'Constantine' }, { id: 26, name: 'Médéa' }, { id: 27, name: 'Mostaganem' }, { id: 28, name: "M'Sila" },
    { id: 29, name: 'Mascara' }, { id: 30, name: 'Ouargla' }, { id: 31, name: 'Oran' }, { id: 32, name: 'El Bayadh' },
    { id: 33, name: 'Illizi' }, { id: 34, name: 'Bordj Bou Arreridj' }, { id: 35, name: 'Boumerdès' }, { id: 36, name: 'El Tarf' },
    { id: 37, name: 'Tindouf' }, { id: 38, name: 'Tissemsilt' }, { id: 39, name: 'El Oued' }, { id: 40, name: 'Khenchela' },
    { id: 41, name: 'Souk Ahras' }, { id: 42, name: 'Tipaza' }, { id: 43, name: 'Mila' }, { id: 44, name: 'Aïn Defla' },
    { id: 45, name: 'Naâma' }, { id: 46, name: 'Aïn Témouchent' }, { id: 47, name: 'Ghardaïa' }, { id: 48, name: 'Relizane' },
    { id: 49, name: 'Timimoun' }, { id: 50, name: 'Bordj Badji Mokhtar' }, { id: 51, name: 'Ouled Djellal' }, { id: 52, name: 'Béni Abbès' },
    { id: 53, name: 'In Salah' }, { id: 54, name: 'In Guezzam' }, { id: 55, name: 'Touggourt' }, { id: 56, name: 'Djanet' },
    { id: 57, name: "El M'Ghair" }, { id: 58, name: 'El Meniaa' }
];

interface Product {
    id: string
    name: string
    price: number
    image: string
    stock: number
    sizes?: { id: string, size: string, stock: number }[]
}

interface OrderItem {
    productId: string
    name: string
    price: number // Custom input price
    originalPrice: number
    quantity: number
    size?: string
    sizeId?: string
    image?: string
}

export default function WholesaleOrderPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Order Form State
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [wilayaId, setWilayaId] = useState('')
    // const [commune, setCommune] = useState('') // Optional: Add commune if needed
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')

    const [orderItems, setOrderItems] = useState<OrderItem[]>([])

    // Product Search Handler
    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length > 2) {
            try {
                const res = await api.admin.getProducts({ search: query, limit: 5 }) as any
                setProducts(res.products || [])
            } catch (err) {
                console.error("Failed to search products", err)
            }
        } else {
            setProducts([])
        }
    }

    // Add Product to Order
    const addProductToOrder = (product: Product, size?: { id: string, size: string }) => {
        const existingItemIndex = orderItems.findIndex(item =>
            item.productId === product.id && item.size === size?.size
        )

        if (existingItemIndex >= 0) {
            // Item exists, just increment quantity? 
            // Better to let user manually adjust quantity in table to avoid confusion with custom prices
            toast.info("Product already added. Adjust quantity in the list.")
            return
        }

        const newItem: OrderItem = {
            productId: product.id,
            name: product.name,
            price: product.price, // Default to current price, but editable
            originalPrice: product.price,
            quantity: 1,
            size: size?.size,
            sizeId: size?.id,
            image: product.image
        }

        setOrderItems([...orderItems, newItem])
        setProducts([]) // Clear search results
        setSearchQuery('')
    }

    // Update Item in Order list
    const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...orderItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setOrderItems(newItems)
    }

    const removeOrderItem = (index: number) => {
        const newItems = [...orderItems]
        newItems.splice(index, 1)
        setOrderItems(newItems)
    }

    const calculateTotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    }

    const handleSubmit = async () => {
        if (!clientName || !clientPhone || !wilayaId || orderItems.length === 0) {
            toast.error("Please fill in all required fields and add at least one product.")
            return
        }

        setLoading(true)
        try {
            const orderData = {
                customerName: clientName,
                customerPhone: clientPhone,
                wilayaId: parseInt(wilayaId),
                deliveryAddress: address,
                notes: notes,
                deliveryType: 'HOME_DELIVERY', // Default to Home Delivery for Wholesale
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price, // This is the key custom field!
                    size: item.size,
                    sizeId: item.sizeId
                }))
            }

            await api.admin.createOrder(orderData)
            toast.success("Wholesale Order Created Successfully!")
            router.push('/admin/orders')

        } catch (error) {
            console.error("Order creation failed", error)
            toast.error("Failed to create order. Check console.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-5xl mx-auto pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Nouvelle Commande de Gros</h1>
                        <p className="text-muted-foreground">Créer une commande manuelle avec prix personnalisés</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* LEFT COLUMN - Client Info */}
                    <div className="md:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Information Client
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Nom Complet *</Label>
                                    <Input
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                        placeholder="Nom du client"
                                    />
                                </div>
                                <div>
                                    <Label>Téléphone *</Label>
                                    <Input
                                        value={clientPhone}
                                        onChange={e => setClientPhone(e.target.value)}
                                        placeholder="05 XX XX XX XX"
                                    />
                                </div>
                                <div>
                                    <Label>Wilaya *</Label>
                                    <Select value={wilayaId} onValueChange={setWilayaId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner Wilaya" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WILAYAS.map(w => (
                                                <SelectItem key={w.id} value={w.id.toString()}>
                                                    {w.id} - {w.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Adresse / Commune</Label>
                                    <Input
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Commune, Adresse détaillée..."
                                    />
                                </div>
                                <div>
                                    <Label>Note (Optionnel)</Label>
                                    <Input
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Instructions spéciales..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN - Product Selection & Order Items */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Product Search */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Ajouter des Produits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Rechercher produit par nom..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={e => handleSearch(e.target.value)}
                                    />
                                </div>

                                {products.length > 0 && (
                                    <div className="border rounded-md max-h-64 overflow-y-auto bg-background absolute z-10 w-full md:w-[600px] shadow-lg">
                                        {products.map(product => (
                                            <div key={product.id} className="p-3 hover:bg-muted border-b last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 relative bg-muted rounded overflow-hidden">
                                                        {product.image && (
                                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{product.name}</div>
                                                        <div className="text-sm text-muted-foreground">Stock: {product.stock}</div>
                                                    </div>
                                                    {product.sizes && product.sizes.length > 0 ? (
                                                        <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                                                            {product.sizes.map(size => (
                                                                <Button
                                                                    key={size.id}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => addProductToOrder(product, size)}
                                                                >
                                                                    {size.size}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <Button size="sm" onClick={() => addProductToOrder(product)}>Ajouter</Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Order Items Table */}
                                <div className="border rounded-md mt-4 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produit</TableHead>
                                                <TableHead>Prix Gros (DA)</TableHead>
                                                <TableHead>Qté</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orderItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        Aucun produit ajouté
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                orderItems.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{item.name}</span>
                                                                {item.size && <span className="text-xs text-muted-foreground">Taille: {item.size}</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                className="w-24 h-8"
                                                                value={item.price}
                                                                onChange={(e) => updateOrderItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                className="w-16 h-8"
                                                                value={item.quantity}
                                                                min={1}
                                                                onChange={(e) => updateOrderItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-bold">
                                                            {(item.price * item.quantity).toLocaleString()} DA
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeOrderItem(idx)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex justify-end mt-4 text-xl font-bold">
                                    Total: {calculateTotal().toLocaleString()} DA
                                </div>

                                <Button
                                    className="w-full mt-6"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={loading || orderItems.length === 0}
                                >
                                    {loading ? 'Création...' : 'Valider la Commande'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
