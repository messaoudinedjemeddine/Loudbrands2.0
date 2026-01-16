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
  Printer,
  Home,
  Store,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { useLocaleStore } from '@/lib/locale-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination'
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
  confirmedStats?: {
    enPreparation: number;
    centre: number;
    versWilaya: number;
    sortiEnLivraison: number;
    livre: number;
    echecLivraison: number;
    retourARetirer: number;
    retourneAuVendeur: number;
    echangeEchoue: number;
    tentativeEchouee: number;
    enAlerte: number;
    enAttenteClient: number;
    totalShipments: number;
  };
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
    size?: string;
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const defaultTab = searchParams.get('tab') || 'all-parcels'

  const [activeTab, setActiveTab] = useState(defaultTab)

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without full reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`${pathname}?${params.toString()}`)
  }

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
  const [allConfirmedOrders, setAllConfirmedOrders] = useState<Order[]>([])
  const [yalidineShipments, setYalidineShipments] = useState<YalidineShipment[]>([])
  const [confirmedShipments, setConfirmedShipments] = useState<YalidineShipment[]>([])

  // Enhanced functionality state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)

  // Status filter for All Parcels tab
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Status filter for Confirmed Orders tab
  const [confirmedStatusFilter, setConfirmedStatusFilter] = useState<string>('all')
  // Tab filter for Confirmed Orders (quick status tabs)
  const [confirmedTabFilter, setConfirmedTabFilter] = useState<string>('all')
  // Pagination for Confirmed Orders
  const [confirmedCurrentPage, setConfirmedCurrentPage] = useState<number>(1)
  const [confirmedItemsPerPage, setConfirmedItemsPerPage] = useState<number>(10)
  // Search for Confirmed Orders
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState<string>('')

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
      // For confirmed tab, we need ALL confirmed orders to match with Yalidine shipments
      const [ordersData, confirmedOrdersData, yalidineStats] = await Promise.all([
        api.admin.getOrders({ limit: 100 }), // Get orders for general display
        api.admin.getOrders({ limit: 10000, confirmedOnly: 'true' }), // Get ALL confirmed orders for matching
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
        })
      ])

      // Fetch all Yalidine shipments (all pages) with timeout and better error handling
      const fetchShipmentsWithTimeout = async (): Promise<any[]> => {
        return new Promise(async (resolve) => {
          const timeout = setTimeout(() => {
            console.warn('Timeout while fetching Yalidine shipments, using partial data')
            resolve([])
          }, 15000) // 15 second timeout (reduced for faster feedback)

          try {
            let allShipments: any[] = []
            let currentPage = 1
            const maxPages = 20 // Limit to 20 pages (approximately 500 parcels)
            let hasMore = true

            // Fetch limited pages for faster loading
            while (hasMore && currentPage <= maxPages) {
              try {
                const response = await yalidineAPI.getAllShipments({ page: currentPage })
                const shipments = response.data || []
                
                // If no shipments returned, stop
                if (shipments.length === 0) {
                  hasMore = false
                  break
                }
                
                allShipments = [...allShipments, ...shipments]
                
                // Check if there are more pages - stop if has_more is false or undefined
                hasMore = response.has_more === true
                currentPage++
                
                // Add a small delay to avoid overwhelming the API
                if (hasMore && currentPage <= maxPages) {
                  await new Promise(resolve => setTimeout(resolve, 100))
                }
              } catch (pageError) {
                console.error(`Error fetching page ${currentPage}:`, pageError)
                // If we have some shipments, continue with what we have
                if (allShipments.length > 0) {
                  break
                }
                throw pageError
              }
            }

            if (currentPage > maxPages) {
              console.warn(`Reached maximum page limit (${maxPages}) while fetching Yalidine shipments. Total shipments: ${allShipments.length}`)
            }

            clearTimeout(timeout)
            resolve(allShipments)
          } catch (err) {
            console.warn('Failed to fetch Yalidine shipments:', err)
            clearTimeout(timeout)
            resolve([])
          }
        })
      }

      const allShipments = await fetchShipmentsWithTimeout()

      const ordersList = (ordersData as any).orders || ordersData as Order[]
      const allConfirmedOrders = (confirmedOrdersData as any).orders || confirmedOrdersData as Order[]
      setOrders(ordersList)

      // Filter shipments to only show those created from our website
      // For confirmed tab, use ALL confirmed orders to match with Yalidine shipments
      const confirmedOrderTrackingNumbers = new Set(
        allConfirmedOrders
          .map((o: Order) => o.trackingNumber)
          .filter((t: string | undefined): t is string => !!t)
      )

      // For general display, use regular orders
      const orderTrackingNumbers = new Set(
        ordersList
          .map((o: Order) => o.trackingNumber)
          .filter((t: string | undefined): t is string => !!t)
      )

      // Only keep shipments that match our orders' tracking numbers (for general display)
      const websiteShipments = allShipments.filter((shipment: any) => 
        orderTrackingNumbers.has(shipment.tracking)
      )

      // For confirmed tab, filter shipments by confirmed orders only
      const confirmedShipments = allShipments.filter((shipment: any) => 
        confirmedOrderTrackingNumbers.has(shipment.tracking)
      )

      setYalidineShipments(websiteShipments)
      setAllConfirmedOrders(allConfirmedOrders)
      setConfirmedShipments(confirmedShipments)

      // Calculate stats from filtered confirmed shipments (only for confirmed tab)
      const confirmedStats = {
        enPreparation: confirmedShipments.filter((s: any) => s.last_status === 'En préparation').length,
        centre: confirmedShipments.filter((s: any) => s.last_status === 'Centre').length,
        versWilaya: confirmedShipments.filter((s: any) => s.last_status === 'Vers Wilaya').length,
        sortiEnLivraison: confirmedShipments.filter((s: any) => s.last_status === 'Sorti en livraison').length,
        livre: confirmedShipments.filter((s: any) => s.last_status === 'Livré').length,
        echecLivraison: confirmedShipments.filter((s: any) => s.last_status === 'Echèc livraison' || s.last_status === 'Echec de livraison').length,
        retourARetirer: confirmedShipments.filter((s: any) => s.last_status === 'Retour à retirer').length,
        retourneAuVendeur: confirmedShipments.filter((s: any) => s.last_status === 'Retourné au vendeur').length,
        echangeEchoue: confirmedShipments.filter((s: any) => s.last_status === 'Echange échoué').length,
        tentativeEchouee: confirmedShipments.filter((s: any) => s.last_status === 'Tentative échouée').length,
        enAlerte: confirmedShipments.filter((s: any) => s.last_status === 'En alerte').length,
        enAttenteClient: confirmedShipments.filter((s: any) => s.last_status === 'En attente du client').length,
        totalShipments: confirmedShipments.length
      }

      // Calculate stats from filtered website shipments (for general tabs)
      const calculatedStats = {
        enPreparation: websiteShipments.filter((s: any) => s.last_status === 'En préparation').length,
        centre: websiteShipments.filter((s: any) => s.last_status === 'Centre').length,
        versWilaya: websiteShipments.filter((s: any) => s.last_status === 'Vers Wilaya').length,
        sortiEnLivraison: websiteShipments.filter((s: any) => s.last_status === 'Sorti en livraison').length,
        livre: websiteShipments.filter((s: any) => s.last_status === 'Livré').length,
        echecLivraison: websiteShipments.filter((s: any) => s.last_status === 'Echèc livraison' || s.last_status === 'Echec de livraison').length,
        retourARetirer: websiteShipments.filter((s: any) => s.last_status === 'Retour à retirer').length,
        retourneAuVendeur: websiteShipments.filter((s: any) => s.last_status === 'Retourné au vendeur').length,
        echangeEchoue: websiteShipments.filter((s: any) => s.last_status === 'Echange échoué').length,
        totalShipments: websiteShipments.length
      }

      // Calculate stats combining calculated Yalidine data with confirmed orders
      const confirmedOrders = ordersList.filter((o: Order) => o.callCenterStatus === 'CONFIRMED')
      const stats = {
        ...calculatedStats,
        confirmedOrders: confirmedOrders.length,
        // Store confirmed stats separately for the confirmed tab
        confirmedStats: confirmedStats
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

  const updateOrderNotes = async (orderId: string, noteToAppend: string) => {
    try {
      if (!noteToAppend.trim()) return

      setLoadingAction(true)
      // Use appendNote to add to existing notes with attribution
      await api.admin.updateOrderStatus(orderId, { appendNote: noteToAppend })

      toast.success('Note added successfully')
      fetchDeliveryData()
      setShowNotesDialog(false)
      setNoteInput('')
    } catch (err) {
      console.error('Error updating order notes:', err)
      toast.error('Failed to add note')
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

  const getYalidineStatusForOrder = (order: Order, useConfirmedShipments = false) => {
    if (!order.trackingNumber) return null

    // Use confirmed shipments if requested (for confirmed tab), otherwise use regular shipments
    const shipmentsToSearch = useConfirmedShipments ? confirmedShipments : yalidineShipments
    
    // Find the corresponding Yalidine shipment
    const yalidineShipment = shipmentsToSearch.find(shipment =>
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

  const getDeliveryAgentWhatsAppLink = (order: Order, status: string | null) => {
    if (!status) return null

    const shipment = yalidineShipments.find(s => s.tracking === order.trackingNumber)
    const tracking = order.trackingNumber || 'N/A'
    const customerName = order.customerName
    
    // Format articles with emojis and better organization
    const articles = order.items.map(i => {
      const sizeStr = i.size ? ` (${i.size})` : ''
      return `📦 ${i.quantity}x ${i.product.name}${sizeStr}`
    }).join('\n')

    // Format phone
    let phone = order.customerPhone || ''
    if (phone.startsWith('0')) phone = phone.substring(1)
    const whatsappNumber = `213${phone}`

    let message = ''

    if (status === 'En attente du client') {
      // Show only the Yalidine desk name chosen by the client (for PICKUP orders)
      const deskName = order.deliveryDesk?.name || shipment?.to_commune_name || 'le bureau Yalidine'
      message = `مرحبًا ${customerName} 🌸
نعلمك أن طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦
وصلت إلى مكتب ياليدين:
🏢 المكتب: ${deskName}

يرجى التوجه إلى المكتب لاستلام الطلبية في أقرب وقت.
شكرًا لثقتك بنا 🤍
Loudstyles`
    } else if (status === 'Sorti en livraison') {
      // Get delivery address or desk based on delivery type
      let deliveryInfo = ''
      if (order.deliveryType === 'PICKUP') {
        // For PICKUP, show only the desk name
        const deskName = order.deliveryDesk?.name || 'المكتب المطلوب'
        deliveryInfo = `🏢 المكتب: ${deskName}`
      } else {
        // For HOME_DELIVERY, show address, commune, and wilaya in one line
        const wilaya = shipment?.to_wilaya_name || order.city?.name || ''
        const commune = shipment?.to_commune_name || ''
        const homeAddress = order.deliveryAddress || shipment?.customer_address || 'العنوان المطلوب'
        const addressParts = [homeAddress]
        if (commune) addressParts.push(commune)
        if (wilaya) addressParts.push(wilaya)
        deliveryInfo = `📍 Adresse: ${addressParts.join(', ')}`
      }
      
      message = `مرحبا ${customerName} 🌸
نعلمك أن طلبيتك:
${articles}
برقم التتبع (${tracking}) 📦
راهي عند عامل التوصيل 🚚

${deliveryInfo}

عامل التوصيل راح يتصل بك قريبًا،
يرجى الرد على الهاتف لتأكيد الاستلام 📞
شكرا لثقتك بنا 🤍
Loudstyles`
    } else if (status === 'Echèc livraison' || status === 'Echec de livraison') {
      message = `⛔ إشعار نهائي

إشعار نهائي وتحذير أخير

بخصوص طلبيتك:
${articles}
رقم التتبع (${tracking}) 📦

نعلمك أن اليوم هو آخر أجل للاستلام دون أي تمديد.

⚠️ في حال عدم الاستلام أو التسبب في إرجاع الطرد (retour)، سيتم تلقائيًا:

❌ تسجيلك ضمن قائمة الزبائن غير الملتزمين لدى شركات توصيل
❌ حظرك نهائيًا من الطلب من صفحة Loudstyles
❌ رفض أي تعامل مستقبلي معك دون استثناء 
Loudstyles لا تقبل خسارة وقتها أو منتجاتها مع زبائن غير جادين`
    } else if (status === 'Tentative échouée') {
      // Different messages based on delivery type
      if (order.deliveryType === 'PICKUP') {
        // Desk delivery - show only the Yalidine desk name chosen by the client
        const deskName = order.deliveryDesk?.name || 'المكتب المطلوب'
        message = `مرحبا ${customerName} 🌸
بخصوص طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦

شركة التوصيل yalidine حاولت الاتصال بك
لإستلامها من:
🏢 المكتب: ${deskName}

لكن لم يتم الرد على الهاتف لتأكيد الاستلام
وتم تسجيلها كـ Tentative échouée 🚫

📞 يرجى الرد والتقدّم للمكتب في أقرب وقت لإستلامها
وتفادي إلغاء الطلبية

شكرا لتفهمك 🤍
Loudstyles`
      } else {
        // Home delivery - show address, commune, and wilaya in one line
        const homeAddress = order.deliveryAddress || shipment?.customer_address || 'المنزل المطلوب'
        const commune = shipment?.to_commune_name || ''
        const wilaya = shipment?.to_wilaya_name || order.city?.name || ''
        const addressParts = [homeAddress]
        if (commune) addressParts.push(commune)
        if (wilaya) addressParts.push(wilaya)
        const addressInfo = `📍 Adresse: ${addressParts.join(', ')}`
        
        message = `مرحبا ${customerName} 🌸
بخصوص طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦

عامل التوصيل yalidine حاول الإتصال بك لتسليمها إلى:
${addressInfo}

لكن لم يتم الرد على الهاتف لتأكيد الاستلام
وتم تسجيلها كـ Tentative échouée 🚫

📞 يرجى الرد على عامل التوصيل في أقرب وقت لإستلامها 
و تفادي إلغاء الطلبية

شكرا لتفهمك 🤍
Loudstyles`
      }
    } else if (status === 'Livré') {
      message = `مرحبا ${customerName} 🌸

نشكرك جزيل الشكر على اختيارك لنا وثقتك في Loudstyles! 🙏

نتمنى أن تكون طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦

قد وصلت إليك بحالة ممتازة وأنك راضٍ/ة عن تجربتك معنا.

نقدر رأيك كثيراً ونرغب في تحسين خدماتنا باستمرار. 
لذلك نود أن نعرف:
✨ كيف كانت تجربتك مع موقعنا؟
✨ ما رأيك في المنتجات التي استلمتها؟
✨ هل لديك أي اقتراحات لتحسين خدمتنا؟

نرجو منك مشاركة تجربتك معنا عبر رسالة نصية على صفحتنا على Instagram:
📱 https://www.instagram.com/loudstyless/

رأيك مهم جداً لنا ويساعدنا في تقديم أفضل خدمة لجميع عملائنا.

شكراً جزيلاً لوقتك وثقتك بنا! 🤍
Loudstyles`
    } else {
      return null // No message for other statuses
    }

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
  }

  const getShipmentWhatsAppLink = (shipment: YalidineShipment) => {
    const status = shipment.last_status
    const tracking = shipment.tracking
    const customerName = shipment.customer_name

    // Try to find order details to get sizes and delivery type
    const order = orders.find(o => o.trackingNumber === tracking)
    let articles = shipment.product_list || 'Articles'

    if (order) {
      // Format articles with emojis and better organization
      articles = order.items.map(i => {
        const sizeStr = i.size ? ` (${i.size})` : ''
        return `📦 ${i.quantity}x ${i.product.name}${sizeStr}`
      }).join('\n')
    } else {
      // Fallback: format product_list with emoji
      articles = `📦 ${articles}`
    }

    // Format phone
    let phone = shipment.customer_phone || ''
    if (phone.startsWith('0')) phone = phone.substring(1)
    const whatsappNumber = `213${phone}`

    let message = ''

    if (status === 'En attente du client') {
      // Show only the Yalidine desk name chosen by the client (for PICKUP orders)
      const deskName = order?.deliveryDesk?.name || shipment.to_commune_name || 'le bureau Yalidine'
      message = `مرحبًا ${customerName} 🌸
نعلمك أن طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦
وصلت إلى مكتب ياليدين:
🏢 المكتب: ${deskName}

يرجى التوجه إلى المكتب لاستلام الطلبية في أقرب وقت.
شكرًا لثقتك بنا 🤍
Loudstyles`
    } else if (status === 'Sorti en livraison') {
      // Get delivery address or desk based on delivery type
      let deliveryInfo = ''
      if (order && order.deliveryType === 'PICKUP') {
        // For PICKUP, show only the desk name
        const deskName = order.deliveryDesk?.name || 'المكتب المطلوب'
        deliveryInfo = `🏢 المكتب: ${deskName}`
      } else {
        // For HOME_DELIVERY, show address, commune, and wilaya in one line
        const wilaya = shipment.to_wilaya_name || order?.city?.name || ''
        const commune = shipment.to_commune_name || ''
        const homeAddress = order?.deliveryAddress || shipment.customer_address || 'العنوان المطلوب'
        const addressParts = [homeAddress]
        if (commune) addressParts.push(commune)
        if (wilaya) addressParts.push(wilaya)
        deliveryInfo = `📍 Adresse: ${addressParts.join(', ')}`
      }
      
      message = `مرحبا ${customerName} 🌸
نعلمك أن طلبيتك:
${articles}
برقم التتبع (${tracking}) 📦
راهي عند عامل التوصيل 🚚

${deliveryInfo}

عامل التوصيل راح يتصل بك قريبًا،
يرجى الرد على الهاتف لتأكيد الاستلام 📞
شكرا لثقتك بنا 🤍
Loudstyles`
    } else if (status === 'Echèc livraison' || status === 'Echec de livraison') {
      message = `⛔ إشعار نهائي

إشعار نهائي وتحذير أخير

بخصوص طلبيتك:
${articles}
رقم التتبع (${tracking}) 📦

نعلمك أن اليوم هو آخر أجل للاستلام دون أي تمديد.

⚠️ في حال عدم الاستلام أو التسبب في إرجاع الطرد (retour)، سيتم تلقائيًا:

❌ تسجيلك ضمن قائمة الزبائن غير الملتزمين لدى شركات توصيل
❌ حظرك نهائيًا من الطلب من صفحة Loudstyles
❌ رفض أي تعامل مستقبلي معك دون استثناء 
Loudstyles لا تقبل خسارة وقتها أو منتجاتها مع زبائن غير جادين`
    } else if (status === 'Tentative échouée') {
      // Different messages based on delivery type
      if (order && order.deliveryType === 'PICKUP') {
        // Desk delivery - show only the Yalidine desk name chosen by the client
        const deskName = order.deliveryDesk?.name || 'المكتب المطلوب'
        message = `مرحبا ${customerName} 🌸
بخصوص طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦

شركة التوصيل yalidine حاولت الاتصال بك
لإستلامها من:
🏢 المكتب: ${deskName}

لكن لم يتم الرد على الهاتف لتأكيد الاستلام
وتم تسجيلها كـ Tentative échouée 🚫

📞 يرجى الرد والتقدّم للمكتب في أقرب وقت لإستلامها
وتفادي إلغاء الطلبية

شكرا لتفهمك 🤍
Loudstyles`
      } else {
        // Home delivery - show address, commune, and wilaya in one line
        const homeAddress = order?.deliveryAddress || shipment.customer_address || 'المنزل المطلوب'
        const commune = shipment.to_commune_name || ''
        const wilaya = shipment.to_wilaya_name || order?.city?.name || ''
        const addressParts = [homeAddress]
        if (commune) addressParts.push(commune)
        if (wilaya) addressParts.push(wilaya)
        const addressInfo = `📍 Adresse: ${addressParts.join(', ')}`
        
        message = `مرحبا ${customerName} 🌸
بخصوص طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦

عامل التوصيل yalidine حاول الإتصال بك لتسليمها إلى:
${addressInfo}

لكن لم يتم الرد على الهاتف لتأكيد الاستلام
وتم تسجيلها كـ Tentative échouée 🚫

📞 يرجى الرد على عامل التوصيل في أقرب وقت لإستلامها 
و تفادي إلغاء الطلبية

شكرا لتفهمك 🤍
Loudstyles`
      }
    } else if (status === 'Livré') {
      message = `مرحبا ${customerName} 🌸

نشكرك جزيل الشكر على اختيارك لنا وثقتك في Loudstyles! 🙏

نتمنى أن تكون طلبيتك:
${articles}
رقم التتبع: (${tracking}) 📦

قد وصلت إليك بحالة ممتازة وأنك راضٍ/ة عن تجربتك معنا.

نقدر رأيك كثيراً ونرغب في تحسين خدماتنا باستمرار. 
لذلك نود أن نعرف:
✨ كيف كانت تجربتك مع موقعنا؟
✨ ما رأيك في المنتجات التي استلمتها؟
✨ هل لديك أي اقتراحات لتحسين خدمتنا؟

نرجو منك مشاركة تجربتك معنا عبر رسالة نصية على صفحتنا على Instagram:
📱 https://www.instagram.com/loudstyless/

رأيك مهم جداً لنا ويساعدنا في تقديم أفضل خدمة لجميع عملائنا.

شكراً جزيلاً لوقتك وثقتك بنا! 🤍
Loudstyles`
    } else {
      return null
    }

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* ... header ... */}
      {/* ... stats ... */}

      {/* Delivery Management */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {activeTab !== 'confirmed' && (
          <TabsList className="flex w-full overflow-x-auto pb-2 justify-start h-auto gap-2">
            <TabsTrigger value="all-parcels" className="flex-shrink-0">All Parcels ({yalidineShipments.length})</TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-shrink-0 bg-emerald-600 text-white data-[state=active]:bg-emerald-700">Confirmed Orders ({stats.confirmedOrders})</TabsTrigger>
            <TabsTrigger value="preparation" className="flex-shrink-0 bg-blue-600 text-white data-[state=active]:bg-blue-700">En préparation ({stats.enPreparation})</TabsTrigger>
            <TabsTrigger value="delivery" className="flex-shrink-0 bg-indigo-600 text-white data-[state=active]:bg-indigo-700">Sorti en livraison ({stats.sortiEnLivraison})</TabsTrigger>
            <TabsTrigger value="waiting" className="flex-shrink-0 bg-amber-500 text-white data-[state=active]:bg-amber-600">En attente du client ({yalidineShipments.filter(s => s.last_status === 'En attente du client').length})</TabsTrigger>
            <TabsTrigger value="failed" className="flex-shrink-0 bg-red-600 text-white animate-pulse-slow data-[state=active]:bg-red-700">Tentative échouée ({yalidineShipments.filter(s => s.last_status === 'Tentative échouée').length})</TabsTrigger>
            <TabsTrigger value="alert" className="flex-shrink-0 bg-orange-600 text-white animate-pulse-slow data-[state=active]:bg-orange-700">En alerte ({yalidineShipments.filter(s => s.last_status === 'En alerte').length})</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="all-parcels" className="space-y-4">
          {/* ... all parcels content ... */}
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
                    filteredShipments.map((shipment, index) => {
                      const order = orders.find(o => o.trackingNumber === shipment.tracking)
                      const whatsappLink = getShipmentWhatsAppLink(shipment)

                      return (
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

                          </div>
                        </div>
                      )
                    })
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  Confirmed Orders - Customer Communication
                </div>
                {/* ... filter ... */}
                <div className="flex items-center space-x-2">
                  <Select value={confirmedStatusFilter} onValueChange={(value) => {
                    setConfirmedStatusFilter(value)
                    setConfirmedTabFilter('all') // Reset tab when using dropdown
                    setConfirmedCurrentPage(1) // Reset to first page when changing filter
                  }}>
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Status Tabs */}
              <Tabs value={confirmedTabFilter} onValueChange={(value) => {
                setConfirmedTabFilter(value)
                setConfirmedCurrentPage(1) // Reset to first page when changing tabs
                if (value !== 'all') {
                  setConfirmedStatusFilter(value) // Sync dropdown with tab
                }
              }} className="mb-6">
                <TabsList className="flex w-full overflow-x-auto pb-2 justify-start h-auto gap-2">
                  <TabsTrigger 
                    value="all" 
                    className="flex-shrink-0"
                  >
                    All ({stats.confirmedOrders})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="En préparation" 
                    className="flex-shrink-0 bg-blue-600 text-white data-[state=active]:bg-blue-700"
                  >
                    En préparation ({stats.confirmedStats?.enPreparation || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Sorti en livraison" 
                    className="flex-shrink-0 bg-indigo-600 text-white data-[state=active]:bg-indigo-700"
                  >
                    Sorti en livraison ({stats.confirmedStats?.sortiEnLivraison || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="En attente du client" 
                    className="flex-shrink-0 bg-amber-500 text-white data-[state=active]:bg-amber-600"
                  >
                    En attente du client ({stats.confirmedStats?.enAttenteClient || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Tentative échouée" 
                    className="flex-shrink-0 bg-red-600 text-white animate-pulse-slow data-[state=active]:bg-red-700"
                  >
                    Tentative échouée ({stats.confirmedStats?.tentativeEchouee || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="En alerte" 
                    className="flex-shrink-0 bg-orange-600 text-white animate-pulse-slow data-[state=active]:bg-orange-700"
                  >
                    En alerte ({stats.confirmedStats?.enAlerte || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Echèc livraison" 
                    className="flex-shrink-0 bg-red-700 text-white animate-pulse-slow data-[state=active]:bg-red-800"
                  >
                    Echec livraison ({stats.confirmedStats?.echecLivraison || 0})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Livré" 
                    className="flex-shrink-0 bg-green-600 text-white data-[state=active]:bg-green-700"
                  >
                    Livré ({stats.confirmedStats?.livre || 0})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search and Items Per Page Selector */}
              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher par nom, téléphone ou tracking..."
                      value={confirmedSearchQuery}
                      onChange={(e) => {
                        setConfirmedSearchQuery(e.target.value)
                        setConfirmedCurrentPage(1) // Reset to first page when searching
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Orders per page:</Label>
                  <Select 
                    value={confirmedItemsPerPage.toString()} 
                    onValueChange={(value) => {
                      setConfirmedItemsPerPage(Number(value))
                      setConfirmedCurrentPage(1) // Reset to first page when changing items per page
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Orders List */}
              {(() => {
                // For confirmed tab, use all confirmed orders (not just the 100 displayed)
                // Filter orders based on both tab and dropdown filter
                let filteredOrders = allConfirmedOrders.filter(order => order.callCenterStatus === 'CONFIRMED')
                
                // Apply tab filter if not 'all' - use confirmedShipments for accurate matching
                if (confirmedTabFilter !== 'all') {
                  if (confirmedTabFilter === 'Echèc livraison') {
                    // Handle both "Echèc livraison" and "Echec de livraison" statuses
                    filteredOrders = filteredOrders.filter(order => {
                      const status = getYalidineStatusForOrder(order, true) // Use confirmed shipments
                      return status === 'Echèc livraison' || status === 'Echec de livraison'
                    })
                  } else {
                    filteredOrders = filteredOrders.filter(order => 
                      getYalidineStatusForOrder(order, true) === confirmedTabFilter // Use confirmed shipments
                    )
                  }
                }
                
                // Apply dropdown filter if not 'all' and tab is 'all'
                if (confirmedStatusFilter !== 'all' && confirmedTabFilter === 'all') {
                  filteredOrders = filteredOrders.filter(order => 
                    getYalidineStatusForOrder(order, true) === confirmedStatusFilter // Use confirmed shipments
                  )
                }

                // Apply search filter
                if (confirmedSearchQuery.trim()) {
                  const searchLower = confirmedSearchQuery.toLowerCase().trim()
                  filteredOrders = filteredOrders.filter(order => {
                    const nameMatch = order.customerName?.toLowerCase().includes(searchLower)
                    const phoneMatch = order.customerPhone?.toLowerCase().includes(searchLower)
                    const trackingMatch = order.trackingNumber?.toLowerCase().includes(searchLower)
                    return nameMatch || phoneMatch || trackingMatch
                  })
                }

                // Calculate pagination
                const totalOrders = filteredOrders.length
                const totalPages = Math.ceil(totalOrders / confirmedItemsPerPage)
                const startIndex = (confirmedCurrentPage - 1) * confirmedItemsPerPage
                const endIndex = startIndex + confirmedItemsPerPage
                const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

                if (filteredOrders.length === 0) {
                  return <p className="text-muted-foreground text-center py-8">No confirmed orders found</p>
                }

                return (
                  <div className="space-y-2">
                    {/* Pagination Info */}
                    <div className="text-xs text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalOrders)} of {totalOrders} orders
                    </div>

                    {/* Orders */}
                    {paginatedOrders.map((order) => {
                    const status = getYalidineStatusForOrder(order, true) // Use confirmed shipments
                    const whatsappLink = getDeliveryAgentWhatsAppLink(order, status)
                    // Find Yalidine shipment for this order to get wilaya and commune names
                    const shipment = confirmedShipments.find(s => s.tracking === order.trackingNumber)
                    const wilayaName = shipment?.to_wilaya_name || order.city?.name || ''
                    const communeName = shipment?.to_commune_name || ''

                    return (
                      <div key={order.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2 min-w-0">
                            {/* Order Number and Status */}
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-base">#{order.orderNumber}</h4>
                              {status && (
                                <Badge variant={getStatusVariant(status) as any} className="text-xs">
                                  {status}
                                </Badge>
                              )}
                            </div>

                            {/* Client Information */}
                            <div className="bg-muted/50 p-2 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Client</p>
                                  <p className="font-semibold text-sm">{order.customerName}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">Téléphone</p>
                                  <p className="font-semibold text-sm">{order.customerPhone}</p>
                                </div>
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-muted/30 p-2 rounded-lg space-y-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Résumé de la commande:</p>
                              <div className="space-y-0.5">
                                {order.items.map((item) => {
                                  const itemTotal = item.price * item.quantity
                                  const sizeStr = item.size ? ` [${item.size}]` : ''
                                  return (
                                    <div key={item.id} className="flex justify-between text-xs">
                                      <span>
                                        {item.quantity}x {item.product.name}{sizeStr}
                                      </span>
                                      <span className="font-medium">{itemTotal.toLocaleString()} DA</span>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="border-t pt-1 mt-1 space-y-0.5">
                                <div className="flex flex-col gap-0.5 text-xs">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      {order.deliveryType === 'HOME_DELIVERY' ? (
                                        <>
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <span className="text-base">🏠</span>
                                            <span className="text-xs">Livraison à domicile:</span>
                                          </div>
                                          <div className="text-muted-foreground mt-0.5 ml-5 space-y-0.5 text-xs">
                                            {wilayaName && <div>Wilaya: {wilayaName}</div>}
                                            {communeName && <div>Commune: {communeName}</div>}
                                            {order.deliveryAddress && <div>Adresse: {order.deliveryAddress}</div>}
                                            {!wilayaName && !communeName && !order.deliveryAddress && (
                                              <div>Adresse non spécifiée</div>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <span className="text-base">🏢</span>
                                            <span className="text-xs">Bureau Yalidine:</span>
                                          </div>
                                          <div className="text-muted-foreground mt-0.5 ml-5 text-xs">
                                            {order.deliveryDesk?.name || order.deliveryAddress || 'Bureau non spécifié'}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <span className="font-medium ml-2 text-xs">{order.deliveryFee.toLocaleString()} DA</span>
                                  </div>
                                </div>
                                <div className="flex justify-between text-xs pt-0.5 border-t">
                                  <span className="font-medium">Total:</span>
                                  <span className="font-semibold text-green-600">{order.total.toLocaleString()} DA</span>
                                </div>
                              </div>
                            </div>

                            {/* Yalidine Tracking */}
                            {order.trackingNumber && (
                              <div className="text-xs">
                                <span className="font-medium">Yalidine Tracking:</span>
                                <span className="ml-2 font-mono bg-blue-50 px-1.5 py-0.5 rounded text-blue-700 text-xs">
                                  {order.trackingNumber}
                                </span>
                              </div>
                            )}

                            {/* Notes Display - Orange and Animated */}
                            {order.notes && (
                              <motion.div 
                                className="bg-orange-50 border-2 border-orange-300 p-2 rounded-lg shadow-md"
                                initial={{ scale: 1 }}
                                animate={{ 
                                  scale: [1, 1.02, 1],
                                  boxShadow: [
                                    '0 0 0px rgba(251, 146, 60, 0.4)',
                                    '0 0 10px rgba(251, 146, 60, 0.6)',
                                    '0 0 0px rgba(251, 146, 60, 0.4)'
                                  ]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                <p className="text-xs font-medium text-orange-800 mb-0.5">Notes:</p>
                                <p className="text-xs text-orange-900 whitespace-pre-wrap">{order.notes}</p>
                              </motion.div>
                            )}
                          </div>

                          {/* Action Buttons - Right Side */}
                          <div className="flex flex-col items-end space-y-1.5 ml-3 flex-shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setShowNotesDialog(true)
                                      setNoteInput('')
                                    }}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    {order.notes ? 'Modifier Note' : 'Ajouter Note'}
                                  </Button>
                                </TooltipTrigger>
                                {order.notes && (
                                  <TooltipContent side="left" className="max-w-md">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-sm mb-2">Détails des Notes:</p>
                                      <p className="text-xs whitespace-pre-wrap">{order.notes}</p>
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>

                            {whatsappLink && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(whatsappLink, '_blank')}
                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs h-7 px-2"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-6">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (confirmedCurrentPage > 1) {
                                    setConfirmedCurrentPage(confirmedCurrentPage - 1)
                                  }
                                }}
                                className={confirmedCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= confirmedCurrentPage - 1 && page <= confirmedCurrentPage + 1)
                              ) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setConfirmedCurrentPage(page)
                                      }}
                                      isActive={confirmedCurrentPage === page}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                )
                              } else if (
                                page === confirmedCurrentPage - 2 ||
                                page === confirmedCurrentPage + 2
                              ) {
                                return (
                                  <PaginationItem key={page}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )
                              }
                              return null
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (confirmedCurrentPage < totalPages) {
                                    setConfirmedCurrentPage(confirmedCurrentPage + 1)
                                  }
                                }}
                                className={confirmedCurrentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )
              })()}
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
                {yalidineShipments.filter(shipment => shipment.last_status === 'En préparation').map((shipment, index) => {
                  const order = orders.find(o => o.trackingNumber === shipment.tracking)
                  return (
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
                          {order && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowNotesDialog(true)
                                setNoteInput('')
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Add Note
                            </Button>
                          )}
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
                  )
                })}
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
                {yalidineShipments.filter(shipment => shipment.last_status === 'Sorti en livraison').map((shipment, index) => {
                  const whatsappLink = getShipmentWhatsAppLink(shipment)
                  return (
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
                          {whatsappLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(whatsappLink, '_blank')}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
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
                  )
                })}
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
                {yalidineShipments.filter(shipment => shipment.last_status === 'En attente du client').map((shipment, index) => {
                  const whatsappLink = getShipmentWhatsAppLink(shipment)
                  return (
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
                          {whatsappLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(whatsappLink, '_blank')}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
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
                  )
                })}
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
                {yalidineShipments.filter(shipment => shipment.last_status === 'Tentative échouée').map((shipment, index) => {
                  const whatsappLink = getShipmentWhatsAppLink(shipment)
                  return (
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
                          {whatsappLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(whatsappLink, '_blank')}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
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
                  )
                })}
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
                {yalidineShipments.filter(shipment => shipment.last_status === 'En alerte').map((shipment, index) => {
                  const order = orders.find(o => o.trackingNumber === shipment.tracking)
                  return (
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
                          {order && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowNotesDialog(true)
                                setNoteInput('')
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Add Note
                            </Button>
                          )}
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
                  )
                })}
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

      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order #{selectedOrder?.orderNumber}</Label>
              <p className="text-sm text-muted-foreground">
                Customer: {selectedOrder?.customerName}
              </p>
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedOrder) {
                    updateOrderNotes(selectedOrder.id, noteInput)
                  }
                }}
                disabled={loadingAction || !noteInput.trim()}
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Note
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