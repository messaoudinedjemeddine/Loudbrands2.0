'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, Truck, Eye, Plus, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { yalidineAPI, Wilaya, Commune, Center, ShipmentData } from '@/lib/yalidine-api';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryType: 'HOME_DELIVERY' | 'PICKUP';
  deliveryAddress?: string;
  city: {
    name: string;
    nameAr?: string;
  };
  deliveryDesk?: {
    name: string;
    nameAr?: string;
  };
  total: number;
  subtotal: number;
  deliveryFee: number;
  callCenterStatus: 'NEW' | 'CONFIRMED' | 'CANCELED' | 'NO_RESPONSE';
  deliveryStatus: 'NOT_READY' | 'READY' | 'IN_TRANSIT' | 'DONE';
  createdAt: string;
  updatedAt: string;
  notes?: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      nameAr?: string;
      image?: string;
    };
  }>;
  deliveryDetails?: {
    wilayaId?: string;
    communeId?: string;
    centerId?: string;
    deliveryType?: string;
    deliveryAddress?: string;
  };
}

interface ShippingStats {
  confirmedOrders: number;
  readyOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  totalShippable: number;
}

const statusColors = {
  NOT_READY: 'bg-slate-100 text-slate-800 border border-slate-200',
  READY: 'bg-amber-100 text-amber-800 border border-amber-200',
  IN_TRANSIT: 'bg-sky-100 text-sky-800 border border-sky-200',
  DONE: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
};

const statusLabels = {
  NOT_READY: 'Not Ready',
  READY: 'Ready',
  IN_TRANSIT: 'In Transit',
  DONE: 'Delivered'
};

// Helper function to format Yalidine dates
const formatYalidineDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';

  try {
    // Yalidine dates are in format "YYYY-MM-DD HH:MM:SS"
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
};

