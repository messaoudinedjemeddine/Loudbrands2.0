'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  ShoppingCart,
  Menu,
  Search,
  User,
  Heart,
  X,
  Phone,
  Mail,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  LogIn
} from 'lucide-react'
import { useCartStore, useAuthStore, useWishlistStore, useUIStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'
import { CartSheet } from '@/components/cart-sheet'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTheme } from 'next-themes'

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isCartOpen, setCartOpen } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)


  const router = useRouter()
  const pathname = usePathname()
  const { items, getTotalItems } = useCartStore()
  const { user, logout } = useAuthStore()
  const { getWishlistCount } = useWishlistStore()
  const { t, isRTL } = useLocaleStore()
  const { theme, setTheme } = useTheme()

  const totalItems = getTotalItems()
  const wishlistCount = getWishlistCount()

  // Check which page we're on to determine navigation
  const isLoudBrandsPage = pathname === '/'
  const isLoudimPage = pathname.startsWith('/loudim')
  const isLoudStylesPage = pathname.startsWith('/loud-styles')
  const isProductsPage = pathname === '/products'

  // Pages that need visible navbar (light backgrounds)
  const needsVisibleNavbar = isProductsPage ||
    isLoudimPage ||
    isLoudStylesPage ||
    pathname.includes('/products/') ||
    pathname.includes('/categories') ||
    pathname.includes('/about') ||
    pathname.includes('/contact') ||
    pathname.includes('/faq') ||
    pathname.includes('/wishlist') ||
    pathname.includes('/checkout') ||
    pathname.includes('/track-order')

  // Determine navigation based on current page
  let navigation = []
  let logoText = ''
  let logoSubtext = ''

  if (isLoudBrandsPage) {
    navigation = [
      { name: 'LOUDIM', href: '/loudim' },
      { name: 'LOUD STYLES', href: '/loud-styles' },
    ]
    logoText = 'LOUD'
    logoSubtext = 'BRANDS'
  } else if (isLoudimPage) {
    navigation = [
      { name: isRTL ? 'الرئيسية' : 'Home', href: '/' },
      { name: isRTL ? 'المنتجات' : 'Products', href: '/loudim/products' },
      { name: isRTL ? 'الفئات' : 'Categories', href: '/loudim/categories' },
    ]
    logoText = 'LOUD'
    logoSubtext = 'IM'
  } else if (isLoudStylesPage) {
    navigation = [
      { name: isRTL ? 'الرئيسية' : 'Home', href: '/' },
      { name: isRTL ? 'المنتجات' : 'Products', href: '/loud-styles/products' },
      { name: isRTL ? 'الفئات' : 'Categories', href: '/loud-styles/categories' },
    ]
    logoText = 'LOUD'
    logoSubtext = 'STYLES'
  } else {
    // Default navigation for other pages
    navigation = [
      { name: isRTL ? 'الرئيسية' : 'Home', href: '/' },
      { name: isRTL ? 'المنتجات' : 'Products', href: '/products' },
    ]
    logoText = 'LOUD'
    logoSubtext = 'BRANDS'
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    // If we're on a page that needs visible navbar, set scrolled to true immediately
    if (needsVisibleNavbar) {
      setIsScrolled(true)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [needsVisibleNavbar])

  if (!mounted) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Determine search URL based on current page
      let searchUrl = '/products'
      if (isLoudimPage) {
        searchUrl = '/loudim/products'
      } else if (isLoudStylesPage) {
        searchUrl = '/loud-styles/products'
      }
      router.push(`${searchUrl}?search=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

    ;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`w-full z-50 transition-all duration-300 h-16 ${isScrolled || needsVisibleNavbar
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700'
          : 'bg-transparent'
          }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Logo Section */}
            <div className="flex-shrink-0">
              <Link href={isLoudimPage ? "/loudim" : isLoudStylesPage ? "/loud-styles" : "/"} className="flex items-center group">
                <motion.div
                  className="transition-transform duration-300 group-hover:scale-105"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <h1 className="text-xl md:text-2xl tracking-wider cursor-pointer font-semibold" dir="ltr">
                    <span className="inline-block">
                      <span className={`transition-colors duration-300 group-hover:text-white font-bold ${isScrolled || needsVisibleNavbar ? 'text-gray-800 dark:text-white' : 'text-white'}`}>{logoText}</span>
                      <span className={`relative inline-block ${isLoudimPage ? '' : 'ml-2'}`}>
                        <span className={`transition-colors duration-300 group-hover:text-primary font-light ${isScrolled || needsVisibleNavbar ? 'text-gray-700 dark:text-gray-300' : 'text-white'}`}>{logoSubtext}</span>
                        <motion.span
                          className="absolute inset-0 bg-primary origin-left"
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ zIndex: -1 } as any}
                        />
                      </span>
                      <span className={`transition-colors duration-300 group-hover:text-white font-light text-xs ml-1 ${isScrolled || needsVisibleNavbar ? 'text-gray-700 dark:text-gray-300' : 'text-white'}`}>®</span>
                    </span>
                  </h1>
                </motion.div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className={`hidden lg:flex items-center justify-center flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center space-x-6 ${isRTL ? 'space-x-reverse' : ''}`}>
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg font-semibold text-base transition-all duration-300 group
                      ${pathname === item.href
                        ? `${isScrolled || needsVisibleNavbar ? 'text-primary bg-primary/10' : 'text-white bg-primary/30'}`
                        : `${isScrolled || needsVisibleNavbar ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10' : 'text-white hover:text-primary hover:bg-primary/20'}`
                      }
                    `}
                  >
                    {item.name}
                    <div className="absolute inset-0 rounded-lg bg-camel-100/0 group-hover:bg-camel-100/30 dark:group-hover:bg-camel-900/20 transition-all duration-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* Search */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                aria-label={isRTL ? 'بحث' : 'Search'}
                className={`relative p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                  ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                  : 'text-white hover:text-primary hover:bg-primary/20'
                  }`}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={isRTL ? 'تبديل المظهر' : 'Toggle theme'}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                  ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                  : 'text-white hover:text-primary hover:bg-primary/20'
                  }`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>


              {/* Language Switcher */}
              <LanguageSwitcher isTransparent={false} isLightBackground={isScrolled || needsVisibleNavbar} />

              {/* Admin Login */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                  ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                  : 'text-white hover:text-primary hover:bg-primary/20'
                  }`}
              >
                <Link href="/admin/login" aria-label={isRTL ? 'تسجيل دخول الأدمن' : 'Admin Login'}>
                  <LogIn className="w-5 h-5" />
                </Link>
              </Button>

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="sm"
                className={`relative p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                  ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                  : 'text-white hover:text-primary hover:bg-primary/20'
                  }`}
                asChild
              >
                <Link href="/wishlist" aria-label={isRTL ? 'المفضلة' : 'Wishlist'}>
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <Badge className={`absolute -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-red-500 to-red-700 text-white border-2 border-white dark:border-gray-900 ${isRTL ? '-left-1' : '-right-1'
                      }`}>
                      {wishlistCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCartOpen(true)}
                aria-label={isRTL ? 'السلة' : 'Cart'}
                className={`relative p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                  ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                  : 'text-white hover:text-primary hover:bg-primary/20'
                  }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className={`absolute -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-r from-camel-500 to-camel-700 text-white border-2 border-white dark:border-gray-900 ${isRTL ? '-left-1' : '-right-1'
                    }`}>
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {/* User Menu - Only show when user is logged in */}
              {user && (
                <div className={`flex items-center space-x-1 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                      ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                      : 'text-white hover:text-primary hover:bg-primary/20'
                      }`}
                    asChild
                  >
                    <Link href="/admin" aria-label={isRTL ? 'حسابي' : 'My Account'}>
                      <User className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    aria-label={isRTL ? 'تسجيل الخروج' : 'Logout'}
                    className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                      ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                      : 'text-white hover:text-primary hover:bg-primary/20'
                      }`}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={isRTL ? 'القائمة' : 'Menu'}
                    className={`lg:hidden p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isScrolled || needsVisibleNavbar
                      ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
                      : 'text-white hover:text-primary hover:bg-primary/20'
                      }`}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={isRTL ? 'right' : 'left'} className="w-80 backdrop-blur-md border-camel-200/20 dark:border-gray-700/20">
                  <div className="flex flex-col h-full">
                    {/* Mobile Navigation */}
                    <div className="flex-1 py-8">
                      <div className="space-y-2">
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300
                              ${pathname === item.href
                                ? 'text-camel-800 dark:text-camel-200 bg-camel-100/50 dark:bg-camel-900/30'
                                : 'text-gray-700 dark:text-gray-300 hover:text-camel-700 dark:hover:text-camel-200 hover:bg-camel-50/50 dark:hover:bg-camel-900/20'
                              }
                            `}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="border-t border-camel-200/20 dark:border-gray-700/20 pt-4">
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-camel-700 dark:hover:text-camel-200 hover:bg-camel-50/50 dark:hover:bg-camel-900/20"
                          onClick={() => setIsSearchOpen(true)}
                        >
                          <Search className="w-4 h-4 mr-3" />
                          {isRTL ? 'البحث' : 'Search'}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-camel-700 dark:hover:text-camel-200 hover:bg-camel-50/50 dark:hover:bg-camel-900/20"
                          onClick={() => setCartOpen(true)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-3" />
                          {isRTL ? 'السلة' : 'Cart'} ({totalItems})
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-camel-700 dark:hover:text-camel-200 hover:bg-camel-50/50 dark:hover:bg-camel-900/20"
                          asChild
                        >
                          <Link href="/wishlist">
                            <Heart className="w-4 h-4 mr-3" />
                            {isRTL ? 'المفضلة' : 'Wishlist'} ({wishlistCount})
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRTL ? 'ابحثي عن المنتجات...' : 'Search products...'}
                  className="w-full px-4 py-3 pl-12 pr-4 bg-white dark:bg-gray-900 border border-camel-200 dark:border-gray-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-camel-500 focus:border-transparent"
                  autoFocus
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-camel-500 to-camel-700 hover:from-camel-600 hover:to-camel-800 text-white"
                >
                  {isRTL ? 'بحث' : 'Search'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet */}
      <CartSheet open={isCartOpen} onOpenChange={setCartOpen} />
    </>
  )
}