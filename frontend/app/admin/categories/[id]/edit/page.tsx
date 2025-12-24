'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SingleImageUpload } from '@/components/ui/single-image-upload'
import { 
  ArrowLeft,
  Save,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface EditCategoryPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  // Unwrap params for Next.js 15 compatibility
  const unwrappedParams = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { token, hasHydrated } = useAuthStore()
  const [categoryData, setCategoryData] = useState<Category>({
    id: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    image: undefined,
    slug: '',
    createdAt: '',
    updatedAt: ''
  })

  const fetchCategory = useCallback(async () => {
    if (!token) {
      toast.error('Authentication required')
      router.push('/admin/login')
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${unwrappedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch category')
      }

      const data = await response.json()
      setCategoryData(data)
    } catch (error) {
      console.error('Failed to fetch category:', error)
      toast.error('Failed to load category')
    }
  }, [unwrappedParams.id, token, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (hasHydrated && mounted) {
      fetchCategory()
    }
  }, [hasHydrated, mounted, fetchCategory])

  if (!mounted) return null

  const handleInputChange = (field: string, value: any) => {
    setCategoryData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (image: string | undefined) => {
    setCategoryData(prev => ({ ...prev, image }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Generate slug from name if not provided
      const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const response = await fetch(`/api/admin/categories/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: categoryData.name,
          nameAr: categoryData.nameAr,
          description: categoryData.description,
          descriptionAr: categoryData.descriptionAr,
          image: categoryData.image,
          slug: slug
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      toast.success('Category updated successfully!')
      router.push('/admin/categories')
    } catch (error) {
      console.error('Failed to update category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin/categories">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Category</h1>
              <p className="text-muted-foreground">Update category information and settings</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/categories/${categoryData.slug}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Category
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={categoryData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">Category Name (Arabic)</Label>
                  <Input
                    id="nameAr"
                    value={categoryData.nameAr || ''}
                    onChange={(e) => handleInputChange('nameAr', e.target.value)}
                    placeholder="أدخل اسم الفئة بالعربية"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={categoryData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter category description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                <Textarea
                  id="descriptionAr"
                  value={categoryData.descriptionAr || ''}
                  onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                  placeholder="أدخل وصف الفئة بالعربية"
                  rows={4}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={categoryData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="auto-generated from name"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to auto-generate from the category name
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category Image */}
          <Card>
            <CardHeader>
              <CardTitle>Category Image</CardTitle>
            </CardHeader>
            <CardContent>
              <SingleImageUpload
                image={categoryData.image}
                onImageChange={handleImageChange}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/categories">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="elegant-gradient">
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}