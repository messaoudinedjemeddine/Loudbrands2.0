'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Loader2,
  AlertTriangle,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/admin-layout'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

const roleColors = {
  ADMIN: 'bg-green-100 text-green-800',
  CONFIRMATRICE: 'bg-purple-100 text-purple-800',
  AGENT_LIVRAISON: 'bg-orange-100 text-orange-800',
  STOCK_MANAGER: 'bg-blue-100 text-blue-800'
}

const roleIcons = {
  ADMIN: Shield,
  CONFIRMATRICE: Phone,
  AGENT_LIVRAISON: Users,
  STOCK_MANAGER: Package
}

const roleNames = {
  ADMIN: 'Admin',
  CONFIRMATRICE: 'Confirmatrice',
  AGENT_LIVRAISON: 'Agent de livraison',
  STOCK_MANAGER: 'Gestionnaire de Stock'
}

export default function AdminUsersPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined
      }

      const data = await api.admin.getUsers({
        ...params,
        search: searchQuery || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined
      }) as {
        users: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }

      setUsers(data.users)
      setFilteredUsers(data.users)
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }))

    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchQuery, roleFilter])

  useEffect(() => {
    if (mounted) {
      fetchUsers()
    }
  }, [mounted, fetchUsers])

  if (!mounted) return null

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchUsers}>Retry</Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return
      }

      await api.admin.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setFilteredUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('User deleted successfully')
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const updatedUser = await api.admin.updateUser(userId, { role: newRole }) as User
      setUsers(prev => prev.map(u =>
        u.id === userId ? updatedUser : u
      ))
      setFilteredUsers(prev => prev.map(u =>
        u.id === userId ? updatedUser : u
      ))
      toast.success('User role updated successfully')
    } catch (error) {
      console.error('Update role error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user role')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Utilisateurs</h1>
            <p className="text-muted-foreground">
              Gérez les comptes utilisateurs et les permissions
            </p>
          </div>
          <Button className="elegant-gradient" asChild>
            <Link href="/admin/users/new">
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter Utilisateur
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total utilisateurs enregistrés
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
                <CardTitle className="text-sm font-medium">Confirmatrices</CardTitle>
                <Phone className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'CONFIRMATRICE').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Personnel centre d'appel
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
                <CardTitle className="text-sm font-medium">Agents Livraison</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'AGENT_LIVRAISON').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Coordinateurs de livraison
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher utilisateurs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les Rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les Rôles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CONFIRMATRICE">Confirmatrice</SelectItem>
                  <SelectItem value="AGENT_LIVRAISON">Agent de livraison</SelectItem>
                  <SelectItem value="STOCK_MANAGER">Gestionnaire de Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user, index) => {
                const RoleIcon = roleIcons[user.role as keyof typeof roleIcons]

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-camel-400 to-camel-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">
                            {user.firstName} {user.lastName}
                          </h3>
                          <Badge className={roleColors[user.role as keyof typeof roleColors]}>
                            {(() => {
                              const IconComponent = roleIcons[user.role as keyof typeof roleIcons];
                              return IconComponent ? <IconComponent className="w-3 h-3 mr-1" /> : null;
                            })()}
                            {roleNames[user.role as keyof typeof roleNames] || user.role}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Rejoint le {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>


                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleUpdateRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="CONFIRMATRICE">Confirmatrice</SelectItem>
                          <SelectItem value="AGENT_LIVRAISON">Agent de livraison</SelectItem>
                          <SelectItem value="STOCK_MANAGER">Gestionnaire de Stock</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez d'ajuster vos filtres ou ajoutez un nouvel utilisateur
                  </p>
                  <Button asChild>
                    <Link href="/admin/users/new">Ajouter Utilisateur</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}