'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Tag, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  Package
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'

interface Category {
  id: string
  name: string
  nameAr?: string
  slug: string
  description?: string
  descriptionAr?: string
  image?: string
  productCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminCategoriesPage() {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { token, hasHydrated } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (hasHydrated) {
      fetchCategories()
    }
  }, [hasHydrated])

  const fetchCategories = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data)
      setFilteredCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.nameAr && category.nameAr.includes(searchQuery)) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories(categories)
    }
  }, [searchQuery, categories])

  if (!mounted) return null

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      setCategories(prev => prev.filter(c => c.id !== categoryId))
      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des catégories...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Catégories</h1>
            <p className="text-muted-foreground">
              Gérez les catégories de produits et l'organisation
            </p>
          </div>
          
          {/* Brand-specific Category Links */}
          <div className="flex items-center space-x-3">
            <Link href="/admin/categories/loudim">
              <Button variant="outline" className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Catégories LOUDIM</span>
              </Button>
            </Link>
            <Link href="/admin/categories/loud-styles">
              <Button variant="outline" className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Catégories LOUD STYLES</span>
              </Button>
            </Link>
            <Button className="elegant-gradient" asChild>
              <Link href="/admin/categories/new">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Catégorie
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">
                  Catégories actives
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dans toutes les catégories
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Moy Produits</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {categories.length > 0 ? Math.round(categories.reduce((sum, c) => sum + (c.productCount || 0), 0) / categories.length) : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Par catégorie
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Rechercher Catégories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher catégories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={category.image || '/placeholder-category.jpg'}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 text-black px-2 py-1 rounded text-sm font-medium">
                      {category.productCount} produits
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {category.name}
                    </h3>
                    {category.nameAr && (
                      <p className="text-white/90 text-sm">
                        {category.nameAr}
                      </p>
                    )}
                  </div>
                </div>

                <CardContent className="p-6">
                  {category.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Slug: {category.slug}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Créé le: {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/categories/${category.slug}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/admin/categories/${category.id}/edit`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune catégorie trouvée</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'Essayez d\'ajuster vos critères de recherche' : 'Commencez par créer votre première catégorie'}
            </p>
            <Button asChild>
              <Link href="/admin/categories/new">Ajouter Catégorie</Link>
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}