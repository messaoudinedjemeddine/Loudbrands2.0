'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingCart } from 'lucide-react';

interface SSENotification {
  type: string;
  title?: string;
  message?: string;
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  total?: number;
  url?: string;
  timestamp: string;
  userId?: string;
  userRole?: string;
}

export function SSENotifications() {
  const { user, token } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>('default');

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserNotificationPermission(Notification.permission);
      
      // Request permission if not already granted or denied
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setBrowserNotificationPermission(permission);
          if (permission === 'granted') {
            console.log('✅ Browser notification permission granted');
          } else {
            console.log('❌ Browser notification permission denied');
          }
        });
      }
    }
  }, []);

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
      
      // Store notification in the store
      addNotification({
        type: notification.type,
        title: notification.title || 'Nouvelle Commande',
        message: notification.message || `Commande #${notification.orderNumber} reçue`,
        orderId: notification.orderId,
        orderNumber: notification.orderNumber,
        customerName: notification.customerName,
        total: notification.total,
        url: notification.url,
      });
      
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

      // Show browser push notification (works on mobile browsers too)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (browserNotificationPermission === 'granted') {
          try {
            const browserNotification = new Notification(notification.title || 'Nouvelle Commande', {
              body: notification.message || `Commande #${notification.orderNumber} de ${notification.customerName || 'un client'}. Total: ${notification.total?.toLocaleString() || '0'} DA`,
              icon: '/logos/logo-dark.png',
              badge: '/logos/logo-dark.png',
              tag: notification.orderId || notification.orderNumber, // Prevent duplicate notifications
              requireInteraction: false,
              silent: false,
            });

            // Handle click on notification
            browserNotification.onclick = () => {
              window.focus();
              if (notification.url) {
                router.push(notification.url);
              }
              browserNotification.close();
            };

            // Auto-close after 5 seconds
            setTimeout(() => {
              browserNotification.close();
            }, 5000);

            console.log('✅ Browser push notification displayed');
          } catch (error) {
            console.error('❌ Error showing browser notification:', error);
          }
        } else if (browserNotificationPermission === 'default') {
          // Request permission again
          Notification.requestPermission().then((permission) => {
            setBrowserNotificationPermission(permission);
            if (permission === 'granted') {
              // Retry showing notification
              handleNewOrderNotification(notification);
            }
          });
        }
      }

      // Play notification sound
      if (typeof window !== 'undefined' && 'Audio' in window) {
        try {
          // Try to play notification sound (supports multiple formats)
          const soundPaths = [
            '/sounds/notification.wav',
            '/sounds/notification.mp3',
            '/sounds/notification.ogg',
          ];
          
          let soundPlayed = false;
          
          // Try each sound path until one works
          const tryPlaySound = (index: number) => {
            if (index >= soundPaths.length || soundPlayed) {
              if (!soundPlayed && index >= soundPaths.length) {
                console.log('ℹ️ No notification sound file found. Add a sound file to /public/sounds/notification.wav or notification.mp3');
              }
              return;
            }
            
            const soundPath = soundPaths[index];
            console.log(`🔊 Attempting to play sound: ${soundPath}`);
            
            const audio = new Audio(soundPath);
            audio.volume = 0.7; // Set volume to 70%
            
            // Handle successful play
            const handlePlay = () => {
              if (!soundPlayed) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log('✅ Notification sound played successfully:', soundPath);
                      soundPlayed = true;
                    })
                    .catch((playError: any) => {
                      console.log(`❌ Could not play ${soundPath}:`, playError.message);
                      // Try next format
                      tryPlaySound(index + 1);
                    });
                }
              }
            };
            
            // Try to play when audio can play
            audio.addEventListener('canplay', handlePlay, { once: true });
            audio.addEventListener('canplaythrough', handlePlay, { once: true });
            
            // Handle errors
            audio.addEventListener('error', (e) => {
              console.log(`❌ Sound file error for ${soundPath}:`, audio.error?.message || 'Unknown error');
              // Try next format
              tryPlaySound(index + 1);
            }, { once: true });
            
            // Load the audio
            audio.load();
            
            // Fallback: try to play immediately if already loaded
            if (audio.readyState >= 2) {
              handlePlay();
            }
            
            // Additional fallback: try after a short delay
            setTimeout(() => {
              if (!soundPlayed && audio.readyState >= 2) {
                handlePlay();
              } else if (!soundPlayed && index < soundPaths.length - 1) {
                // If still not played and not the last format, try next
                tryPlaySound(index + 1);
              }
            }, 300);
          };
          
          // Start trying to play sounds
          tryPlaySound(0);
        } catch (error: any) {
          console.warn('❌ Error playing notification sound:', error.message);
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
  }, [user, token, router, addNotification, browserNotificationPermission]);

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
