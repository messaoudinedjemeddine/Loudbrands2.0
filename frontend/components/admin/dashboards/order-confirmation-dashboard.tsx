'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  Loader2,
  Eye,
  AlertTriangle,
  FileText,
  Settings,
  Edit,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Tag,
  MessageSquare,
  Save,
  X,
  User,
  Mail,
  Home,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useLocaleStore } from '@/lib/locale-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { yalidineAPI, Wilaya } from '@/lib/yalidine-api'

interface OrderConfirmationStats {
  confirmedOrders: number;
  readyOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  totalOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  doubleOrders: number;
  delayedOrders: number;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  product: {
    id: string;
    name: string;
    nameAr?: string;
    price: number;
    image?: string;
    sizes?: Array<{ id: string; name: string; price?: number }>;
    colors?: Array<{ id: string; name: string; hex?: string }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'HOME_DELIVERY' | 'PICKUP';
  deliveryAddress?: string | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
  callCenterStatus: 'NEW' | 'CONFIRMED' | 'CANCELED' | 'PENDING' | 'DOUBLE_ORDER' | 'DELAYED';
  deliveryStatus: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  city: {
    id: string;
    name: string;
    nameAr?: string;
  };
  deliveryDesk?: {
    id: string;
    name: string;
    nameAr?: string;
  };
  items: OrderItem[];
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  image?: string;
  sizes?: Array<{ id: string; name: string; price?: number }>;
  colors?: Array<{ id: string; name: string; hex?: string }>;
}

interface City {
  id: string;
  name: string;
  nameAr?: string;
  deliveryFee: number;
}

interface DeliveryDesk {
  id: string;
  name: string;
  nameAr?: string;
  cityId: string;
}

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOUBLE_ORDER: 'bg-orange-100 text-orange-800',
  DELAYED: 'bg-purple-100 text-purple-800',
  NOT_READY: 'bg-gray-100 text-gray-800',
  READY: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800'
}

const statusLabels = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  CANCELED: 'Canceled',
  PENDING: 'Pending',
  DOUBLE_ORDER: 'Double Order',
  DELAYED: 'Delayed',
  NOT_READY: 'Not Ready',
  READY: 'Ready',
  IN_TRANSIT: 'In Transit',
  DONE: 'Delivered'
}

