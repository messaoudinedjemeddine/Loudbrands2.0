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

    // Find existing manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;

    if (isAdminRoute) {
      // Use admin manifest for admin routes
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = '/admin-manifest.json';
    } else {
      // Use client manifest for client routes
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = '/manifest.json';
    }
  }, [pathname]);

  return null;
}
