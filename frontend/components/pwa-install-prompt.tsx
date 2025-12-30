'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, Plus } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
  const [isIOS, setIsIOS] = useState(false);

  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname === '/admin/login';

  useEffect(() => {
    // Only show for admin pages (including login page)
    if (!isAdmin) {
      return;
    }

    // Detect iOS
    const checkIOS = () => {
      const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
    };

    checkIOS();

    // Check media query for desktop/mobile
    const checkDesktop = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      setIsDesktop(!isMobile);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // Only show on mobile devices
    if (window.matchMedia('(min-width: 768px)').matches) {
      setIsDesktop(true);
      return; // Don't show on desktop
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed the prompt (admin-specific)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed-admin');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Show prompt after a delay (2 seconds for admin login page, 3 seconds for other admin pages)
    const delay = pathname === '/admin/login' ? 2000 : 3000;
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, delay);

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
  }, [isAdmin, pathname]);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, show detailed instructions
      setShowPrompt(false);
      // Show iOS instructions in a more user-friendly way
      // The instructions will be shown in the prompt content itself
      return;
    }

    if (deferredPrompt) {
      // Use the browser's install prompt (Android/Chrome)
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowPrompt(false);
        } else {
          console.log('User dismissed the install prompt');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }

      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      toast.info('Please use your browser menu to install this app');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Use admin-specific localStorage key
    localStorage.setItem('pwa-prompt-dismissed-admin', 'true');
    setIsDismissed(true);
  };

  // Only show for admin pages on mobile (including login page)
  if (!isAdmin || isInstalled || !showPrompt || isDismissed || isDesktop) {
    return null;
  }

  const title = "Install Admin Dashboard";
  const description = "Get quick access to your admin dashboard directly from your home screen. Manage orders, products, and more on the go!";

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

      {/* iOS-specific instructions */}
      {isIOS && (
        <div className="w-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Instructions pour iOS:
          </p>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-2 text-left list-decimal list-inside">
            <li>Appuyez sur le bouton <Share2 className="w-3 h-3 inline" /> <strong>Partager</strong> en bas de l'écran</li>
            <li>Faites défiler et sélectionnez <Plus className="w-3 h-3 inline" /> <strong>"Sur l'écran d'accueil"</strong></li>
            <li>Appuyez sur <strong>"Ajouter"</strong> en haut à droite</li>
          </ol>
        </div>
      )}

      <div className="flex flex-col w-full gap-2 sm:flex-row sm:gap-4 px-4 sm:px-0">
        {!isIOS && (
          <Button
            onClick={handleInstallClick}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Install Now
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleDismiss}
          className="w-full sm:w-auto"
        >
          {isIOS ? 'Fermer' : 'Maybe Later'}
        </Button>
      </div>
    </div>
  );

  // Always use Drawer for mobile admin prompt
  return (
    <Drawer open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{description}</DrawerDescription>
        </DrawerHeader>
        <PromptContent />
        <DrawerFooter className="pt-2 pb-4">
          <p className="text-xs text-muted-foreground text-center px-4">
            Install the app for faster access to your admin dashboard
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 