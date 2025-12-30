'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Search
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

interface ComprehensiveAnalytics {
  financial: {
    totalRevenue: number
    totalNetProfit: number
    stockValuation: {
      cost: number
      retail: number
      potentialProfit: number
    }
  }
  logistics: {
    deliverySuccessRate: number
    yalidineLivreOrders: number
    totalShipped: number
  }
  ordersByCity: Array<{
    cityId: string
    cityName: string
    cityNameAr?: string
    orders: number
  }>
  topCategories: Array<{
    categoryId: string
    categoryName: string
    categoryNameAr?: string
    quantity: number
    revenue: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    nameAr?: string
    image: string
    quantity: number
    revenue: number
    orderCount: number
  }>
}

interface TimeSeriesData {
  date: string
  orders: number
  revenue: number
  profit: number
}

interface InventoryItem {
  id: string
  name: string
  nameAr?: string
  categoryName: string
  categoryNameAr?: string
  brandName: string
  image: string
  price: number
  costPrice: number
  unitProfit: number
  totalStock: number
  totalPotentialProfit: number
  stockValuationCost: number
  stockValuationRetail: number
  profitMargin: number
  isLowStock: boolean
  lowStockSizes: Array<{
    size: string
    stock: number
  }>
}

const COLORS = ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#BC8F8F', '#A0522D', '#8B7355', '#6F4E37', '#5C4033']

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [comprehensiveData, timeSeriesData, inventoryData] = await Promise.all([
        api.admin.getComprehensiveAnalytics(),
        api.admin.getTimeSeriesAnalytics(),
        api.admin.getInventoryIntelligence()
      ])

      setAnalytics(comprehensiveData as ComprehensiveAnalytics)
      setTimeSeries(timeSeriesData as TimeSeriesData[])
      setInventory(inventoryData as InventoryItem[])

    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item => {
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query) ||
      item.brandName.toLowerCase().includes(query) ||
      (item.nameAr && item.nameAr.toLowerCase().includes(query))
    )
  })

  if (!mounted) return null

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </AdminLayout>
    )
  }

  // Prepare chart data
  const categoryChartData = analytics.topCategories.map((cat, index) => ({
    name: cat.categoryName,
    value: cat.revenue,
    color: COLORS[index % COLORS.length]
  }))

  const productChartData = analytics.topProducts.slice(0, 10).map(product => ({
    name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
    revenue: product.revenue,
    quantity: product.quantity
  }))

  const cityChartData = analytics.ordersByCity.slice(0, 10).map(city => ({
    name: city.cityName,
    orders: city.orders
  }))

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive business intelligence and performance metrics
            </p>
          </div>
        </div>

        {/* KPI Cards - Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.financial.totalRevenue.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From confirmed orders
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.financial.totalNetProfit.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selling Price - Buying Price (per unit)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Stock Valuation</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.financial.stockValuation.cost.toLocaleString()} DA
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  At Buying Price: {analytics.financial.stockValuation.cost.toLocaleString()} DA
                  <br />
                  At Selling Price: {analytics.financial.stockValuation.retail.toLocaleString()} DA
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Delivery Success</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.logistics.deliverySuccessRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.logistics.yalidineLivreOrders} / {analytics.logistics.totalShipped} shipped
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Middle Row - Line Chart and Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time-Series Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Profit & Order Volume (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    profit: {
                      label: 'Profit (DA)',
                      color: 'hsl(var(--chart-1))',
                    },
                    orders: {
                      label: 'Orders',
                      color: 'hsl(var(--chart-2))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <RechartsLineChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="profit"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      name="Profit (DA)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Sales by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={categoryChartData.reduce((acc, item, index) => {
                    acc[`category${index}`] = {
                      label: item.name,
                      color: item.color,
                    }
                    return acc
                  }, {} as Record<string, { label: string; color: string }>)}
                  className="h-[300px]"
                >
                  <RechartsPieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row - Delivery Gauge and City Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Success Rate Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Delivery Success Rate (Yalidine Livre)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 80}`}
                        strokeDashoffset={`${2 * Math.PI * 80 * (1 - analytics.logistics.deliverySuccessRate / 100)}`}
                        className="text-green-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {analytics.logistics.deliverySuccessRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Success Rate
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {analytics.logistics.yalidineLivreOrders} orders with Yalidine tracking
                    </p>
                    <p className="text-sm text-muted-foreground">
                      out of {analytics.logistics.totalShipped} total shipped
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orders by City Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Orders by City
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    orders: {
                      label: 'Orders',
                      color: 'hsl(var(--chart-1))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={cityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Products Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: 'Revenue (DA)',
                      color: 'hsl(var(--chart-1))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={productChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Inventory Intelligence Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Inventory Intelligence
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit Profit</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Potential Profit</TableHead>
                      <TableHead>Stock Value (Buying)</TableHead>
                      <TableHead>Stock Value (Selling)</TableHead>
                      <TableHead>Profit Margin</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-muted-foreground">No products found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg'
                                }}
                              />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{item.brandName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.categoryName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {item.unitProfit.toLocaleString()} DA
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.totalStock}</span>
                            {item.isLowStock && (
                              <Badge variant="destructive" className="ml-2">
                                Low Stock
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-600">
                              {item.totalPotentialProfit.toLocaleString()} DA
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {item.stockValuationCost.toLocaleString()} DA
                            </span>
                            <p className="text-xs text-muted-foreground">At buying price</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {item.stockValuationRetail.toLocaleString()} DA
                            </span>
                            <p className="text-xs text-muted-foreground">At selling price</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.profitMargin > 30 ? 'default' : 'secondary'}>
                              {item.profitMargin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.isLowStock ? (
                              <div className="flex items-center space-x-1 text-orange-600">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs">Low Stock</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-green-600">
                                In Stock
                              </Badge>
                            )}
                            {item.lowStockSizes.length > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Low: {item.lowStockSizes.map(s => s.size).join(', ')}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  )
}
