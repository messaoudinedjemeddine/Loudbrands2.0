'use client';

import { useState, useEffect, useCallback } from 'react';
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
  NOT_READY: 'Pas Prêt',
  READY: 'Prêt',
  IN_TRANSIT: 'En Transit',
  DONE: 'Livré'
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

export function ShippingDashboard() {
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



  const fetchYalidineShipments = useCallback(async (filters: any = {}) => {
    try {
      setLoadingShipments(true);

      // Add pagination parameters
      const page = filters.page || 1;
      const limit = shipmentPagination.per_page;
      const offset = (page - 1) * limit;

      const requestFilters = {
        ...filters,
        limit,
        offset
      };

      const response = await yalidineAPI.getAllShipments(requestFilters);

      // Handle pagination data
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
      setShipmentPagination({
        has_more: false,
        total_data: 0,
        current_page: 1,
        total_pages: 0,
        per_page: shipmentPagination.per_page
      });
    } finally {
      setLoadingShipments(false);
    }
  }, [shipmentPagination.per_page]);

  useEffect(() => {
    fetchShippingData();
    loadYalidineData();
    fetchYalidineShipments();
  }, [fetchYalidineShipments]);

  const fetchShippingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch only confirmed orders
      const response = await api.admin.getOrders({ confirmedOnly: 'true' }) as { orders: Order[] };
      const confirmedOrders = response.orders || [];

      setOrders(confirmedOrders);

      // Calculate stats
      const stats = {
        confirmedOrders: confirmedOrders.filter(o => o.deliveryStatus === 'NOT_READY').length,
        readyOrders: confirmedOrders.filter(o => o.deliveryStatus === 'READY').length,
        inTransitOrders: confirmedOrders.filter(o => o.deliveryStatus === 'IN_TRANSIT').length,
        deliveredOrders: confirmedOrders.filter(o => o.deliveryStatus === 'DONE').length,
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

  const loadYalidineData = async () => {
    try {
      const [wilayasData, communesData] = await Promise.all([
        yalidineAPI.getWilayas(),
        yalidineAPI.getCommunes(16) // Default to Alger
      ]);

      setWilayas(wilayasData.data || []);
      setCommunes(communesData.data || []);
    } catch (error) {
      console.error('Error loading Yalidine data:', error);
    }
  };



  const handleFilterChange = (key: string, value: string) => {
    setShipmentFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(shipmentFilters).filter(([_, value]) => value !== '')
    );
    fetchYalidineShipments(activeFilters);
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
    fetchYalidineShipments();
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= shipmentPagination.total_pages) {
      const activeFilters = Object.fromEntries(
        Object.entries(shipmentFilters).filter(([_, value]) => value !== '')
      );
      fetchYalidineShipments({ ...activeFilters, page });
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

  const handleCreateShipment = async (order: Order) => {
    try {
      toast.info('Creating shipment...');
      const result = await api.shipping.shipOrder(order.id);

      if (result.success) {
        toast.success(`Shipment created successfully! Tracking: ${result.tracking}`);

        // Update order status to READY (if not already handled by backend, but backend updates tracking, not deliveryStatus necessarily? Backend updates tracking number. Admin might maintain separate 'deliveryStatus' flow. Let's update it here to be safe/consistent with previous UX)
        await api.admin.updateOrderStatus(order.id, {
          deliveryStatus: 'READY'
        });

        fetchShippingData(); // Refresh data
      } else {
        toast.error('Failed to create shipment: Success flag missing');
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to create shipment';
      toast.error(msg);
    }
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, { deliveryStatus: status });
      fetchShippingData(); // Refresh data
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Confirmées</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.confirmedOrders}</div>
            <p className="text-xs text-muted-foreground">Prêt pour l'expédition</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Prêtes</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.readyOrders}</div>
            <p className="text-xs text-muted-foreground">Expédition créée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">{stats.inTransitOrders}</div>
            <p className="text-xs text-muted-foreground">En route</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livré</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Terminé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          <TabsTrigger value="orders">Commandes Confirmées ({orders.length})</TabsTrigger>
          <TabsTrigger value="yalidine">Expéditions Yalidine ({yalidineShipments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Confirmées Prêtes pour l'Expédition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto w-full">
                <Table className="w-full min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Commande #</TableHead>
                      <TableHead className="w-[200px]">Client</TableHead>
                      <TableHead className="w-[150px]">Livraison</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[120px]">Statut</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="w-[120px] font-medium">{order.orderNumber}</TableCell>
                        <TableCell className="w-[200px]">
                          <div>
                            <div className="font-medium truncate">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground truncate">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <div>
                            <div className="font-medium truncate">
                              {order.deliveryType === 'HOME_DELIVERY' ? 'Livraison à Domicile' : 'Retrait'}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {order.deliveryType === 'HOME_DELIVERY'
                                ? order.deliveryAddress
                                : order.deliveryDesk?.name
                              }
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{order.city.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[100px]">{order.total.toLocaleString()} DA</TableCell>
                        <TableCell className="w-[120px]">
                          <Badge className={statusColors[order.deliveryStatus]}>
                            {statusLabels[order.deliveryStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[150px]">
                          <div className="flex space-x-2">
                            {order.deliveryStatus === 'NOT_READY' && (
                              <Button
                                size="sm"
                                onClick={() => handleCreateShipment(order)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Créer Expédition
                              </Button>
                            )}

                            {order.deliveryStatus === 'READY' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateDeliveryStatus(order.id, 'IN_TRANSIT')}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Marquer En Transit
                              </Button>
                            )}

                            {order.deliveryStatus === 'IN_TRANSIT' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateDeliveryStatus(order.id, 'DONE')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marquer Livré
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yalidine" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtres
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    {showFilters ? 'Masquer Filtres' : 'Afficher Filtres'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Tout Effacer
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Statut</label>
                    <select
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">Tous les Statuts</option>
                      {yalidineStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Numéro de Suivi</label>
                    <input
                      type="text"
                      placeholder="Saisir le numéro de suivi"
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.tracking}
                      onChange={(e) => handleFilterChange('tracking', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">ID Commande</label>
                    <input
                      type="text"
                      placeholder="Saisir l'ID de commande"
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.order_id}
                      onChange={(e) => handleFilterChange('order_id', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Nom de la Commune</label>
                    <input
                      type="text"
                      placeholder="Saisir le nom de la commune"
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.to_commune_name}
                      onChange={(e) => handleFilterChange('to_commune_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date de Création</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.date_creation}
                      onChange={(e) => handleFilterChange('date_creation', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date du Dernier Statut</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.date_last_status}
                      onChange={(e) => handleFilterChange('date_last_status', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mois</label>
                    <select
                      className="w-full p-2 border rounded mt-1"
                      value={shipmentFilters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                    >
                      {monthOptions.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={applyFilters} className="ml-2">
                    Appliquer Filtres
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Yalidine Shipments Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expéditions</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{shipmentPagination.total_data || yalidineShipments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {shipmentPagination.total_data > 0 ? `Toutes les expéditions dans Yalidine (page ${shipmentPagination.current_page} sur ${shipmentPagination.total_pages})` : 'Toutes les expéditions dans Yalidine'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">En Préparation</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {yalidineShipments.filter(s => s.last_status === 'En préparation').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  En préparation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">En Livraison</CardTitle>
                <Truck className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600">
                  {yalidineShipments.filter(s => s.last_status === 'Sorti en livraison').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  En livraison
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Livré</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {yalidineShipments.filter(s => s.last_status === 'Livré').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Livré avec succès
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Toutes les Expéditions Yalidine
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Voir toutes les expéditions de votre compte Yalidine ({shipmentPagination.total_data || yalidineShipments.length} total)
                    {shipmentPagination.total_pages > 1 && ` • Page ${shipmentPagination.current_page} sur ${shipmentPagination.total_pages}`}
                  </p>
                </div>
                <Button
                  onClick={fetchYalidineShipments}
                  disabled={loadingShipments}
                  variant="outline"
                  size="sm"
                >
                  <Loader2 className={`h-4 w-4 mr-2 ${loadingShipments ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingShipments ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Chargement des expéditions depuis Yalidine...</span>
                </div>
              ) : yalidineShipments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>Aucune expédition trouvée dans le compte Yalidine</p>
                  <p className="text-sm">Créez des expéditions à partir des commandes confirmées pour les voir ici</p>
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Truck className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {yalidineShipments.length > 0 && shipmentPagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((shipmentPagination.current_page - 1) * shipmentPagination.per_page) + 1} to{' '}
                    {Math.min(shipmentPagination.current_page * shipmentPagination.per_page, shipmentPagination.total_data)} of{' '}
                    {shipmentPagination.total_data} shipments
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

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, shipmentPagination.total_pages) }, (_, i) => {
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

                      {shipmentPagination.total_pages > 5 && (
                        <>
                          {shipmentPagination.current_page > 3 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}

                          {shipmentPagination.current_page > 3 && shipmentPagination.current_page < shipmentPagination.total_pages - 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(shipmentPagination.current_page)}
                              className="w-8 h-8 p-0"
                            >
                              {shipmentPagination.current_page}
                            </Button>
                          )}

                          {shipmentPagination.current_page < shipmentPagination.total_pages - 2 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}

                          {shipmentPagination.total_pages > 5 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(shipmentPagination.total_pages)}
                              className="w-8 h-8 p-0"
                            >
                              {shipmentPagination.total_pages}
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={shipmentPagination.current_page === shipmentPagination.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Shipment Dialog */}

    </div>
  );
}
