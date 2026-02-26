'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { useLocaleStore } from '@/lib/locale-store'
import { Locale, locales } from '@/lib/i18n'

const languageNames: Record<Locale, { name: string; nativeName: string }> = {
  ar: { name: 'Arabic', nativeName: 'العربية' },
  fr: { name: 'French', nativeName: 'Français' }
}

export function LanguageSwitcher({ isTransparent = false, isLightBackground = false }: { isTransparent?: boolean; isLightBackground?: boolean }) {
  const { locale, setLocale } = useLocaleStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-2 rounded-lg transition-all duration-300 ${isLightBackground
              ? 'text-gray-800 dark:text-gray-300 hover:text-primary hover:bg-primary/10'
              : 'text-white hover:text-amber-300 hover:bg-amber-500/20'
            }`}
        >
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-camel-200/20 dark:border-gray-700/20 shadow-lg arabic-font"
      >
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className="flex items-center justify-between cursor-pointer p-3 hover:bg-camel-50/50 dark:hover:bg-camel-900/20 transition-all duration-300"
          >
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {languageNames[lang].nativeName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {languageNames[lang].name}
              </span>
            </div>
            {locale === lang && (
              <Check className="w-4 h-4 text-camel-600 dark:text-camel-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}