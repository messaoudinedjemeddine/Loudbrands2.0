'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Loader2,
  ExternalLink,
  Phone,
  Navigation,
  AlertTriangle
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { yalidineAPI } from '@/lib/yalidine-api'
import { toast } from 'sonner'

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

export default function AgentYalidineShipmentsPage() {
  const [loading, setLoading] = useState(true)
  const [yalidineShipments, setYalidineShipments] = useState<YalidineShipment[]>([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  
  // Pagination state for Yalidine shipments
  const [shipmentPagination, setShipmentPagination] = useState({
    has_more: false,
    total_data: 0,
    current_page: 1,
    total_pages: 0,
    per_page: 25
  })
  
  // Status filter for Yalidine shipments
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Yalidine status options
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
    fetchAllYalidineShipments()
  }, [])

  // Reset pagination when filter changes
  useEffect(() => {
    setShipmentPagination(prev => ({ ...prev, current_page: 1 }))
  }, [statusFilter])

  // Filter shipments by status
  const allFilteredShipments = statusFilter && statusFilter !== 'all'
    ? yalidineShipments.filter(shipment => shipment.last_status === statusFilter)
    : yalidineShipments

  // Paginate the filtered results
  const startIndex = (shipmentPagination.current_page - 1) * shipmentPagination.per_page
  const endIndex = startIndex + shipmentPagination.per_page
  const filteredShipments = allFilteredShipments.slice(startIndex, endIndex)
  
  // Update pagination info based on filtered results
  const totalFilteredItems = allFilteredShipments.length
  const totalPages = Math.ceil(totalFilteredItems / shipmentPagination.per_page)

  const fetchYalidineShipments = async (page: number = 1) => {
    try {
      setLoadingShipments(true)
      const response = await yalidineAPI.getAllShipments({ page })
      
      // Handle pagination data
      setShipmentPagination({
        has_more: response.has_more || false,
        total_data: response.total_data || response.data?.length || 0,
        current_page: page,
        total_pages: Math.ceil((response.total_data || 0) / shipmentPagination.per_page),
        per_page: shipmentPagination.per_page
      })
      
      setYalidineShipments(response.data || [])
    } catch (error) {
      console.error('Error fetching Yalidine shipments:', error)
      setYalidineShipments([])
      setShipmentPagination({
        has_more: false,
        total_data: 0,
        current_page: 1,
        total_pages: 0,
        per_page: shipmentPagination.per_page
      })
    } finally {
      setLoadingShipments(false)
      setLoading(false)
    }
  }

  // Fetch all Yalidine shipments (not paginated for filtering)
  const fetchAllYalidineShipments = async () => {
    try {
      setLoadingShipments(true)
      const response = await yalidineAPI.getAllShipments({ page: 1 })
      setYalidineShipments(response.data || [])
    } catch (error) {
      console.error('Error fetching all Yalidine shipments:', error)
      setYalidineShipments([])
    } finally {
      setLoadingShipments(false)
      setLoading(false)
    }
  }

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setShipmentPagination(prev => ({ ...prev, current_page: page }))
    }
  }

  const nextPage = () => {
    if (shipmentPagination.current_page < totalPages) {
      goToPage(shipmentPagination.current_page + 1)
    }
  }

  const prevPage = () => {
    if (shipmentPagination.current_page > 1) {
      goToPage(shipmentPagination.current_page - 1)
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

  const formatYalidineDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_blank')
  }

  const handleNavigateToAddress = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading Yalidine shipments...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Yalidine Shipments</h1>
          <p className="text-muted-foreground">
            Manage and track all Yalidine shipments with detailed status information.
          </p>
        </div>

        {/* Yalidine Shipments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Yalidine Shipments ({totalFilteredItems} total)
                {totalPages > 1 && ` • Page ${shipmentPagination.current_page} of ${totalPages}`}
              </CardTitle>
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
                {statusFilter && statusFilter !== 'all' && (
                  <Button 
                    onClick={() => setStatusFilter('all')} 
                    variant="outline"
                    size="sm"
                  >
                    Clear Filter
                  </Button>
                )}
                <Button 
                  onClick={() => fetchAllYalidineShipments()} 
                  disabled={loadingShipments}
                  variant="outline"
                  size="sm"
                >
                  <Loader2 className={`h-4 w-4 mr-2 ${loadingShipments ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingShipments ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading shipments from Yalidine...</span>
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>
                  {statusFilter && statusFilter !== 'all'
                    ? `No shipments found with status "${statusFilter}"` 
                    : 'No shipments found in Yalidine account'
                  }
                </p>
                {statusFilter && statusFilter !== 'all' && (
                  <Button 
                    onClick={() => setStatusFilter('all')} 
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredShipments.map((shipment, index) => (
                  <motion.div
                    key={shipment.id || shipment.tracking || `shipment-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-lg">#{shipment.tracking}</p>
                              <Badge className={`${
                                shipment.last_status === 'Livré' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                shipment.last_status === 'Sorti en livraison' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                                shipment.last_status === 'En préparation' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                shipment.last_status === 'Echèc livraison' ? 'bg-red-100 text-red-800 border border-red-200' :
                                shipment.last_status === 'Retourné au vendeur' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                shipment.last_status === 'Echange échoué' ? 'bg-red-100 text-red-800 border border-red-200' :
                                shipment.last_status === 'Pas encore expédié' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                                shipment.last_status === 'A vérifier' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                shipment.last_status === 'Pas encore ramassé' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                shipment.last_status === 'Prêt à expédier' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                                shipment.last_status === 'Ramassé' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                                shipment.last_status === 'Bloqué' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                shipment.last_status === 'Débloqué' ? 'bg-lime-100 text-lime-800 border border-lime-200' :
                                shipment.last_status === 'Transfert' ? 'bg-violet-100 text-violet-800 border border-violet-200' :
                                shipment.last_status === 'Expédié' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                shipment.last_status === 'Centre' ? 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200' :
                                shipment.last_status === 'En localisation' ? 'bg-pink-100 text-pink-800 border border-pink-200' :
                                shipment.last_status === 'Vers Wilaya' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                                shipment.last_status === 'Reçu à Wilaya' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                shipment.last_status === 'En attente du client' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                shipment.last_status === 'Prêt pour livreur' ? 'bg-green-100 text-green-800 border border-green-200' :
                                shipment.last_status === 'En attente' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                                shipment.last_status === 'En alerte' ? 'bg-red-100 text-red-800 border border-red-200' :
                                shipment.last_status === 'Tentative échouée' ? 'bg-red-100 text-red-800 border border-red-200' :
                                shipment.last_status === 'Retour vers centre' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                shipment.last_status === 'Retourné au centre' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                shipment.last_status === 'Retour transfert' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                shipment.last_status === 'Retour groupé' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                shipment.last_status === 'Retour à retirer' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                shipment.last_status === 'Retour vers vendeur' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {shipment.last_status || 'Active'}
                              </Badge>
                            </div>
                            <p className="font-medium">{shipment.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{shipment.customer_phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-lg">{shipment.price?.toLocaleString()} DA</p>
                            <p className="text-sm text-muted-foreground">
                              {shipment.weight || 1} kg
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">From:</span> {shipment.from_wilaya_name || 'Batna'}
                          </div>
                          <div>
                            <span className="font-medium">To:</span> {shipment.to_wilaya_name} • {shipment.to_commune_name}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatYalidineDate(shipment.date_creation)}
                          </div>
                          <div>
                            <span className="font-medium">Products:</span> {shipment.product_list || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Last Status Date:</span> {formatYalidineDate(shipment.date_last_status)}
                          </div>
                        </div>
                        {shipment.customer_address && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Address:</span> {shipment.customer_address}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(shipment.customer_phone, shipment.tracking)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCallCustomer(shipment.customer_phone)}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        {shipment.customer_address && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleNavigateToAddress(shipment.customer_address!)}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalFilteredItems > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredItems)} of {totalFilteredItems} shipments
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={shipmentPagination.current_page === 1}
                  >
                    Previous
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isCurrentPage = pageNum === shipmentPagination.current_page;
                      return (
                        <Button
                          key={pageNum}
                          variant={isCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        {shipmentPagination.current_page > 3 && (
                          <span className="px-2">...</span>
                        )}
                        {shipmentPagination.current_page > 3 && shipmentPagination.current_page < totalPages - 2 && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => goToPage(shipmentPagination.current_page)}
                          >
                            {shipmentPagination.current_page}
                          </Button>
                        )}
                        {shipmentPagination.current_page < totalPages - 2 && (
                          <span className="px-2">...</span>
                        )}
                        {totalPages > 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => goToPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={shipmentPagination.current_page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
