import './globals.css';
import type { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic, Cairo } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { RTLProvider } from '@/components/rtl-provider';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

import { Suspense } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { TrackingScripts } from '@/components/analytics/tracking-scripts';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true
});

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  preload: true, // Enable preload for better performance
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true
});

export const metadata: Metadata = {
  title: 'LOUD BRANDS - Traditional Modern Fashion',
  description: 'Discover our exquisite collection of traditional Algerian fashion designed for the modern woman. Free delivery across Algeria.',
  keywords: 'Algerian fashion, traditional clothing, modern fashion, women clothing, Algeria, traditional dress',
  authors: [{ name: 'LOUD BRANDS' }],
  creator: 'LOUD BRANDS',
  publisher: 'LOUD BRANDS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://algerian-elegance.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LOUD BRANDS - Traditional Modern Fashion',
    description: 'Discover our exquisite collection of traditional Algerian fashion designed for the modern woman.',
    url: 'https://algerian-elegance.com',
    siteName: 'LOUD BRANDS',
    images: [
      {
        url: '/logos/logo-light.png',
        width: 1200,
        height: 630,
        alt: 'LOUD BRANDS Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LOUD BRANDS - Traditional Modern Fashion',
    description: 'Discover our exquisite collection of traditional Algerian fashion designed for the modern woman.',
    images: ['/logos/logo-light.png'],
  },
  icons: {
    icon: [
      { url: '/loud-brands-logo.png', sizes: 'any', type: 'image/png' },
      { url: '/logo-mini.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo-mini.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/ios logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/loud-brands-logo.png'],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="light" style={{ scrollbarGutter: 'stable' }}>
      <head>
        {/* Prevent theme-related CLS by applying theme class immediately - CRITICAL: Must run before any rendering */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Set theme immediately before any rendering
                  const html = document.documentElement;
                  const theme = localStorage.getItem('theme') || 'light';
                  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;
                  
                  // Remove all theme classes first
                  html.classList.remove('light', 'dark');
                  
                  // Add resolved theme immediately
                  html.classList.add(resolvedTheme);
                  
                  // Prevent any subsequent theme changes from causing shifts
                  const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        // Ensure theme class is always present
                        if (!html.classList.contains('light') && !html.classList.contains('dark')) {
                          html.classList.add(resolvedTheme);
                        }
                      }
                    });
                  });
                  
                  observer.observe(html, {
                    attributes: true,
                    attributeFilter: ['class']
                  });
                } catch (e) {
                  // Fallback: ensure light class is always present
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com" />

        {/* Preload only critical resources that are used on all pages */}
        {/* Note: manifest.json should use rel="manifest" not preload */}
        <link rel="manifest" href="/manifest.json" />

        {/* Prefetch likely next pages (removed API prefetch - not supported) */}
        <link rel="prefetch" href="/loud-styles" />
        <link rel="prefetch" href="/loud-styles/products" />
        <link rel="prefetch" href="/products" />

        <link rel="icon" href="/logo-mini.png" sizes="any" />
        <link rel="icon" href="/logo-mini.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/logo-mini.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/logo-mini.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LOUD BRANDS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#C4A47C" />
      </head>
      <body
        className={`${inter.variable} ${notoSansArabic.variable} ${cairo.variable} font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <RTLProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster />
            {/* <PWAInstallPrompt /> */}

          </RTLProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        {/* Vercel Analytics - Dynamically loaded to avoid 404 errors if not configured */}
        <SpeedInsights />
        <Analytics />
        <Suspense fallback={null}>
          <TrackingScripts />
        </Suspense>
      </body>
    </html>
  );
}