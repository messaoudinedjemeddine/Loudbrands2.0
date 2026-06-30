'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send
} from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { GoogleMapEmbed } from '@/components/google-map-embed'
import { useLocaleStore } from '@/lib/locale-store'

export function Footer() {
  const { t, isRTL } = useLocaleStore()

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = (e.target as HTMLFormElement).elements.namedItem('email') as HTMLInputElement;
    console.log('Subscribed with:', email.value)
  }

  return (
    <footer className="bg-background border-t hidden md:block" style={{ minHeight: '1px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Middle Section with Links */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8" style={{ minHeight: '200px' }}>
          <div className="col-span-2 md:col-span-1" style={{ minHeight: '150px' }}>
            <h3 className="font-semibold mb-4">{t.footer.contactInfo}</h3>
            <div className="space-y-4 text-muted-foreground">
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span>0794399412</span>
              </div>
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span>contact@loudbrands.com</span>
              </div>
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="cursor-help hover:text-primary transition-colors border-b border-dashed border-muted-foreground/50">
                      {isRTL ? 'باتنة، الجزائر' : 'Batna, Algeria'}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-0 overflow-hidden text-left" side="top">
                    <div className="h-60 w-full relative">
                      <GoogleMapEmbed />
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{isRTL ? 'السبت-الخميس: 9ص-6م' : 'Sat-Thu: 9AM-6PM'}</span>
              </div>
            </div>
          </div>

          <div style={{ minHeight: '150px' }}>
            <h3 className="font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-3">
              <li><Link href="/loudim/categories" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">{isRTL ? 'فئات LOUDIM' : 'LOUDIM Categories'}</Link></li>
              <li><Link href="/loud-styles/categories" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">{isRTL ? 'فئات LOUD STYLES' : 'LOUD STYLES Categories'}</Link></li>
              <li><Link href="/loudim/products" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">{isRTL ? 'منتجات LOUDIM' : 'LOUDIM Products'}</Link></li>
              <li><Link href="/loud-styles/products" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">{isRTL ? 'منتجات LOUD STYLES' : 'LOUD STYLES Products'}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t.footer.customerService}</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">{t.nav.contact}</Link></li>
              <li><Link href="/track-order" className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">{t.nav.trackOrder}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{isRTL ? 'تابعنا' : 'Follow Us'}</h3>
            <ul className="space-y-3">
              <li><a href="https://www.facebook.com/share/195ch9DabE/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''} text-gray-600 dark:text-gray-400 hover:text-primary transition-colors`}><Facebook className="w-5 h-5" /><span>Facebook</span></a></li>
              <li><a href="https://www.instagram.com/loudstyless?igsh=MTE4bnlzM2dyYXB2YQ==" target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''} text-gray-600 dark:text-gray-400 hover:text-primary transition-colors`}><Instagram className="w-5 h-5" /><span>LOUD Styles</span></a></li>
              <li><a href="https://www.instagram.com/loudim_brand?igsh=OXdzMGttejQzOWoy" target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''} text-gray-600 dark:text-gray-400 hover:text-primary transition-colors`}><Instagram className="w-5 h-5" /><span>LOUDIM</span></a></li>
              <li><a href="https://www.tiktok.com/@loudstyles?_t=ZS-8zI7QXNey0L&_r=1" target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''} text-gray-600 dark:text-gray-400 hover:text-primary transition-colors`}><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg><span>TikTok</span></a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 py-6 border-t flex justify-center items-center">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} LOUD BRANDS. {t.footer.allRightsReserved}.
          </p>
        </div>
      </div>
    </footer>
  );
}