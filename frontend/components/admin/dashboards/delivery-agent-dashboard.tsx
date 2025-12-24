'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Loader2,
  Eye,
  AlertTriangle,
  Navigation,
  Phone,
  Package,
  MessageSquare,
  MessageCircle,
  Edit,
  Tag,
  ExternalLink,
  Send,
  Save,
  Printer
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useLocaleStore } from '@/lib/locale-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { yalidineAPI } from '@/lib/yalidine-api'

interface DeliveryStats {
  enPreparation: number;
  centre: number;
  versWilaya: number;
  sortiEnLivraison: number;
  livre: number;
  echecLivraison: number;
  retourARetirer: number;
  retourneAuVendeur: number;
  echangeEchoue: number;
  confirmedOrders: number;
  totalShipments: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'HOME_DELIVERY' | 'PICKUP';
  deliveryAddress?: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  callCenterStatus: 'NEW' | 'CONFIRMED' | 'CANCELED' | 'PENDING' | 'DOUBLE_ORDER' | 'DELAYED';
  deliveryStatus: string;
  communicationStatus?: 'ANSWERED' | 'DIDNT_ANSWER' | 'SMS_SENT';
  notes?: string;
  trackingNumber?: string;
  yalidineShipmentId?: string;
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
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      nameAr?: string;
      image?: string;
    };
    image?: string;
  }>;
  deliveryDetails?: {
    wilayaId?: string;
    communeId?: string;
    centerId?: string;
    deliveryType?: string;
    deliveryAddress?: string;
  };
}

interface YalidineShipment {
  id: string;
  tracking: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  from_wilaya_name: string;
  to_wilaya_name: string;
  to_commune_name: string;
  product_list: string;
  price: number;
  weight: number;
  last_status: string;
  date_creation: string;
  date_last_status: string;
}

const getStatusVariant = (status: string) => {
  const statusMap: Record<string, string> = {
    'Livré': 'success',
    'Sorti en livraison': 'info',
    'En attente du client': 'warning',
    'Tentative échouée': 'error',
    'En alerte': 'error',
    'En préparation': 'warning',
    'Expédié': 'info',
    'Centre': 'purple',
    'READY': 'warning',
    'IN_TRANSIT': 'info',
    'DONE': 'success',
    'CONFIRMED': 'success',
    'ANSWERED': 'success',
    'DIDNT_ANSWER': 'error',
    'SMS_SENT': 'info',
    'default': 'secondary'
  };
  return statusMap[status] || statusMap.default;
};

const statusLabels = {
  READY: 'Ready',
  IN_TRANSIT: 'In Transit',
  DONE: 'Delivered',
  CONFIRMED: 'Confirmed',
  ANSWERED: 'Answered',
  DIDNT_ANSWER: 'Didn\'t Answer',
  SMS_SENT: 'SMS Sent'
}

const getCommunicationStatusVariant = (status: string) => {
  const statusMap: Record<string, string> = {
    'ANSWERED': 'success',
    'DIDNT_ANSWER': 'error',
    'SMS_SENT': 'info',
    'default': 'secondary'
  };
  return statusMap[status] || statusMap.default;
};

const communicationStatusLabels = {
  ANSWERED: 'Answered',
  DIDNT_ANSWER: 'Didn\'t Answer',
  SMS_SENT: 'SMS Sent'
}

