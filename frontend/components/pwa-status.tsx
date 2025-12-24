'use client';

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export function PWAStatus() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  if (!isStandalone) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 flex items-center space-x-2">
      <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
        App Mode
      </span>
    </div>
  );
} 