'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ShoppingCart, 
  Search, 
  Filter,
  Phone,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

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
  callCenterStatus: string
  deliveryStatus: string
  createdAt: string
  updatedAt: string
  items: any[]
  city: {
    id: string
    name: string
  }
  deliveryDesk?: {
    id: string
    name: string
  }
}

export default function ConfirmatriceHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')

  useEffect(() => {
    fetchAllOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, dateFilter])

  const fetchAllOrders = async () => {
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
      toast.error('Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.callCenterStatus === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const today = new Date()
      const orderDate = new Date()
      
      switch (dateFilter) {
        case 'TODAY':
          filtered = filtered.filter(order => {
            orderDate.setTime(new Date(order.createdAt).getTime())
            return orderDate.toDateString() === today.toDateString()
          })
          break
        case 'WEEK':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(order => {
            orderDate.setTime(new Date(order.createdAt).getTime())
            return orderDate >= weekAgo
          })
          break
        case 'MONTH':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(order => {
            orderDate.setTime(new Date(order.createdAt).getTime())
            return orderDate >= monthAgo
          })
          break
      }
    }

    setFilteredOrders(filtered)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.callCenterStatus === status).length
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
          <h1 className="text-3xl font-bold text-gray-900">Historique des Commandes</h1>
          <p className="text-gray-600">Consultez l'historique complet des commandes</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredOrders.length} commandes
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="N° commande, client, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
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
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les dates</SelectItem>
                  <SelectItem value="TODAY">Aujourd'hui</SelectItem>
                  <SelectItem value="WEEK">Cette semaine</SelectItem>
                  <SelectItem value="MONTH">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('ALL')
                  setDateFilter('ALL')
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getStatusCount('NEW')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getStatusCount('CONFIRMED')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getStatusCount('CANCELED')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getStatusCount('PENDING')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Historique des Commandes</span>
          </CardTitle>
          <CardDescription>
            Toutes les commandes traitées par le centre d'appel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune commande trouvée avec les filtres actuels</p>
            </div>
          ) : (
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
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
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
                                <div className="text-xs text-gray-500">x{item.quantity}</div>
                              </div>
                            </div>
                          ))}
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
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(order.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.callCenterStatus)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}









