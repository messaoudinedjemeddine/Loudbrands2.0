'use client'

import { Preloader } from '@/components/preloader'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Tree-shakeable: only import what we need from framer-motion
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Sparkles,
  TrendingUp,
  X,
  ArrowLeft,
  ZoomIn,
  MessageCircle
} from 'lucide-react'
import Image from 'next/image'
import { OptimizedImage } from '@/components/performance/optimized-image'
import { useCartStore, useWishlistStore, useUIStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'
import { toast } from 'sonner'
import { LoudStylesNavbar } from '@/components/loud-styles-navbar'
// Lazy load non-critical components
const LaunchCountdown = dynamic(() => import('@/components/launch-countdown').then(mod => ({ default: mod.LaunchCountdown })), {
  ssr: false
})

declare global {
  interface Window {
    fbq: any;
    gtag: any;
  }
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  oldPrice?: number;
  category: {
    id: string;
    name: string;
    nameAr?: string;
    slug: string;
  };
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  isLaunch?: boolean;
  stock: number;
  reference?: string;
  images: string[];
  sizes: Array<{ id: string; size: string; stock: number }>;
  slug?: string;
  launchAt?: string;
  isLaunchActive?: boolean;
}

interface LuxuryProductDetailProps {
  product: Product
}

export default function LuxuryProductDetail({ product }: LuxuryProductDetailProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)
  const [timerCompleted, setTimerCompleted] = useState(false)
  const [showAccessoryPopup, setShowAccessoryPopup] = useState(false)
  const [accessoryPopupDismissed, setAccessoryPopupDismissed] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [relatedAccessories, setRelatedAccessories] = useState<Product[]>([])
  const [loadingAccessories, setLoadingAccessories] = useState(false)
  const isOrderable = !product?.isLaunchActive || timerCompleted

  const addItem = useCartStore((state) => state.addItem)
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()
  const { isRTL } = useLocaleStore()
  const { setCartOpen } = useUIStore()

  const [isMobile, setIsMobile] = useState(false)

  // Check if product is in accessoires category
  const categorySlug = product?.category?.slug?.toLowerCase() || '';
  const isAccessoires = categorySlug.includes('accessoire') || categorySlug.includes('accessories');

  // All hooks must be called before any conditional returns
  useEffect(() => {
    setMounted(true)

    // Check if mobile
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
    
    return () => {} // Return empty cleanup function if window is undefined
  }, [product])

  useEffect(() => {
    // Auto-select first size if available (only for non-accessoires, skip 'S')
    if (!isAccessoires && product?.sizes && product.sizes.length > 0 && !selectedSize) {
      const firstSize = product.sizes.find(s => {
        const size = typeof s === 'string' ? s : s.size;
        return size !== 'S';
      });
      if (firstSize) {
        setSelectedSize(typeof firstSize === 'string' ? firstSize : firstSize.size)
      }
    }
  }, [product?.sizes, selectedSize, isAccessoires])

  // Fetch related accessories for yennayer-dress
  useEffect(() => {
    const isYennayerDress = product?.slug === 'yennayer-dress'
    
    if (isYennayerDress && mounted) {
      const fetchAccessories = async () => {
        setLoadingAccessories(true)
        const accessorySlugs = ['pack-yennayer', 'accessoires-yennayer', 'djbine-yennayer']
        
        try {
          const accessoriesPromises = accessorySlugs.map(async (slug) => {
            try {
              const res = await fetch(`/api/products/slug/${slug}?brand=loud-styles`)
              if (res.ok) {
                const data = await res.json()
                return data.product
              }
              return null
            } catch (error) {
              console.error(`Error fetching ${slug}:`, error)
              return null
            }
          })
          
          const accessories = (await Promise.all(accessoriesPromises)).filter(Boolean)
          setRelatedAccessories(accessories)
          
          // Show popup after 3 seconds if accessories are loaded and not dismissed in this session
          if (accessories.length > 0 && !accessoryPopupDismissed) {
            const timer = setTimeout(() => {
              setShowAccessoryPopup(true)
            }, 3000)
            
            return () => clearTimeout(timer)
          }
        } catch (error) {
          console.error('Error fetching accessories:', error)
        } finally {
          setLoadingAccessories(false)
        }
      }
      
      fetchAccessories()
    }
  }, [product?.slug, mounted])

  // Handle adding accessory to cart
  const handleAddAccessoryToCart = (accessory: Product) => {
    const categorySlug = accessory?.category?.slug?.toLowerCase() || '';
    const isAccessoryAccessoires = categorySlug.includes('accessoire') || categorySlug.includes('accessories');
    
    addItem({
      id: accessory.id,
      name: isRTL ? accessory.nameAr || accessory.name : accessory.name,
      price: accessory.price,
      image: accessory.images[0],
      size: isAccessoryAccessoires ? undefined : undefined,
      sizeId: undefined,
      quantity: 1
    })

    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'DZD',
        value: accessory.price,
        items: [{
          item_id: accessory.id,
          item_name: accessory.name,
          price: accessory.price
        }]
      })
    }

    setCartOpen(true)
    toast.success(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart', {
      className: 'bg-green-500 text-white border-green-600',
      icon: <Check className="w-4 h-4 text-white" />
    })
  }



  // Safety check for product - AFTER all hooks but before conditional return
  if (!product || !product.images || product.images.length === 0) {
    if (!mounted) return null
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warm-50 to-cream-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Product data is missing or invalid</p>
        </div>
      </div>
    );
  }

  // inside component
  if (!mounted) {
    return <Preloader />
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const handleAddToCart = () => {
    // Only require size if product has sizes and is not accessoires
    if (!isAccessoires && !selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size')
      return
    }

    // Find the correct size object from the product.sizes array based on the selected string
    const selectedSizeObj = getSelectedSizeObject(selectedSize);

    addItem({
      id: product.id,
      name: isRTL ? product.nameAr || product.name : product.name,
      price: product.price,
      image: product.images[0],
      size: isAccessoires ? undefined : (selectedSize || undefined),
      sizeId: isAccessoires ? undefined : selectedSizeObj?.id,
      quantity: quantity
    })

    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'DZD',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          item_variant: selectedSize
        }]
      })
    }

    setCartOpen(true)

    toast.success(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart', {
      className: 'bg-green-500 text-white border-green-600',
      icon: <Check className="w-4 h-4 text-white" />
    })
  }

  const handleWishlistToggle = () => {
    const isCurrentlyWishlisted = isInWishlist(product.id)

    if (isCurrentlyWishlisted) {
      removeFromWishlist(product.id)
      toast.success(isRTL ? 'تم الإزالة من المفضلة' : 'Removed from wishlist')
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        price: product.price,
        oldPrice: product.oldPrice,
        image: product.images[0],
        rating: product.rating,
        isOnSale: product.isOnSale,
        stock: product.stock,
        slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
      })
      toast.success(isRTL ? 'تمت الإضافة إلى المفضلة' : 'Added to wishlist')
    }
  }

  const getSizeStrings = (sizes: any[]) => {
    if (!Array.isArray(sizes)) return []
    return sizes.map(size => typeof size === 'string' ? size : size.size)
  }

  const sizeStrings = getSizeStrings(product.sizes || [])

  // Size mapping for display
  const sizeMapping = {
    'M': '36-38',
    'L': '40',
    'XL': '42-44',
    'XXL': '46-48'
  }

  // Helper to find the correct size object from the displayed size
  const getSelectedSizeObject = (displaySize: string | null) => {
    if (!displaySize || !product.sizes) return undefined;

    // First try exact match
    let match = product.sizes.find(s => s.size === displaySize);
    if (match) return match;

    // Try finding by numeric map
    const numericMatch = product.sizes.find(s => {
      const num = parseInt(s.size);
      if (isNaN(num)) return false;

      if (displaySize === 'M' && (num === 36 || num === 38)) return true;
      if (displaySize === 'L' && num === 40) return true;
      if (displaySize === 'XL' && (num >= 42 && num <= 44)) return true;
      if (displaySize === 'XXL' && (num >= 46 && num <= 48)) return true;
      if (displaySize === 'XXXL' && (num >= 50 && num <= 52)) return true;

      return false;
    });

    return numericMatch;
  }

  const getDisplaySizes = () => {
    // Don't show sizes for accessoires
    if (isAccessoires) return [];
    // Filter out 'S' and return available sizes
    const availableSizes = product.sizes?.map(s => s.size) || [];
    return ['M', 'L', 'XL', 'XXL', 'XXXL'].filter(size => availableSizes.includes(size));
  }

  const displaySizes = getDisplaySizes();

  // Optimize animations for mobile - reduce complexity (moved before conditional returns)
  // Disable animations for first image to improve LCP
  const containerVariants = {
    hidden: { opacity: 1 }, // Start visible to prevent delay
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 0 }, // Start visible
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <React.Fragment>
      <LoudStylesNavbar />
      <div
        className="min-h-screen bg-gradient-to-br from-cream-50 via-warm-50 to-cream-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ minHeight: '100vh', width: '100%' }}
      >
        {/* Header with Back Button */}
        <motion.div
          className="sticky top-0 z-40 bg-background/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-border dark:border-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: mounted && isMobile ? 0.2 : 0.5 }}
          style={{ minHeight: '60px' }}
        >
          <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white h-8 sm:h-9 px-2 sm:px-3"
              >
                <ArrowLeft className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRTL ? 'rotate-180' : ''}`} />
                <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm">{isRTL ? 'العودة' : 'Back'}</span>
              </Button>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWishlistToggle}
                  className={`text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-white h-8 w-8 sm:h-9 sm:w-9 p-0 ${isInWishlist(product.id) ? 'text-red-500 dark:text-red-400' : ''
                    }`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ minHeight: '600px' }}
        >
          <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-12 max-w-7xl mx-auto items-start" style={{ minHeight: '500px' }}>
            {/* Image Gallery - Left Side */}
            <motion.div
              className="lg:order-1 flex-shrink-0 w-full"
              variants={itemVariants}
              style={{ minHeight: '400px' }}
            >
              <div className="relative w-full" style={{ minHeight: '400px' }}>
                {/* Main Image - Optimized for LCP - Render immediately without animation delay */}
                <div
                  className="relative aspect-square bg-background dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden border-2 border-transparent shadow-elegant dark:shadow-2xl w-full product-detail-image group transform-gpu"
                  style={{
                    minHeight: '400px',
                    width: '100%',
                    willChange: 'transform'
                  }}
                >
                  <Image
                    src={product.images[currentImageIndex] || '/placeholder.svg'}
                    alt={isRTL ? product.nameAr || product.name : product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={currentImageIndex === 0}
                    fetchPriority={currentImageIndex === 0 ? 'high' : 'auto'}
                    loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    quality={currentImageIndex === 0 ? 90 : 75}
                    unoptimized={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                    }}
                  />

                  {/* Zoom Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-background/90 dark:hover:bg-gray-800/90 h-8 w-8 sm:h-9 sm:w-9 p-0"
                    onClick={() => setShowImageModal(true)}
                  >
                    <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>

                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnails - Show all but limit visible area */}
                {product.images.length > 1 && (
                  <div className="mt-3 sm:mt-4 lg:mt-6">
                    <motion.div
                      className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide max-h-[80px] sm:max-h-none"
                      variants={itemVariants}
                    >
                      {product.images.map((image, index) => (
                        <motion.button
                          key={index}
                          className={`relative aspect-square w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${index === currentImageIndex
                            ? 'border-primary shadow-elegant scale-105'
                            : 'border-border hover:border-primary/50'
                            }`}
                          onClick={() => setCurrentImageIndex(index)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ willChange: 'transform' }}
                        >
                          <Image
                            src={image}
                            alt={`${isRTL ? product.nameAr || product.name : product.name} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                            loading="lazy"
                            sizes="(max-width: 640px) 40px, (max-width: 1024px) 56px, 80px"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder.svg'
                            }}
                          />
                        </motion.button>
                      ))}
                    </motion.div>
                    {product.images.length > 5 && isMobile && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {isRTL ? `عرض ${product.images.length} صورة` : `View ${product.images.length} images`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Details - Right Side */}
            <motion.div
              className="lg:order-2 space-y-4 sm:space-y-6 lg:space-y-8 min-w-0"
              variants={itemVariants}
            >
              {/* Product Header */}
              <div className="space-y-3 sm:space-y-4">
                {/* Badges */}
                <motion.div
                  className="flex flex-wrap gap-1.5 sm:gap-2"
                  variants={itemVariants}
                >
                  {product.isOnSale && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isRTL ? 'تخفيض' : 'Sale'}
                    </Badge>
                  )}
                  {product.isLaunch && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {isRTL ? 'قريباً' : 'Coming Soon'}
                    </Badge>
                  )}
                  {product.isLaunch && product.launchAt && (
                    <LaunchCountdown
                      launchAt={product.launchAt}
                      onComplete={() => setTimerCompleted(true)}
                      className="mt-2"
                    />
                  )}
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {isRTL ? 'مجموعة تقليدية' : 'Traditional Collection'}
                  </Badge>
                  {/* LOW STOCK BADGE */}
                  {(product.stock <= 5 || (selectedSize && product.sizes?.find(s => s.size === selectedSize)?.stock! <= 5)) && (
                    <Badge className="bg-amber-500 text-white border-0 animate-pulse">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {isRTL ? 'كمية محدودة جداً' : 'Low Stock'}
                    </Badge>
                  )}
                </motion.div>

                {/* Title */}
                <motion.h1
                  className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight"
                  variants={itemVariants}
                >
                  {isRTL ? product.nameAr || product.name : product.name}
                </motion.h1>

              </div>

              {/* Price */}
              <motion.div
                className="space-y-2"
                variants={itemVariants}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {product.price.toLocaleString()} DA
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-base sm:text-lg lg:text-xl text-muted-foreground line-through">
                        {product.oldPrice.toLocaleString()} DA
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 w-fit text-xs sm:text-sm">
                        {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                className="space-y-2 sm:space-y-3 lg:space-y-4"
                variants={itemVariants}
              >
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  {isRTL ? 'الوصف' : 'Description'}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {isRTL ? product.descriptionAr || product.description : product.description}
                </p>
              </motion.div>

              {/* Size Selection */}
              {isOrderable && displaySizes.length > 0 && (
                <motion.div
                  className="space-y-2 sm:space-y-3 lg:space-y-4"
                  variants={itemVariants}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {isRTL ? 'المقاس' : 'Size'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="text-primary hover:text-primary/80 text-xs sm:text-sm"
                    >
                      {isRTL ? 'دليل المقاسات' : 'Size Guide'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 lg:gap-3">
                    {displaySizes.filter(size => size !== 'S').map((size) => (
                      <motion.button
                        key={size}
                        className={`group relative px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-md sm:rounded-lg border-2 transition-all duration-300 font-medium text-sm sm:text-base ${selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground shadow-elegant'
                          : 'border-border hover:border-primary/50 bg-background hover:bg-muted/50'
                          }`}
                        onClick={() => setSelectedSize(size)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ willChange: 'transform' }}
                      >
                        {size}
                        {/* Enhanced Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm rounded-lg shadow-2xl border border-gray-700 pointer-events-none whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white">{size}</span>
                            <span className="text-gray-300">=</span>
                            <span className="font-mono text-yellow-400">
                              {sizeMapping[size as keyof typeof sizeMapping] || size}
                            </span>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Size Guide Modal */}
                  <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                          {isRTL ? 'دليل المقاسات' : 'Size Guide'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="p-4 sm:p-6">

                            {/* Size Selection Buttons */}
                            <div className="mb-6">
                              <p className="text-sm text-muted-foreground mb-3">
                                {isRTL ? 'المقاس المعروض.' : 'Size displayed.'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {displaySizes.filter(size => size !== 'S').map((size) => {
                                  const isSelected = selectedSize === size || (!selectedSize && size === displaySizes.find(s => s !== 'S'))
                                  return (
                                    <button
                                      key={size}
                                      onClick={() => setSelectedSize(size)}
                                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        isSelected
                                          ? 'bg-black text-white border-2 border-black'
                                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Dress Figure and Size Chart - Vertical Layout */}
                            <div className="flex flex-col gap-8 items-center">
                              {/* Body Figure with Temu measurements */}
                              <div className="relative flex flex-col items-center justify-center w-full">
                                <div className="relative w-full max-w-[264px] mx-auto flex justify-center">
                                  {/* Use Temu body image from public folder - image already has measurement lines */}
                                  {/* Image dimensions: 264x561 */}
                                  <div className="relative w-full">
                                    <img
                                      src="/temu-body-size.png"
                                      alt={isRTL ? 'رسم توضيحي للجسم' : 'Body measurement guide'}
                                      className="w-full h-auto object-contain"
                                    />
                                    {/* Overlay measurement numbers only - positioned on existing lines */}
                                    {/* Coordinates: Bust(85,181), Waist(85,228), Hips(85,288), Height(208,280) */}
                                    <svg
                                      viewBox="0 0 264 561"
                                      className="absolute inset-0 w-full h-full pointer-events-none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      preserveAspectRatio="xMidYMid meet"
                                    >
                                      {/* Bust Measurement Range - exact coordinates (85, 181) */}
                                      <circle cx="85" cy="181" r="18" fill="#d4af37" opacity="0.95" stroke="white" strokeWidth="2" />
                                      <text x="85" y="185" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                        {(() => {
                                          const currentSize = selectedSize || displaySizes.find(s => s !== 'S') || 'M'
                                          const sizeData = {
                                            'M': '86-94',
                                            'L': '95-101',
                                            'XL': '101-107',
                                            'XXL': '107-113',
                                            'XXXL': '113-119'
                                          }[currentSize] || '86-94'
                                          return sizeData
                                        })()}
                                      </text>
                                      
                                      {/* Waist Measurement Range - exact coordinates (85, 228) */}
                                      <circle cx="85" cy="228" r="18" fill="#d4af37" opacity="0.95" stroke="white" strokeWidth="2" />
                                      <text x="85" y="232" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                        {(() => {
                                          const currentSize = selectedSize || displaySizes.find(s => s !== 'S') || 'M'
                                          const sizeData = {
                                            'M': '66-74',
                                            'L': '75-81',
                                            'XL': '81-87',
                                            'XXL': '87-93',
                                            'XXXL': '93-99'
                                          }[currentSize] || '66-74'
                                          return sizeData
                                        })()}
                                      </text>
                                      
                                      {/* Hips Measurement Range - exact coordinates (85, 288) */}
                                      <circle cx="85" cy="288" r="18" fill="#d4af37" opacity="0.95" stroke="white" strokeWidth="2" />
                                      <text x="85" y="292" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                        {(() => {
                                          const currentSize = selectedSize || displaySizes.find(s => s !== 'S') || 'M'
                                          const sizeData = {
                                            'M': '91-99',
                                            'L': '100-106',
                                            'XL': '106-112',
                                            'XXL': '112-118',
                                            'XXXL': '118-124'
                                          }[currentSize] || '91-99'
                                          return sizeData
                                        })()}
                                      </text>
                                      
                                      {/* Height Measurement Range - exact coordinates (208, 280) */}
                                      <circle cx="208" cy="280" r="17" fill="#d4af37" opacity="0.95" stroke="white" strokeWidth="2" />
                                      <text x="208" y="284" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                        {(() => {
                                          const currentSize = selectedSize || displaySizes.find(s => s !== 'S') || 'M'
                                          const sizeData = {
                                            'M': '165-175',
                                            'L': '175-180',
                                            'XL': '175-180',
                                            'XXL': '180-185',
                                            'XXXL': '180-185'
                                          }[currentSize] || '165-175'
                                          return sizeData
                                        })()}
                                      </text>
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Size Chart Table - Below body image */}
                              <div className="w-full max-w-2xl mx-auto">
                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50 dark:bg-gray-800">
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                                          المقاس
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                                          الصدر
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                                          الخصر
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                                          الورك
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">
                                          الطول
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[
                                        { size: 'M', chest: '86-94', waist: '66-74', hips: '91-99', height: '165-175' }, // Combined S/M
                                        { size: 'L', chest: '95-101', waist: '75-81', hips: '100-106', height: '175-180' },
                                        { size: 'XL', chest: '101-107', waist: '81-87', hips: '106-112', height: '175-180' },
                                        { size: 'XXL', chest: '107-113', waist: '87-93', hips: '112-118', height: '180-185' },
                                        { size: 'XXXL', chest: '113-119', waist: '93-99', hips: '118-124', height: '180-185' }
                                      ].filter(item => displaySizes.includes(item.size) && item.size !== 'S').map((item, index) => {
                                        const isSelected = selectedSize === item.size || (!selectedSize && index === 0)
                                        return (
                                          <tr 
                                            key={item.size}
                                            className={`transition-colors ${
                                              isSelected 
                                                ? 'bg-[#d4af37]/20 border-l-4 border-[#d4af37]' 
                                                : index % 2 === 0 
                                                  ? 'bg-white dark:bg-gray-900' 
                                                  : 'bg-gray-50 dark:bg-gray-800'
                                            }`}
                                          >
                                            <td className={`px-3 py-2 text-right text-xs font-medium ${
                                              isSelected ? 'text-[#d4af37] font-bold' : 'text-foreground'
                                            }`}>
                                              {item.size}
                                            </td>
                                            <td className={`px-3 py-2 text-right text-xs ${
                                              isSelected ? 'text-[#d4af37] font-semibold' : 'text-muted-foreground'
                                            }`}>
                                              {item.chest}
                                            </td>
                                            <td className={`px-3 py-2 text-right text-xs ${
                                              isSelected ? 'text-[#d4af37] font-semibold' : 'text-muted-foreground'
                                            }`}>
                                              {item.waist}
                                            </td>
                                            <td className={`px-3 py-2 text-right text-xs ${
                                              isSelected ? 'text-[#d4af37] font-semibold' : 'text-muted-foreground'
                                            }`}>
                                              {item.hips}
                                            </td>
                                            <td className={`px-3 py-2 text-right text-xs ${
                                              isSelected ? 'text-[#d4af37] font-semibold' : 'text-muted-foreground'
                                            }`}>
                                              {item.height}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>

                        {/* Disclaimer */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-muted-foreground text-center" dir="rtl">
                            البيانات مقاسة يدوياً وقد يكون هناك اختلافات طفيفة.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              )}

              {/* Quantity */}
              {isOrderable && (
                <motion.div
                  className="space-y-2 sm:space-y-3 lg:space-y-4"
                  variants={itemVariants}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {isRTL ? 'الكمية' : 'Quantity'}
                  </h3>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <span className="text-base sm:text-lg font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              {isOrderable && (
                <motion.div
                  className="space-y-3 sm:space-y-4"
                  variants={itemVariants}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
                    <Button
                      size="lg"
                      className="h-11 sm:h-12 lg:h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-elegant hover:shadow-luxury transition-all duration-300 text-sm sm:text-base"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span>{isRTL ? 'أضف للسلة' : 'Add to Cart'}</span>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-11 sm:h-12 lg:h-14 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background font-semibold shadow-elegant transition-all duration-300 text-sm sm:text-base"
                      disabled={!isAccessoires && product.sizes && product.sizes.length > 0 && !selectedSize}
                      onClick={() => {
                        // Only require size if product has sizes and is not accessoires
                        if (!isAccessoires && product.sizes && product.sizes.length > 0 && !selectedSize) {
                          toast.error(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size')
                          return
                        }

                        // Add to cart first
                        const selectedSizeObj = getSelectedSizeObject(selectedSize);
                        addItem({
                          id: product.id,
                          name: isRTL ? product.nameAr || product.name : product.name,
                          price: product.price,
                          image: product.images[0],
                          size: isAccessoires ? undefined : (selectedSize || undefined),
                          sizeId: isAccessoires ? undefined : selectedSizeObj?.id
                        })

                        // Redirect to checkout
                        router.push('/checkout')
                      }}
                    >
                      <span>{isRTL ? 'اشتري الآن' : 'Buy Now'}</span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Service Highlights */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 pt-3 sm:pt-4 lg:pt-6 border-t border-border dark:border-gray-700"
                variants={itemVariants}
              >
                <div className="text-center space-y-2 p-4 rounded-lg bg-background/50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-center">
                    <Image
                      src="/logos/yalidine.png"
                      alt="Yalidine"
                      width={60}
                      height={60}
                      className="object-contain h-15 w-15"
                    />
                  </div>
                  <p className="text-xs font-medium text-foreground dark:text-gray-200">
                    {isRTL ? 'شحن مع ياليدين' : 'Shipping with Yalidine'}
                  </p>
                </div>
                <div className="text-center space-y-2 p-4 rounded-lg bg-background/50 dark:bg-gray-800/50">
                  <Shield className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-xs font-medium text-foreground dark:text-gray-200">
                    {isRTL ? 'أصالة' : 'Authenticity'}
                  </p>
                </div>
                <div className="text-center space-y-2 p-4 rounded-lg bg-background/50 dark:bg-gray-800/50">
                  <MessageCircle className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-xs font-medium text-foreground dark:text-gray-200">
                    {isRTL ? 'خدمة عملاء احترافية' : 'Professional Customer Service'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Additional Information Below - Fixed grid to prevent CLS */}
          <motion.div
            className="max-w-7xl mx-auto mt-6 sm:mt-8 lg:mt-16"
            variants={itemVariants}
            style={{ minHeight: '300px' }}
          >
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
              style={{ minHeight: '250px' }}
            >
              {/* Craftsmanship Card */}
              <Card
                className="bg-background/50 dark:bg-gray-800/50 backdrop-blur-sm border-border dark:border-gray-700 shadow-elegant dark:shadow-2xl"
                style={{ minHeight: '200px' }}
              >
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4" style={{ minHeight: '1.5em' }}>
                    {isRTL ? 'الصناعة الرفيعة' : 'Craftsmanship'}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed" style={{ minHeight: '3em' }}>
                    {isRTL
                      ? 'نؤمن أن الفخامة تبدأ من المادة. لهذا نعتمد أقمشة مستوردة، ونطوّر تصاميمنا في دبي، مع عناية دقيقة بكل مرحلة من مراحل التنفيذ'
                      : 'Each piece is meticulously handcrafted by skilled artisans using traditional techniques passed down through generations.'
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Care Instructions Card */}
              <Card
                className="bg-background/50 dark:bg-gray-800/50 backdrop-blur-sm border-border dark:border-gray-700 shadow-elegant dark:shadow-2xl"
                style={{ minHeight: '200px' }}
              >
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4" style={{ minHeight: '1.5em' }}>
                    {isRTL ? 'تعليمات العناية' : 'Care Instructions'}
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground" style={{ minHeight: '6em' }}>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{isRTL ? 'يفضل الغسل اليدوي بالماء البارد.' : 'Dry clean only'}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{isRTL ? 'استخدم منظف لطيف، وابتعد عن الشمس المباشرة أثناء التجفيف.' : 'Store flat'}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{isRTL ? 'اكوي بدرجة حرارة منخفضة عند الحاجة.' : 'Avoid direct sunlight'}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{isRTL ? 'خزّن في مكان جاف لتحافظ على فخامتها وجمالها.' : 'Handle with clean, dry hands'}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </motion.div>

        {/* Image Modal */}
        <AnimatePresence>
          {showImageModal && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowImageModal(false)}
            >
              <motion.div
                className="relative max-w-4xl max-h-[90vh] w-full h-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  onClick={() => setShowImageModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="relative w-full h-full">
                  <Image
                    src={product.images[currentImageIndex] || '/placeholder.svg'}
                    alt={isRTL ? product.nameAr || product.name : product.name}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                    }}
                  />
                </div>

                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-background/90 dark:hover:bg-gray-800/90"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-background/90 dark:hover:bg-gray-800/90"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accessories Bottom Alert Panel - Horizontal, Centered */}
        <AnimatePresence>
          {showAccessoryPopup && relatedAccessories.length > 0 && (
            <motion.div
              className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none pb-4"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ 
                type: 'spring',
                damping: 25,
                stiffness: 200
              }}
            >
              <motion.div
                className="bg-white border-2 border-[#d4af37] shadow-2xl rounded-2xl p-4 pointer-events-auto"
                style={{ width: 'fit-content', minWidth: '320px', maxWidth: '400px' }}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                transition={{ delay: 0.1 }}
              >
                {/* Header with close button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <motion.h2 
                      className="text-base sm:text-lg font-bold text-gray-900 mb-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isRTL ? '✨ أكمل إطلالتك ✨' : '✨ Complete Your Look ✨'}
                    </motion.h2>
                    <motion.p 
                      className="text-gray-600 text-xs sm:text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {isRTL 
                        ? 'إكسسوارات مطابقة'
                        : 'Matching accessories'
                      }
                    </motion.p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-700 hover:bg-gray-100 rounded-full flex-shrink-0 ml-4"
                    onClick={() => {
                      setShowAccessoryPopup(false)
                      setAccessoryPopupDismissed(true)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Accessories Horizontal Layout - 3 cards */}
                <div className="flex gap-3 justify-center items-start">
                  {relatedAccessories.slice(0, 3).map((accessory, index) => {
                    // Get image URL - handle different possible formats
                    const imageUrl = accessory.images?.[0] || 
                                   (accessory as any).image || 
                                   (accessory as any).images?.[0]?.url || 
                                   (accessory as any).images?.[0] || 
                                   '/placeholder.svg'
                    
                    return (
                    <motion.div
                      key={accessory.id}
                      className="group relative flex-shrink-0"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Circular Card */}
                      <div className="bg-gray-50 rounded-full overflow-hidden border-2 border-[#d4af37] hover:border-[#d4af37]/80 transition-all duration-300 p-2 w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center">
                        {/* Circular Product Image */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white">
                          <img
                            src={imageUrl}
                            alt={isRTL ? accessory.nameAr || accessory.name : accessory.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder.svg'
                              target.onerror = null
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Product Info Below Circle */}
                      <div className="mt-2 text-center w-20 sm:w-24">
                        <h3 className="font-semibold text-gray-900 text-[10px] sm:text-xs line-clamp-1 mb-1">
                          {isRTL ? accessory.nameAr || accessory.name : accessory.name}
                        </h3>
                        <span className="text-xs font-bold text-[#d4af37] block mb-1">
                          {accessory.price.toLocaleString()} DA
                        </span>
                        <Button
                          size="sm"
                          className="w-full bg-[#d4af37] text-white hover:bg-[#d4af37]/90 font-semibold text-[10px] h-6 px-2"
                          onClick={() => {
                            handleAddAccessoryToCart(accessory)
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          {isRTL ? 'أضف' : 'Add'}
                        </Button>
                      </div>
                    </motion.div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#d4af37] text-xs h-8"
                    onClick={() => {
                      setShowAccessoryPopup(false)
                      setAccessoryPopupDismissed(true)
                    }}
                  >
                    {isRTL ? 'لاحقاً' : 'Later'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </React.Fragment>
  )
}
