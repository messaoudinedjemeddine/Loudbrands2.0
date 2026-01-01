'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingCart } from 'lucide-react';

interface SSENotification {
  type: string;
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  total?: number;
  url?: string;
  timestamp: string;
}

export function SSENotifications() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Only connect if user is authenticated and has admin role
    if (!user || !token) {
      return;
    }

    const allowedRoles = ['ADMIN', 'CONFIRMATRICE', 'AGENT_LIVRAISON', 'STOCK_MANAGER'];
    if (!allowedRoles.includes(user.role)) {
      return;
    }

    const connectSSE = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Get API URL and handle /api suffix properly
      // NEXT_PUBLIC_API_URL might be: https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com';
      
      // Remove trailing /api if present to avoid double /api/api
      apiUrl = apiUrl.replace(/\/api\/?$/, '');
      
      // Build SSE URL - ensure we have the base URL without /api, then add /api/sse
      const sseUrl = `${apiUrl}/api/sse/notifications?token=${encodeURIComponent(token)}`;
      
      console.log('🔗 Connecting to SSE endpoint:', sseUrl.replace(/token=[^&]+/, 'token=***'));
      console.log('🔍 API URL before processing:', process.env.NEXT_PUBLIC_API_URL);
      console.log('🔍 API URL after processing:', apiUrl);

      try {
        const eventSource = new EventSource(sseUrl);

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('✅ SSE connection opened successfully');
          console.log('🔗 SSE URL:', sseUrl.replace(/token=[^&]+/, 'token=***'));
          console.log('👤 User:', user?.email, 'Role:', user?.role);
          setIsConnected(true);
          reconnectAttempts.current = 0;
          
          // Clear any pending reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          
          // Show a test notification to confirm connection works
          toast.success('Connexion SSE établie', {
            description: 'Vous recevrez des notifications en temps réel pour les nouvelles commandes',
            duration: 3000,
          });
        };

        eventSource.onmessage = (event) => {
          try {
            console.log('📨 SSE message received:', event.data);
            const data: SSENotification = JSON.parse(event.data);
            console.log('📦 Parsed SSE data:', data);
            
            // Handle different notification types
            if (data.type === 'connected') {
              console.log('✅ SSE connected:', data.message);
              console.log('👤 Connected as user:', data.userId, 'Role:', data.userRole);
              console.log('🔍 Current user from store:', user?.id, 'Role:', user?.role);
              
              // Verify user ID matches
              if (data.userId && user?.id && data.userId !== user.id) {
                console.warn('⚠️ WARNING: SSE userId mismatch!', {
                  sseUserId: data.userId,
                  storeUserId: user.id
                });
              }
              return;
            }

            if (data.type === 'new_order') {
              console.log('🛒 New order notification received:', data);
              handleNewOrderNotification(data);
            } else {
              // Generic notification
              console.log('ℹ️ Generic notification received:', data);
              toast.info(data.title || 'Notification', {
                description: data.message,
                duration: 5000,
              });
            }
          } catch (error) {
            console.error('❌ Error parsing SSE message:', error);
            console.error('Raw event data:', event.data);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ SSE connection error:', error);
          console.error('EventSource readyState:', eventSource.readyState);
          setIsConnected(false);
          
          // Only close if it's actually closed
          if (eventSource.readyState === EventSource.CLOSED) {
            eventSource.close();

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts.current < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
              reconnectAttempts.current++;
              
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`🔄 Attempting to reconnect SSE (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
                connectSSE();
              }, delay);
            } else {
              console.error('❌ Max SSE reconnection attempts reached');
            }
          }
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        setIsConnected(false);
      }
    };

    const handleNewOrderNotification = (notification: SSENotification) => {
      console.log('🔔 Handling new order notification:', notification);
      
      // Show toast notification
      try {
        toast.success(notification.title || 'Nouvelle Commande', {
          description: notification.message || `Commande #${notification.orderNumber} reçue`,
          duration: 10000,
          icon: <ShoppingCart className="w-5 h-5" />,
          action: notification.url ? {
            label: 'Voir la commande',
            onClick: () => {
              console.log('🔗 Navigating to:', notification.url);
              router.push(notification.url!);
            }
          } : undefined,
        });
        console.log('✅ Toast notification displayed');
      } catch (toastError) {
        console.error('❌ Error displaying toast:', toastError);
      }

      // Optional: Play notification sound
      if (typeof window !== 'undefined' && 'Audio' in window) {
        try {
          // You can add a notification sound file if needed
          // const audio = new Audio('/notification.mp3');
          // audio.play().catch(() => {});
        } catch (error) {
          // Ignore audio errors
        }
      }
    };

    // Connect when component mounts
    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
    };
  }, [user, token, router]);

  // Render connection status indicator (always visible for debugging)
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-3 py-1 rounded-full text-xs shadow-lg ${
        isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        SSE: {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
    </div>
  );
}
