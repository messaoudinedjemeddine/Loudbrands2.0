'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    // Check media query for desktop/mobile
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Show prompt after a delay (5 seconds)
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('resize', checkDesktop);
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Use the browser's install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      // Show instructions for manual installation
      const instructions = /iPhone|iPad|iPod/.test(navigator.userAgent)
        ? 'Tap the Share button and select "Add to Home Screen"'
        : 'Click the browser menu and select "Install App"';

      alert(`To install this app:\n\n${instructions}`);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    setIsDismissed(true);
  };

  if (isInstalled || !showPrompt || isDismissed) {
    return null;
  }

  const title = isAdmin ? "Install Admin App" : "Install Loud Brands";
  const description = isAdmin
    ? "Get quick access to your admin dashboard directly from your home screen."
    : "Get the best shopping experience with our mobile app.";

  const PromptContent = () => (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-1.5 shadow-lg">
        <Image
          src="/icon-192x192.png"
          alt="LOUD BRANDS"
          width={64}
          height={64}
          className="rounded-xl w-full h-full object-cover"
        />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {description}
        </p>
      </div>
      <div className="flex flex-col w-full gap-2 sm:flex-row sm:gap-4 px-4 sm:px-0">
        <Button
          onClick={handleInstallClick}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Install Now
        </Button>
        <Button
          variant="outline"
          onClick={handleDismiss}
          className="w-full sm:w-auto"
        >
          Maybe Later
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="sr-only">{description}</DialogDescription>
          </DialogHeader>
          <PromptContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{description}</DrawerDescription>
        </DrawerHeader>
        <PromptContent />
        <DrawerFooter className="pt-2">
          {/* Footer content if needed */}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 