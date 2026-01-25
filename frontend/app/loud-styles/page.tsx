'use client'

import { Preloader } from '@/components/preloader'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
// Tree-shakeable framer-motion imports - only import what we need
// Tree-shakeable framer-motion import - only import motion, not entire library
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  Heart,
  Star,
  Sparkles,
  Truck,
  Shield,
  Headphones,
  CreditCard
} from 'lucide-react'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'
import { LoudStylesNavbar } from '@/components/loud-styles-navbar'
import { CriticalCSS } from '@/components/performance/critical-css'

// Lazy load non-critical components for code splitting
const CategoriesSection = dynamic(() => import('./sections/categories-section'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false
})

const FeaturedProductsSection = dynamic(() => import('./sections/featured-products-section'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  ),
  ssr: false
})

interface Product {
  id: string
  name: string
  nameAr?: string
  description?: string
  price: number
  oldPrice?: number
  image: string
  slug: string
  rating?: number
  isOnSale?: boolean
  stock: number
  sizes: any[]
  category: {
    id: string
    name: string
    nameAr?: string
    slug: string
  } | string
  brand: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  nameAr?: string
  slug: string
  image?: string
  productCount: number
}

export default function LoudStylesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [djabadourProducts, setDjabadourProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const addItem = useCartStore((state) => state.addItem)
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()
  const { isRTL } = useLocaleStore()

  // Features for LOUD STYLES
  const features = [
    {
      icon: Truck,
      title: isRTL ? 'شحن مع ياليدين' : 'Shipping with Yalidine',
      description: isRTL ? 'شحن موثوق مع ياليدين' : 'Reliable shipping with Yalidine'
    },
    {
      icon: Shield,
      title: isRTL ? 'جودة مضمونة' : 'Quality Guaranteed',
      description: isRTL ? 'أقمشة فاخرة وخياطة متقنة' : 'Premium fabrics and expert craftsmanship'
    },
    {
      icon: Headphones,
      title: isRTL ? 'دعم شخصي' : 'Personal Support',
      description: isRTL ? 'استشارة مجانية لاختيار المقاس المناسب' : 'Free consultation for perfect fit'
    },
    {
      icon: CreditCard,
      title: isRTL ? 'دفع آمن' : 'Secure Payment',
      description: isRTL ? 'دفع عند الاستلام' : 'Cash on delivery'
    }
  ]

  // Fetch LOUD STYLES data - Optimized with parallel fetching and limited products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch products, djabadour el hemma, and categories in parallel for faster loading
        const [productsResponse, djabadourResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products?brand=loud-styles&limit=4'),
          fetch('/api/products/djabadour-el-hemma?brand=loud-styles'),
          fetch('/api/categories?brand=loud-styles')
        ])

        // Process products
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products')
        }
        const productsData = await productsResponse.json()
        const products = Array.isArray(productsData) ? productsData : (productsData.products || [])

        const featured = products.slice(0, 4).map((product: any) => ({
          ...product,
          sizes: product.sizes || [],
          rating: product.rating || 4.5,
          isOnSale: product.oldPrice && product.oldPrice > product.price,
          isLaunch: product.isLaunch || false,
          isLaunchActive: product.isLaunchActive || false,
          launchAt: product.launchAt || undefined,
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
        }))
        setFeaturedProducts(featured)

        // Process djabadour el hemma products
        if (djabadourResponse.ok) {
          const djabadourData = await djabadourResponse.json()
          const djabadourProductsArray = djabadourData.products || []
          const djabadour = djabadourProductsArray.map((product: any) => ({
            ...product,
            sizes: product.sizes || [],
            rating: product.rating || 4.5,
            isOnSale: product.oldPrice && product.oldPrice > product.price,
            isLaunch: product.isLaunch || false,
            isLaunchActive: product.isLaunchActive || false,
            launchAt: product.launchAt || undefined,
            slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
          }))
          setDjabadourProducts(djabadour)
        }

        // Process categories
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories')
        }
        const categoriesData = await categoriesResponse.json()
        const categories = categoriesData.categories || []

        const categoriesWithCount = categories.map((category: any) => ({
          ...category,
          productCount: category.productCount || 0,
          slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
        }))
        setCategories(categoriesWithCount)

      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching data:', err)
        }
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <Preloader />

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: isRTL ? product.nameAr || product.name : product.name,
      price: product.price,
      image: product.image
    })
  }

  const getSizeStrings = (sizes: any[]) => {
    return ['M', 'L', 'XL', 'XXL'];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-100 via-cream-50 to-warm-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Critical CSS for above-the-fold */}
      <CriticalCSS />

      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <LoudStylesNavbar />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video - Lazy Loaded - Full Screen */}
        {/* Hero Static Background */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/Djawhara Green2.webp"
            alt="LOUD STYLES Hero"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Hero Content - On Top of Video - Fixed dimensions to prevent CLS */}
        <div
          className={`relative z-20 text-center text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isRTL ? 'text-right' : 'text-left'}`}
          style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[120%]"
            style={{
              minHeight: '2.5em'
            }}
          >
            {isRTL ? 'أناقة الأزياء التقليدية الجزائرية' : 'Elegant Algerian Traditional Fashion'}
          </h1>
          <p
            className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-200 font-normal leading-[150%] max-w-3xl mx-auto"
            style={{ minHeight: '1.5em' }}
          >
            {isRTL
              ? 'اكتشفي مجموعتنا الفاخرة من الأزياء التقليدية الجزائرية المصممة خصيصاً للمرأة العصرية'
              : 'Discover our exquisite collection of traditional Algerian fashion designed for the modern woman'
            }
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ minHeight: '60px' }}
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 transition-all duration-300 font-semibold hover:scale-105 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#bfa36a', borderColor: '#bfa36a' }}
              asChild
            >
              <Link href="/loud-styles/products">
                {isRTL ? 'تسوقي الآن' : 'Shop Now'}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 transition-all duration-300 font-semibold hover:scale-105 border-white text-black hover:bg-white hover:text-gray-900"
              asChild
            >
              <Link href="/loud-styles/categories">
                {isRTL ? 'استكشفي المجموعات' : 'Explore Collections'}
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator - Simplified for performance */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-70">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section - Fixed grid to prevent CLS */}
      <section className="py-20 bg-gradient-to-br from-cream-100 via-warm-50 to-cream-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center elegant-hover"
                style={{
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start'
                }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg flex-shrink-0" style={{ backgroundColor: '#bfa36a' }}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white" style={{ minHeight: '1.5em' }}>{feature.title}</h3>
                <p className="text-gray-600 dark:text-300" style={{ minHeight: '1.2em' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section - Lazy Loaded */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        <div className="container mx-auto px-4" style={{ minHeight: '400px' }}>
          <CategoriesSection categories={categories} loading={loading} error={error} />
        </div>
      </section>

      {/* Djabadour El Hemma Section - Single Row */}
      {djabadourProducts.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-warm-100 via-cream-50 to-warm-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className={`text-center mb-12 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                {isRTL ? 'جبادور الحمة' : 'Djabadour El Hemma'}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {isRTL
                  ? 'أحدث الإضافات من مجموعة الجبادور'
                  : 'Latest additions from our Djabadour collection'
                }
              </p>
            </motion.div>

            {/* Horizontal Scrollable Row */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-6 min-w-max" style={{ width: 'max-content' }}>
                {djabadourProducts.map((product, index) => {
                  const categorySlug = typeof product.category === 'string' 
                    ? product.category.toLowerCase() 
                    : (product.category as { slug?: string })?.slug?.toLowerCase() || '';
                  const isAccessoires = categorySlug.includes('accessoire') || categorySlug.includes('accessories');
                  const sizeStrings = isAccessoires ? [] : ['M', 'L', 'XL', 'XXL'];

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="flex-shrink-0 w-64"
                    >
                      <Link href={`/loud-styles/products/${product.slug}?brand=loud-styles`} className="block h-full">
                        <Card className={`group cursor-pointer overflow-hidden relative h-full flex flex-col transition-all duration-500 ${
                          product.isLaunch && product.isLaunchActive
                            ? 'border-2 border-[#bfa36a] bg-gradient-to-br from-[#bfa36a]/10 via-[#bfa36a]/5 to-beige-200 dark:from-gray-800 dark:to-gray-900 shadow-xl hover:shadow-2xl ring-2 ring-[#bfa36a]/20'
                            : 'border-0 bg-gradient-to-br from-beige-100 via-beige-200 to-beige-300 dark:from-gray-800 dark:to-gray-900'
                        }`}>
                          <div className="relative h-80 overflow-hidden flex-shrink-0">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.4 }}
                              className="relative h-full w-full"
                            >
                              <Image
                                src={product.image || '/placeholder.svg'}
                                alt={isRTL ? product.nameAr || product.name : product.name}
                                fill
                                className="object-cover transition-transform duration-500"
                                sizes="256px"
                              />
                            </motion.div>
                            {product.isOnSale && (
                              <Badge className={`absolute top-4 bg-red-500 hover:bg-red-600 ${isRTL ? 'right-4' : 'left-4'} shadow-lg z-10`}>
                                {isRTL ? 'تخفيض' : 'Sale'}
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-6 flex-1 flex flex-col text-center">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                              {isRTL ? product.nameAr || product.name : product.name}
                            </h3>

                            <div className="flex items-center justify-center gap-2 mb-4">
                              {product.oldPrice && product.oldPrice > product.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {product.oldPrice?.toLocaleString()} DA
                                </span>
                              )}
                              <span className="text-xl font-bold text-primary">
                                {product.price.toLocaleString()} DA
                              </span>
                            </div>

                            {sizeStrings.length > 0 && (
                              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                                {sizeStrings.slice(0, 3).map((size, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                                  >
                                    {size}
                                  </span>
                                ))}
                                {sizeStrings.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{sizeStrings.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-center gap-2 mt-auto">
                              <Button
                                size="sm"
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleAddToCart(product)
                                }}
                                disabled={product.isLaunch && product.isLaunchActive}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                {isRTL ? 'أضف للسلة' : 'Add to Cart'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-10 h-10 p-0"
                                onClick={(e) => {
                                  e.preventDefault()
                                  const isCurrentlyWishlisted = isInWishlist(product.id)
                                  if (isCurrentlyWishlisted) {
                                    removeFromWishlist(product.id)
                                  } else {
                                    addToWishlist({
                                      id: product.id,
                                      name: product.name,
                                      nameAr: product.nameAr,
                                      price: product.price,
                                      oldPrice: product.oldPrice,
                                      image: product.image,
                                      rating: product.rating,
                                      isOnSale: product.isOnSale,
                                      stock: product.stock,
                                      slug: product.slug
                                    })
                                  }
                                }}
                              >
                                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section - Lazy Loaded */}
      <section className="py-20 bg-gradient-to-br from-cream-100 via-warm-50 to-cream-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
        <div className="container mx-auto px-4" style={{ minHeight: '600px' }}>
          <FeaturedProductsSection products={featuredProducts} loading={loading} error={error} />
        </div>
      </section>
    </div>
  )
}
