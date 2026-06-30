'use client';

import { useState, useEffect } from 'react';
import { Download, X, Star, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on client-facing pages (not admin routes)
    const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/confirmatrice') || pathname?.startsWith('/agent-livraison');
    if (isAdminRoute) {
      return;
    }

    // Detect iOS
    const checkIOS = () => {
      const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
    };

    checkIOS();

    // Check if mobile device
    const checkMobile = () => {
      const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Only show on mobile devices
    if (!window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed the banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Show banner after a delay (3 seconds)
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 3000);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Automatically trigger install prompt
    if (deferredPrompt) {
      try {
        // Trigger the native install prompt immediately
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowBanner(false);
        } else {
          console.log('User dismissed the install prompt');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
      
      setDeferredPrompt(null);
    } else if (isIOS) {
      // For iOS, we can't auto-install, but we can show a simple message
      // The native share sheet will need to be triggered manually by the user
      alert('Pour installer l\'app sur iOS:\n1. Appuyez sur le bouton Partager\n2. Sélectionnez "Sur l\'écran d\'accueil"\n3. Appuyez sur "Ajouter"');
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app, please use your browser\'s menu and select "Add to Home Screen" or "Install App"');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  // Only show on mobile, non-admin pages
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/confirmatrice') || pathname?.startsWith('/agent-livraison');
  if (isInstalled || !showBanner || isDismissed || !isMobile || isAdminRoute) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/95 to-accent/95 backdrop-blur-md border-b border-primary/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left side - App info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 relative">
              <div className="w-12 h-12 rounded-xl bg-white/20 p-1 shadow-lg">
                <Image
                  src="/icon-192x192.png"
                  alt="LOUD BRANDS"
                  width={40}
                  height={40}
                  className="rounded-lg w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  LOUD BRANDS App
                </h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
              
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {isIOS ? 'Installez l\'app pour une meilleure expérience' : 'Get the full shopping experience'}
              </p>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!isIOS && (
              <Button
                onClick={handleInstallClick}
                className="bg-white text-primary hover:bg-white/90 font-semibold px-3 sm:px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Install</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
            
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
