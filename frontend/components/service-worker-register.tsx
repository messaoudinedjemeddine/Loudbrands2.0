'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Force clear the old, broken CSP cache for returning users once
      const HAS_CLEARED = localStorage.getItem('sw_v5_cleared');
      if (!HAS_CLEARED) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((names) => {
            for (let name of names) {
              caches.delete(name);
            }
          });
        }
        localStorage.setItem('sw_v5_cleared', 'true');
        // Give it a split second to clear then force a hard reload
        setTimeout(() => window.location.reload(), 500);
        return;
      }

      // Register normally after clearing
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Always check for updates
        })
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('SW registered: ', registration);
          }

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((registrationError) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('SW registration failed: ', registrationError);
          }
        });
    }
  }, []);

  return null;
} 