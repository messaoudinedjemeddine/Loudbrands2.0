'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  ArrowLeft,
  Save,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useLocaleStore } from '@/lib/locale-store'

const availableSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  costPrice?: number;
  oldPrice?: number;
  category: string;
  reference?: string;
  stock: number;
  isOnSale: boolean;
  isActive: boolean;
  isLaunch?: boolean;
  launchAt?: string;
  images?: Array<{ url: string; alt?: string }>;
  slug?: string;
  sizes: Array<{ size: string; stock: number }>;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
}

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  // Unwrap params for Next.js 15 compatibility
  const unwrappedParams = use(params)
  const { t } = useLocaleStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [inventoryEnabled, setInventoryEnabled] = useState(false)
  const [productData, setProductData] = useState<Product>({
    id: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    costPrice: 0,
    oldPrice: 0,
    category: '',
    reference: '',
    stock: 0,
    isOnSale: false,
    isActive: true,
    isLaunch: false,
    launchAt: '',
    images: [],
    sizes: []
  })

  // Derive isAccessories from the selected category name
  const selectedCategory = categories.find(c => c.name === productData.category)
  const isAccessories = selectedCategory?.slug?.toLowerCase().includes('accessoire') || selectedCategory?.slug?.toLowerCase().includes('accessories')

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.admin.getCategories() as Category[]
      setCategories(response)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    }
  }, [])

  const fetchProduct = useCallback(async () => {
    try {
      const data = await api.admin.getProduct(unwrappedParams.id) as any
      // Transform the API response to match our Product interface
      const transformedData: Product = {
        id: data.id,
        name: data.name,
        nameAr: data.nameAr || '',
        description: data.description || '',
        descriptionAr: data.descriptionAr || '',
        price: data.price,
        costPrice: data.costPrice || 0,
        oldPrice: data.oldPrice || 0,
        category: data.category?.name || data.category || '',
        reference: data.reference || '',
        stock: data.stock,
        isOnSale: data.isOnSale || false,
        isActive: data.isActive !== false,
        isLaunch: data.isLaunch || false,
        launchAt: data.launchAt ? new Date(data.launchAt).toISOString().slice(0, 16) : '',
        images: data.images?.map((img: any) => ({ 
          url: img.url, 
          alt: img.alt || '' 
        })) || [],
        slug: data.slug || '',
        sizes: data.sizes?.map((s: any) => ({ size: s.size, stock: s.stock })) || []
      }
      setProductData(transformedData)
    } catch (error) {
      console.error('Failed to fetch product:', error)
      toast.error('Failed to load product')
    }
  }, [unwrappedParams.id])

  useEffect(() => {
    setMounted(true)
    // Load inventory toggle state from localStorage
    const savedState = localStorage.getItem('inventory-enabled')
    if (savedState !== null) {
      setInventoryEnabled(savedState === 'true')
    } else {
      setInventoryEnabled(false)
    }
    fetchCategories()
    fetchProduct()
  }, [fetchCategories, fetchProduct])

  if (!mounted) return null

  const handleInputChange = (field: string, value: any) => {
    setProductData(prev => ({ ...prev, [field]: value }))
  }

  const handleImagesChange = (images: Array<{ url: string; alt?: string }>) => {
    setProductData(prev => ({ ...prev, images }))
  }

  const handleAddSize = (size: string) => {
    if (!productData.sizes.find(s => s.size === size)) {
      setProductData(prev => ({
        ...prev,
        sizes: [...prev.sizes, { size, stock: 0 }]
      }))
    }
  }

  const handleRemoveSize = (size: string) => {
    setProductData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s.size !== size)
    }))
  }

  const handleSizeStockChange = (size: string, stock: number) => {
    setProductData(prev => ({
      ...prev,
      sizes: prev.sizes.map(s => s.size === size ? { ...s, stock } : s)
    }))
  }

  // Calculate sum of all size stocks
  const totalSizeStock = productData.sizes.reduce((sum, size) => sum + (size.stock || 0), 0)
  
  // Check if total stock matches sum of size stocks (only for non-accessories)
  const stockMismatch = !isAccessories && productData.sizes.length > 0 && productData.stock !== totalSizeStock

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate stock match before submitting
    if (stockMismatch) {
      toast.error(`Total stock (${productData.stock}) does not match the sum of size quantities (${totalSizeStock}). Please adjust the values.`)
      return
    }
    
    setIsLoading(true)

    try {
      // Generate slug from name if not provided
      const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      await api.admin.updateProduct(unwrappedParams.id, {
        name: productData.name,
        nameAr: productData.nameAr,
        description: productData.description,
        descriptionAr: productData.descriptionAr,
        price: productData.price,
        costPrice: productData.costPrice,
        oldPrice: productData.oldPrice,
        category: productData.category,
        reference: productData.reference,
        stock: productData.stock,
        isOnSale: productData.isOnSale,
        isActive: productData.isActive,
        isLaunch: productData.isLaunch,
        launchAt: productData.launchAt ? new Date(productData.launchAt).toISOString() : undefined,
        slug: slug,
        images: productData.images,
        sizes: productData.sizes
      })

      toast.success('Product updated successfully!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error('Failed to update product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Edit Product</h1>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  inventoryEnabled 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  Inventaire {inventoryEnabled ? 'ON' : 'OFF'}
                </div>
              </div>
              <p className="text-muted-foreground">
                Update product information and settings
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${unwrappedParams.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Product
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={productData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">Product Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    value={productData.nameAr || ''}
                    onChange={(e) => handleInputChange('nameAr', e.target.value)}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                  <Textarea
                    id="descriptionAr"
                    value={productData.descriptionAr || ''}
                    onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                    dir="rtl"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Buying Price (DA) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={productData.costPrice || ''}
                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">The price you paid for this product</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price (DA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={productData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">The price customers will pay</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oldPrice">Old Price (DA)</Label>
                  <Input
                    id="oldPrice"
                    type="number"
                    value={productData.oldPrice || ''}
                    onChange={(e) => handleInputChange('oldPrice', parseFloat(e.target.value) || undefined)}
                  />
                  <p className="text-xs text-muted-foreground">Previous selling price (for discounts)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={productData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Code</Label>
                  <Input
                    id="reference"
                    value={productData.reference || ''}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={productData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    className={stockMismatch ? 'border-red-500' : ''}
                    disabled={!inventoryEnabled}
                  />
                  {!inventoryEnabled && (
                    <p className="text-xs text-muted-foreground">
                      Activer l'inventaire pour modifier le stock
                    </p>
                  )}
                  {stockMismatch && inventoryEnabled && (
                    <p className="text-sm text-red-500 font-medium">
                      ⚠️ Total stock ({productData.stock}) does not match sum of sizes ({totalSizeStock})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isOnSale"
                    checked={productData.isOnSale}
                    onCheckedChange={(checked) => handleInputChange('isOnSale', checked)}
                  />
                  <Label htmlFor="isOnSale">On Sale</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={productData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isLaunch"
                    checked={productData.isLaunch}
                    onCheckedChange={(checked) => handleInputChange('isLaunch', checked)}
                  />
                  <Label htmlFor="isLaunch">{t?.product?.launch?.launchMode || 'Launch Mode'}</Label>
                </div>
              </div>

              {productData.isLaunch && (
                <div className="space-y-2">
                  <Label htmlFor="launchAt">{t?.product?.launch?.launchDate || 'Launch Date & Time'}</Label>
                  <Input
                    id="launchAt"
                    type="datetime-local"
                    value={productData.launchAt || ''}
                    onChange={(e) => handleInputChange('launchAt', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Set when this product will become available for ordering
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sizes - Hide for accessories */}
          {!isAccessories && (
            <Card>
              <CardHeader>
                <CardTitle>Available Sizes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!inventoryEnabled && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ L'inventaire est désactivé. Activez-le pour modifier les tailles et quantités.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {availableSizes.map((size) => {
                    const isSelected = productData.sizes.find(s => s.size === size)
                    return (
                      <Button
                        key={size}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="h-12"
                        onClick={() => isSelected ? handleRemoveSize(size) : handleAddSize(size)}
                        disabled={!inventoryEnabled}
                      >
                        {size}
                      </Button>
                    )
                  })}
                </div>

                {productData.sizes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Stock per Size</h4>
                      <div className="text-sm">
                        <span className={stockMismatch ? 'text-red-500 font-semibold' : 'text-muted-foreground'}>
                          Total: {totalSizeStock}
                        </span>
                        {stockMismatch && (
                          <span className="ml-2 text-red-500">(Expected: {productData.stock})</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {productData.sizes.map((sizeData) => (
                        <div key={sizeData.size} className="flex items-center space-x-2">
                          <Label className="w-8">{sizeData.size}:</Label>
                          <Input
                            type="number"
                            value={sizeData.stock}
                            onChange={(e) => handleSizeStockChange(sizeData.size, parseInt(e.target.value) || 0)}
                            min="0"
                            className="flex-1"
                            disabled={!inventoryEnabled}
                          />
                        </div>
                      ))}
                    </div>
                    {stockMismatch && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">
                          <strong>Warning:</strong> The total stock must equal the sum of all size quantities. 
                          Please adjust either the total stock or individual size quantities to match.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={productData.images || []}
                onImagesChange={handleImagesChange}
                multiple={true}
                maxImages={10}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => router.push('/admin/products')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || stockMismatch} 
              className="elegant-gradient"
              title={stockMismatch ? 'Total stock must match sum of size quantities' : ''}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}