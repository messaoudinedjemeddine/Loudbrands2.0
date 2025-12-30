'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ShoppingCart, 
  CheckCircle, 
  Phone,
  Truck,
  Calendar,
  Clock
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

export default function ConfirmatriceConfirmPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfirmedOrders()
  }, [])

  const fetchConfirmedOrders = async () => {
    try {
      const response = await fetch('/api/confirmatrice/orders/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filter for confirmed orders
        const confirmedOrders = data.filter((order: Order) => 
          order.callCenterStatus === 'CONFIRMED'
        )
        setOrders(confirmedOrders)
      }
    } catch (error) {
      console.error('Error fetching confirmed orders:', error)
      toast.error('Erreur lors du chargement des commandes confirmées')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { label: 'Confirmée', color: 'bg-green-100 text-green-800' },
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      DOUBLE_ORDER: { label: 'Commande double', color: 'bg-purple-100 text-purple-800' },
      DELAYED: { label: 'Retardée', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.CONFIRMED
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
          <h1 className="text-3xl font-bold text-gray-900">Commandes Confirmées</h1>
          <p className="text-gray-600">Gestion des commandes confirmées et prêtes pour la livraison</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {orders.length} commandes confirmées
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Commandes Confirmées</span>
          </CardTitle>
          <CardDescription>
            Commandes validées et prêtes pour la préparation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune commande confirmée pour le moment</p>
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
                    <TableHead>Date de confirmation</TableHead>
                    <TableHead>Statut</TableHead>
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
                          <span className="text-sm">{formatDate(order.updatedAt)}</span>
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

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              Commandes confirmées aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livraison Domicile</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(order => order.deliveryType === 'HOME_DELIVERY').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Livraisons à domicile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Point Relais</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(order => order.deliveryType === 'PICKUP').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Retraits en point relais
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}









