'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Phone,
  MapPin,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Mail,
  CreditCard,
  FileText,
  Download,
  Edit3,
  Save,
  X,
  ChevronDown,
  RotateCcw,
  MessageCircle,
  Printer
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { yalidineAPI } from '@/lib/yalidine-api'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface OrderItem {
  id: string
  name: string
  nameAr?: string
  quantity: number
  price: number
  size?: string
  product: {
    id: string
    name: string
    nameAr?: string
    image?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  total: number
  subtotal: number
  deliveryFee: number
  deliveryType: 'HOME_DELIVERY' | 'PICKUP'
  deliveryAddress?: string
  city: {
    name: string
    nameAr?: string
  }
  deliveryDesk?: {
    name: string
    nameAr?: string
  }
  callCenterStatus: 'CONFIRMED' | 'CANCELED' | 'PENDING' | 'DOUBLE_ORDER' | 'DELAYED'
  createdAt: string
  updatedAt: string
  notes?: string
  trackingNumber?: string
  yalidineShipmentId?: string
  items: OrderItem[]
}

const statusColors = {
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  DOUBLE_ORDER: 'bg-orange-100 text-orange-800',
  DELAYED: 'bg-purple-100 text-purple-800'
}

const statusIcons = {
  CONFIRMED: CheckCircle,
  CANCELED: XCircle,
  PENDING: Clock,
  DOUBLE_ORDER: Package,
  DELAYED: Truck
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    CONFIRMED: 'Confirmé',
    CANCELED: 'Annulé',
    PENDING: 'En Attente',
    DOUBLE_ORDER: 'Commande Double',
    DELAYED: 'Retardé'
  }
  return labels[status] || status
}

const getWhatsAppLink = (order: Order) => {
  const phone = order.customerPhone.replace(/\D/g, '')
  // Only proceed if we have a valid phone number (05, 06, 07)
  if (!phone.match(/^0[567]/)) return null

  // Convert 05/06/07 to +213 format
  const formattedPhone = `213${phone.substring(1)}`

  const text = `مرحبا ${order.customerName} 👋
تم تأكيد طلبك بنجاح ✅
${order.trackingNumber ? `رقم التتبع الخاص بك مع ياليدين هو: ${order.trackingNumber} 📦` : ''}
يمكنك تتبع طلبك عبر الرابط: https://loudbrandss.com/track-order 🚚
شكرا لثقتك بنا! 🙏`

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
}

