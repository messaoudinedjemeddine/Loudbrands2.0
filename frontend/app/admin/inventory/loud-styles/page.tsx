'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  Filter, 
  Download,
  Upload,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Eye,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Product {
  id: string
  name: string
  nameAr: string
  price: number
  costPrice: number
  oldPrice?: number
  stock: number
  category: {
    id: string
    name: string
    slug: string
  }
  brand: {
    id: string
    name: string
    slug: string
  }
  reference: string
  isOnSale: boolean
  isActive: boolean
  image: string
  createdAt: string
  sizes?: Array<{
    id: string
    size: string
    stock: number
  }>
  totalStock?: number
  profitPerUnit?: number
  totalProfit?: number
  profitMargin?: number
  description?: string
  descriptionAr?: string
}

interface InventoryStats {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalValue: number
  totalCost: number
  totalProfit: number
  averageProfitMargin: number
  totalStock: number
}

export default function LoudStylesInventoryPage() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageProfitMargin: 0,
    totalStock: 0
  })

  useEffect(() => {
    setMounted(true)
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // Fetch only LOUD STYLES products
      const response = await api.admin.getInventoryByBrand('loud-styles') as { products: Product[] }
      const productsList = response.products || []
      setProducts(productsList)
      
      // Calculate stats from analytics if available
      if ((response as any).analytics) {
        setStats({
          totalProducts: (response as any).analytics.totalProducts,
          lowStockProducts: productsList.filter(p => (p.totalStock || p.stock) <= 5 && (p.totalStock || p.stock) > 0).length,
          outOfStockProducts: productsList.filter(p => (p.totalStock || p.stock) === 0).length,
          totalValue: (response as any).analytics.totalValue,
          totalCost: (response as any).analytics.totalCost,
          totalProfit: (response as any).analytics.totalProfit,
          averageProfitMargin: (response as any).analytics.averageProfitMargin,
          totalStock: (response as any).analytics.totalStock
        })
      } else {
        // Fallback calculation
        const totalValue = productsList.reduce((sum, product) => sum + (product.price * (product.totalStock || product.stock)), 0)
        const totalCost = productsList.reduce((sum, product) => sum + (product.costPrice * (product.totalStock || product.stock)), 0)
        const totalProfit = totalValue - totalCost
        const averageProfitMargin = totalValue > 0 ? ((totalProfit / totalValue) * 100) : 0
        const lowStockProducts = productsList.filter(p => (p.totalStock || p.stock) <= 5 && (p.totalStock || p.stock) > 0).length
        const outOfStockProducts = productsList.filter(p => (p.totalStock || p.stock) === 0).length
        const totalStock = productsList.reduce((sum, product) => sum + (product.totalStock || product.stock), 0)
        
        setStats({
          totalProducts: productsList.length,
          lowStockProducts,
          outOfStockProducts,
          totalValue,
          totalCost,
          totalProfit,
          averageProfitMargin,
          totalStock
        })
      }
    } catch (error) {
      console.error('Failed to fetch LOUD STYLES products:', error)
      toast.error('Failed to load LOUD STYLES inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.nameAr?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category?.name === categoryFilter)
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => (product.totalStock || product.stock) <= 5 && (product.totalStock || product.stock) > 0)
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => (product.totalStock || product.stock) === 0)
    } else if (stockFilter === 'in') {
      filtered = filtered.filter(product => (product.totalStock || product.stock) > 5)
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(product => product.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(product => !product.isActive)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter])

  const exportToExcel = async () => {
    try {
      toast.loading('Preparing LOUD STYLES inventory export...');
      
      const response = await api.admin.exportInventoryByBrand('loud-styles') as string;
      
      if (!response) {
        throw new Error('No data received from server');
      }
      
      // Create and download file
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `loud-styles-inventory-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('LOUD STYLES inventory exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.dismiss();
      toast.error('Failed to export LOUD STYLES inventory');
    }
  }

  const getCategories = () => {
    const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))
    return categories
  }

  if (!mounted) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/inventory">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Inventory</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LOUD STYLES Inventory</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage LOUD STYLES brand products and stock levels</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={exportToExcel} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
            <Link href="/admin/products/new?brand=loud-styles">
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Stock</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStock}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

                     <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.4 }}
           >
             <Card>
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                     <p className="text-2xl font-bold text-gray-900 dark:text-white">
                       {stats.totalCost.toLocaleString()} DA
                     </p>
                   </div>
                   <FileSpreadsheet className="w-8 h-8 text-orange-500" />
                 </div>
               </CardContent>
             </Card>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.5 }}
           >
             <Card>
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</p>
                     <p className="text-2xl font-bold text-green-600">
                       {stats.totalProfit.toLocaleString()} DA
                     </p>
                   </div>
                   <TrendingUp className="w-8 h-8 text-green-500" />
                 </div>
               </CardContent>
             </Card>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3, delay: 0.6 }}
           >
             <Card>
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Profit Margin</p>
                     <p className="text-2xl font-bold text-blue-600">
                       {stats.averageProfitMargin.toFixed(1)}%
                     </p>
                   </div>
                   <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                 </div>
               </CardContent>
             </Card>
           </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stock Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="in">In Stock (&gt;5)</SelectItem>
                  <SelectItem value="low">Low Stock (≤5)</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setStockFilter('all')
                  setStatusFilter('all')
                }}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Clear Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>LOUD STYLES Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No LOUD STYLES products in inventory yet'}
                </p>
                <Link href="/admin/products/new?brand=loud-styles">
                  <Button>Add First Product</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                                     <TableHeader>
                     <TableRow>
                       <TableHead>Product</TableHead>
                       <TableHead>Reference</TableHead>
                       <TableHead>Category</TableHead>
                       <TableHead>Price</TableHead>
                       <TableHead>Cost</TableHead>
                       <TableHead>Profit/Unit</TableHead>
                       <TableHead>Stock</TableHead>
                       <TableHead>Total Profit</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                              {product.nameAr && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{product.nameAr}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{product.reference}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category?.name}</Badge>
                        </TableCell>
                                                 <TableCell>
                           <div>
                             <p className="font-medium">{product.price.toLocaleString()} DA</p>
                             {product.oldPrice && (
                               <p className="text-sm text-gray-500 line-through">
                                 {product.oldPrice.toLocaleString()} DA
                               </p>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <p className="font-medium text-gray-600">{product.costPrice.toLocaleString()} DA</p>
                         </TableCell>
                         <TableCell>
                           <p className={`font-medium ${product.profitPerUnit && product.profitPerUnit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {product.profitPerUnit ? product.profitPerUnit.toLocaleString() : (product.price - product.costPrice).toLocaleString()} DA
                           </p>
                         </TableCell>
                                                 <TableCell>
                           <div className="flex items-center space-x-2">
                             <span className={`font-medium ${
                               (product.totalStock || product.stock) === 0 
                                 ? 'text-red-600' 
                                 : (product.totalStock || product.stock) <= 5 
                                 ? 'text-orange-600' 
                                 : 'text-green-600'
                             }`}>
                               {product.totalStock || product.stock}
                             </span>
                             {(product.totalStock || product.stock) <= 5 && (product.totalStock || product.stock) > 0 && (
                               <Badge variant="destructive" className="text-xs">Low</Badge>
                             )}
                             {(product.totalStock || product.stock) === 0 && (
                               <Badge variant="destructive" className="text-xs">Out</Badge>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <p className={`font-medium ${product.totalProfit && product.totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {product.totalProfit ? product.totalProfit.toLocaleString() : 
                               ((product.price - product.costPrice) * (product.totalStock || product.stock)).toLocaleString()} DA
                           </p>
                         </TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/admin/products/${product.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
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
    </AdminLayout>
  )
}
