'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  Package,
  Truck,
  Phone,
  Mail,
  Home,
  ShoppingBag,
  Download,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

declare global {
  interface Window {
    fbq: any;
    gtag: any;
  }
}

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  image?: string
}

interface OrderDetails {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryType: string
  deliveryAddress: string
  wilayaId: number
  deliveryDeskName: string
  notes: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  orderDate: string
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    if (orderDetails?.customerPhone) {
      QRCode.toDataURL(orderDetails.customerPhone, {
        width: 100,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(url => setQrCodeUrl(url))
    }
  }, [orderDetails])

  useEffect(() => {
    setMounted(true)
    // Get order details from localStorage
    const storedOrderDetails = localStorage.getItem('lastOrderDetails')
    if (storedOrderDetails) {
      try {
        const parsedDetails = JSON.parse(storedOrderDetails)
        setOrderDetails(parsedDetails)

        // Track Purchase Event
        if (window.fbq) {
          window.fbq('track', 'Purchase', {
            currency: 'DZD',
            value: parsedDetails.total,
            content_ids: parsedDetails.items.map((item: any) => item.id),
            content_type: 'product',
            order_id: parsedDetails.orderNumber,
          })
        }
        if (window.gtag) {
          window.gtag('event', 'purchase', {
            transaction_id: parsedDetails.orderNumber,
            value: parsedDetails.total,
            currency: 'DZD',
            items: parsedDetails.items.map((item: any) => ({
              item_id: item.id,
              item_name: item.name,
              price: item.price,
              quantity: item.quantity,
              item_variant: item.size
            }))
          })
        }

      } catch (error) {
        console.error('Error parsing order details:', error)
      }
    }
  }, [])

