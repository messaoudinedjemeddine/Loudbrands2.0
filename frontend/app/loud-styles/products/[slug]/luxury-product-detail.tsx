'use client'

import { Preloader } from '@/components/preloader'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Tree-shakeable: only import what we need from framer-motion
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  }, [])

  useEffect(() => {
    // Auto-select first size if available (only for non-accessoires)
    if (!isAccessoires && product?.sizes && product.sizes.length > 0 && !selectedSize) {
      const firstSize = product.sizes[0];
      setSelectedSize(typeof firstSize === 'string' ? firstSize : firstSize.size)
    }
  }, [product?.sizes, selectedSize, isAccessoires])


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
      sizeId: isAccessoires ? undefined : selectedSizeObj?.id
    })

    // Track AddToCart Event
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_ids: [product.id],
          content_type: 'product',
          value: product.price,
          currency: 'DZD'
        })
      }
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
    return ['M', 'L', 'XL', 'XXL'];
  }

  const displaySizes = getDisplaySizes()

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
  }

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
  }

  return (
    <>
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
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {isRTL ? 'المقاس' : 'Size'}
                  </h3>
                  <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 lg:gap-3">
                    {displaySizes.map((size) => (
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
      </div>
    </>
  )
}
