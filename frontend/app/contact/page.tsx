'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Twitter,
  Headphones
} from 'lucide-react'

export default function ContactPage() {

  const contactInfo = [
    {
      icon: Phone,
      title: 'الهاتف',
      details: ['0794399412'],
      description: 'نحن هنا لمساعدتك'
    },
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      details: ['contact@loudbrands.com'],
      description: 'راسلنا في أي وقت'
    },
    {
      icon: MapPin,
      title: 'العنوان',
      details: ['باتنة، الجزائر'],
      description: 'زرنا في مقرنا'
    },
    {
      icon: Clock,
      title: 'ساعات العمل',
      details: ['السبت - الخميس: 9:00 ص - 6:00 م'],
      description: 'أوقات الدوام'
    }
  ]

  const faqItems = [
    {
      question: 'ما هي طرق الدفع المتاحة؟',
      answer: 'نحن نقبل الدفع عند الاستلام حالياً. قريباً سنوفر خدمة الدفع عبر البطاقة الذهبية.'
    },
    {
      question: 'ما هي سياسة الاستبدال والاسترجاع؟',
      answer: 'لدينا سياسة استبدال واسترجاع مرنة خلال 48 ساعة من استلام الطلب، بشرط أن يكون المنتج في حالته الأصلية.'
    },
    {
      question: 'ما هي مناطق التوصيل؟',
      answer: 'نحن نوفر خدمة التوصيل إلى جميع ولايات الجزائر (58 ولاية).'
    }
  ]

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="pt-16">
        {/* Header */}
        <section className="bg-muted/30 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">اتصل بنا</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                نحن هنا للإجابة على استفساراتكم ومساعدتكم. لا تترددوا في التواصل معنا.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <info.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{info.title}</h3>
                      <div className="space-y-1 mb-3">
                        {info.details.map((detail, idx) => (
                          <p key={idx} className="text-muted-foreground" dir="ltr">{detail}</p>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-4">الأسئلة الشائعة</h2>
                <p className="text-muted-foreground">إجابات على أكثر الأسئلة شيوعاً</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-primary" />
                    مركز المساعدة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {faqItems.map((item, index) => (
                      <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                        <h4 className="font-semibold text-lg mb-2 text-primary">{item.question}</h4>
                        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>


      </div>
    </div>
  )
}