  const generatePDFReceipt = async () => {
    if (!orderDetails) return

    setIsGeneratingPDF(true)
    try {
      // Create a hidden container for the receipt
      const receiptElement = document.createElement('div')
      receiptElement.style.position = 'absolute'
      receiptElement.style.left = '-9999px'
      receiptElement.style.top = '0'
      receiptElement.style.width = '210mm'
      receiptElement.style.minHeight = '297mm' // A4 height
      receiptElement.style.padding = '20mm'
      receiptElement.style.backgroundColor = '#ffffff'
      receiptElement.style.fontFamily = 'Arial, sans-serif' // Standard font that supports Arabic
      receiptElement.style.direction = 'rtl' // Right-to-left for Arabic
      receiptElement.dir = 'rtl'
      document.body.appendChild(receiptElement)

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(orderDetails.customerPhone, {
        width: 100,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      })

      // Construct HTML content
      const itemsHtml = orderDetails.items.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
          <div style="flex: 1; text-align: right;">
            <div style="font-weight: bold;">${item.name}</div>
            <div style="font-size: 12px; color: #666;">
              ${item.size ? `المقاس: ${item.size} - ` : ''}الكمية: ${item.quantity}
            </div>
          </div>
          <div style="text-align: left; font-weight: bold;">${item.price.toFixed(2)} دج</div>
        </div>
      `).join('')

      const deliveryInfo = orderDetails.deliveryType === 'HOME_DELIVERY'
        ? `العنوان: ${orderDetails.deliveryAddress}`
        : `نقطة الاستلام: ${orderDetails.deliveryDeskName}`

      receiptElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: bold; margin: 0;">LOUD BRANDS</h1>
          <p style="font-size: 16px; color: #666; margin: 5px 0;">الموضة التقليدية العصرية</p>
        </div>

        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;">
          <h2 style="font-size: 24px; font-weight: bold; margin: 0;">إيصال الطلب</h2>
          <p style="font-size: 14px; margin: 10px 0;">رقم الطلب: ${orderDetails.orderNumber}</p>
          <p style="font-size: 14px; margin: 5px 0;">${new Date(orderDetails.orderDate).toLocaleDateString('ar-DZ')} - ${new Date(orderDetails.orderDate).toLocaleTimeString('ar-DZ')}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">معلومات العميل</h3>
          <p style="margin: 5px 0;"><strong>الاسم:</strong> ${orderDetails.customerName}</p>
          <p style="margin: 5px 0;"><strong>الهاتف:</strong> ${orderDetails.customerPhone}</p>
          <p style="margin: 5px 0;"><strong>البريد الإلكتروني:</strong> ${orderDetails.customerEmail || 'غير متوفر'}</p>
          <p style="margin: 5px 0;"><strong>${deliveryInfo}</strong></p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">ملخص الطلب</h3>
          ${itemsHtml}
        </div>

        <div style="margin-top: 20px; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>المجموع الفرعي:</span>
            <span>${orderDetails.subtotal.toFixed(2)} دج</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>رسوم التوصيل:</span>
            <span>${orderDetails.deliveryFee.toFixed(2)} دج</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 20px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px;">
            <span>الإجمالي:</span>
            <span>${orderDetails.total.toFixed(2)} دج</span>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center;">
          <img src="${qrCodeDataURL}" alt="QR Code" style="width: 100px; height: 100px;" />
          <p style="font-size: 12px; margin-top: 5px;">امسح للتواصل</p>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>شكراً لطلبك!</p>
          <p>للدعم: 0794399412</p>
        </div>
      `

      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(receiptElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`receipt-${orderDetails.orderNumber}.pdf`)

      // Cleanup
      document.body.removeChild(receiptElement)

    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <div className="pt-16">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center"
          >
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold mb-4">تم تقديم الطلب بنجاح!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              شكراً لطلبك. لقد استلمنا طلبك وسنقوم بمعالجته قريباً.
            </p>

            {/* Order Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>تفاصيل الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-medium">رقم الطلب:</span>
                  <span className="font-bold text-primary">
                    {orderDetails?.orderNumber || searchParams.get('orderNumber') || 'ORD-123456'}
                  </span>
                </div>

                {orderDetails && (
                  <div className="text-right space-y-2 mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">العميل:</span>
                      <span>{orderDetails.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">الهاتف:</span>
                      <span>{orderDetails.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">المبلغ الإجمالي:</span>
                      <span className="font-bold text-primary">{orderDetails.total.toFixed(2)} دج</span>
                    </div>
                    <div className="col-span-2 mt-4 border-t pt-4">
                      <span className="font-medium mb-3 block text-right">المنتجات:</span>
                      <div className="space-y-3">
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 bg-background/50 p-3 rounded-lg">
                            <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                              {(() => {
                                const imageUrl = item.image || (item as any).images?.[0]?.url || (item as any).images?.[0] || (item as any).product?.image || (item as any).product?.images?.[0]?.url || (item as any).product?.images?.[0]
                                return imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    unoptimized={imageUrl?.startsWith('http')}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <ShoppingBag className="w-6 h-6" />
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="flex-1 text-right">
                              <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                              <div className="flex gap-4 text-xs text-muted-foreground mt-1 justify-end">
                                {item.size && <span>المقاس: {item.size}</span>}
                                <span>الكمية: {item.quantity}</span>
                              </div>
                              <div className="text-sm font-semibold text-primary mt-1">
                                {item.price.toFixed(2)} دج
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">التسليم المتوقع</h3>
                    <p className="text-sm text-muted-foreground">1-2 أيام</p>
                  </div>

                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Phone className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold">تأكيد الطلب</h3>
                    <p className="text-sm text-muted-foreground">سنتصل بك قريباً</p>
                  </div>
                </div>

                {/* Tracking and Receipt Buttons */}
                {/* Tracking and Receipt Buttons */}
                <div className="space-y-4 mt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={generatePDFReceipt}
                      disabled={isGeneratingPDF || !orderDetails}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 ml-2" />
                          تحميل الإيصال
                        </>
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="lg"
                          disabled={!orderDetails}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Eye className="w-5 h-5 ml-2" />
                          عرض الإيصال
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-center text-2xl font-bold">إيصال الطلب</DialogTitle>
                        </DialogHeader>
                        {orderDetails && (
                          <div className="p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                            <div className="text-center mb-8">
                              <h1 className="text-2xl font-bold mb-2">LOUD BRANDS</h1>
                              <p className="text-muted-foreground">الموضة التقليدية العصرية</p>
                            </div>

                            <div className="text-center mb-8 border-b-2 border-black pb-4">
                              <p className="mb-2">رقم الطلب: {orderDetails.orderNumber}</p>
                              <p className="text-sm">{new Date(orderDetails.orderDate).toLocaleDateString('ar-DZ')} - {new Date(orderDetails.orderDate).toLocaleTimeString('ar-DZ')}</p>
                            </div>

                            <div className="mb-8">
                              <h3 className="text-lg font-bold mb-4 border-b pb-2">معلومات العميل</h3>
                              <div className="space-y-2">
                                <p><strong>الاسم:</strong> {orderDetails.customerName}</p>
                                <p><strong>الهاتف:</strong> {orderDetails.customerPhone}</p>
                                <p><strong>البريد الإلكتروني:</strong> {orderDetails.customerEmail || 'غير متوفر'}</p>
                                <p><strong>{orderDetails.deliveryType === 'HOME_DELIVERY' ? `العنوان: ${orderDetails.deliveryAddress}` : `نقطة الاستلام: ${orderDetails.deliveryDeskName}`}</strong></p>
                              </div>
                            </div>

                            <div className="mb-8">
                              <h3 className="text-lg font-bold mb-4 border-b pb-2">ملخص الطلب</h3>
                              <div className="space-y-4">
                                {orderDetails.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center border-b pb-2">
                                    <div className="flex-1 text-right">
                                      <div className="font-bold">{item.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {item.size ? `المقاس: ${item.size} - ` : ''}الكمية: {item.quantity}
                                      </div>
                                    </div>
                                    <div className="font-bold">{item.price.toFixed(2)} دج</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-8 space-y-2">
                              <div className="flex justify-between">
                                <span>المجموع الفرعي:</span>
                                <span>{orderDetails.subtotal.toFixed(2)} دج</span>
                              </div>
                              <div className="flex justify-between">
                                <span>رسوم التوصيل:</span>
                                <span>{orderDetails.deliveryFee.toFixed(2)} دج</span>
                              </div>
                              <div className="flex justify-between text-xl font-bold border-t-2 border-black pt-4 mt-4">
                                <span>الإجمالي:</span>
                                <span>{orderDetails.total.toFixed(2)} دج</span>
                              </div>
                            </div>

                            {qrCodeUrl && (
                              <div className="mt-8 text-center">
                                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 mx-auto" />
                                <p className="text-xs mt-2">امسح للتواصل</p>
                              </div>
                            )}

                            <div className="mt-8 text-center text-sm text-muted-foreground border-t pt-4">
                              <p>شكراً لطلبك!</p>
                              <p>للدعم: 0794399412</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/track-order`}>
                      <Package className="w-5 h-5 ml-2" />
                      تتبع طلبك
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>الخطوات التالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-right">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">تأكيد الطلب</h4>
                      <p className="text-sm text-muted-foreground">
                        سيتصل بك فريقنا خلال 24 ساعة لتأكيد تفاصيل طلبك.
                      </p>
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ مهم: إذا لم ترد على مكالمتنا خلال 48 ساعة، سيتم إلغاء طلبك تلقائياً.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">معالجة الطلب</h4>
                      <p className="text-sm text-muted-foreground">
                        بمجرد التأكيد، سنقوم بتحضير طلبك للشحن.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">التسليم</h4>
                      <p className="text-sm text-muted-foreground">
                        سيتم تسليم طلبك إلى العنوان المحدد أو نقطة الاستلام خلال 1-2 أيام.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/loud-styles/products">
                  <ShoppingBag className="w-5 h-5 ml-2" />
                  منتجات Loud Styles
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link href="/">
                  <Home className="w-5 h-5 ml-2" />
                  العودة للرئيسية
                </Link>
              </Button>
            </div>

            {/* Contact Info */}
            <div className="mt-12 p-6 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-4">هل تحتاج مساعدة؟</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm">0794399412</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm">contact@loudbrands.com</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}