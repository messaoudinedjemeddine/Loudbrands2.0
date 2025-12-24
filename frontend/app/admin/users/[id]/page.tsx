'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  User,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'

interface UserDetailPageProps {
  params: Promise<{
    id: string
  }>
}

const mockUser = {
  id: '1',
  firstName: 'Ahmed',
  lastName: 'Benali',
  email: 'ahmed.benali@example.com',
  phone: '+213 555 123 456',
  role: 'USER',
  isActive: true,
  createdAt: '2024-01-15T10:30:00Z',
  lastLogin: '2024-01-20T14:20:00Z',
  orderCount: 5,
  totalSpent: 125000,
  orders: [
    {
      id: 'ORD-001',
      orderNumber: 'ORD-001',
      total: 25000,
      status: 'DONE',
      createdAt: '2024-01-20T10:30:00Z'
    },
    {
      id: 'ORD-002',
      orderNumber: 'ORD-002',
      total: 18000,
      status: 'IN_TRANSIT',
      createdAt: '2024-01-18T14:20:00Z'
    }
  ]
}

const roleColors = {
  USER: 'bg-blue-100 text-blue-800',
  CALLCENTER: 'bg-green-100 text-green-800',
  DELIVERY: 'bg-purple-100 text-purple-800',
  SUPERADMIN: 'bg-red-100 text-red-800'
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const [mounted, setMounted] = useState(false)
  const [user] = useState(mockUser)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
              <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
              <p className="text-muted-foreground">User Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={roleColors[user.role as keyof typeof roleColors]}>
              {user.role}
            </Badge>
            {user.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
            <Button asChild>
              <Link href={`/admin/users/${user.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">First Name</p>
                    <p className="text-muted-foreground">{user.firstName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Name</p>
                    <p className="text-muted-foreground">{user.lastName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{user.phone}</p>
                  </div>
                  <div>
                    <p className="font-medium">Role</p>
                    <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                      {user.role}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user.role === 'USER' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.total.toLocaleString()} DA</p>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stats & Actions */}
          <div className="space-y-6">
            {user.role === 'USER' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Order Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{user.orderCount}</div>
                      <p className="text-muted-foreground">Total Orders</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {user.totalSpent.toLocaleString()} DA
                      </div>
                      <p className="text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {Math.round(user.totalSpent / user.orderCount).toLocaleString()} DA
                      </div>
                      <p className="text-muted-foreground">Average Order</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Joined</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button className="w-full" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Call User
                </Button>
                <Button className="w-full elegant-gradient" asChild>
                  <Link href={`/admin/users/${user.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit User
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}