'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Star, Zap, ArrowRight } from 'lucide-react';
import Image from 'next/image';
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

  useEffect(() => {
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
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app, please use your browser\'s menu and select "Add to Home Screen" or "Install App"');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  if (isInstalled || !showBanner || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/95 to-accent/95 backdrop-blur-md border-b border-primary/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - App info */}
          <div className="flex items-center space-x-4">
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
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">
                  LOUD BRANDS App
                </h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Star className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
              
              <p className="text-sm text-white/90 leading-relaxed">
                Get the full shopping experience with our mobile app
              </p>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleInstallClick}
              className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