export function OrderConfirmationDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, isRTL, direction } = useLocaleStore()
  const [stats, setStats] = useState<OrderConfirmationStats>({
    confirmedOrders: 0,
    readyOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    totalOrders: 0,
    pendingOrders: 0,
    canceledOrders: 0,
    doubleOrders: 0,
    delayedOrders: 0
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [wilayas, setWilayas] = useState<Wilaya[]>([])

  // Enhanced functionality state
  const [products, setProducts] = useState<Product[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [deliveryDesks, setDeliveryDesks] = useState<DeliveryDesk[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [noteInput, setNoteInput] = useState('')

  // Form states
  const [editForm, setEditForm] = useState({
    customerPhone: '',
    deliveryType: 'HOME_DELIVERY' as 'HOME_DELIVERY' | 'PICKUP',
    deliveryAddress: '',
    cityId: '',
    deliveryDeskId: '',
    notes: ''
  })

  const [newItemForm, setNewItemForm] = useState({
    productId: '',
    quantity: 1,
    size: '',
    color: ''
  })

  useEffect(() => {
    fetchOrderConfirmationData()
    // Load Wilayas
    yalidineAPI.getWilayas().then(response => {
      setWilayas(response.data || [])
    }).catch(err => {
      console.error('Error fetching wilayas:', err)
    })
  }, [])

  const fetchOrderConfirmationData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all orders
      const ordersResponse = await api.admin.getOrders()
      const ordersData = (ordersResponse as any).data || ordersResponse as Order[]
      setOrders(ordersData)

      // Calculate stats
      const stats = {
        confirmedOrders: ordersData.filter((o: Order) => o.callCenterStatus === 'CONFIRMED').length,
        readyOrders: ordersData.filter((o: Order) => o.deliveryStatus === 'READY').length,
        inTransitOrders: ordersData.filter((o: Order) => o.deliveryStatus === 'IN_TRANSIT').length,
        deliveredOrders: ordersData.filter((o: Order) => o.deliveryStatus === 'DONE').length,
        totalOrders: ordersData.length,
        pendingOrders: ordersData.filter((o: Order) => o.callCenterStatus === 'PENDING').length,
        canceledOrders: ordersData.filter((o: Order) => o.callCenterStatus === 'CANCELED').length,
        doubleOrders: ordersData.filter((o: Order) => o.callCenterStatus === 'DOUBLE_ORDER').length,
        delayedOrders: ordersData.filter((o: Order) => o.callCenterStatus === 'DELAYED').length
      }
      setStats(stats)

      // Fetch products for editing
      const productsResponse = await api.admin.getProducts()
      setProducts((productsResponse as any).data || productsResponse as Product[])

      // Fetch cities and delivery desks - using direct API calls
      try {
        const citiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/admin/cities`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : ''}`,
            'Content-Type': 'application/json'
          }
        })
        const citiesData = await citiesResponse.json()
        setCities(citiesData.data || citiesData || [])

        const desksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/admin/delivery-desks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : ''}`,
            'Content-Type': 'application/json'
          }
        })
        const desksData = await desksResponse.json()
        setDeliveryDesks(desksData.data || desksData || [])
      } catch (err) {
        console.warn('Could not fetch cities/delivery desks:', err)
        setCities([])
        setDeliveryDesks([])
      }

    } catch (err) {
      console.error('Error fetching order confirmation data:', err)
      setError('Failed to load orders')
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setEditingOrder(order)
    setEditForm({
      customerPhone: order.customerPhone,
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress || '',
      cityId: order.city.id,
      deliveryDeskId: order.deliveryDesk?.id || '',
      notes: order.notes || ''
    })
    setShowEditDialog(true)
  }

  const handleSaveOrder = async () => {
    if (!editingOrder) return

    try {
      setLoadingAction(true)

      // Calculate new totals
      const city = cities.find(c => c.id === editForm.cityId)
      const deliveryFee = editForm.deliveryType === 'HOME_DELIVERY' ? (city?.deliveryFee || 0) : 0
      const subtotal = editingOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const total = subtotal + deliveryFee

      const updatedOrder = {
        ...editingOrder,
        customerPhone: editForm.customerPhone,
        deliveryType: editForm.deliveryType,
        deliveryAddress: editForm.deliveryType === 'HOME_DELIVERY' ? editForm.deliveryAddress : null,
        cityId: editForm.cityId,
        deliveryDeskId: editForm.deliveryType === 'PICKUP' ? editForm.deliveryDeskId : undefined,
        deliveryFee,
        subtotal,
        total,
        notes: editForm.notes
      }

      // Update order using direct API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedOrder)
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      // Update local state
      setOrders(orders.map(o => o.id === editingOrder.id ? { ...o, ...updatedOrder } : o))

      toast.success('Order updated successfully')
      setShowEditDialog(false)
      setEditingOrder(null)

      // Refresh data
      fetchOrderConfirmationData()

    } catch (err) {
      console.error('Error updating order:', err)
      toast.error('Failed to update order')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      setLoadingAction(true)

      const order = orders.find(o => o.id === orderId)
      if (!order) return

      // Update order status
      await api.admin.updateOrderStatus(orderId, { callCenterStatus: status })

      // Refresh data
      fetchOrderConfirmationData()
      toast.success('Order status updated')

    } catch (err) {
      console.error('Error updating order status:', err)
      toast.error('Failed to update order status')
    } finally {
      setLoadingAction(false)
      setShowStatusDialog(false)
    }
  }

  const handleUpdateNotes = async (orderId: string, noteToAppend: string) => {
    try {
      if (!noteToAppend.trim()) return

      setLoadingAction(true)

      // Update order notes using the PATCH status endpoint which supports appending
      await api.admin.updateOrderStatus(orderId, { appendNote: noteToAppend })

      // Update local state is tricky because we need the full new notes string. 
      // Ideally we fetch the order again or optimistic update (but we don't have the attribution signature easily).
      // Let's fetch the data.
      await fetchOrderConfirmationData()

      toast.success('Note added successfully')
      setShowNotesDialog(false)
      setNoteInput('')

    } catch (err) {
      console.error('Error updating notes:', err)
      toast.error('Failed to add note')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteItem = async (orderId: string, itemId: string) => {
    try {
      setLoadingAction(true)
      // Delete order item using direct API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/admin/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : ''}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      toast.success('Item deleted successfully')
      fetchOrderConfirmationData()

    } catch (err) {
      console.error('Error deleting item:', err)
      toast.error('Failed to delete item')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleAddItem = async (orderId: string) => {
    try {
      setLoadingAction(true)

      const product = products.find(p => p.id === newItemForm.productId)
      if (!product) return

      const itemData = {
        orderId,
        productId: newItemForm.productId,
        quantity: newItemForm.quantity,
        price: product.price,
        size: newItemForm.size || undefined,
        color: newItemForm.color || undefined
      }

      // Add order item using direct API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/admin/orders/${orderId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      toast.success('Item added successfully')
      setShowAddItemDialog(false)
      setNewItemForm({ productId: '', quantity: 1, size: '', color: '' })
      fetchOrderConfirmationData()

    } catch (err) {
      console.error('Error adding item:', err)
      toast.error('Failed to add item')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUpdateItem = async (orderId: string, itemId: string, updates: any) => {
    try {
      setLoadingAction(true)
      // Update order item using direct API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api'}/admin/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      toast.success('Item updated successfully')
      fetchOrderConfirmationData()

    } catch (err) {
      console.error('Error updating item:', err)
      toast.error('Failed to update item')
    } finally {
      setLoadingAction(false)
    }
  }

  const getFilteredOrders = (status: string) => {
    if (status === 'all') return orders
    return orders.filter(order => order.callCenterStatus === status)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p className="font-bold">System Update: v2.5 - FIX YALIDINE PRICE</p>
        <p>If you do NOT see this red banner, please force refresh (Ctrl+F5).</p>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Order Confirmation Dashboard</h2>
          <p className="text-muted-foreground">Manage and confirm customer orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                All orders from website
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">New Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Ready for preparation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Canceled</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.canceledOrders}</div>
              <p className="text-xs text-muted-foreground">
                Cancelled orders
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Other Status</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.doubleOrders + stats.delayedOrders}</div>
              <p className="text-xs text-muted-foreground">
                Double/Delayed orders
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Orders Management */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({stats.totalOrders})</TabsTrigger>
          <TabsTrigger value="NEW">New ({stats.pendingOrders})</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmed ({stats.confirmedOrders})</TabsTrigger>
          <TabsTrigger value="CANCELED">Canceled ({stats.canceledOrders})</TabsTrigger>
          <TabsTrigger value="DOUBLE_ORDER">Double ({stats.doubleOrders})</TabsTrigger>
          <TabsTrigger value="DELAYED">Delayed ({stats.delayedOrders})</TabsTrigger>
        </TabsList>

        {['all', 'NEW', 'CONFIRMED', 'CANCELED', 'DOUBLE_ORDER', 'DELAYED'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <ShoppingCart className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {status === 'all' ? 'All Orders' : `${statusLabels[status as keyof typeof statusLabels]} Orders`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getFilteredOrders(status).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders found</p>
                ) : (
                  <div className="space-y-4">
                    {getFilteredOrders(status).map((order) => (
                      <div key={order.id} className={`border rounded-lg p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="flex-1">
                            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} mb-2`}>
                              <h4 className="font-medium">#{order.orderNumber}</h4>
                              <Badge className={statusColors[order.callCenterStatus as keyof typeof statusColors]}>
                                {statusLabels[order.callCenterStatus as keyof typeof statusLabels]}
                              </Badge>
                            </div>

                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4`}>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <User className="w-4 h-4" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <Phone className="w-4 h-4" />
                                <span>{order.customerPhone}</span>
                              </div>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                {order.deliveryType === 'HOME_DELIVERY' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                                <span>{order.deliveryType === 'HOME_DELIVERY' ? 'Home Delivery' : 'Pickup'}</span>
                              </div>
                              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                <MapPin className="w-4 h-4" />
                                <span>{order.city.name}</span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="mb-4">
                              <h5 className="font-medium mb-2">Items ({order.items.length})</h5>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className={`flex items-center justify-between p-2 bg-gray-50 rounded ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className="flex-1">
                                      <p className="font-medium">{item.product.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Qty: {item.quantity} × {item.price.toLocaleString()} DA
                                        {item.size && ` | Size: ${item.size}`}
                                        {item.color && ` | Color: ${item.color}`}
                                      </p>
                                    </div>
                                    <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateItem(order.id, item.id, { quantity: item.quantity + 1 })}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateItem(order.id, item.id, { quantity: Math.max(1, item.quantity - 1) })}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteItem(order.id, item.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div>
                                <p>Subtotal: {order.subtotal.toLocaleString()} DA</p>
                                <p>Delivery: {order.deliveryFee.toLocaleString()} DA</p>
                                <p className="font-bold">Total: {order.total.toLocaleString()} DA</p>
                                <p className="text-muted-foreground">Created: {formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                          </div>

                          <div className={`flex flex-col ${isRTL ? 'space-y-reverse space-y-2' : 'space-y-2'}`}>
                            <Button
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              variant="outline"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowStatusDialog(true)
                              }}
                              variant="outline"
                            >
                              <Tag className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowNotesDialog(true)
                                setNoteInput('')
                              }}
                              variant="outline"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowAddItemDialog(true)
                              }}
                              variant="outline"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Order #{editingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  placeholder="Numéro de téléphone"
                />
              </div>

              <div>
                <Label htmlFor="deliveryType">Delivery Type</Label>
                <Select
                  value={editForm.deliveryType}
                  onValueChange={(value: 'HOME_DELIVERY' | 'PICKUP') => setEditForm({ ...editForm, deliveryType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME_DELIVERY">Home Delivery</SelectItem>
                    <SelectItem value="PICKUP">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editForm.deliveryType === 'HOME_DELIVERY' && (
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input
                  id="deliveryAddress"
                  value={editForm.deliveryAddress}
                  onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                  placeholder="Adresse complète"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Select
                  value={editForm.cityId}
                  onValueChange={(value) => setEditForm({ ...editForm, cityId: value, deliveryDeskId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editForm.deliveryType === 'PICKUP' && (
                <div>
                  <Label htmlFor="deliveryDesk">Delivery Desk</Label>
                  <Select
                    value={editForm.deliveryDeskId}
                    onValueChange={(value) => setEditForm({ ...editForm, deliveryDeskId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un point relais" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryDesks
                        .filter(desk => desk.cityId === editForm.cityId)
                        .map((desk) => (
                          <SelectItem key={desk.id} value={desk.id}>
                            {desk.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Ajouter des notes sur cette commande"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrder} disabled={loadingAction}>
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Update status for order #{selectedOrder?.orderNumber}</p>

            <div className="grid grid-cols-2 gap-2">
              {['NEW', 'CONFIRMED', 'PENDING', 'CANCELED', 'DOUBLE_ORDER', 'DELAYED'].map((status) => (
                <Button
                  key={status}
                  variant={selectedOrder?.callCenterStatus === status ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedOrder!.id, status)}
                  disabled={loadingAction}
                  className="justify-start"
                >
                  {statusLabels[status as keyof typeof statusLabels]}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Notes</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Order #{selectedOrder?.orderNumber}</Label>
            </div>

            <div className="space-y-2">
              <Label>History</Label>
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto border">
                {selectedOrder?.notes || 'No notes yet.'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Note</Label>
              <Textarea
                placeholder="Write a new note..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Your note will be appended with your attribution.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder) {
                  handleUpdateNotes(selectedOrder.id, noteInput)
                }
              }}
              disabled={loadingAction || !noteInput.trim()}
            >
              {loadingAction ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Add Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Order #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Select
                value={newItemForm.productId}
                onValueChange={(value) => setNewItemForm({ ...newItemForm, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.price.toLocaleString()} DA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm({ ...newItemForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size">Size (Optional)</Label>
                <Input
                  id="size"
                  value={newItemForm.size}
                  onChange={(e) => setNewItemForm({ ...newItemForm, size: e.target.value })}
                  placeholder="Taille"
                />
              </div>

              <div>
                <Label htmlFor="color">Color (Optional)</Label>
                <Input
                  id="color"
                  value={newItemForm.color}
                  onChange={(e) => setNewItemForm({ ...newItemForm, color: e.target.value })}
                  placeholder="Couleur"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAddItem(selectedOrder!.id)}
              disabled={loadingAction || !newItemForm.productId}
            >
              {loadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 