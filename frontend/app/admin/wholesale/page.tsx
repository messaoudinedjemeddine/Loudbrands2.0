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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { yalidineAPI, type Commune, type Center } from '@/lib/yalidine-api'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

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
    const [selectedProductForBulk, setSelectedProductForBulk] = useState<Product | null>(null)
    const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({})

    // Order Form State
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [wilayaId, setWilayaId] = useState('')
    // const [commune, setCommune] = useState('') // Optional: Add commune if needed
    const [address, setAddress] = useState('')
    const [notes, setNotes] = useState('')

    // Yalidine Shipping State
    const [deliveryType, setDeliveryType] = useState<'HOME_DELIVERY' | 'PICKUP'>('HOME_DELIVERY')
    const [communes, setCommunes] = useState<Commune[]>([])
    const [communeId, setCommuneId] = useState('')
    const [communeName, setCommuneName] = useState('')
    const [centers, setCenters] = useState<Center[]>([])
    const [centerId, setCenterId] = useState('')
    const [centerName, setCenterName] = useState('')
    const [deliveryFee, setDeliveryFee] = useState(0)
    const [isLoadingShipping, setIsLoadingShipping] = useState(false)

    const [orderItems, setOrderItems] = useState<OrderItem[]>([])

    // Load communes/centers when wilaya changes
    const loadCommunes = async (wilayaId: string, type: 'HOME_DELIVERY' | 'PICKUP' = deliveryType) => {
        if (!wilayaId) return

        setIsLoadingShipping(true)
        try {
            // Always load centers for pickup availability check or desk selection
            const centersData = await yalidineAPI.getCenters(parseInt(wilayaId))
            setCenters(centersData.data || [])

            if (type === 'PICKUP') {
                // Filter communes that have centers
                const uniqueCommunes = new Map<number, Commune>()
                centersData.data?.forEach(center => {
                    if (!uniqueCommunes.has(center.commune_id)) {
                        uniqueCommunes.set(center.commune_id, {
                            id: center.commune_id,
                            name: center.commune_name,
                            wilaya_id: center.wilaya_id,
                            wilaya_name: center.wilaya_name,
                            has_stop_desk: true,
                            is_deliverable: true,
                            delivery_time_parcel: 0,
                            delivery_time_payment: 0
                        })
                    }
                })
                setCommunes(Array.from(uniqueCommunes.values()))
            } else {
                // Home delivery - get all communes
                const response = await yalidineAPI.getCommunes(parseInt(wilayaId))
                setCommunes(response.data || [])
            }

            // Calculate initial fee
            calculateShippingFees(parseInt(wilayaId), type)
        } catch (error) {
            console.error('Failed to load Yalidine data:', error)
            toast.error('Failed to load shipping options')
        } finally {
            setIsLoadingShipping(false)
        }
    }

    const calculateTotal = () => {
        return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    }

    const calculateShippingFees = async (toWilayaId: number, type: 'HOME_DELIVERY' | 'PICKUP') => {
        try {
            // Estimate weight
            const weight = Math.max(0.5, orderItems.reduce((acc, item) => acc + (item.quantity * 0.5), 0))

            const fees = await yalidineAPI.calculateFees({
                fromWilayaId: 5, // Batna default
                toWilayaId,
                weight,
                declaredValue: calculateTotal()
            })

            if (type === 'HOME_DELIVERY') {
                setDeliveryFee(fees.deliveryOptions.express.home || 500)
            } else {
                setDeliveryFee(fees.deliveryOptions.express.desk || 0)
            }
        } catch (err) {
            console.error('Fee calc error:', err)
            if (type === 'HOME_DELIVERY') {
                setDeliveryFee(500)
            } else {
                setDeliveryFee(0)
            }
        }
    }

    // Effect to recalculate fee when items change (value/weight changes)
    useEffect(() => {
        if (wilayaId) {
            calculateShippingFees(parseInt(wilayaId), deliveryType)
        }
    }, [orderItems.length, calculateTotal()])

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

    const openBulkAddModal = (product: Product) => {
        setSelectedProductForBulk(product)
        // Initialize quantities with 0
        const initialQuantities: Record<string, number> = {}
        if (product.sizes) {
            product.sizes.forEach(s => initialQuantities[s.id] = 0)
        } else {
            // No sizes, just base product logic (though this function is mainly for sized products)
            initialQuantities['base'] = 0
        }
        setBulkQuantities(initialQuantities)
    }

    const handleBulkAdd = () => {
        if (!selectedProductForBulk) return

        const itemsToAdd: OrderItem[] = []

        if (selectedProductForBulk.sizes && selectedProductForBulk.sizes.length > 0) {
            selectedProductForBulk.sizes.forEach(size => {
                const qty = bulkQuantities[size.id]
                if (qty > 0) {
                    itemsToAdd.push({
                        productId: selectedProductForBulk.id,
                        name: selectedProductForBulk.name,
                        price: selectedProductForBulk.price,
                        originalPrice: selectedProductForBulk.price,
                        quantity: qty,
                        size: size.size,
                        sizeId: size.id,
                        image: selectedProductForBulk.image
                    })
                }
            })
        } else {
            // Fallback for no sizes if somehow opened
            const qty = bulkQuantities['base'] || 0
            if (qty > 0) {
                itemsToAdd.push({
                    productId: selectedProductForBulk.id,
                    name: selectedProductForBulk.name,
                    price: selectedProductForBulk.price,
                    originalPrice: selectedProductForBulk.price,
                    quantity: qty,
                    image: selectedProductForBulk.image
                })
            }
        }

        // Merge with existing items or add new
        const updatedOrderItems = [...orderItems]
        itemsToAdd.forEach(newItem => {
            const existingIndex = updatedOrderItems.findIndex(
                item => item.productId === newItem.productId && item.sizeId === newItem.sizeId
            )
            if (existingIndex >= 0) {
                updatedOrderItems[existingIndex].quantity += newItem.quantity
            } else {
                updatedOrderItems.push(newItem)
            }
        })

        setOrderItems(updatedOrderItems)
        setSelectedProductForBulk(null)
        setBulkQuantities({})
        setProducts([])
        setSearchQuery('')
        toast.success(`${itemsToAdd.length} items added to order`)
    }



    const handleSubmit = async () => {
        if (!clientName || !clientPhone || !wilayaId || orderItems.length === 0) {
            toast.error("Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Wilaya, Produits)")
            return
        }

        if (deliveryType === 'HOME_DELIVERY' && (!communeId || !address)) {
            toast.error("Veuillez sélectionner la commune et l'adresse")
            return
        }

        if (deliveryType === 'PICKUP' && (!communeId || !centerId)) {
            toast.error("Veuillez sélectionner la commune et le bureau")
            return
        }

        setLoading(true)
        try {
            const selectedCenter = centers.find(c => c.center_id.toString() === centerId)

            const orderData = {
                customerName: clientName,
                customerPhone: clientPhone,
                wilayaId: parseInt(wilayaId),

                // Yalidine fields
                deliveryType: deliveryType,
                deliveryAddress: deliveryType === 'HOME_DELIVERY' ? address : undefined,
                deliveryDeskId: deliveryType === 'PICKUP' ? centerId : undefined,
                deliveryDeskName: deliveryType === 'PICKUP' && selectedCenter ? selectedCenter.name : undefined,
                communeId: communeId,
                communeName: communeName,
                deliveryFee: deliveryFee,

                notes: notes,
                items: orderItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size,
                    sizeId: item.sizeId
                }))
            }

            await api.admin.createOrder(orderData)
            toast.success("Commande de Gros Créée avec Succès!")
            router.push('/admin/orders')

        } catch (error) {
            console.error("Order creation failed", error)
            toast.error("Échec de création de commande")
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
                                    <Select value={wilayaId} onValueChange={(value) => {
                                        setWilayaId(value)
                                        setCommuneId('')
                                        setCommuneName('')
                                        setCenterId('')
                                        setCenterName('')
                                        loadCommunes(value, deliveryType)
                                    }}>
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

                                {/* Delivery Type */}
                                <div>
                                    <Label className="mb-2 block">Type de Livraison *</Label>
                                    <RadioGroup
                                        value={deliveryType}
                                        onValueChange={(value: 'HOME_DELIVERY' | 'PICKUP') => {
                                            setDeliveryType(value)
                                            if (wilayaId) {
                                                setCommuneId('')
                                                setCommuneName('')
                                                setCenterId('')
                                                setCenterName('')
                                                loadCommunes(wilayaId, value)
                                            }
                                        }}
                                        className="gap-4"
                                    >
                                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                                            <RadioGroupItem value="HOME_DELIVERY" id="home" />
                                            <Label htmlFor="home" className="cursor-pointer flex-1 flex flex-col">
                                                <span className="font-medium">Livraison à Domicile</span>
                                                <span className="text-xs text-muted-foreground">Yalidine livre au domicile</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                                            <RadioGroupItem value="PICKUP" id="pickup" />
                                            <Label htmlFor="pickup" className="cursor-pointer flex-1 flex flex-col">
                                                <span className="font-medium">Retrait au Bureau</span>
                                                <span className="text-xs text-muted-foreground">Récupérer au StopDesk</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Commune Selection */}
                                {wilayaId && (
                                    <div>
                                        <Label>Commune {deliveryType === 'PICKUP' ? '(avec StopDesk)' : ''} *</Label>
                                        <Select
                                            value={communeId}
                                            onValueChange={(value) => {
                                                const selected = communes.find(c => c.id.toString() === value)
                                                setCommuneId(value)
                                                setCommuneName(selected?.name || '')
                                                setCenterId('') // Reset center when commune changes
                                            }}
                                            disabled={isLoadingShipping}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner Commune" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {communes.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Center (Desk) Selection - Pickup Only */}
                                {deliveryType === 'PICKUP' && communeId && (
                                    <div>
                                        <Label>Bureau StopDesk *</Label>
                                        <Select
                                            value={centerId}
                                            onValueChange={(value) => {
                                                const selected = centers.find(c => c.center_id.toString() === value)
                                                setCenterId(value)
                                                setCenterName(selected?.name || '')
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner Bureau" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {centers
                                                    .filter(c => c.commune_id.toString() === communeId)
                                                    .map((c) => (
                                                        <SelectItem key={c.center_id} value={c.center_id.toString()}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {deliveryType === 'HOME_DELIVERY' && (
                                    <div>
                                        <Label>Adresse Détaillée *</Label>
                                        <Input
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            placeholder="Commune, Adresse détaillée..."
                                        />
                                    </div>
                                )}
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
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="h-8 text-xs bg-black hover:bg-gray-800 text-white"
                                                                onClick={() => openBulkAddModal(product)}
                                                            >
                                                                Sélectionner Tailles
                                                            </Button>
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

                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-base">
                                        <span>Sous-total:</span>
                                        <span>{calculateTotal().toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span>Frais de livraison:</span>
                                        <span>{deliveryFee.toLocaleString()} DA</span>
                                    </div>
                                    <div className="flex justify-end text-xl font-bold border-t pt-2">
                                        Total: {(calculateTotal() + deliveryFee).toLocaleString()} DA
                                    </div>
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

            {/* Bulk Add Modal */}
            <Dialog open={!!selectedProductForBulk} onOpenChange={(open) => !open && setSelectedProductForBulk(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Sélectionner Quantités pour {selectedProductForBulk?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-4">
                            {selectedProductForBulk?.sizes && selectedProductForBulk.sizes.map(size => (
                                <div key={size.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg">{size.size}</span>
                                        <span className={`text-xs ${size.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Stock: {size.stock}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setBulkQuantities(prev => ({
                                                ...prev,
                                                [size.id]: Math.max(0, (prev[size.id] || 0) - 1)
                                            }))}
                                        >
                                            -
                                        </Button>
                                        <Input
                                            type="number"
                                            className="w-16 h-8 text-center no-spinner"
                                            value={bulkQuantities[size.id] || 0}
                                            onChange={(e) => setBulkQuantities(prev => ({
                                                ...prev,
                                                [size.id]: Math.max(0, parseInt(e.target.value) || 0)
                                            }))}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setBulkQuantities(prev => ({
                                                ...prev,
                                                [size.id]: (prev[size.id] || 0) + 1
                                            }))}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setSelectedProductForBulk(null)}>Annuler</Button>
                        <Button onClick={handleBulkAdd}>Ajouter à la Commande</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}
