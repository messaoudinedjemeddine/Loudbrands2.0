'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Store, 
  Mail, 
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  Upload
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState({
    // Store Settings
    storeName: 'Algerian Elegance',
    storeDescription: 'Premium traditional Algerian fashion for the modern woman',
    storeEmail: 'contact@algerian-elegance.com',
    storePhone: '+213 XXX XXX XXX',
    storeAddress: 'Algiers, Algeria',
    currency: 'DA',
    
    // Email Settings
    emailNotifications: true,
    orderConfirmationEmail: true,
    lowStockAlerts: true,
    customerNewsletters: true,
    
    // Notification Settings
    pushNotifications: true,
    smsNotifications: false,
    orderStatusUpdates: true,
    promotionalMessages: false,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    
    // Appearance Settings
    primaryColor: '#C4A47C',
    secondaryColor: '#D4B896',
    darkMode: false,
    compactLayout: false,
    
    // Localization Settings
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
    timezone: 'Africa/Algiers',
    dateFormat: 'DD/MM/YYYY'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleSave = (section: string) => {
    // Simulate saving settings
    toast.success(`${section} settings saved successfully!`)
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings and preferences
          </p>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="store" className="flex items-center">
              <Store className="w-4 h-4 mr-2" />
              Store
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="localization" className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Localization
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Store className="w-5 h-5 mr-2" />
                    Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={settings.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeEmail">Store Email</Label>
                      <Input
                        id="storeEmail"
                        type="email"
                        value={settings.storeEmail}
                        onChange={(e) => handleInputChange('storeEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storePhone">Store Phone</Label>
                      <Input
                        id="storePhone"
                        value={settings.storePhone}
                        onChange={(e) => handleInputChange('storePhone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={settings.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea
                      id="storeDescription"
                      value={settings.storeDescription}
                      onChange={(e) => handleInputChange('storeDescription', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">Store Address</Label>
                    <Textarea
                      id="storeAddress"
                      value={settings.storeAddress}
                      onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Store Logo</Label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-camel-400 to-camel-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">ع</span>
                      </div>
                      <Button variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Logo
                      </Button>
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Store')} className="elegant-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Store Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable email notifications for admin activities
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Order Confirmation Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Send confirmation emails to customers
                        </p>
                      </div>
                      <Switch
                        checked={settings.orderConfirmationEmail}
                        onCheckedChange={(checked) => handleInputChange('orderConfirmationEmail', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Low Stock Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when products are running low
                        </p>
                      </div>
                      <Switch
                        checked={settings.lowStockAlerts}
                        onCheckedChange={(checked) => handleInputChange('lowStockAlerts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Customer Newsletters</Label>
                        <p className="text-sm text-muted-foreground">
                          Send newsletters to subscribed customers
                        </p>
                      </div>
                      <Switch
                        checked={settings.customerNewsletters}
                        onCheckedChange={(checked) => handleInputChange('customerNewsletters', checked)}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Email')} className="elegant-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive SMS notifications for urgent matters
                        </p>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Order Status Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when order status changes
                        </p>
                      </div>
                      <Switch
                        checked={settings.orderStatusUpdates}
                        onCheckedChange={(checked) => handleInputChange('orderStatusUpdates', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Promotional Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about promotions and offers
                        </p>
                      </div>
                      <Switch
                        checked={settings.promotionalMessages}
                        onCheckedChange={(checked) => handleInputChange('promotionalMessages', checked)}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Notification')} className="elegant-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onCheckedChange={(checked) => handleInputChange('twoFactorAuth', checked)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                        <Input
                          id="passwordExpiry"
                          type="number"
                          value={settings.passwordExpiry}
                          onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        value={settings.loginAttempts}
                        onChange={(e) => handleInputChange('loginAttempts', parseInt(e.target.value))}
                        className="max-w-32"
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Security')} className="elegant-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance & Theme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="w-16 h-10"
                        />
                        <Input
                          value={settings.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable dark theme for the admin panel
                        </p>
                      </div>
                      <Switch
                        checked={settings.darkMode}
                        onCheckedChange={(checked) => handleInputChange('darkMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Compact Layout</Label>
                        <p className="text-sm text-muted-foreground">
                          Use a more compact layout to fit more content
                        </p>
                      </div>
                      <Switch
                        checked={settings.compactLayout}
                        onCheckedChange={(checked) => handleInputChange('compactLayout', checked)}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSave('Appearance')} className="elegant-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Appearance Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Localization Settings */}
          <TabsContent value="localization">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Localization & Regional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="defaultLanguage">Default Language</Label>
                      <select
                        id="defaultLanguage"
                        value={settings.defaultLanguage}
                        onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="en">English</option>
                        <option value="ar">العربية (Arabic)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <select
                        id="timezone"
                        value={settings.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="Africa/Algiers">Africa/Algiers</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select
                      id="dateFormat"
                      value={settings.dateFormat}
                      onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                      className="w-full max-w-48 px-3 py-2 border border-input rounded-md"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <Button onClick={() => handleSave('Localization')} className="elegant-gradient">
                    <Save className="w-4 h-4 mr-2" />
                    Save Localization Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}