const getNoAnswerWhatsAppLink = (order: Order) => {
  const phone = order.customerPhone.replace(/\D/g, '')
  if (!phone.match(/^0[567]/)) return null

  const formattedPhone = `213${phone.substring(1)}`

  const productNames = order.items.map(item => item.product.name).join(', ')

  const text = `مرحباً ${order.customerName} 👋
حاولنا الاتصال بك بخصوص طلبك:
${productNames}
ولكن لم نتمكن من الوصول إليك 📞.

يرجى الرد أو إعادة الاتصال لتأكيد الطلب.
⚠️ سيتم إلغاء الطلب تلقائياً خلال 48 ساعة في حال عدم الرد.

الاسم: ${order.customerName}
الولاية: ${order.city.name}

شكراً لتفهمك! 🙏`

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`
}

export default function AdminOrdersPage() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    setMounted(true)
    fetchOrders()
  }, [])

  // Refresh orders when the page becomes visible (user returns from order detail)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders()
      }
    }

    const handleFocus = () => {
      fetchOrders()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getOrders() as { orders: Order[] }
      setOrders(response.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...orders]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery) ||
        order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.callCenterStatus === statusFilter)
    }

    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(order => order.city.name === cityFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery, statusFilter, cityFilter])

  if (!mounted) return null

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, { callCenterStatus: status })
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, callCenterStatus: status as any } : order
      ))

      // If status is CONFIRMED, create Yalidine shipment
      if (status === 'CONFIRMED') {
        try {
          toast.info('Initiating shipment creation...');
          const shipmentResult = await api.shipping.shipOrder(orderId);
          console.log('Shipment Result:', shipmentResult);

          if (shipmentResult && shipmentResult.success && shipmentResult.tracking) {
            toast.success(`Order confirmed & Ticket created: ${shipmentResult.tracking}`);

            // Update local state with tracking info
            setOrders(prev => prev.map(order =>
              order.id === orderId ? {
                ...order,
                trackingNumber: shipmentResult.tracking,
                yalidineShipmentId: shipmentResult.import_id
              } : order
            ));
          } else {
            console.warn('Shipment failed:', shipmentResult);
            const errorMsg = shipmentResult?.error || shipmentResult?.message || 'Unknown error';
            toast.warning(`Order confirmed but shipment failed: ${errorMsg}`);
          }
        } catch (shipmentError: any) {
          console.error('Failed to create Yalidine shipment:', shipmentError);
          const msg = shipmentError.response?.data?.error || shipmentError.message || 'Unknown error';
          toast.error(`Order Confirmed, BUT Shipment Failed: ${msg}`);
        }
      } else {
        toast.success('Order status updated')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const handlePrintLabel = async (tracking: string) => {
    if (!tracking) {
      toast.error('No tracking number available')
      return
    }

    try {
      toast.loading('Fetching label...')
      const response = await api.shipping.getParcel(tracking)
      toast.dismiss()

      if (response && response.label) {
        window.open(response.label, '_blank')
      } else {
        console.warn('Label URL not found in response:', response)
        toast.error('Label URL not found. Please check Yalidine dashboard.')
      }
    } catch (error) {
      console.error('Failed to fetch label:', error)
      toast.dismiss()
      toast.error('Failed to fetch label')
    }
  }

  const handleEditNote = (orderId: string, currentNote: string) => {
    setEditingNoteId(orderId)
    setNoteText(currentNote || '')
  }

  const handleSaveNote = async (orderId: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, { notes: noteText })
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, notes: noteText } : order
      ))
      setEditingNoteId(null)
      setNoteText('')
      toast.success('Note saved successfully')
    } catch (error) {
      console.error('Failed to save note:', error)
      toast.error('Failed to save note')
    }
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setNoteText('')
  }



  // Test Yalidine connection
  const testYalidineConnection = async () => {
    try {
      console.log('🔍 Testing Yalidine connection from frontend...');

      // Test status endpoint
      const status = await yalidineAPI.getStatus();
      console.log('✅ Yalidine status:', status);

      // Test wilayas endpoint
      const wilayas = await yalidineAPI.getWilayas();
      console.log('✅ Yalidine wilayas:', wilayas.data?.length || 0, 'wilayas found');

      // Test centers for a specific wilaya (Alger - 16)
      const centers = await yalidineAPI.getCenters(16);
      console.log('✅ Yalidine centers for Alger:', centers.data?.length || 0, 'centers found');
      if (centers.data && centers.data.length > 0) {
        console.log('📋 Sample centers:', centers.data.slice(0, 3).map(c => ({ id: c.center_id, name: c.name })));
      }

      toast.success('Yalidine connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Yalidine connection test failed:', error);
      toast.error(`Yalidine test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const handleExportOrders = async () => {
    try {
      toast.loading('Exporting orders...')
      const csvData = await api.admin.exportOrders()

      // Create and download the file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.dismiss()
      toast.success('Orders exported successfully')
    } catch (error) {
      console.error('Failed to export orders:', error)
      toast.dismiss()
      toast.error('Failed to export orders')
    }
  }

  const cities = Array.from(new Set(orders.map(order => order.city.name)))

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
            <p className="text-muted-foreground">
              Gérez les commandes clients, suivez le statut de livraison et traitez les confirmations de commandes
            </p>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des commandes...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
              <p className="text-muted-foreground">
                Gérez les commandes clients, suivez le statut de livraison et traitez les confirmations de commandes
              </p>
            </div>
            {/* DEBUG BANNER v2.7 */}
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-2 w-full" role="alert">
              <p className="font-bold">System Update: v2.7 (ADMIN) - FIX YALIDINE PRICE</p>
              <p>If you see this banner, the Double Price Fix IS ACTIVE on this page.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={testYalidineConnection} variant="outline" className="flex items-center space-x-2">
                <Truck className="w-4 h-4" />
                <span>Test Yalidine</span>
              </Button>
              <Button onClick={handleExportOrders} className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Exporter Commandes</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Nouvelles Commandes</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.callCenterStatus === 'PENDING').length}
                </div>
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.callCenterStatus === 'CONFIRMED').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Commandes confirmées
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenus de tous temps
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher commandes, clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-status" value="all">Tous les Statuts</SelectItem>
                  <SelectItem key="CONFIRMED" value="CONFIRMED">Confirmé</SelectItem>
                  <SelectItem key="CANCELED" value="CANCELED">Annulé</SelectItem>
                  <SelectItem key="PENDING" value="PENDING">En Attente</SelectItem>
                  <SelectItem key="DOUBLE_ORDER" value="DOUBLE_ORDER">Commande Double</SelectItem>
                  <SelectItem key="DELAYED" value="DELAYED">Retardé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-cities" value="all">Toutes les Villes</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Order #</TableHead>
                    <TableHead className="max-w-[150px]">Client</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Total</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Tracking</TableHead>
                    <TableHead className="hidden xl:table-cell">Notes</TableHead>
                    <TableHead className="hidden xl:table-cell">Location</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusIcons[order.callCenterStatus as keyof typeof statusIcons]

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[120px]" title={order.customerName}>
                              {order.customerName}
                            </span>
                            <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell max-w-[200px]">
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, i) => (
                              <div key={item.id} className="text-xs truncate" title={item.product.name}>
                                <span className="font-semibold">{item.quantity}x</span> {item.product.name}
                                {item.size && <span className="text-muted-foreground"> ({item.size})</span>}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-muted-foreground italic">
                                +{order.items.length - 2} more...
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell text-right font-medium">
                          {order.total.toLocaleString()} DA
                        </TableCell>

                        <TableCell className="text-center">
                          <Select
                            value={order.callCenterStatus}
                            onValueChange={(value) => handleUpdateStatus(order.id, value)}
                          >
                            <SelectTrigger className="border-0 bg-transparent p-0 h-auto hover:bg-transparent shadow-none w-auto mx-auto place-items-center">
                              <Badge
                                variant="secondary"
                                className={`${statusColors[order.callCenterStatus as keyof typeof statusColors]} whitespace-nowrap cursor-pointer`}
                              >
                                {getStatusLabel(order.callCenterStatus)}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                              <SelectItem value="CANCELED">Annulé</SelectItem>
                              <SelectItem value="PENDING">En Attente</SelectItem>
                              <SelectItem value="DOUBLE_ORDER">Commande Double</SelectItem>
                              <SelectItem value="DELAYED">Retardé</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          {order.trackingNumber ? (
                            <div className="flex items-center space-x-1 text-xs">
                              <span className="font-mono bg-muted px-1 py-0.5 rounded">
                                {order.trackingNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>

                        <TableCell className="hidden xl:table-cell max-w-[150px]">
                          {editingNoteId === order.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="h-7 text-xs"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveNote(order.id)}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="text-xs truncate cursor-pointer hover:underline"
                              onClick={() => handleEditNote(order.id, order.notes || '')}
                              title={order.notes || "Add note"}
                            >
                              {order.notes || <span className="text-muted-foreground italic">Add note...</span>}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="hidden xl:table-cell">
                          <div className="text-xs">
                            <div className="font-medium">{order.city.name}</div>
                            <div className="text-muted-foreground truncate max-w-[100px]">
                              {order.deliveryType === 'PICKUP' ? 'Desk' : 'Home'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden 2xl:table-cell text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('fr-DZ', {
                            timeZone: 'Africa/Algiers',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* WhatsApp Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                const link = getWhatsAppLink(order)
                                if (link) window.open(link, '_blank')
                                else toast.error('Invalid phone number')
                              }}
                              title="Send WhatsApp Confirmation"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>

                            {/* WhatsApp No Answer Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                const link = getNoAnswerWhatsAppLink(order)
                                if (link) window.open(link, '_blank')
                                else toast.error('Invalid phone number')
                              }}
                              title="Pas de réponse (WhatsApp)"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>

                            {/* Print Label Button */}
                            {order.trackingNumber && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handlePrintLabel(order.trackingNumber!)}
                                title="Imprimer Bordereau"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}

                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 flex items-center space-x-2">
                                <Eye className="w-4 h-4" />
                                <span className="sr-only">View</span>
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
                  <p className="text-muted-foreground">
                    Essayez d'ajuster vos filtres ou termes de recherche
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}