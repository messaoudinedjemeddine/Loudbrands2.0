'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { TrackingComponent } from '@/components/tracking-component'
import { Package, MapPin, Clock } from 'lucide-react'

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                تتبع طلبك
              </h1>
              <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
                أدخل رقم تتبع ياليدين الخاص بك للحصول على تفاصيل الطلب الشاملة،
                تحديثات الشحن في الوقت الفعلي، ومعلومات الطلب الكاملة
              </p>
              
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  ملاحظة: سيتم إرسال رقم التتبع إليك بمجرد شحن طلبك
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg" dir="rtl">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">تفاصيل الطلب</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg" dir="rtl">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">الموقع الحالي</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background/50 rounded-lg" dir="rtl">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">زمن التوصيل</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tracking Component */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <TrackingComponent />
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}