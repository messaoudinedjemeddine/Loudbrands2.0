'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingCart, CheckCircle } from 'lucide-react';

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
  const maxReconnectAttempts = 10; // Increased from 5 to 10 for better resilience
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<number>(Date.now());
  const isConnectingRef = useRef<boolean>(false); // Prevent duplicate connections
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>('default');

  // Request browser notification permission on mount - improved for mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      setBrowserNotificationPermission(currentPermission);
      
      // Check if we're in PWA/standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      console.log('📱 Device info:', { isStandalone, isMobile, permission: currentPermission });
      
      // Request permission if not already granted or denied
      // On mobile, we need to request permission more proactively
      if (currentPermission === 'default') {
        // For mobile devices or PWA, show a more user-friendly prompt
        if (isMobile || isStandalone) {
          // Small delay to ensure page is fully loaded
          setTimeout(() => {
            Notification.requestPermission().then((permission) => {
              setBrowserNotificationPermission(permission);
              if (permission === 'granted') {
                console.log('✅ Browser notification permission granted');
                // Show a test notification to confirm it works
                try {
                  new Notification('Notifications activées! 🔔', {
                    body: 'Vous recevrez des notifications pour les nouvelles commandes',
                    icon: '/logo-mini.png',
                    badge: '/logo-mini.png',
                    tag: 'permission-granted',
                    silent: false,
                  });
                } catch (e) {
                  console.log('Could not show test notification:', e);
                }
              } else if (permission === 'denied') {
                console.log('❌ Browser notification permission denied');
                console.log('💡 User needs to enable notifications in browser settings');
              }
            }).catch((error) => {
              console.error('Error requesting notification permission:', error);
            });
          }, 1000); // 1 second delay for better UX
        } else {
          // For desktop, request immediately
          Notification.requestPermission().then((permission) => {
            setBrowserNotificationPermission(permission);
            if (permission === 'granted') {
              console.log('✅ Browser notification permission granted');
            } else {
              console.log('❌ Browser notification permission denied');
            }
          });
        }
      } else if (currentPermission === 'granted') {
        console.log('✅ Notification permission already granted');
      } else {
        console.log('❌ Notification permission denied. User needs to enable in browser settings.');
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
      // Prevent duplicate connections
      if (isConnectingRef.current || (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN)) {
        console.log('⚠️ SSE connection already in progress or open, skipping...');
        return;
      }

      isConnectingRef.current = true;

      // Close existing connection if any
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch (e) {
          console.warn('Error closing existing connection:', e);
        }
        eventSourceRef.current = null;
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
          lastMessageTimeRef.current = Date.now();
          isConnectingRef.current = false; // Connection established
          
          // Clear any pending reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          // Start connection health monitoring
          // Check if we haven't received a message in 60 seconds (should get ping every 20s)
          if (connectionCheckIntervalRef.current) {
            clearInterval(connectionCheckIntervalRef.current);
          }
          connectionCheckIntervalRef.current = setInterval(() => {
            const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
            // If no message in 60 seconds, connection might be dead
            if (timeSinceLastMessage > 60000 && eventSourceRef.current) {
              console.warn('⚠️ No SSE messages received in 60 seconds, connection may be dead');
              setIsConnected(false);
              if (eventSourceRef.current.readyState === EventSource.OPEN) {
                // Force reconnect by closing and reconnecting
                try {
                  eventSourceRef.current.close();
                } catch (e) {
                  console.warn('Error closing stale connection:', e);
                }
                eventSourceRef.current = null;
                connectSSE();
              }
            }
          }, 30000); // Check every 30 seconds
          
          // Show a test notification to confirm connection works (only on initial connect)
          if (reconnectAttempts.current === 0) {
            toast.success('Connexion SSE établie', {
              description: 'Vous recevrez des notifications en temps réel pour les nouvelles commandes',
              duration: 3000,
            });
          } else {
            toast.success('Reconnexion SSE réussie', {
              description: 'Connexion rétablie avec succès',
              duration: 2000,
            });
          }
        };

        eventSource.onmessage = (event) => {
          try {
            // Update last message time for connection health monitoring
            lastMessageTimeRef.current = Date.now();

            // Handle ping messages (keep-alive)
            if (event.data.trim() === ': ping' || event.data.trim().startsWith(': ping')) {
              console.log('💓 SSE ping received');
              return;
            }

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
            } else if (data.type === 'order_confirmed') {
              console.log('✅ Order confirmed notification received:', data);
              handleOrderConfirmedNotification(data);
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
          isConnectingRef.current = false; // Allow reconnection
          
          // Close the connection if it's in a bad state
          if (eventSource.readyState === EventSource.CLOSED || eventSource.readyState === EventSource.CONNECTING) {
            try {
              eventSource.close();
            } catch (closeError) {
              console.warn('Error closing EventSource:', closeError);
            }
            eventSourceRef.current = null;

            // Attempt to reconnect with exponential backoff
            // Faster reconnection for Heroku restarts (detected by immediate close)
            if (reconnectAttempts.current < maxReconnectAttempts) {
              // Use shorter delay for first few attempts (likely Heroku restart)
              const baseDelay = reconnectAttempts.current < 3 ? 1000 : 2000;
              const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), 30000);
              reconnectAttempts.current++;
              
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`🔄 Attempting to reconnect SSE (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
                connectSSE();
              }, delay);
            } else {
              console.error('❌ Max SSE reconnection attempts reached');
              toast.error('Connexion SSE perdue', {
                description: 'Impossible de se reconnecter. Veuillez rafraîchir la page.',
                duration: 10000,
              });
            }
          }
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        setIsConnected(false);
        isConnectingRef.current = false; // Allow retry
      }
    };

    const handleOrderConfirmedNotification = (notification: SSENotification) => {
      console.log('🔔 Handling order confirmed notification:', notification);
      
      // Store notification in the store
      addNotification({
        type: notification.type,
        title: notification.title || 'Commande Confirmée',
        message: notification.message || `Commande #${notification.orderNumber} confirmée et prête pour la livraison`,
        orderId: notification.orderId,
        orderNumber: notification.orderNumber,
        customerName: notification.customerName,
        total: notification.total,
        url: notification.url,
      });
      
      // Show toast notification
      try {
        toast.success(notification.title || 'Commande Confirmée', {
          description: notification.message || `Commande #${notification.orderNumber} confirmée et prête pour la livraison`,
          duration: 10000,
          icon: <CheckCircle className="w-5 h-5" />,
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

      // Show browser push notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (browserNotificationPermission === 'granted') {
          try {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if ('serviceWorker' in navigator && isStandalone) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title || 'Commande Confirmée', {
                  body: notification.message || `Commande #${notification.orderNumber} confirmée et prête pour la livraison`,
                  icon: '/logo-mini.png',
                  badge: '/logo-mini.png',
                  tag: notification.orderId || notification.orderNumber,
                  requireInteraction: false,
                  silent: false,
                  vibrate: isMobile ? [200, 100, 200] : undefined,
                  data: {
                    url: notification.url || '/agent-livraison/dashboard',
                    orderId: notification.orderId,
                    orderNumber: notification.orderNumber,
                  },
                });
                console.log('✅ Service worker notification displayed (PWA mode)');
              }).catch((error) => {
                console.error('Error showing service worker notification:', error);
                showRegularNotification();
              });
            } else {
              showRegularNotification();
            }
            
            function showRegularNotification() {
              const browserNotification = new Notification(notification.title || 'Commande Confirmée', {
                body: notification.message || `Commande #${notification.orderNumber} confirmée et prête pour la livraison`,
                icon: '/logo-mini.png',
                badge: '/logo-mini.png',
                tag: notification.orderId || notification.orderNumber,
                requireInteraction: false,
                silent: false,
                vibrate: isMobile ? [200, 100, 200] : undefined,
              });

              browserNotification.onclick = () => {
                window.focus();
                if (notification.url) {
                  router.push(notification.url);
                }
                browserNotification.close();
              };

              setTimeout(() => {
                browserNotification.close();
              }, 5000);

              console.log('✅ Browser push notification displayed');
            }
          } catch (error) {
            console.error('❌ Error showing browser notification:', error);
          }
        }
      }

      // Play confirm.mp3 sound
      playNotificationSound('confirm');
    };

    // Reusable function to play notification sounds
    const playNotificationSound = (soundName: string = 'notification') => {
      if (typeof window !== 'undefined' && 'Audio' in window) {
        try {
          // Try to play notification sound (supports multiple formats)
          const soundPaths = [
            `/sounds/${soundName}.mp3`,
            `/sounds/${soundName}.wav`,
            `/sounds/${soundName}.ogg`,
            // Fallback to default notification sound
            ...(soundName !== 'notification' ? [
              '/sounds/notification.mp3',
              '/sounds/notification.wav',
              '/sounds/notification.ogg',
            ] : []),
          ];
          
          let soundPlayed = false;
          
          // Try each sound path until one works
          const tryPlaySound = (index: number) => {
            if (index >= soundPaths.length || soundPlayed) {
              if (!soundPlayed && index >= soundPaths.length) {
                console.log(`ℹ️ No ${soundName} sound file found. Add a sound file to /public/sounds/${soundName}.mp3`);
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
            // Check if we're in PWA/standalone mode
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            // Use service worker notification if available (better for PWA)
            if ('serviceWorker' in navigator && isStandalone) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notification.title || 'Nouvelle Commande', {
                  body: notification.message || `Commande #${notification.orderNumber} de ${notification.customerName || 'un client'}. Total: ${notification.total?.toLocaleString() || '0'} DA`,
                  icon: '/logo-mini.png',
                  badge: '/logo-mini.png',
                  tag: notification.orderId || notification.orderNumber,
                  requireInteraction: false,
                  silent: false,
                  vibrate: isMobile ? [200, 100, 200] : undefined,
                  data: {
                    url: notification.url || '/admin/orders',
                    orderId: notification.orderId,
                    orderNumber: notification.orderNumber,
                  },
                });
                console.log('✅ Service worker notification displayed (PWA mode)');
              }).catch((error) => {
                console.error('Error showing service worker notification:', error);
                // Fallback to regular notification
                showRegularNotification();
              });
            } else {
              // Use regular Notification API for browser mode
              showRegularNotification();
            }
            
            function showRegularNotification() {
              const browserNotification = new Notification(notification.title || 'Nouvelle Commande', {
                body: notification.message || `Commande #${notification.orderNumber} de ${notification.customerName || 'un client'}. Total: ${notification.total?.toLocaleString() || '0'} DA`,
                icon: '/logo-mini.png', // Use favicon
                badge: '/logo-mini.png', // Use favicon for badge
                tag: notification.orderId || notification.orderNumber, // Prevent duplicate notifications
                requireInteraction: false,
                silent: false,
                vibrate: isMobile ? [200, 100, 200] : undefined, // Vibration pattern for mobile
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
            }
          } catch (error) {
            console.error('❌ Error showing browser notification:', error);
          }
        } else if (browserNotificationPermission === 'default') {
          // Request permission again (especially important for mobile)
          console.log('📱 Requesting notification permission...');
          Notification.requestPermission().then((permission) => {
            setBrowserNotificationPermission(permission);
            if (permission === 'granted') {
              console.log('✅ Permission granted, showing notification');
              // Retry showing notification
              handleNewOrderNotification(notification);
            } else {
              console.log('❌ Permission denied:', permission);
              // Show a toast to inform user they need to enable notifications
              toast.info('Notifications désactivées', {
                description: 'Activez les notifications dans les paramètres du navigateur pour recevoir des alertes',
                duration: 5000,
              });
            }
          }).catch((error) => {
            console.error('Error requesting permission:', error);
          });
        } else if (browserNotificationPermission === 'denied') {
          console.log('❌ Notification permission denied. User needs to enable in browser settings.');
          // Optionally show a helpful message
          toast.info('Notifications bloquées', {
            description: 'Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.',
            duration: 5000,
          });
        }
      }

      // Play notification sound (default notification sound)
      playNotificationSound('notification');
    };

    // Connect when component mounts
    connectSSE();

    // Cleanup on unmount
    return () => {
      isConnectingRef.current = false;
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch (e) {
          console.warn('Error closing EventSource on cleanup:', e);
        }
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
        connectionCheckIntervalRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, token]); // Only depend on user.id and token to prevent unnecessary reconnections

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