export function DeliveryAgentDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, isRTL, direction } = useLocaleStore()
  const [stats, setStats] = useState<DeliveryStats>({
    enPreparation: 0,
    centre: 0,
    versWilaya: 0,
    sortiEnLivraison: 0,
    livre: 0,
    echecLivraison: 0,
    retourARetirer: 0,
    retourneAuVendeur: 0,
    echangeEchoue: 0,
    confirmedOrders: 0,
    totalShipments: 0
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [yalidineShipments, setYalidineShipments] = useState<YalidineShipment[]>([])

  // Enhanced functionality state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  // Status filter for All Parcels tab
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Yalidine status options for filtering
  const yalidineStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Pas encore expédié', label: 'Pas encore expédié' },
    { value: 'A vérifier', label: 'A vérifier' },
    { value: 'En préparation', label: 'En préparation' },
    { value: 'Pas encore ramassé', label: 'Pas encore ramassé' },
    { value: 'Prêt à expédier', label: 'Prêt à expédier' },
    { value: 'Ramassé', label: 'Ramassé' },
    { value: 'Bloqué', label: 'Bloqué' },
    { value: 'Débloqué', label: 'Débloqué' },
    { value: 'Transfert', label: 'Transfert' },
    { value: 'Expédié', label: 'Expédié' },
    { value: 'Centre', label: 'Centre' },
    { value: 'En localisation', label: 'En localisation' },
    { value: 'Vers Wilaya', label: 'Vers Wilaya' },
    { value: 'Reçu à Wilaya', label: 'Reçu à Wilaya' },
    { value: 'En attente du client', label: 'En attente du client' },
    { value: 'Prêt pour livreur', label: 'Prêt pour livreur' },
    { value: 'Sorti en livraison', label: 'Sorti en livraison' },
    { value: 'En attente', label: 'En attente' },
    { value: 'En alerte', label: 'En alerte' },
    { value: 'Tentative échouée', label: 'Tentative échouée' },
    { value: 'Livré', label: 'Livré' },
    { value: 'Echèc livraison', label: 'Echèc livraison' },
    { value: 'Retour vers centre', label: 'Retour vers centre' },
    { value: 'Retourné au centre', label: 'Retourné au centre' },
    { value: 'Retour transfert', label: 'Retour transfert' },
    { value: 'Retour groupé', label: 'Retour groupé' },
    { value: 'Retour à retirer', label: 'Retour à retirer' },
    { value: 'Retour vers vendeur', label: 'Retour vers vendeur' },
    { value: 'Retourné au vendeur', label: 'Retourné au vendeur' },
    { value: 'Echange échoué', label: 'Echange échoué' }
  ]

  useEffect(() => {
    fetchDeliveryData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch Yalidine shipments for dashboard tabs
  const fetchYalidineShipments = async () => {
    try {
      const response = await yalidineAPI.getAllShipments({ page: 1 })
      setYalidineShipments(response.data || [])
    } catch (error) {
      console.error('Error fetching Yalidine shipments:', error)
      setYalidineShipments([])
    }
  }


  const fetchDeliveryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch delivery data, Yalidine shipments, and Yalidine stats
      const [ordersData, yalidineStats, yalidineShipmentsData] = await Promise.all([
        api.admin.getOrders({ limit: 100 }), // Get more orders for delivery agent
        yalidineAPI.getShipmentStats().catch(err => {
          console.warn('Failed to fetch Yalidine stats:', err)
          return {
            enPreparation: 0,
            centre: 0,
            versWilaya: 0,
            sortiEnLivraison: 0,
            livre: 0,
            echecLivraison: 0,
            retourARetirer: 0,
            retourneAuVendeur: 0,
            echangeEchoue: 0,
            totalShipments: 0
          }
        }),
        yalidineAPI.getAllShipments({ page: 1 }).catch(err => {
          console.warn('Failed to fetch Yalidine shipments:', err)
          return { data: [] }
        })
      ])

      const ordersList = (ordersData as any).orders || ordersData as Order[]
      setOrders(ordersList)
      setYalidineShipments(yalidineShipmentsData.data || [])

      // Calculate stats combining Yalidine data with confirmed orders
      const confirmedOrders = ordersList.filter((o: Order) => o.callCenterStatus === 'CONFIRMED')
      const stats = {
        ...yalidineStats,
        confirmedOrders: confirmedOrders.length
      }
      setStats(stats)

    } catch (err) {
      console.error('Error fetching delivery data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }


  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, { deliveryStatus: status })
      fetchDeliveryData() // Refresh data
    } catch (err) {
      console.error('Error updating delivery status:', err)
    }
  }

  // Enhanced functionality functions
  const updateCommunicationStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      setLoadingAction(true)
      const updateData: any = { communicationStatus: status }
      if (notes) updateData.notes = notes

      await api.admin.updateOrderStatus(orderId, updateData)
      toast.success(`Communication status updated to ${communicationStatusLabels[status as keyof typeof communicationStatusLabels]}`)
      fetchDeliveryData()
    } catch (err) {
      console.error('Error updating communication status:', err)
      toast.error('Failed to update communication status')
    } finally {
      setLoadingAction(false)
    }
  }

  const updateOrderNotes = async (orderId: string, notes: string) => {
    try {
      setLoadingAction(true)
      await api.admin.updateOrderStatus(orderId, { notes })
      toast.success('Order notes updated successfully')
      fetchDeliveryData()
      setShowNotesDialog(false)
    } catch (err) {
      console.error('Error updating order notes:', err)
      toast.error('Failed to update order notes')
    } finally {
      setLoadingAction(false)
    }
  }

  const sendWhatsAppMessage = (phoneNumber: string, trackingNumber: string) => {
    try {
      // Format phone number for WhatsApp (remove leading 0 and add country code)
      const formattedPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber
      const whatsappNumber = `213${formattedPhone}`

      // Create WhatsApp message
      const message = `مرحبا! يمكنك تتبع طلبك باستخدام الرقم التالي: ${trackingNumber}

يمكنك تتبع طلبك على موقعنا:
https://loudim.com/track-order

شكرا لك!`

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message)

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank')

      toast.success('WhatsApp message prepared for sending')
    } catch (err) {
      console.error('Error preparing WhatsApp message:', err)
      toast.error('Failed to prepare WhatsApp message')
    }
  }

  const sendTrackingMessage = (phoneNumber: string, trackingNumber: string) => {
    try {
      // Format phone number for WhatsApp (remove leading 0 and add country code)
      const formattedPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber
      const whatsappNumber = `213${formattedPhone}`

      // Create tracking message
      const message = `مرحبا! يمكنكم تتبع طلبكم رقم #${trackingNumber} عبر الرابط التالي:

https://loudbrandss.com/track-order?tracking=${trackingNumber}

شكرا لثقتكم بنا!`

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message)

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')

      toast.success('Tracking message prepared for sending')
    } catch (error) {
      console.error('Error sending tracking message:', error)
      toast.error('Failed to prepare tracking message')
    }
  }

  const sendClaimMessage = (phoneNumber: string, trackingNumber: string, customerName: string) => {
    try {
      // Format phone number for WhatsApp (remove leading 0 and add country code)
      const formattedPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber
      const whatsappNumber = `213${formattedPhone}`

      // Create Order Near message
      const message = `مرحبا ${customerName} 👋
طلبيتك برقم التتبع ${trackingNumber} 📦 راهي قريبة ليك! 📍
يرجى الرد على ياليدين لاستلام الطلبية. 📞
شكرا!`

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message)

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')

      toast.success('Message prepared for sending')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to prepare message')
    }
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_blank')
  }

  const handleNavigateToAddress = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  const getYalidineStatusForOrder = (order: Order) => {
    if (!order.trackingNumber) return null

    // Find the corresponding Yalidine shipment
    const yalidineShipment = yalidineShipments.find(shipment =>
      shipment.tracking === order.trackingNumber
    )

    return yalidineShipment ? yalidineShipment.last_status : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading delivery data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchDeliveryData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Delivery Management Dashboard</h2>
        <p className="text-muted-foreground">
          Manage deliveries and track order status. Handle customer communications and navigation.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">En préparation</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enPreparation}</div>
              <p className="text-xs text-muted-foreground">
                Orders being prepared
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
              <CardTitle className="text-sm font-medium">Centre</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.centre}</div>
              <p className="text-xs text-muted-foreground">
                At distribution center
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
              <CardTitle className="text-sm font-medium">Vers Wilaya</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.versWilaya}</div>
              <p className="text-xs text-muted-foreground">
                Heading to destination
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
              <CardTitle className="text-sm font-medium">Sorti en livraison</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sortiEnLivraison}</div>
              <p className="text-xs text-muted-foreground">
                Out for delivery
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
              <CardTitle className="text-sm font-medium">Livré</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.livre}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Échec de livraison</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.echecLivraison}</div>
              <p className="text-xs text-muted-foreground">
                Delivery failed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Retour à retirer</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.retourARetirer}</div>
              <p className="text-xs text-muted-foreground">
                Return to pickup
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Retourné au vendeur</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.retourneAuVendeur}</div>
              <p className="text-xs text-muted-foreground">
                Returned to seller
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Échange échoué</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.echangeEchoue}</div>
              <p className="text-xs text-muted-foreground">
                Exchange failed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmedOrders}</div>
              <p className="text-xs text-muted-foreground">
                From our website
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delivery Management */}
      <Tabs defaultValue="all-parcels" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto pb-2 justify-start h-auto gap-2">
          <TabsTrigger value="all-parcels" className="flex-shrink-0">All Parcels ({yalidineShipments.length})</TabsTrigger>
          <TabsTrigger value="confirmed" className="flex-shrink-0 bg-emerald-600 text-white data-[state=active]:bg-emerald-700">Confirmed Orders ({stats.confirmedOrders})</TabsTrigger>
          <TabsTrigger value="preparation" className="flex-shrink-0 bg-blue-600 text-white data-[state=active]:bg-blue-700">En préparation ({stats.enPreparation})</TabsTrigger>
          <TabsTrigger value="delivery" className="flex-shrink-0 bg-indigo-600 text-white data-[state=active]:bg-indigo-700">Sorti en livraison ({stats.sortiEnLivraison})</TabsTrigger>
          <TabsTrigger value="waiting" className="flex-shrink-0 bg-amber-500 text-white data-[state=active]:bg-amber-600">En attente du client ({yalidineShipments.filter(s => s.last_status === 'En attente du client').length})</TabsTrigger>
          <TabsTrigger value="failed" className="flex-shrink-0 bg-red-600 text-white animate-pulse-slow data-[state=active]:bg-red-700">Tentative échouée ({yalidineShipments.filter(s => s.last_status === 'Tentative échouée').length})</TabsTrigger>
          <TabsTrigger value="alert" className="flex-shrink-0 bg-orange-600 text-white animate-pulse-slow data-[state=active]:bg-orange-700">En alerte ({yalidineShipments.filter(s => s.last_status === 'En alerte').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all-parcels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  All Yalidine Parcels ({statusFilter === 'all' ? yalidineShipments.length : yalidineShipments.filter(s => s.last_status === statusFilter).length})
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {yalidineStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchDeliveryData}
                    disabled={loading}
                  >
                    <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const filteredShipments = statusFilter === 'all'
                    ? yalidineShipments
                    : yalidineShipments.filter(shipment => shipment.last_status === statusFilter);

                  return filteredShipments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{statusFilter === 'all' ? 'No parcels found' : `No parcels with status "${statusFilter}"`}</p>
                      <p className="text-sm">All your Yalidine parcels will appear here</p>
                    </div>
                  ) : (
                    filteredShipments.map((shipment, index) => (
                      <div key={shipment.id || shipment.tracking || `parcel-${index}`} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-2 sm:gap-0">
                              <div>
                                <p className="font-medium">#{shipment.tracking}</p>
                                <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                                <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                                <p className="text-sm text-muted-foreground">
                                  {shipment.price?.toLocaleString()} DA
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge variant={getStatusVariant(shipment.last_status) as any}>
                                  {shipment.last_status}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span>{shipment.product_list || 'N/A'}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{shipment.weight || 1} kg</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{shipment.from_wilaya_name} → {shipment.to_wilaya_name}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{shipment.to_commune_name}</span>
                              </div>
                            </div>
                            {shipment.customer_address && (
                              <div className="mt-2 text-sm bg-muted p-2 rounded">
                                <strong>Address:</strong> {shipment.customer_address}
                              </div>
                            )}
                            <div className="mt-2 text-xs text-muted-foreground">
                              Created: {new Date(shipment.date_creation).toLocaleDateString()} •
                              Last Update: {new Date(shipment.date_last_status).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallCustomer(shipment.customer_phone)}
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                            {shipment.customer_address && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                              >
                                <Navigation className="w-4 h-4 mr-1" />
                                Navigate
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://yalidine.com/app/bordereau/${shipment.tracking}`, '_blank')}
                            >
                              <Printer className="w-4 h-4 mr-1" />
                              Ticket
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                Confirmed Orders - Customer Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.filter(order => order.callCenterStatus === 'CONFIRMED').length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No confirmed orders to contact</p>
              ) : (
                <div className="space-y-4">
                  {orders.filter(order => order.callCenterStatus === 'CONFIRMED').map((order) => (
                    <div key={order.id} className={`flex items-center justify-between p-4 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex-1">
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} mb-2`}>
                          <h4 className="font-medium">#{order.orderNumber}</h4>
                          <Badge variant="outline">{order.customerPhone}</Badge>
                        </div>
                        {order.trackingNumber && (
                          <div className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Yalidine Tracking:</span>
                            <span className="ml-2 font-mono bg-blue-50 px-2 py-1 rounded text-blue-700">
                              {order.trackingNumber}
                            </span>
                          </div>
                        )}
                        {getYalidineStatusForOrder(order) && (
                          <div className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Yalidine Status:</span>
                            <Badge variant={getStatusVariant(getYalidineStatusForOrder(order)!) as any} className="ml-2">
                              {getYalidineStatusForOrder(order)}
                            </Badge>
                          </div>
                        )}
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} text-sm text-muted-foreground mb-2`}>
                          <span>{order.customerName}</span>
                          <span>{order.items.length} items</span>
                          <span>{order.total.toLocaleString()} DA</span>
                          <span>{order.deliveryType === 'HOME_DELIVERY' ? 'Home Delivery' : 'Pickup'}</span>
                        </div>
                        {order.deliveryAddress && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Address:</span> {order.deliveryAddress}
                          </div>
                        )}
                        {order.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Notes:</span> {order.notes}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowNotesDialog(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Notes
                        </Button>
                        {order.trackingNumber && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTrackingMessage(order.customerPhone, order.trackingNumber!)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Send Tracking
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendClaimMessage(order.customerPhone, order.trackingNumber!, order.customerName)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Notify Near
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preparation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders in Preparation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yalidineShipments.filter(shipment => shipment.last_status === 'En préparation').map((shipment, index) => (
                  <div key={shipment.id || shipment.tracking || `preparation-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">#{shipment.tracking}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {shipment.price?.toLocaleString()} DA
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getStatusVariant(shipment.last_status) as any}>
                              {shipment.last_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {shipment.product_list || 'N/A'} • {shipment.weight || 1} kg
                        </div>
                        {shipment.customer_address && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <strong>Address:</strong> {shipment.customer_address}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallCustomer(shipment.customer_phone)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        {shipment.customer_address && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {yalidineShipments.filter(shipment => shipment.last_status === 'En préparation').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders in preparation
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders Out for Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yalidineShipments.filter(shipment => shipment.last_status === 'Sorti en livraison').map((shipment, index) => (
                  <div key={shipment.id || shipment.tracking || `delivery-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">#{shipment.tracking}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {shipment.price?.toLocaleString()} DA
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getStatusVariant(shipment.last_status) as any}>
                              {shipment.last_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {shipment.product_list || 'N/A'} • {shipment.weight || 1} kg
                        </div>
                        {shipment.customer_address && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <strong>Address:</strong> {shipment.customer_address}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallCustomer(shipment.customer_phone)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        {shipment.customer_address && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {yalidineShipments.filter(shipment => shipment.last_status === 'Sorti en livraison').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders out for delivery
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waiting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En attente du client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yalidineShipments.filter(shipment => shipment.last_status === 'En attente du client').map((shipment, index) => (
                  <div key={shipment.id || shipment.tracking || `waiting-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">#{shipment.tracking}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {shipment.price?.toLocaleString()} DA
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getStatusVariant(shipment.last_status) as any}>
                              {shipment.last_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {shipment.product_list || 'N/A'} • {shipment.weight || 1} kg
                        </div>
                        {shipment.customer_address && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <strong>Address:</strong> {shipment.customer_address}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallCustomer(shipment.customer_phone)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        {shipment.customer_address && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {yalidineShipments.filter(shipment => shipment.last_status === 'En attente du client').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders waiting for client
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tentative échouée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yalidineShipments.filter(shipment => shipment.last_status === 'Tentative échouée').map((shipment, index) => (
                  <div key={shipment.id || shipment.tracking || `failed-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">#{shipment.tracking}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {shipment.price?.toLocaleString()} DA
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getStatusVariant(shipment.last_status) as any}>
                              {shipment.last_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {shipment.product_list || 'N/A'} • {shipment.weight || 1} kg
                        </div>
                        {shipment.customer_address && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <strong>Address:</strong> {shipment.customer_address}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallCustomer(shipment.customer_phone)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        {shipment.customer_address && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {yalidineShipments.filter(shipment => shipment.last_status === 'Tentative échouée').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No failed delivery attempts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alert" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>En alerte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {yalidineShipments.filter(shipment => shipment.last_status === 'En alerte').map((shipment, index) => (
                  <div key={shipment.id || shipment.tracking || `alert-${index}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">#{shipment.tracking}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {shipment.price?.toLocaleString()} DA
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getStatusVariant(shipment.last_status) as any}>
                              {shipment.last_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {shipment.product_list || 'N/A'} • {shipment.weight || 1} kg
                        </div>
                        {shipment.customer_address && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <strong>Address:</strong> {shipment.customer_address}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCallCustomer(shipment.customer_phone)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        {shipment.customer_address && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {yalidineShipments.filter(shipment => shipment.last_status === 'En alerte').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders in alert status
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Communication Status Dialog */}
      <Dialog open={showCommunicationDialog} onOpenChange={setShowCommunicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Communication Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order #{selectedOrder?.orderNumber}</Label>
              <p className="text-sm text-muted-foreground">
                Customer: {selectedOrder?.customerName} ({selectedOrder?.customerPhone})
              </p>
            </div>
            <div>
              <Label>Communication Status</Label>
              <Select onValueChange={(value) => {
                if (selectedOrder) {
                  updateCommunicationStatus(selectedOrder.id, value)
                  setShowCommunicationDialog(false)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANSWERED">Answered</SelectItem>
                  <SelectItem value="DIDNT_ANSWER">Didn&apos;t Answer</SelectItem>
                  <SelectItem value="SMS_SENT">SMS Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order #{selectedOrder?.orderNumber}</Label>
              <p className="text-sm text-muted-foreground">
                Customer: {selectedOrder?.customerName} ({selectedOrder?.customerPhone})
              </p>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about this order..."
                defaultValue={selectedOrder?.notes || ''}
                onChange={(e) => {
                  if (selectedOrder) {
                    selectedOrder.notes = e.target.value
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedOrder) {
                    updateOrderNotes(selectedOrder.id, selectedOrder.notes || '')
                  }
                }}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
} 