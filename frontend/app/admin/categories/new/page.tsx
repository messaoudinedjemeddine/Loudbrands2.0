'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SingleImageUpload } from '@/components/ui/single-image-upload'
import { 
  ArrowLeft,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export default function NewCategoryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categoryData, setCategoryData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    image: undefined as string | undefined,
    slug: '',
    brandId: ''
  })

  const [brands, setBrands] = useState<Array<{ id: string; name: string; slug: string }>>([])

  useEffect(() => {
    setMounted(true)
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await api.admin.getBrands()
      setBrands(response as any)
    } catch (error) {
      console.error('Failed to fetch brands:', error)
      toast.error('Failed to load brands')
    }
  }

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
      // Validate required fields
      if (!categoryData.name) {
        toast.error('Please fill in the category name')
        return
      }

      if (!categoryData.brandId) {
        toast.error('Please select a brand')
        return
      }

      // Generate slug from name if not provided
      const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      // Call the API
      await api.admin.createCategory({
        name: categoryData.name,
        nameAr: categoryData.nameAr,
        description: categoryData.description,
        descriptionAr: categoryData.descriptionAr,
        image: categoryData.image,
        slug: slug,
        brandId: categoryData.brandId
      })

      toast.success('Category created successfully!')
      router.push('/admin/categories')
    } catch (error) {
      console.error('Failed to create category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create category')
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
              <h1 className="text-3xl font-bold">Add New Category</h1>
              <p className="text-muted-foreground">Create a new category for your products</p>
            </div>
          </div>
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
                    value={categoryData.nameAr}
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
                  value={categoryData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter category description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionAr">Description (Arabic)</Label>
                <Textarea
                  id="descriptionAr"
                  value={categoryData.descriptionAr}
                  onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                  placeholder="أدخل وصف الفئة بالعربية"
                  rows={4}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandId">Brand *</Label>
                <Select value={categoryData.brandId} onValueChange={(value) => handleInputChange('brandId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                'Creating...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Category
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}