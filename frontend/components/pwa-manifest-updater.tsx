'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PWAManifestUpdater() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if we're on an admin route
    const isAdminRoute = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/confirmatrice') || 
                         pathname?.startsWith('/agent-livraison');

    // Find existing manifest link by ID or by rel
    let manifestLink = document.querySelector('#pwa-manifest') as HTMLLinkElement || 
                       document.querySelector('link[rel="manifest"]') as HTMLLinkElement;

    if (isAdminRoute) {
      // Use admin manifest for admin routes - completely separate PWA
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.id = 'pwa-manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = '/admin-manifest.json';
      console.log('Admin PWA manifest loaded: /admin-manifest.json (start_url: /admin)');
    } else {
      // Use client manifest for client routes
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.id = 'pwa-manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = '/manifest.json';
      console.log('Client PWA manifest loaded: /manifest.json (start_url: /)');
    }
  }, [pathname]);

  return null;
}