export function ShippingRoleDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ShippingStats>({
    confirmedOrders: 0,
    readyOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    totalShippable: 0
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showShipmentDialog, setShowShipmentDialog] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);

  // Yalidine shipments
  const [yalidineShipments, setYalidineShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [shipmentPagination, setShipmentPagination] = useState({
    has_more: false,
    total_data: 0,
    current_page: 1,
    total_pages: 0,
    per_page: 25
  });

  // Yalidine data
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');

  // Filters for Yalidine shipments
  const [shipmentFilters, setShipmentFilters] = useState({
    status: '',
    tracking: '',
    order_id: '',
    to_commune_name: '',
    date_creation: '',
    date_last_status: '',
    payment_status: '',
    month: '' // New month filter
  });

  // Month filter options
  const monthOptions = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Yalidine status options (exact values from API)
  const yalidineStatuses = [
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
  ];
  const [showFilters, setShowFilters] = useState(false);

  // Shipment form
  const [shipmentForm, setShipmentForm] = useState<Partial<ShipmentData>>({
    orderId: '',
    firstname: '',
    familyname: '',
    contactPhone: '',
    address: '',
    fromWilayaName: 'Alger',
    toWilayaName: '',
    toCommuneName: '',
    productList: '',
    price: 0,
    weight: 1,
    length: 10,
    width: 10,
    height: 10,
    isStopDesk: false,
    doInsurance: false,
    declaredValue: 0,
    freeshipping: false,
    hasExchange: false,
  });

  useEffect(() => {
    fetchShippingData();
    fetchYalidineData();
  }, []);

  const fetchShippingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData] = await Promise.all([
        api.admin.getOrders({ limit: 100 })
      ]);

      const ordersList = (ordersData as any).orders || ordersData as Order[];
      const confirmedOrders = ordersList.filter((order: Order) => order.callCenterStatus === 'CONFIRMED');

      setOrders(confirmedOrders);

      // Calculate stats
      const stats = {
        confirmedOrders: confirmedOrders.length,
        readyOrders: confirmedOrders.filter((o: Order) => o.deliveryStatus === 'READY').length,
        inTransitOrders: confirmedOrders.filter((o: Order) => o.deliveryStatus === 'IN_TRANSIT').length,
        deliveredOrders: confirmedOrders.filter((o: Order) => o.deliveryStatus === 'DONE').length,
        totalShippable: confirmedOrders.length
      };
      setStats(stats);

    } catch (err) {
      console.error('Error fetching shipping data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchYalidineData = async () => {
    try {
      const [wilayasData, centersData] = await Promise.all([
        yalidineAPI.getWilayas(),
        yalidineAPI.getCenters()
      ]);

      setWilayas((wilayasData as any)?.data || []);
      setCenters((centersData as any)?.data || []);
    } catch (error) {
      console.error('Error fetching Yalidine data:', error);
    }
  };

  const fetchYalidineShipments = async (filters: any = {}) => {
    try {
      setLoadingShipments(true);
      const page = filters.page || 1;
      const limit = shipmentPagination.per_page;
      const offset = (page - 1) * limit;
      const requestFilters = { ...filters, limit, offset };

      const response = await yalidineAPI.getAllShipments(requestFilters);

      if (response.has_more !== undefined) {
        const totalPages = Math.ceil((response.total_data || 0) / limit);
        setShipmentPagination({
          has_more: response.has_more,
          total_data: response.total_data || 0,
          current_page: page,
          total_pages: totalPages,
          per_page: limit
        });
      }

      setYalidineShipments(response.data || []);
    } catch (error) {
      console.error('Error fetching Yalidine shipments:', error);
      setYalidineShipments([]);
    } finally {
      setLoadingShipments(false);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, { deliveryStatus: status });
      toast.success(`Order status updated to ${statusLabels[status as keyof typeof statusLabels]}`);
      fetchShippingData();
    } catch (err) {
      console.error('Error updating delivery status:', err);
      toast.error('Failed to update order status');
    }
  };

  const handleCreateShipment = async (order: Order) => {
    try {
      toast.info('Chargement des détails de la commande...');
      // Fetch fresh order data
      const freshOrder: any = await api.orders.getById(order.id);

      if (!freshOrder) {
        toast.error('Impossible de charger les détails de la commande');
        return;
      }

      // Process items for sizes
      const processedItems = freshOrder.items.map((item: any) => {
        let size = item.size;
        if ((!size || size.trim() === '') && item.productSize) {
          size = item.productSize.size;
        }
        return { ...item, size };
      });

      setSelectedOrder(freshOrder);

      // Initialize wilaya/commune
      const orderWilaya = wilayas.find(w => w.name === freshOrder.city.name);
      const orderWilayaId = orderWilaya?.id || 5;

      let stopDeskId: number | undefined = undefined;
      let toCommuneName = freshOrder.city.name;

      if (orderWilayaId) {
        try {
          // Initialize requests array
          const requests: any[] = [yalidineAPI.getCommunes(orderWilayaId)];

          // Only fetch centers if pickup
          if (freshOrder.deliveryType === 'PICKUP') {
            requests.push(yalidineAPI.getCenters(orderWilayaId));
          } else {
            requests.push(Promise.resolve({ data: [] }));
          }

          const [communesData, centersData] = await Promise.all(requests);

          setCommunes(communesData.data || []);
          setSelectedWilaya(orderWilayaId.toString());

          // Resolve Commune for Home Delivery
          if (freshOrder.deliveryType === 'HOME_DELIVERY' && freshOrder.deliveryDetails?.communeId) {
            const communes = communesData.data || [];
            const matchedCommune = communes.find((c: any) => c.id.toString() === freshOrder.deliveryDetails?.communeId.toString());
            if (matchedCommune) {
              toCommuneName = matchedCommune.name;
              console.log('Resolved Commune:', toCommuneName);
            }
          }

          // Resolve Stop Desk ID if it's a Pickup order
          if (freshOrder.deliveryType === 'PICKUP') {
            const centers = centersData.data || [];

            // Try fetch by centerId first
            if (freshOrder.deliveryDetails?.centerId) {
              const matchedCenter = centers.find((c: any) => c.center_id.toString() === freshOrder.deliveryDetails?.centerId.toString());
              if (matchedCenter) {
                stopDeskId = matchedCenter.center_id;
                toCommuneName = matchedCenter.commune_name;
                console.log('Resolved Desk by ID:', matchedCenter.name);
              }
            }

            // Fallback to name matching
            if (!stopDeskId && freshOrder.deliveryDesk) {
              const deskName = freshOrder.deliveryDesk.name;
              const matchedCenter = centers.find((c: any) => c.name === deskName);
              if (matchedCenter) {
                stopDeskId = matchedCenter.center_id;
                toCommuneName = matchedCenter.commune_name;
              } else {
                // Try partial match
                const partialMatch = centers.find((c: any) => c.name.includes(deskName) || deskName.includes(c.name));
                if (partialMatch) {
                  stopDeskId = partialMatch.center_id;
                  toCommuneName = partialMatch.commune_name;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading communes/centers:', error);
        }
      }

      // Force recalculation of subtotal
      const calculatedSubtotal = freshOrder.items.reduce((acc: number, item: any) => {
        return acc + (Number(item.price) * Number(item.quantity));
      }, 0);

      // Show visible feedback
      toast.info(`Creating Delivery Ticket: Price = ${calculatedSubtotal} DA`);

      setShipmentForm({
        orderId: freshOrder.orderNumber,
        firstname: freshOrder.customerName.split(' ')[0] || '',
        familyname: freshOrder.customerName.split(' ').slice(1).join(' ') || '',
        contactPhone: freshOrder.customerPhone,
        address: freshOrder.deliveryAddress || '',
        fromWilayaName: 'Batna',
        toWilayaName: freshOrder.city.name,
        toCommuneName: toCommuneName,
        productList: processedItems.map((item: any) => {
          const sizeStr = item.size ? ` ${item.size}` : '';
          return `${item.quantity}x ${item.product.name}${sizeStr}`;
        }).join('\n'),
        price: calculatedSubtotal, // Use forced calculation
        weight: 1,
        length: 10,
        width: 10,
        height: 10,
        isStopDesk: freshOrder.deliveryType === 'PICKUP',
        stopDeskId: stopDeskId,
        doInsurance: false,
        declaredValue: calculatedSubtotal, // Use forced calculation
        freeshipping: false,
        hasExchange: false,
      });
      setShowShipmentDialog(true);
    } catch (error) {
      console.error('Error preparing shipment:', error);
      toast.error('Erreur lors de la préparation de l\'expédition');
    }
  };

  const createShipment = async () => {
    try {
      setCreatingShipment(true);

      const shipmentData: ShipmentData = {
        orderId: shipmentForm.orderId!,
        firstname: shipmentForm.firstname!,
        familyname: shipmentForm.familyname!,
        contactPhone: shipmentForm.contactPhone!,
        address: shipmentForm.address!,
        fromWilayaName: shipmentForm.fromWilayaName!,
        toWilayaName: shipmentForm.toWilayaName!,
        toCommuneName: shipmentForm.toCommuneName!,
        productList: shipmentForm.productList!,
        price: shipmentForm.price!,
        weight: shipmentForm.weight!,
        length: shipmentForm.length!,
        width: shipmentForm.width!,
        height: shipmentForm.height!,
        isStopDesk: shipmentForm.isStopDesk!,
        doInsurance: shipmentForm.doInsurance!,
        declaredValue: shipmentForm.declaredValue!,
        freeshipping: shipmentForm.freeshipping!,
        hasExchange: shipmentForm.hasExchange!,
      };

      const response = await yalidineAPI.createShipment(shipmentData);

      if (response.success) {
        toast.success('Shipment created successfully!');
        setShowShipmentDialog(false);

        // Update order status to READY
        if (selectedOrder) {
          await updateDeliveryStatus(selectedOrder.id, 'READY');
        }

        // Refresh shipments
        fetchYalidineShipments();
      } else {
        toast.error((response as any).message || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
    } finally {
      setCreatingShipment(false);
    }
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= shipmentPagination.total_pages) {
      fetchYalidineShipments({ ...shipmentFilters, page });
    }
  };

  const nextPage = () => {
    if (shipmentPagination.current_page < shipmentPagination.total_pages) {
      goToPage(shipmentPagination.current_page + 1);
    }
  };

  const prevPage = () => {
    if (shipmentPagination.current_page > 1) {
      goToPage(shipmentPagination.current_page - 1);
    }
  };

  const clearFilters = () => {
    setShipmentFilters({
      status: '',
      tracking: '',
      order_id: '',
      to_commune_name: '',
      date_creation: '',
      date_last_status: '',
      payment_status: '',
      month: ''
    });
    fetchYalidineShipments({ page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    setShipmentFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchYalidineShipments({ ...shipmentFilters, page: 1 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shipping data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchShippingData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Shipping Management Dashboard</h2>
        <p className="text-muted-foreground">
          Manage shipments and track delivery status. Create Yalidine shipments and monitor delivery progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmedOrders}</div>
            <p className="text-xs text-muted-foreground">Ready for shipping</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ready Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyOrders}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransitOrders}</div>
            <p className="text-xs text-muted-foreground">Currently delivering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shippable</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShippable}</div>
            <p className="text-xs text-muted-foreground">All confirmed orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Orders and Yalidine Shipments */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Confirmed Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="yalidine">Yalidine Shipments ({yalidineShipments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Orders Ready for Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
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
                          <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.deliveryType === 'HOME_DELIVERY' ? 'Home Delivery' : 'Pickup'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.deliveryType === 'HOME_DELIVERY'
                              ? order.deliveryAddress
                              : order.deliveryDesk?.name
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">{order.city.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.total.toLocaleString()} DA</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.deliveryStatus]}>
                          {statusLabels[order.deliveryStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {order.deliveryStatus === 'NOT_READY' && (
                            <Button
                              size="sm"
                              onClick={() => handleCreateShipment(order)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Shipment
                            </Button>
                          )}

                          {order.deliveryStatus === 'READY' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDeliveryStatus(order.id, 'IN_TRANSIT')}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Mark In Transit
                            </Button>
                          )}

                          {order.deliveryStatus === 'IN_TRANSIT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDeliveryStatus(order.id, 'DONE')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yalidine" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Yalidine Shipments (page {shipmentPagination.current_page} of {shipmentPagination.total_pages})</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => fetchYalidineShipments()}
                    disabled={loadingShipments}
                    variant="outline"
                    size="sm"
                  >
                    <Loader2 className={`h-4 w-4 mr-2 ${loadingShipments ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="sm"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              {showFilters && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Month</label>
                      <select
                        value={shipmentFilters.month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        {monthOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={shipmentFilters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        <option value="">All Statuses</option>
                        {yalidineStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tracking Number</label>
                      <input
                        type="text"
                        value={shipmentFilters.tracking}
                        onChange={(e) => handleFilterChange('tracking', e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full mt-1 p-2 border rounded-md"
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button onClick={applyFilters} size="sm">
                        Apply Filters
                      </Button>
                      <Button onClick={clearFilters} variant="outline" size="sm">
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {loadingShipments ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading shipments from Yalidine...</span>
                </div>
              ) : yalidineShipments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No shipments found in Yalidine account</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {yalidineShipments.map((shipment, index) => (
                    <div key={shipment.id || shipment.tracking || `shipment-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-lg">#{shipment.tracking}</p>
                                <Badge className={`${shipment.last_status === 'Livré' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
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
                              <span className="font-medium">From:</span> {shipment.from_wilaya_name || 'Alger'}
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
                            onClick={() => window.open(`https://yalidine.com/tracking/${shipment.tracking}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {shipmentPagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing page {shipmentPagination.current_page} of {shipmentPagination.total_pages}
                    ({shipmentPagination.total_data} total shipments)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(1)}
                      disabled={shipmentPagination.current_page === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={shipmentPagination.current_page === 1}
                    >
                      Previous
                    </Button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, shipmentPagination.total_pages) }, (_, i) => {
                      const page = Math.max(1, Math.min(
                        shipmentPagination.total_pages - 4,
                        shipmentPagination.current_page - 2
                      )) + i
                      if (page > shipmentPagination.total_pages) return null

                      return (
                        <Button
                          key={page}
                          variant={page === shipmentPagination.current_page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={shipmentPagination.current_page === shipmentPagination.total_pages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(shipmentPagination.total_pages)}
                      disabled={shipmentPagination.current_page === shipmentPagination.total_pages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Shipment Dialog */}
      <Dialog open={showShipmentDialog} onOpenChange={setShowShipmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Yalidine Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Order ID</label>
                <input
                  type="text"
                  value={shipmentForm.orderId}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, orderId: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                  readOnly
                />
              </div>
              <div>
                <label className="text-sm font-medium">First Name</label>
                <input
                  type="text"
                  value={shipmentForm.firstname || ''}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, firstname: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Family Name</label>
                <input
                  type="text"
                  value={shipmentForm.familyname || ''}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, familyname: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Customer Phone</label>
                <input
                  type="text"
                  value={shipmentForm.contactPhone || ''}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (DA)</label>
                <input
                  type="number"
                  value={shipmentForm.price}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Customer Address</label>
              <textarea
                value={shipmentForm.address || ''}
                onChange={(e) => setShipmentForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">From Wilaya</label>
                <input
                  type="text"
                  value={shipmentForm.fromWilayaName}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, fromWilayaName: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Wilaya</label>
                <input
                  type="text"
                  value={shipmentForm.toWilayaName}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, toWilayaName: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">To Commune</label>
                <input
                  type="text"
                  value={shipmentForm.toCommuneName}
                  onChange={(e) => setShipmentForm(prev => ({ ...prev, toCommuneName: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Product List</label>
              <textarea
                value={shipmentForm.productList}
                onChange={(e) => setShipmentForm(prev => ({ ...prev, productList: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowShipmentDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={createShipment}
                disabled={creatingShipment}
              >
                {creatingShipment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Shipment'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
