'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  nameAr: string
  price: number
  oldPrice?: number
  stock: number
  category: {
    id: string
    name: string
    slug: string
  }
  reference: string
  isOnSale: boolean
  isActive: boolean
  isLaunch: boolean
  launchAt?: string
  image: string
  createdAt: string
  sales?: number // Optional since it's not in the backend response
}

// Helper function to get category name
function getCategoryName(category: any): string {
  if (category && typeof category === 'object' && 'name' in category) {
    return category.name
  }
  return category || ''
}

export default function AdminProductsPage() {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products...')
      
      // Check authentication first
      const authData = localStorage.getItem('auth-storage')
      console.log('Auth data:', authData)
      
      if (!authData) {
        toast.error('Not authenticated. Please log in.')
        return
      }
      
      const response = await api.admin.getProducts() as { products: Product[] }
      console.log('Products response:', response)
      setProducts(response.products || [])
      console.log('Products set:', response.products?.length || 0)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Authentication failed. Please log in as admin.')
        } else {
          toast.error(`Failed to load products: ${error.message}`)
        }
      } else {
        toast.error('Failed to load products')
      }
    } finally {
      setLoading(false)
    }
  }

  // Make fetchProducts available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).refreshProducts = fetchProducts
  }

  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.reference.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => getCategoryName(product.category) === categoryFilter)
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.stock <= 5)
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(product => product.stock === 0)
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(product => product.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(product => !product.isActive)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter])

  if (!mounted) return null

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.admin.deleteProduct(productId)
      setProducts(prev => prev.filter(p => p.id !== productId))
      toast.success('Product deleted successfully')
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    }
  }

  const handleToggleStatus = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return
      
      await api.admin.updateProduct(productId, { isActive: !product.isActive })
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      ))
      toast.success('Product status updated')
    } catch (error) {
      console.error('Failed to update product status:', error)
      toast.error('Failed to update product status')
    }
  }

  const handleToggleLaunch = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return
      
      const newLaunchState = !product.isLaunch
      const launchData = newLaunchState 
        ? { 
            isLaunch: true, 
            launchAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default to 24 hours from now
          }
        : { 
            isLaunch: false, 
            launchAt: null 
          }
      
      await api.admin.updateProduct(productId, launchData)
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, isLaunch: launchData.isLaunch, launchAt: launchData.launchAt || undefined } : p
      ))
      toast.success(`Produit ${newLaunchState ? 'mode lancement activé' : 'mode lancement désactivé'}`)
    } catch (error) {
      console.error('Failed to update product launch status:', error)
      toast.error('Failed to update product launch status')
    }
  }

  const categories = Array.from(new Set(products.map(product => getCategoryName(product.category))))

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Produits</h1>
              <p className="text-muted-foreground">
                Gérez votre catalogue de produits et inventaire
              </p>
            </div>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement des produits...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Produits</h1>
            <p className="text-muted-foreground">
              Gérez votre catalogue de produits et inventaire
            </p>
          </div>
          <Button className="elegant-gradient" asChild>
            <Link href="/admin/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Produit
            </Link>
          </Button>
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
                <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% par rapport au mois dernier
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
                <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.stock <= 5).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Produits avec stock ≤ 5
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
                <CardTitle className="text-sm font-medium">En Promotion</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.isOnSale).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Produits avec remises
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
                <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.sales || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unités vendues ce mois
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les Catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les Catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut du Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout le Stock</SelectItem>
                  <SelectItem value="low">Stock Faible</SelectItem>
                  <SelectItem value="out">Rupture de Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut du Produit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Produits ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{product.name}</h3>
                        {product.isOnSale && (
                          <Badge variant="destructive" className="text-xs">Promotion</Badge>
                        )}
                        {product.isLaunch && (
                          <Badge variant="default" className="text-xs bg-blue-500">Lancement</Badge>
                        )}
                        {!product.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactif</Badge>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600">Stock Faible</Badge>
                        )}
                        {product.stock === 0 && (
                          <Badge variant="destructive" className="text-xs">Rupture de Stock</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.reference} • {getCategoryName(product.category)}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm font-medium">
                          {product.price.toLocaleString()} DA
                        </span>
                        {product.oldPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.oldPrice.toLocaleString()} DA
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Stock: {product.stock}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Ventes: {product.sales || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {product.isLaunch && product.launchAt && (
                      <div className="text-xs text-muted-foreground mr-2">
                        Date de Lancement: {new Date(product.launchAt).toLocaleString()}
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(product.id)}
                      className={product.isActive ? 'text-orange-600' : 'text-green-600'}
                    >
                      {product.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleLaunch(product.id)}
                      className={product.isLaunch ? 'text-blue-600' : 'text-gray-600'}
                    >
                      {product.isLaunch ? 'Désactiver Lancement' : 'Activer Lancement'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez d'ajuster vos filtres ou ajoutez un nouveau produit
                  </p>
                  <Button asChild>
                    <Link href="/admin/products/new">Ajouter Produit</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}