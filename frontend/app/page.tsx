'use client'

import { useEffect, useState, Suspense, lazy, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Star, Truck, Shield, Headphones, CreditCard, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { LazyImage } from '@/components/performance/lazy-image'
import { LazyComponent } from '@/components/performance/lazy-component'
import { useCartStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'
import Image from 'next/image'

// Lazy load heavy components
const Navbar = lazy(() => import('@/components/navbar').then(mod => ({ default: mod.Navbar })))

// Performance optimizations - removed lazy loading for now

// Define types
interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  categoryAr?: string;
  rating?: number;
  isOnSale?: boolean;
  stock: number;
  sizes: Array<{ id: string; size: string; stock: number }> | string[];
  slug: string;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  image: string;
  productCount: number;
  slug: string;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const addItem = useCartStore((state) => state.addItem)
  const { t, isRTL } = useLocaleStore()

  // Memoize features to prevent re-creation on every render
  const features = useMemo(() => [
    {
      icon: Truck,
      title: isRTL ? 'توصيل مجاني' : 'Free Delivery',
      description: isRTL ? 'توصيل مجاني في جميع أنحاء الجزائر' : 'Free delivery across Algeria'
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
      description: isRTL ? 'دفع عند الاستلام أو تحويل بنكي' : 'Cash on delivery or bank transfer'
    }
  ], [isRTL])

  // Fetch featured products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch featured products from both brands (first 4 products)
        const productsResponse = await fetch('/api/products?limit=8')
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products')
        }
        const productsData = await productsResponse.json()

        // Handle different response formats
        const products = Array.isArray(productsData) ? productsData : (productsData.products || [])
        const featured = products.slice(0, 4).map((product: any) => ({
          ...product,
          sizes: product.sizes || [],
          rating: product.rating || 4.5,
          isOnSale: product.oldPrice && product.oldPrice > product.price,
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-')
        }))
        setFeaturedProducts(featured)

        // Fetch categories from both brands (with caching)
        const categoriesResponse = await fetch('/api/categories', {
          next: { revalidate: 300 } // Cache for 5 minutes
        })
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories')
        }
        const categoriesData = await categoriesResponse.json()
        const categories = categoriesData.categories || []
        const categoriesWithCount = categories.map((category: any) => ({
          ...category,
          productCount: category.productCount || Math.floor(Math.random() * 50) + 10,
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

  // Preload homepage-specific resources using useEffect (client-side only)
  // MUST be called before any conditional returns
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return;

    const preloads = [
      { href: '/logo-mini.png', as: 'image', type: 'image/png' },
      { href: '/loud-brands-logo.png', as: 'image', type: 'image/png' },
      { href: '/images/Djawhara Green2.webp', as: 'image', type: 'image/webp' }
    ];

    preloads.forEach(({ href, as, type }) => {
      const existingLink = document.querySelector(`link[rel="preload"][href="${href}"]`);
      if (existingLink) return;

      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        if (type) link.type = type;
        link.href = href;
        document.head.appendChild(link);
      } catch (e) {
        // Ignore preload errors
      }
    });
  }, [mounted]);

  if (!mounted) return null

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: isRTL ? product.nameAr || product.name : product.name,
      price: product.price,
      image: product.image
    })
  }



  // Helper function to get size strings
  const getSizeStrings = (sizes: Product['sizes']): string[] => {
    if (!Array.isArray(sizes) || sizes.length === 0) return []

    return typeof sizes[0] === 'string'
      ? sizes as string[]
      : (sizes as Array<{ id: string; size: string; stock: number }>).map(s => s.size)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warm-50 to-cream-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section with Video */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Navbar positioned over video */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Suspense fallback={<div className="h-16 bg-white/90 backdrop-blur-sm" />}>
            <Navbar />
          </Suspense>
        </div>

        {/* Hero Static Background */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/images/Djawhara Green2.webp"
            alt="LOUD BRANDS Hero - Traditional Algerian Fashion"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Hero Content - On Top of Video */}
        <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl mb-6 tracking-wider group cursor-pointer" dir="ltr">
              <span className="inline-block">
                <span className="text-primary transition-colors duration-300 group-hover:text-white font-bold">LOUD</span>
                <span className="relative inline-block ml-2">
                  <span className="text-white transition-colors duration-300 group-hover:text-primary font-light">BRANDS</span>
                  <motion.span
                    className="absolute inset-0 bg-primary origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ zIndex: -1 }}
                  />
                </span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
              {isRTL
                ? 'اكتشفي الأناقة الجزائرية الأصيلة مع مجموعتنا المميزة من الأزياء التقليدية والعصرية'
                : 'Discover authentic Algerian elegance with our exclusive collection of traditional and modern fashion'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.div
                whileHover={{ scale: 0.95 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/loudim">
                  <div className="bg-primary hover:bg-primary/90 rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px] text-center">
                    <h2 className="text-xl font-semibold tracking-wider cursor-pointer" dir="ltr">
                      <span className="inline-block">
                        <span className="text-white font-bold">LOUD</span>
                        <span className="relative inline-block ml-2">
                          <span className="text-white font-light">IM</span>
                        </span>
                      </span>
                    </h2>
                  </div>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 0.95 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/loud-styles">
                  <div className="bg-primary hover:bg-primary/90 rounded-full px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px] text-center">
                    <h2 className="text-xl font-semibold tracking-wider cursor-pointer" dir="ltr">
                      <span className="inline-block">
                        <span className="text-white font-bold">LOUD</span>
                        <span className="relative inline-block ml-2">
                          <span className="text-white font-light">STYLES</span>
                        </span>
                      </span>
                    </h2>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>


      {/* About Us Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className={`${isRTL ? 'lg:order-2' : ''}`}
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
              >
                {t?.pages?.loudBrands?.whoWeAre || (isRTL ? 'من نحن' : 'Who We Are')}
              </motion.h2>

              <motion.h3
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-bold mb-4 text-gray-800"
              >
                {isRTL ? 'LOUD Brands' : 'LOUD Brands'}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-lg text-gray-600 mb-6 leading-relaxed break-words"
              >
                {t?.pages?.loudBrands?.fromHeart || (isRTL
                  ? 'من قلب الجزائر، نحن نعيد تعريف الأناقة بأسلوب يجمع بين الحداثة والأصالة.'
                  : 'From the heart of Algeria, we are redefining elegance with a style that blends modernity and authenticity.'
                )}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="text-lg text-gray-600 mb-4 leading-relaxed break-words"
              >
                {t?.pages?.loudBrands?.leadingBrand || (isRTL
                  ? 'نحن علامة جزائرية رائدة متخصصة في تصميم وإنتاج ملابس المناسبات والملابس اليومية، من خلال فرعين متميزين:'
                  : 'We are a leading Algerian brand specializing in the design and production of occasion wear and everyday clothing, through two distinct branches:'
                )}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="space-y-3 mb-6"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-lg text-gray-600">
                    <strong>LOUD Styles:</strong> {t?.pages?.loudBrands?.loudStylesDesc || (isRTL ? 'فساتين أعراس وملابس سهرات فاخرة.' : 'Luxurious wedding and evening gowns.')}
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-lg text-gray-600">
                    <strong>LOUDIM:</strong> {t?.pages?.loudBrands?.loudimDesc || (isRTL ? 'ملابس خارجية أنيقة وملابس كاجوال راقية.' : 'Chic outerwear and sophisticated casual wear.')}
                  </p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                viewport={{ once: true }}
                className="text-lg text-gray-600 mb-8 leading-relaxed font-medium break-words"
              >
                {t?.pages?.loudBrands?.proudAlgerian || (isRTL
                  ? 'نحن هنا لنقدم للنساء الجزائريات خيارات محلية تنافس بقوة العلامات التجارية الدولية—بفخر كامل، نحن 100% جزائريون.'
                  : 'We are here to offer Algerian women local choices that powerfully compete with international brands—with complete pride, we are 100% Algerian.'
                )}
              </motion.p>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-3xl font-bold text-primary mb-2">
                    5000+
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    {isRTL ? 'عميلة سعيدة' : 'Happy Customers'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300"
                >
                  <div className="text-3xl font-bold text-primary mb-2">
                    1000+
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    {isRTL ? 'تصميم فريد' : 'Unique Designs'}
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className={`${isRTL ? 'lg:order-1' : ''}`}
            >
              <div className="relative">
                <Image
                  src="/images/Djawhara Green2.webp"
                  alt="LOUD BRANDS Collection - Traditional Algerian Fashion"
                  width={600}
                  height={600}
                  className="w-full h-[600px] object-cover rounded-2xl shadow-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Floating Badge */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  viewport={{ once: true }}
                  className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold shadow-lg"
                >
                  100% {isRTL ? 'جزائري' : 'Algerian'}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 text-gray-900 dark:text-gray-100 bg-gradient-to-br from-cream-100 via-warm-50 to-cream-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16"
          >
            {t?.pages?.loudBrands?.ourStory || (isRTL ? 'قصتنا' : 'Our Story')}
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/Djebarpink.webp"
                  alt="Our Story"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-lg text-gray-700 leading-relaxed break-words">
                {t?.pages?.loudBrands?.storyBegin || (isRTL
                  ? 'بدأت LOUD Brands كحلم بسيط: إنشاء موضة محلية تعكس هوية المرأة الجزائرية وتلبي ذوقها المتميز في كل مناسبة.'
                  : 'LOUD Brands began as a simple dream: to create local fashion that reflects the identity of the Algerian woman and meets her refined taste for every occasion.'
                )}
              </p>

              <p className="text-lg text-gray-700 leading-relaxed break-words">
                {t?.pages?.loudBrands?.storyJourney || (isRTL
                  ? 'من فستان زفاف يخلد لحظة كبيرة في الحياة إلى إطلالة كاجوال تعكس ذاتك اليومية—كانت رحلتنا مليئة بالشغف والتصميم والالتزام بالجودة.'
                  : 'From a wedding dress that immortalizes life\'s big moment to a casual look that mirrors your everyday self—our journey has been filled with passion, design, and commitment to quality.'
                )}
              </p>

              <p className="text-lg text-gray-700 leading-relaxed break-words">
                {t?.pages?.loudBrands?.storyInnovation || (isRTL
                  ? 'اخترنا أن نكون مختلفين... لذلك ابتكرنا من خلال إنشاء فرعين لخدمة كل جانب من جوانب حياتك:'
                  : 'We chose to be different... so we innovated by creating two branches to cater to every aspect of your life:'
                )}
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-lg text-gray-700 break-words">
                    <strong>LOUD Styles:</strong> {t?.pages?.loudBrands?.loudStylesPurpose || (isRTL ? 'لكل لحظة عظيمة، إطلالة تليق بك.' : 'For every grand moment, a look worthy of you.')}
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                  <p className="text-lg text-gray-700 break-words">
                    <strong>LOUDIM:</strong> {t?.pages?.loudBrands?.loudimPurpose || (isRTL ? 'لكل يوم، أناقة تناسبك.' : 'For every day, an elegance that suits you.')}
                  </p>
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed font-medium break-words">
                {t?.pages?.loudBrands?.storyToday || (isRTL
                  ? 'اليوم، نحن فخورون بأن نكون علامة جزائرية تحدث فرقاً مع كل خطوة.'
                  : 'Today, we are proud to be an Algerian brand making a difference with every step.'
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Structure */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {isRTL ? 'علاماتنا التجارية' : 'Our Brands'}
            </h2>
            <p className="text-xl max-w-3xl mx-auto text-gray-600">
              {isRTL
                ? 'اكتشفي مجموعتنا المتنوعة من الأزياء التقليدية والعصرية'
                : 'Discover our diverse collection of traditional and modern fashion'
              }
            </p>
          </motion.div>

          {/* Brand Cards Layout */}
          <div className="space-y-20">
            {/* LOUDIM Brand - First Card */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Brand Info Section */}
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Title Group */}
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    LOUDIM
                  </h3>
                  <p className="text-lg font-medium text-gray-600">
                    {isRTL ? 'ملابس طلعة أنيقة، كاجوال بلمسة راقية' : 'Elegant casual wear with a sophisticated touch'}
                  </p>
                </div>

                {/* Description */}
                <p className="text-lg leading-relaxed text-gray-600">
                  {t?.pages?.loudBrands?.loudimTagline || (isRTL
                    ? 'مجموعة LOUDIM تجمع بين الأناقة والراحة، مصممة للمرأة العصرية التي تبحث عن التميز في كل مناسبة.'
                    : 'LOUDIM collection combines elegance and comfort, designed for the modern woman seeking distinction in every occasion.'
                  )}
                </p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {[
                    isRTL ? 'تصاميم عصرية وأنيقة' : 'Modern and elegant designs',
                    isRTL ? 'أقمشة عالية الجودة' : 'High-quality fabrics',
                    isRTL ? 'مناسبة لجميع المناسبات' : 'Perfect for all occasions'
                  ].map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center text-gray-600"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/loudim">
                      {t?.pages?.loudBrands?.exploreLoudim || (isRTL ? 'استكشفي LOUDIM' : 'Explore LOUDIM')}
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Image Section */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="relative h-[500px] rounded-2xl shadow-2xl overflow-hidden">
                  <Image
                    src="/images/kufsulblk3.webp"
                    alt="LOUDIM Collection - Casual Fashion"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                  {/* Brand Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                    viewport={{ once: true }}
                    className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                  >
                    <span className="text-yellow-600 font-bold">LOUDIM</span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* LOUD STYLES Brand - Second Card (Alternating Layout) */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Image Section - First on mobile, second on desktop */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative lg:order-1"
              >
                <div className="relative h-[500px] rounded-2xl shadow-2xl overflow-hidden">
                  <Image
                    src="/images/kufsulblue2.webp"
                    alt="LOUD STYLES Collection - Luxury Fashion"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                  {/* Brand Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                    viewport={{ once: true }}
                    className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                  >
                    <span className="text-yellow-600 font-bold">LOUD STYLES</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Brand Info Section */}
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 lg:order-2"
              >
                {/* Title Group */}
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    LOUD STYLES
                  </h3>
                  <p className="text-lg font-medium text-gray-600">
                    {isRTL ? 'فساتين أعراس وسهرات فاخرة' : 'Wedding dresses and luxury evening wear'}
                  </p>
                </div>

                {/* Description */}
                <p className="text-lg leading-relaxed text-gray-600">
                  {isRTL
                    ? 'مجموعة LOUD STYLES تقدم أجمل فساتين الأعراس والملابس الفاخرة للمناسبات الخاصة.'
                    : 'LOUD STYLES collection offers the most beautiful wedding dresses and luxury wear for special occasions.'
                  }
                </p>

                {/* Feature List */}
                <ul className="space-y-3">
                  {[
                    isRTL ? 'فساتين أعراس فاخرة' : 'Luxury wedding dresses',
                    isRTL ? 'ملابس سهرات أنيقة' : 'Elegant evening wear',
                    isRTL ? 'تفاصيل يدوية دقيقة' : 'Handcrafted details'
                  ].map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center text-gray-600"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/loud-styles">
                      {isRTL ? 'استكشفي LOUD STYLES' : 'Explore LOUD STYLES'}
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Our Values Section */}
      <section className="py-20 text-gray-900 dark:text-gray-100 bg-gradient-to-br from-cream-100 via-warm-50 to-cream-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t?.pages?.loudBrands?.ourValues || (isRTL ? 'قيمنا' : 'Our Values')}
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '✨',
                title: t?.pages?.loudBrands?.qualityFirst || (isRTL ? 'الجودة أولاً' : 'Quality First'),
                description: t?.pages?.loudBrands?.qualityFirstDesc || (isRTL ? 'من أول خيط إلى آخر غرزة، نحرص على أن يكون كل تفصيل في منتجاتنا مثالاً للجودة والتميز.' : 'From the first thread to the last stitch, we ensure every detail in our products is an example of quality and excellence.')
              },
              {
                icon: '✨',
                title: t?.pages?.loudBrands?.refinedElegance || (isRTL ? 'أناقة راقية' : 'Refined Elegance'),
                description: t?.pages?.loudBrands?.refinedEleganceDesc || (isRTL ? 'تصاميمنا تجمع بين الحداثة والأصالة لتعكس شخصيتك بأسلوب راقٍ وفاخر.' : 'Our designs combine modernity and authenticity to reflect your personality with a sophisticated and luxurious style.')
              },
              {
                icon: '✨',
                title: t?.pages?.loudBrands?.localIndustry || (isRTL ? 'تمكين الصناعة المحلية' : 'Empowering Local Industry'),
                description: t?.pages?.loudBrands?.localIndustryDesc || (isRTL ? 'نفخر بأن كل قطعة تُنتج بحب في الجزائر، لتدعم الصناعة المحلية بكل فخر.' : 'We are proud that every piece is produced with love in Algeria, supporting local industry with pride.')
              },
              {
                icon: '✨',
                title: t?.pages?.loudBrands?.boldness || (isRTL ? 'الجسارة والتميز' : 'Boldness and Distinction'),
                description: t?.pages?.loudBrands?.boldnessDesc || (isRTL ? 'نؤمن بأن كل امرأة تستحق أن تتألق بأسلوبها الخاص وتكون فريدة ومميزة.' : 'We believe every woman deserves to shine in her own style and be unique and special.')
              },
              {
                icon: '✨',
                title: t?.pages?.loudBrands?.innovation || (isRTL ? 'الابتكار المستمر' : 'Continuous Innovation'),
                description: t?.pages?.loudBrands?.innovationDesc || (isRTL ? 'نواكب أحدث خطوط الموضة ونكيفها لتتناسب مع ذوقك المحلي وتلبي حاجتك.' : 'We keep up with the latest fashion trends and adapt them to suit your local taste and meet your needs.')
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="text-3xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}