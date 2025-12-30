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

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export default function CategoriesPage() {
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
        const response = await api.categories.getAll()
        console.log('API Response:', response)
        
        // Ensure we have an array of categories
        const fetchedCategories = Array.isArray(response) 
          ? response 
          : ((response as any)?.categories || (response as any)?.data || [])
        console.log('Processed categories:', fetchedCategories)
        
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
        <Link href={`/products?category=${category.slug}`} className="block h-full">
          <Card className="group cursor-pointer transition-all duration-500 overflow-hidden h-full flex flex-col bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-lg hover:shadow-2xl">
            <div className="relative h-64 overflow-hidden">
              <Image
                src={category.image || '/placeholder.svg'}
                alt={name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Animated overlay */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <motion.h3 
                  className="text-2xl font-bold text-white mb-2 drop-shadow-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {name}
                </motion.h3>
                <motion.p 
                  className="text-white/90 text-sm line-clamp-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {category.description}
                </motion.p>
              </div>
              
              <motion.div 
                className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Badge variant="secondary" className="bg-white/95 text-black shadow-lg font-semibold px-3 py-1">
                  {category.productCount} {isRTL ? 'منتج' : 'products'}
                </Badge>
              </motion.div>
              
              {/* Floating sparkles effect */}
              <motion.div
                className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </div>
            
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <div className="flex-1">
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {category.description}
                </p>
              </div>
              
              <motion.div 
                className={`flex items-center space-x-2 text-primary font-semibold group-hover:text-primary/80 transition-colors duration-300 ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'}`}
                whileHover={{ x: isRTL ? -5 : 5 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm">{isRTL ? 'تسوق الآن' : 'Shop Now'}</span>
                <motion.span 
                  className="text-lg"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  →
                </motion.span>
              </motion.div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="pt-16">
        {/* Enhanced Header */}
        <motion.div 
          className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 dark:from-primary/20 dark:via-primary/10 dark:to-secondary/20 py-20 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated background elements */}
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
            }}
          />
          
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <motion.h1 
                className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {isRTL ? 'تسوق حسب الفئة' : 'Shop by Category'}
              </motion.h1>
              <motion.p 
                className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {isRTL ? 'استكشف مجموعتنا الواسعة من الفئات واعثر على ما تبحث عنه بالضبط' : 'Explore our wide range of categories and find exactly what you\'re looking for'}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Centered Search Bar */}
          <motion.div 
            className="flex justify-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="relative w-full max-w-2xl">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5`} />
                <Input
                  placeholder={isRTL ? 'ابحث في الفئات...' : 'Search categories...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-12' : 'pl-12'} h-14 text-lg bg-white/80 backdrop-blur-sm border-2 border-primary/20 focus:border-primary/50 transition-all duration-300 rounded-full shadow-lg hover:shadow-xl focus:shadow-2xl`}
                  onFocus={() => setShowSearch(true)}
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearSearch}
                    className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors duration-200`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                )}
              </div>
              
              {/* Search suggestions */}
              <AnimatePresence>
                {showSearch && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-muted z-50"
                  >
                    {filteredCategories.slice(0, 3).map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="block p-3 hover:bg-muted/50 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <Image
                              src={category.image || '/placeholder.svg'}
                              alt={category.name}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <span className="font-medium">{isRTL ? category.nameAr || category.name : category.name}</span>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Results Count and View Toggle */}
          <motion.div 
            className={`flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-4 py-2">
                {filteredCategories.length} {isRTL ? 'فئة' : 'categories'}
              </Badge>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 text-sm text-muted-foreground"
                >
                  <Filter className="w-4 h-4" />
                  <span>{isRTL ? 'نتائج البحث' : 'Search results'}</span>
                </motion.div>
              )}
            </div>

            <div className={`flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-lg p-1 shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          </motion.div>

          {/* Categories Grid */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <motion.p 
                  className="mt-6 text-lg text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {isRTL ? 'جاري تحميل الفئات...' : 'Loading categories...'}
                </motion.p>
              </motion.div>
            ) : filteredCategories.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-20"
              >
                <motion.div 
                  className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Search className="w-16 h-16 text-muted-foreground" />
                </motion.div>
                <h3 className="text-2xl font-semibold mb-3">{isRTL ? 'لم يتم العثور على فئات' : 'No categories found'}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {isRTL ? 'حاول تعديل معايير البحث الخاصة بك أو استكشف جميع الفئات المتاحة' : 'Try adjusting your search criteria or explore all available categories'}
                </p>
                <Button onClick={clearSearch} variant="outline">
                  {isRTL ? 'عرض جميع الفئات' : 'Show all categories'}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {Array.isArray(filteredCategories) && filteredCategories.map((category, index) => (
                  <CategoryCard key={category.id} category={category} index={index} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}