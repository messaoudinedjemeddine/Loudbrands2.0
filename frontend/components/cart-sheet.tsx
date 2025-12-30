'use client'

import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store'
import { useLocaleStore } from '@/lib/locale-store'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore()
  const { t, isRTL } = useLocaleStore()

  const totalPrice = getTotalPrice()

  if (items.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px]" side={isRTL ? "left" : "right"}>
          <SheetHeader>
            <SheetTitle>{t.nav.cart}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t.common.emptyCart}</h3>
            <p className="text-muted-foreground mb-6">
              {isRTL ? 'أضف بعض المنتجات للبدء' : 'Add some products to get started'}
            </p>
            <Button asChild onClick={() => onOpenChange(false)}>
              <Link href="/loud-styles/products">{t.common.continueShopping}</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col" side={isRTL ? "left" : "right"}>
        <SheetHeader>
          <SheetTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            {t.nav.cart}
            <Badge variant="secondary">
              {items.length} {t.common.itemsInCart}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {items.map((item) => (
              <motion.div
                key={`${item.id}-${item.sizeId || 'no-size'}`}
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -50 : 50 }}
                className={`flex items-center space-x-4 p-4 bg-muted/30 rounded-lg ${isRTL ? 'space-x-reverse flex-row-reverse' : ''}`}
              >
                <div className="relative w-16 h-16 bg-background rounded-md overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h4 className="font-medium truncate">{item.name}</h4>
                  {item.size && (
                    <p className="text-sm text-muted-foreground">
                      {t.common.size}: {item.size}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-primary">
                    {item.price.toLocaleString()} {t.common.currency}
                  </p>
                </div>

                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item.sizeId)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <span className="w-8 text-center font-medium">{item.quantity}</span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.sizeId)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id, item.sizeId)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 mt-auto">
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="text-lg font-semibold">{t.common.total}:</span>
            <span className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString()} {t.common.currency}
            </span>
          </div>

          <div className="space-y-2">
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout" onClick={() => onOpenChange(false)}>
                {t.common.proceedToCheckout}
              </Link>
            </Button>

            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/loud-styles/products" onClick={() => onOpenChange(false)}>
                {t.common.continueShopping}
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={clearCart}
            >
              {t.common.clearCart}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}