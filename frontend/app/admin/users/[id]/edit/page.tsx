'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Save,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditUserPage({ params }: EditUserPageProps) {
  // Unwrap params for Next.js 15 compatibility
  const unwrappedParams = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'USER',
    isActive: true
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoadingData(true)
      // For now, we'll use the same API as getting all users and filter by ID
      // In a real app, you'd have a separate endpoint for getting a single user
      const response = await api.admin.getUsers({ limit: 1000 }) as {
        users: Array<{
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          phone?: string;
          role: string;
        }>;
      }

      const user = response.users.find(u => u.id === unwrappedParams.id)
      if (user) {
        setUserData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          isActive: true
        })
      } else {
        toast.error('User not found')
        router.push('/admin/users')
      }
    } catch (error) {
      console.error('Fetch user error:', error)
      toast.error('Failed to load user data')
    } finally {
      setIsLoadingData(false)
    }
  }, [unwrappedParams.id, router])

  useEffect(() => {
    if (mounted) {
      fetchUserData()
    }
  }, [mounted, fetchUserData])

  if (!mounted) return null

  const handleInputChange = (field: string, value: any) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!userData.firstName || !userData.lastName || !userData.email) {
        toast.error('Please fill in all required fields')
        return
      }

      await api.admin.updateUser(unwrappedParams.id, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || undefined,
        role: userData.role
      })

      toast.success('User updated successfully!')
      router.push('/admin/users')
    } catch (error) {
      console.error('Update user error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit User</h1>
              <p className="text-muted-foreground">Update user information</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${unwrappedParams.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View User
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={userData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={userData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={userData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="AGENT_LIVRAISON">Agent de Livraison</SelectItem>
                      <SelectItem value="CONFIRMATRICE">Confirmatrice</SelectItem>
                      <SelectItem value="STOCK_MANAGER">Gestionnaire de Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={userData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">User account is active</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/users">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="elegant-gradient">
              {isLoading ? (
                'Updating...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}