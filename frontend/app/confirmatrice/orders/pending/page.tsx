'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ShoppingCart, 
  Edit, 
  Plus, 
  Minus, 
  Save, 
  X,
  Phone,
  Truck,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    price: number
    images: { url: string; alt?: string }[]
  }
  quantity: number
  price: number
  size?: string
  sizeId?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryType: 'HOME_DELIVERY' | 'PICKUP'
  deliveryAddress?: string
  deliveryFee: number
  subtotal: number
  total: number
  notes?: string
  callCenterStatus: 'NEW' | 'CONFIRMED' | 'CANCELED' | 'NO_RESPONSE' | 'PENDING' | 'DOUBLE_ORDER' | 'DELAYED'
  deliveryStatus: 'NOT_READY' | 'READY' | 'IN_TRANSIT' | 'DONE'
  trackingNumber?: string
  yalidineShipmentId?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  city: {
    id: string
    name: string
  }
  deliveryDesk?: {
    id: string
    name: string
  }
}

interface Product {
  id: string
  name: string
  price: number
  images: { url: string; alt?: string }[]
  sizes: { id: string; size: string; stock: number }[]
}

export default function ConfirmatriceOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [selectedOrderForProduct, setSelectedOrderForProduct] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/confirmatrice/orders/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const endpoint = status === 'CONFIRMED' ? 'confirm' : 
                      status === 'CANCELED' ? 'cancel' : 'no-response'
      
      const response = await fetch(`/api/confirmatrice/orders/${orderId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        const updatedOrder = await response.json()
        
        if (status === 'CONFIRMED' && updatedOrder.trackingNumber) {
          toast.success(`Commande confirmée! Numéro de suivi Yalidine: ${updatedOrder.trackingNumber}`)
        } else if (status === 'CONFIRMED') {
          toast.success('Commande confirmée! Expédition Yalidine en cours de création...')
        } else {
          toast.success('Statut de la commande mis à jour')
        }
        
        fetchOrders() // Refresh the list
      } else {
        toast.error('Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const updateOrder = async (orderData: Partial<Order>) => {
    if (!editingOrder) return

    try {
      const response = await fetch(`/api/confirmatrice/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        toast.success('Commande mise à jour avec succès')
        setShowEditDialog(false)
        setEditingOrder(null)
        fetchOrders()
      } else {
        toast.error('Erreur lors de la mise à jour de la commande')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Erreur lors de la mise à jour de la commande')
    }
  }

  const updateOrderItemQuantity = async (orderId: string, itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/confirmatrice/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ quantity })
      })

      if (response.ok) {
        toast.success('Quantité mise à jour')
        fetchOrders()
      } else {
        toast.error('Erreur lors de la mise à jour de la quantité')
      }
    } catch (error) {
      console.error('Error updating item quantity:', error)
      toast.error('Erreur lors de la mise à jour de la quantité')
    }
  }

  const removeOrderItem = async (orderId: string, itemId: string) => {
    try {
      const response = await fetch(`/api/confirmatrice/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        toast.success('Produit supprimé de la commande')
        fetchOrders()
      } else {
        toast.error('Erreur lors de la suppression du produit')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Erreur lors de la suppression du produit')
    }
  }

  const addProductToOrder = async (orderId: string, productId: string, quantity: number, sizeId?: string) => {
    try {
      const response = await fetch(`/api/confirmatrice/orders/${orderId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId, quantity, sizeId })
      })

      if (response.ok) {
        toast.success('Produit ajouté à la commande')
        setShowAddProductDialog(false)
        setSelectedOrderForProduct(null)
        fetchOrders()
      } else {
        toast.error('Erreur lors de l\'ajout du produit')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Erreur lors de l\'ajout du produit')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { label: 'Nouvelle', color: 'bg-blue-100 text-blue-800' },
      CONFIRMED: { label: 'Confirmée', color: 'bg-green-100 text-green-800' },
      CANCELED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
      NO_RESPONSE: { label: 'Pas de réponse', color: 'bg-orange-100 text-orange-800' },
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      DOUBLE_ORDER: { label: 'Commande double', color: 'bg-purple-100 text-purple-800' },
      DELAYED: { label: 'Retardée', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NEW
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getDeliveryTypeLabel = (type: string) => {
    return type === 'HOME_DELIVERY' ? 'Livraison à domicile' : 'Point relais'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600">Confirmation et modification des commandes</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {orders.length} commandes
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Commandes en Attente</span>
          </CardTitle>
          <CardDescription>
            Gérez les commandes et confirmez les détails avec les clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Livraison</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        {order.customerEmail && (
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                            {/* Product Image */}
                            <div className="relative w-12 h-12 flex-shrink-0">
                              <Image
                                src={item.product.images?.[0]?.url || '/placeholder.svg'}
                                alt={item.product.name}
                                fill
                                className="object-cover rounded-md"
                                sizes="48px"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.product.name}</div>
                              <div className="text-xs text-gray-500">{item.product.price.toFixed(2)} DH</div>
                              {item.size && (
                                <div className="text-xs text-gray-500">Taille: {item.size}</div>
                              )}
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderItemQuantity(order.id, item.id, Math.max(0, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderItemQuantity(order.id, item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeOrderItem(order.id, item.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrderForProduct(order)
                            setShowAddProductDialog(true)
                          }}
                          className="w-full mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter produit
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{getDeliveryTypeLabel(order.deliveryType)}</span>
                      </div>
                      {order.deliveryAddress && (
                        <div className="text-xs text-gray-500 mt-1">{order.deliveryAddress}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-right">
                        <div className="font-medium">{order.total.toFixed(2)} DH</div>
                        <div className="text-xs text-gray-500">
                          Sous-total: {order.subtotal.toFixed(2)} DH
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="text-xs text-gray-500">
                            Livraison: {order.deliveryFee.toFixed(2)} DH
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(order.callCenterStatus)}
                        {order.trackingNumber && (
                          <div className="text-xs text-blue-600 font-mono">
                            📦 {order.trackingNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingOrder(order)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <div className="flex flex-col space-y-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'CANCELED')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Commande</DialogTitle>
            <DialogDescription>
              Modifiez les détails de la commande et ajoutez des observations
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nom du client</Label>
                  <Input
                    id="customerName"
                    value={editingOrder.customerName}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      customerName: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Téléphone</Label>
                  <Input
                    id="customerPhone"
                    value={editingOrder.customerPhone}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      customerPhone: e.target.value
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  value={editingOrder.customerEmail || ''}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    customerEmail: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="deliveryType">Type de livraison</Label>
                <Select
                  value={editingOrder.deliveryType}
                  onValueChange={(value) => setEditingOrder({
                    ...editingOrder,
                    deliveryType: value as 'HOME_DELIVERY' | 'PICKUP'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME_DELIVERY">Livraison à domicile</SelectItem>
                    <SelectItem value="PICKUP">Point relais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingOrder.deliveryType === 'HOME_DELIVERY' && (
                <div>
                  <Label htmlFor="deliveryAddress">Adresse de livraison</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={editingOrder.deliveryAddress || ''}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      deliveryAddress: e.target.value
                    })}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={editingOrder.callCenterStatus}
                  onValueChange={(value) => setEditingOrder({
                    ...editingOrder,
                    callCenterStatus: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Nouvelle</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="DOUBLE_ORDER">Commande double</SelectItem>
                    <SelectItem value="CANCELED">Annulée</SelectItem>
                    <SelectItem value="DELAYED">Retardée</SelectItem>
                    <SelectItem value="NO_RESPONSE">Pas de réponse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Observations</Label>
                <Textarea
                  id="notes"
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    notes: e.target.value
                  })}
                  placeholder="Ajoutez des observations sur cette commande..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => updateOrder(editingOrder)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un Produit</DialogTitle>
            <DialogDescription>
              Sélectionnez un produit à ajouter à la commande
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForProduct && (
            <AddProductForm
              products={products}
              onAddProduct={(productId, quantity, sizeId) => 
                addProductToOrder(selectedOrderForProduct.id, productId, quantity, sizeId)
              }
              onCancel={() => setShowAddProductDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add Product Form Component
interface AddProductFormProps {
  products: Product[]
  onAddProduct: (productId: string, quantity: number, sizeId?: string) => void
  onCancel: () => void
}

function AddProductForm({ products, onAddProduct, onCancel }: AddProductFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string>('')

  const handleAdd = () => {
    if (selectedProduct) {
      onAddProduct(selectedProduct.id, quantity, selectedSize || undefined)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="product">Produit</Label>
        <Select onValueChange={(productId) => {
          const product = products.find(p => p.id === productId)
          setSelectedProduct(product || null)
          setSelectedSize('')
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un produit" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} - {product.price.toFixed(2)} DH
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && selectedProduct.sizes.length > 0 && (
        <div>
          <Label htmlFor="size">Taille</Label>
          <Select value={selectedSize} onValueChange={setSelectedSize}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une taille" />
            </SelectTrigger>
            <SelectContent>
              {selectedProduct.sizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.size} (Stock: {size.stock})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="quantity">Quantité</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleAdd} disabled={!selectedProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>
    </div>
  )
}
