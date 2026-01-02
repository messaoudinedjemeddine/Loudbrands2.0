'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Tag,
  BarChart3,
  Home,
  Truck,
  Phone,
  FileText,
  MapPin,
  Sun,
  Moon,
  User,
  Menu,
  Building2,
  CheckCircle
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { SSENotifications } from '@/components/admin/sse-notifications'
import { NotificationBell } from '@/components/admin/notification-bell'

// Role-based navigation configuration
const getNavigationByRole = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return [
        { name: 'Tableau de Bord', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Produits', href: '/admin/products', icon: Package },
        { name: 'Inventaire', href: '/admin/inventory', icon: Package },
        { name: 'Inventaire Intelligent', href: '/admin/inventory/smart', icon: Package },
        { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Catégories', href: '/admin/categories', icon: Tag },
        { name: 'Utilisateurs', href: '/admin/users', icon: Users },
        { name: 'Ateliers', href: '/admin/ateliers', icon: Building2 },
        { name: 'Expédition', href: '/admin/shipping', icon: Truck },
        { name: 'Analyses', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Analyses de Profit', href: '/admin/analytics/profit', icon: BarChart3 },
        { name: 'Paramètres', href: '/admin/settings', icon: Settings },
      ]
    case 'CONFIRMATRICE':
      return [
        { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
      ]
    case 'AGENT_LIVRAISON':
      return [
        { name: 'Commandes Confirmées', href: '/admin/dashboard/agent_livraison?tab=confirmed', icon: CheckCircle },
        { name: 'Expéditions Yalidine', href: '/admin/dashboard/agent_livraison?tab=all-parcels', icon: Package },
      ]
    case 'STOCK_MANAGER':
      return [
        { name: 'Ateliers', href: '/admin/ateliers', icon: Building2 },
        { name: 'Inventaire Intelligent', href: '/admin/inventory/smart', icon: Package },
      ]
    default:
      return [
        { name: 'Tableau de Bord', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Paramètres', href: '/admin/settings', icon: Settings },
      ]
  }
}

// Role display names
const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'Administrateur'
    case 'CONFIRMATRICE':
      return 'Confirmatrice (Centre d\'Appel)'
    case 'AGENT_LIVRAISON':
      return 'Agent de Livraison'
    case 'STOCK_MANAGER':
      return 'Gestionnaire de Stock'
    default:
      return 'Utilisateur'
  }
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Force light mode for admin dashboard
    setTheme('light')
  }, [setTheme])

  useEffect(() => {
    // Check authentication after mount
    if (mounted && !isAuthenticated()) {
      router.push('/admin/login')
      return
    }

    // Redirect to appropriate dashboard if on main admin page
    if (mounted && user && pathname === '/admin') {
      const role = user.role.toLowerCase()
      router.push(`/admin/dashboard/${role}`)
    }
  }, [mounted, isAuthenticated, user, pathname, router])

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  // Remove theme toggle for admin dashboard - always light mode

  if (!mounted) return null

  // Show loading while checking authentication
  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  /* Existing code ... */
  const navigation = getNavigationByRole(user.role)
  const roleDisplayName = getRoleDisplayName(user.role)

  const Sidebar = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Logo */}
      <div className="flex items-center px-4 py-3 border-b border-r">
        <Link href={`/admin/dashboard/${user.role.toLowerCase()}`} className="flex items-center space-x-2">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/logos/logo-dark.png"
              alt="Loudim Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-bold block truncate">Tableau de Bord Admin</span>
            <p className="text-xs text-muted-foreground truncate">{roleDisplayName}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          // Check if current path starts with the navigation item's href
          // This handles nested routes like /admin/products/new, /admin/products/123/edit, etc.
          // For dashboard, only match exact path or dashboard-specific routes
          const isActive = item.href === '/admin/dashboard'
            ? (pathname === item.href || pathname.startsWith('/admin/dashboard/'))
            : (pathname === item.href || pathname.startsWith(item.href + '/'))



          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${isActive
                ? 'bg-primary text-black shadow-md pl-3 pr-2'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:shadow-sm px-2'
                }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute top-0 bottom-0 w-1 bg-primary-foreground/30 rounded-full left-0" />
              )}
              <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Actions */}
      <div className="p-3 border-t border-r">
        <div className="flex items-center space-x-2 mb-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user.avatar} alt={user.firstName} />
            <AvatarFallback className="text-xs">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-1 h-8"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:w-60' : 'lg:w-0 overflow-hidden'
            }`}
        >
          <Sidebar className="bg-card w-60 h-full border-r" />
        </div>

        {/* Mobile sidebar */}
        <div className="lg:hidden flex flex-col fixed inset-y-0 inset-x-0 z-50 pointer-events-none">
          {/* Mobile Header */}
          <div className="h-16 bg-card border-b flex items-center justify-between px-4 pointer-events-auto" dir="ltr">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-4">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-card border-r">
                  <Sidebar />
                </SheetContent>
              </Sheet>

              <div className="flex items-center space-x-2">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src="/logos/logo-dark.png"
                    alt="Loudim Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-sm font-bold block truncate">Loudim Admin</span>
              </div>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Main content */}
        <div
          className={`flex-1 min-w-0 pt-16 lg:pt-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:pl-60' : 'lg:pl-0'
            }`}
        >
          <main className="p-4 lg:p-6">
            <div className="mb-4 hidden lg:flex items-center justify-between" dir="ltr">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <NotificationBell />
            </div>
            <div className="w-full max-w-full overflow-x-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      {/* PWA Install Prompt - Only shows on mobile for admin dashboard */}
      <PWAInstallPrompt />
      {/* SSE Notifications - Real-time order notifications */}
      <SSENotifications />
    </div>
  )
}