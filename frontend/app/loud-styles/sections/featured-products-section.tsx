'use client'

import Link from 'next/link'
import Image from 'next/image'
// Tree-shakeable: only import motion components we use
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Heart } from 'lucide-react'
import { useCartStore, useWishlistStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'

interface Product {
  id: string
  name: string
  nameAr?: string
  price: number
  oldPrice?: number
  image: string
  slug: string
  isOnSale?: boolean
  rating?: number
  stock: number
  sizes: any[]
}

interface FeaturedProductsSectionProps {
  products: Product[]
  loading: boolean
  error: string | null
}

export default function FeaturedProductsSection({ products, loading, error }: FeaturedProductsSectionProps) {
  const addItem = useCartStore((state) => state.addItem)
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()
  const { isRTL } = useLocaleStore()

  const getSizeStrings = (sizes: any[]) => {
    return ['M', 'L', 'XL', 'XXL'];
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: isRTL ? product.nameAr || product.name : product.name,
      price: product.price,
      image: product.image
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className={`text-center mb-16 ${isRTL ? 'text-right' : 'text-left'}`}
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          {isRTL ? 'المجموعة المميزة' : 'Featured Collection'}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {isRTL
            ? 'قطع مختارة بعناية من أجمل الأزياء التقليدية الجزائرية'
            : 'Carefully selected pieces from the most beautiful traditional Algerian fashion'
          }
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 4).map((product, index) => {
            const sizeStrings = getSizeStrings(product.sizes)

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                viewport={{ once: true }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                whileTap={{
                  scale: 0.98,
                  transition: { duration: 0.1 }
                }}
                className="h-full"
              >
                <Link href={`/loud-styles/products/${product.slug}?brand=loud-styles`} className="block h-full">
                  <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-beige-100 via-beige-200 to-beige-300 dark:from-gray-800 dark:to-gray-900 relative h-full flex flex-col">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />

                    <div className="relative flex-1 flex flex-col">
                      <div className="relative h-80 overflow-hidden flex-shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="relative h-full w-full"
                        >
                          <Image
                            src={product.image || '/placeholder.svg'}
                            alt={isRTL ? product.nameAr || product.name : product.name}
                            fill
                            className="object-cover transition-transform duration-500"
                            loading={index < 2 ? "eager" : "lazy"}
                            priority={index < 2}
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          />
                        </motion.div>
                        {product.isOnSale && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, x: -20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
                          >
                            <Badge className={`absolute top-4 bg-red-500 hover:bg-red-600 ${isRTL ? 'right-4' : 'left-4'} shadow-lg`}>
                              {isRTL ? 'تخفيض' : 'Sale'}
                            </Badge>
                          </motion.div>
                        )}
                      </div>

                      <CardContent className="p-6 flex-1 flex flex-col text-center">
                        <motion.h3
                          className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors text-center"
                          whileHover={{ color: 'hsl(var(--primary))' }}
                        >
                          {isRTL ? product.nameAr || product.name : product.name}
                        </motion.h3>

                        <motion.div
                          className="flex items-center justify-center gap-2 mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        >
                          {product.oldPrice && product.oldPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {product.oldPrice?.toLocaleString()} DA
                            </span>
                          )}
                          <span className="text-xl font-bold text-primary">
                            {product.price.toLocaleString()} DA
                          </span>
                        </motion.div>

                        <motion.div
                          className="flex items-center justify-center gap-2 mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                        >
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
                        </motion.div>

                        <motion.div
                          className="flex items-center justify-center gap-2 mt-auto"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                        >
                          <Button
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={(e) => {
                              e.preventDefault()
                              handleAddToCart(product)
                            }}
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
                        </motion.div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            className="text-lg px-8 py-6 transition-all duration-300 font-medium text-white"
            style={{ backgroundColor: '#bfa36a', borderColor: '#bfa36a' }}
            asChild
          >
            <Link href="/loud-styles/products" style={{ borderColor: '#bfa36a', color: 'white' }}>
              {isRTL ? 'عرض جميع المنتجات' : 'View All Products'}
            </Link>
          </Button>
        </motion.div>
      </div>
    </>
  )
}

