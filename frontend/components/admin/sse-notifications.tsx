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

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com';
      // EventSource doesn't support custom headers, so we pass token as query parameter
      const sseUrl = `${apiUrl}/api/sse/notifications?token=${encodeURIComponent(token)}`;

      try {
        const eventSource = new EventSource(sseUrl);

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('SSE connection opened');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          
          // Clear any pending reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        eventSource.onmessage = (event) => {
          try {
            const data: SSENotification = JSON.parse(event.data);
            
            // Handle different notification types
            if (data.type === 'connected') {
              console.log('SSE connected:', data.message);
              return;
            }

            if (data.type === 'new_order') {
              handleNewOrderNotification(data);
            } else {
              // Generic notification
              toast.info(data.title || 'Notification', {
                description: data.message,
                duration: 5000,
              });
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          setIsConnected(false);
          eventSource.close();

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectAttempts.current++;
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect SSE (attempt ${reconnectAttempts.current})...`);
              connectSSE();
            }, delay);
          } else {
            console.error('Max SSE reconnection attempts reached');
          }
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        setIsConnected(false);
      }
    };

    const handleNewOrderNotification = (notification: SSENotification) => {
      // Show toast notification
      toast.success(notification.title, {
        description: notification.message,
        duration: 8000,
        icon: <ShoppingCart className="w-5 h-5" />,
        action: notification.url ? {
          label: 'Voir la commande',
          onClick: () => {
            router.push(notification.url!);
          }
        } : undefined,
      });

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

  // This component doesn't render anything visible
  // It just handles SSE connections in the background
  return null;
}
