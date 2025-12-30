'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Grid, List, Loader2, Sparkles, Filter, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'
import { api } from '@/lib/api'
import { LoudStylesNavbar } from '@/components/loud-styles-navbar'

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export default function LoudStylesCategoriesPage() {
  const { isRTL } = useLocaleStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const response = await api.categories.getAll({ brand: 'loud-styles' })
        
        // Ensure we have an array of categories
        const fetchedCategories = (response as any).categories || []
        
        setCategories(fetchedCategories)
        setFilteredCategories(fetchedCategories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
        setFilteredCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.nameAr && category.nameAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories(categories)
    }
  }, [searchQuery, categories])

  const clearSearch = () => {
    setSearchQuery('')
    setShowSearch(false)
  }

  const CategoryCard = ({ category, index }: { category: Category, index: number }) => {
    const name = isRTL ? category.nameAr || category.name : category.name
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6, 
          delay: index * 0.1,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        whileHover={{ 
          y: -8,
          transition: { duration: 0.3 }
        }}
        className="h-full"
      >
        <Link href={`/loud-styles/products?category=${category.slug}&brand=loud-styles`} className="block h-full">
          <Card className="group cursor-pointer transition-all duration-500 overflow-hidden h-full flex flex-col bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-lg hover:shadow-2xl">
            <div className="relative h-64 overflow-hidden">
              <Image
                src={category.image || '/placeholder.svg'}
                alt={name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder.svg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-500" />
              
              {/* Category Info Overlay */}
              <div className="absolute inset-0 flex items-end justify-center p-6">
                <div className="text-center text-white">
                  <motion.h3 
                    className="text-2xl font-bold mb-2"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {name}
                  </motion.h3>
                  <motion.p 
                    className="text-sm opacity-90 mb-3"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    {category.productCount} {isRTL ? 'قطعة' : 'pieces'}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Button 
                      size="sm" 
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-black"
                    >
                      {isRTL ? 'استكشفي المجموعة' : 'Explore Collection'}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Hover Ring Effect */}
            <motion.div
              className="absolute inset-0 rounded-lg border-4 border-transparent group-hover:border-primary/30 transition-all duration-500"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </Card>
        </Link>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warm-50 to-cream-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL ? 'جاري تحميل الفئات...' : 'Loading categories...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warm-50 to-cream-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <LoudStylesNavbar />
      </div>
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              {isRTL ? 'فئات LOUD STYLES' : 'LOUD STYLES Categories'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {isRTL 
                ? 'اكتشفي مجموعاتنا المتنوعة من الأزياء التقليدية الجزائرية'
                : 'Discover our diverse collections of traditional Algerian fashion'
              }
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={isRTL ? 'البحث في الفئات...' : 'Search categories...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 pb-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isRTL ? 'لا توجد فئات' : 'No categories found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL 
                ? 'جربي البحث عن شيء آخر'
                : 'Try searching for something else'
              }
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredCategories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
