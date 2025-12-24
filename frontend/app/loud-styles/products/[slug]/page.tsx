'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoudStylesNavbar } from '@/components/loud-styles-navbar'
import Link from 'next/link'
import LuxuryProductDetail from './luxury-product-detail'
import { useLocaleStore } from '@/lib/locale-store'

interface Product {
  id: string
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  price: number
  oldPrice?: number
  image: string
  images: string[]
  slug: string
  rating?: number
  isOnSale?: boolean
  stock: number
  sizes: Array<{ id: string; size: string; stock: number }>
  category: {
    id: string
    name: string
    nameAr?: string
    slug: string
  }
  brand: {
    id: string
    name: string
    slug: string
  }
}

export default function LoudStylesProductPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const { isRTL } = useLocaleStore()

  // Fetch LOUD STYLES product
  useEffect(() => {
    if (!slug) return

    async function fetchProduct() {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/slug/${slug}?brand=loud-styles`)
        
        if (!res.ok) {
          throw new Error('Failed to fetch product')
        }
        
        const data = await res.json()
        setProduct(data.product)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-100 via-cream-50 to-warm-200" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="fixed top-0 left-0 right-0 z-50">
          <LoudStylesNavbar />
        </div>
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isRTL ? 'جاري تحميل المنتج...' : 'Loading product...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-100 via-cream-50 to-warm-200" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="fixed top-0 left-0 right-0 z-50">
          <LoudStylesNavbar />
        </div>
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {isRTL ? 'المنتج غير موجود' : 'Product Not Found'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isRTL 
                ? 'عذراً، المنتج الذي تبحث عنه غير موجود أو تم إزالته.'
                : 'Sorry, the product you are looking for does not exist or has been removed.'
              }
            </p>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/loud-styles/products">
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {isRTL ? 'العودة للمنتجات' : 'Back to Products'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Transform product data to match luxury component interface
  const luxuryProduct = {
    ...product,
    reference: product.id, // Use ID as reference if no reference field
    isLaunch: false, // Default value
    reviewCount: 0 // Default value
  }

  return <LuxuryProductDetail product={luxuryProduct} />
}
