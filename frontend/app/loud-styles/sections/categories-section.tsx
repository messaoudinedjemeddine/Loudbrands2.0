'use client'

import Link from 'next/link'
import Image from 'next/image'
// Tree-shakeable: only import motion.div, not the entire motion object
import { motion } from 'framer-motion'
import { useLocaleStore } from '@/lib/locale-store'

interface Category {
  id: string
  name: string
  nameAr?: string
  slug: string
  image?: string
  productCount: number
}

interface CategoriesSectionProps {
  categories: Category[]
  loading: boolean
  error: string | null
}

export default function CategoriesSection({ categories, loading, error }: CategoriesSectionProps) {
  const { isRTL } = useLocaleStore()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          {isRTL ? 'تسوقي حسب المجموعة' : 'Shop by Collection'}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {isRTL
            ? 'اكتشفي مجموعاتنا المتنوعة من الأزياء التقليدية الجزائرية'
            : 'Discover our diverse collections of traditional Algerian fashion'
          }
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              viewport={{ once: true }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              className="flex-shrink-0"
            >
              <Link href={`/loud-styles/products?category=${category.slug}&brand=loud-styles`}>
                <div className="group cursor-pointer relative">
                  <div className="w-48 h-48 rounded-full overflow-hidden bg-gradient-to-br from-white via-cream-50 to-warm-50 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-2xl transition-all duration-500 relative">
                    <Image
                      src={category.image || '/placeholder.svg'}
                      alt={isRTL ? category.nameAr || category.name : category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                      sizes="(max-width: 640px) 192px, 192px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500" />

                    <div className="absolute inset-0 flex items-end justify-center p-6">
                      <div className="text-center text-white">
                        <motion.h3
                          className="text-xl font-bold mb-2"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isRTL ? category.nameAr || category.name : category.name}
                        </motion.h3>
                        <motion.p
                          className="text-sm opacity-90"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          {category.productCount} {isRTL ? 'قطعة' : 'pieces'}
                        </motion.p>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent group-hover:border-primary/30 transition-all duration-500"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}


