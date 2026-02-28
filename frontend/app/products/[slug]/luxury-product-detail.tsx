'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  AlertCircle,
  Sparkles,
  TrendingUp,
  Package,
  Clock,
  MapPin,
  Eye,
  X,
  ArrowLeft,
  ArrowRight,
  ThumbsUp,
  MessageCircle,
  Calendar,
  User,
  Star as StarIcon,
  ZoomIn,
  ChevronDown
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'
import { toast } from 'sonner'
import { LaunchCountdown } from '@/components/launch-countdown'

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
  } | string;
  categoryAr?: string;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  isLaunch?: boolean;
  isLaunchActive?: boolean;
  isOrderable?: boolean;
  isOutOfStock?: boolean;
  launchAt?: string;
  stock: number;
  reference?: string;
  images: string[];
  sizes: Array<{ id: string; size: string; stock: number }>;
  features?: string[];
  specifications?: Record<string, string>;
  slug?: string;
}

interface ProductDetailClientProps {
  product: Product
}

export default function LuxuryProductDetail({ product }: ProductDetailClientProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [timerCompleted, setTimerCompleted] = useState(false)
  const isOrderable = (!product.isLaunchActive || timerCompleted) && !product.isOutOfStock

  const addItem = useCartStore((state) => state.addItem)
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()
  const { t, isRTL } = useLocaleStore()

  useEffect(() => {
    console.log('Product Launch Debug:', {
      name: product.name,
      isLaunch: product.isLaunch,
      launchAt: product.launchAt
    })
    setMounted(true)
    // Auto-select first size if available
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0].size)
    }

  }, [product.sizes, selectedSize, product.isLaunch, product.launchAt, product.name, product.id, product.price, product.category])

  if (!mounted) return null

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
    if (product.isOutOfStock) {
      toast.error(isRTL ? 'هذا المنتج غير متوفر' : 'This product is out of stock')
      return
    }
    
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size')
      return
    }

    const selectedSizeObj = getSelectedSizeObject(selectedSize)

    addItem({
      id: product.id,
      name: isRTL ? product.nameAr || product.name : product.name,
      price: product.price,
      image: product.images[0],
      size: selectedSize || undefined,
      sizeId: selectedSizeObj?.id,
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

    toast.success(isRTL ? 'تمت الإضافة إلى السلة' : 'Added to cart')
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
    'XXL': '46-48',
    'XXXL': '50-52'
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

  // Convert numeric sizes to letter sizes for display
  const getDisplaySizes = () => {
    // Return all standard sizes regardless of availability
    return ['M', 'L', 'XL', 'XXL', 'XXXL'];
  }

  const displaySizes = getDisplaySizes()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warm-50 to-cream-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Back Button */}
      <motion.div
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span className="ml-2">{isRTL ? 'العودة' : 'Back'}</span>
            </Button>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWishlistToggle}
                className={`text-muted-foreground hover:text-foreground ${isInWishlist(product.id) ? 'text-red-500' : ''
                  }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Image Gallery - Left Side */}
          <motion.div
            className="lg:order-1"
            variants={itemVariants}
          >
            <div className="relative">
              {/* Main Image */}
              <motion.div
                className="relative aspect-square bg-background rounded-2xl overflow-hidden shadow-elegant"
                variants={imageVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={product.images[currentImageIndex] || '/placeholder.svg'}
                  alt={isRTL ? product.nameAr || product.name : product.name}
                  fill
                  className="object-contain"
                  priority
                  unoptimized={(product.images[currentImageIndex] || '').startsWith('http')}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder.svg'
                  }}
                />

                {/* Zoom Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  onClick={() => setShowImageModal(true)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </motion.div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <motion.div
                  className="flex space-x-4 mt-6"
                  variants={itemVariants}
                >
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      className={`relative aspect-square w-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${index === currentImageIndex
                        ? 'border-primary shadow-elegant scale-105'
                        : 'border-border hover:border-primary/50'
                        }`}
                      onClick={() => setCurrentImageIndex(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Image
                        src={image}
                        alt={`${isRTL ? product.nameAr || product.name : product.name} - Image ${index + 1}`}
                        fill
                        className="object-contain"
                        unoptimized={typeof image === 'string' && image.startsWith('http')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder.svg'
                        }}
                      />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Product Details - Right Side */}
          <motion.div
            className="lg:order-2 space-y-8"
            variants={itemVariants}
          >
            {/* Product Header */}
            <div className="space-y-4">
              {/* Badges */}
              <motion.div
                className="flex flex-wrap gap-2"
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
                {product.isOutOfStock && (
                  <Badge className="bg-gray-500 text-white border-0">
                    {isRTL ? 'نفاذ الكمية' : 'Out of Stock'}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {isRTL ? 'مجموعة تقليدية' : 'Traditional Collection'}
                </Badge>
              </motion.div>

              {product.isLaunch && product.launchAt && (
                <LaunchCountdown
                  launchAt={product.launchAt}
                  onComplete={() => setTimerCompleted(true)}
                  className="mt-2"
                />
              )}

              {/* Title */}
              <motion.h1
                className="text-4xl font-bold text-foreground leading-tight"
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
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-foreground">
                  ${product.price.toFixed(2)}
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.oldPrice.toFixed(2)}
                    </span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              className="space-y-4"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-foreground">
                {isRTL ? 'الوصف' : 'Description'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {isRTL ? product.descriptionAr || product.description : product.description}
              </p>
            </motion.div>

            {/* Size Selection */}
            {isOrderable && (
              <motion.div
                className="space-y-4"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {isRTL ? 'المقاس' : 'Size'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {displaySizes.map((size, index) => (
                    <motion.button
                      key={`${size}-${index}`}
                      className={`group relative px-6 py-3 min-h-[44px] min-w-[60px] md:min-h-0 md:min-w-0 rounded-lg border-2 transition-all duration-300 font-medium text-base md:text-sm ${selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground shadow-elegant'
                        : 'border-border hover:border-primary/50 bg-background hover:bg-muted/50'
                        }`}
                      onClick={() => setSelectedSize(size)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                      {/* Enhanced Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm rounded-lg shadow-2xl border border-gray-700 pointer-events-none whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{size}</span>
                          <span className="text-gray-300">=</span>
                          <span className="font-mono text-yellow-400">{sizeMapping[size as keyof typeof sizeMapping] || size}</span>
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
                className="space-y-4"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {isRTL ? 'الكمية' : 'Quantity'}
                </h3>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 md:h-10 md:w-10"
                  >
                    <Minus className="w-5 h-5 md:w-4 md:h-4" />
                  </Button>
                  <span className="text-xl md:text-lg font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-12 w-12 md:h-10 md:w-10"
                  >
                    <Plus className="w-5 h-5 md:w-4 md:h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {isOrderable && (
              <motion.div
                className="space-y-4"
                variants={itemVariants}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="h-14 md:h-12 text-base md:text-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-elegant hover:shadow-luxury transition-all duration-300"
                    onClick={handleAddToCart}
                    disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isRTL ? 'أضف للسلة' : 'Add to Cart'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 md:h-12 text-base md:text-sm border-2 border-foreground text-foreground hover:bg-foreground hover:text-background font-semibold shadow-elegant transition-all duration-300"
                    disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
                    onClick={() => {
                      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                        toast.error(isRTL ? 'يرجى اختيار المقاس' : 'Please select a size')
                        return
                      }

                      const selectedSizeObj = getSelectedSizeObject(selectedSize)

                      // Add to cart first
                      addItem({
                        id: product.id,
                        name: isRTL ? product.nameAr || product.name : product.name,
                        price: product.price,
                        image: product.images[0],
                        size: selectedSize || undefined,
                        sizeId: selectedSizeObj?.id
                      })

                      // Redirect to checkout
                      router.push('/checkout')
                    }}
                  >
                    {isRTL ? 'اشتري الآن' : 'Buy Now'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Service Highlights */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border"
              variants={itemVariants}
            >
              <div className="text-center space-y-2 p-4 rounded-lg bg-background/50">
                <div className="flex items-center justify-center">
                  <Image
                    src="/logos/yalidine.png"
                    alt="Yalidine"
                    width={60}
                    height={60}
                    className="object-contain h-15 w-15"
                  />
                </div>
                <p className="text-xs font-medium text-foreground">
                  {isRTL ? 'شحن مع ياليدين' : 'Shipping with Yalidine'}
                </p>
              </div>
              <div className="text-center space-y-2 p-4 rounded-lg bg-background/50">
                <Shield className="h-6 w-6 text-primary mx-auto" />
                <p className="text-xs font-medium text-foreground">
                  {isRTL ? 'أصالة' : 'Authenticity'}
                </p>
              </div>
              <div className="text-center space-y-2 p-4 rounded-lg bg-background/50">
                <MessageCircle className="h-6 w-6 text-primary mx-auto" />
                <p className="text-xs font-medium text-foreground">
                  {isRTL ? 'خدمة عملاء احترافية' : 'Professional Customer Service'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Additional Information Below */}
        <motion.div
          className="max-w-7xl mx-auto mt-16"
          variants={itemVariants}
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Craftsmanship Card */}
            <Card className="bg-background/50 backdrop-blur-sm border-border shadow-elegant">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {isRTL ? 'الصناعة الرفيعة' : 'Craftsmanship'}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {isRTL
                    ? 'نؤمن أن الفخامة تبدأ من المادة. لهذا نعتمد أقمشة مستوردة، ونطوّر تصاميمنا في دبي، مع عناية دقيقة بكل مرحلة من مراحل التنفيذ'
                    : 'Each piece is meticulously handcrafted by skilled artisans using traditional techniques passed down through generations.'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Care Instructions Card */}
            <Card className="bg-background/50 backdrop-blur-sm border-border shadow-elegant">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {isRTL ? 'تعليمات العناية' : 'Care Instructions'}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
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
                  unoptimized={(product.images[currentImageIndex] || '').startsWith('http')}
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
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
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
  )
}
