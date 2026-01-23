'use client'

import Link from 'next/link';
import { WifiOff, Home, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto text-center p-6">
        <div className="mb-8">
          <WifiOff className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re Offline
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, you can still browse some of our content that&apos;s been saved for offline viewing.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Some features may not be available while offline
        </p>
      </div>
    </div>
  );
} 