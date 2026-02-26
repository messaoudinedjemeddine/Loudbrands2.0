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
  const processedNotificationsRef = useRef<Set<string>>(new Set()); // Track processed notifications to prevent duplicates
  const processingNotificationsRef = useRef<Set<string>>(new Set()); // Track notifications currently being processed
  const lastNotificationTimeRef = useRef<Map<string, number>>(new Map()); // Track when each notification type was last processed
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null); // For cross-tab communication
  const connectionIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`); // Unique connection ID
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

    // Set up BroadcastChannel for cross-tab communication
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      broadcastChannelRef.current = new BroadcastChannel('sse-connections');
      
      // Listen for other tabs requesting to close connections and notification coordination
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data.type === 'close-connection' && event.data.connectionId !== connectionIdRef.current) {
          console.log('📢 Another tab is taking over SSE connection, closing this one...');
          if (eventSourceRef.current) {
            try {
              eventSourceRef.current.close();
            } catch (e) {
              console.warn('Error closing connection from broadcast:', e);
            }
            eventSourceRef.current = null;
            setIsConnected(false);
            isConnectingRef.current = false;
          }
        } else if (event.data.type === 'connection-established' && event.data.connectionId !== connectionIdRef.current) {
          // Another tab has established connection, close this one if we're trying to connect
          if (isConnectingRef.current || (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CONNECTING)) {
            console.log('📢 Another tab already has SSE connection, canceling this connection...');
            if (eventSourceRef.current) {
              try {
                eventSourceRef.current.close();
              } catch (e) {
                console.warn('Error closing connection:', e);
              }
              eventSourceRef.current = null;
            }
            isConnectingRef.current = false;
          }
        } else if (event.data.type === 'notification-processed') {
          // Another tab has processed this notification, mark it as processed here too
          const notificationKey = event.data.notificationKey;
          if (notificationKey && !processedNotificationsRef.current.has(notificationKey)) {
            processedNotificationsRef.current.add(notificationKey);
            console.log('📢 Notification already processed by another tab, marking as processed:', notificationKey);
          }
        }
      };
    }

    const connectSSE = () => {
      // Prevent duplicate connections
      if (isConnectingRef.current || (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.OPEN)) {
        console.log('⚠️ SSE connection already in progress or open, skipping...');
        return;
      }

      isConnectingRef.current = true;

      // Notify other tabs to close their connections (this tab is taking over)
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'close-connection',
          connectionId: connectionIdRef.current,
          timestamp: Date.now()
        });
      }

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
      // Add connection ID to help identify connections
      const sseUrl = `${apiUrl}/api/sse/notifications?token=${encodeURIComponent(token)}&connId=${connectionIdRef.current}`;
      
      console.log('🔗 Connecting to SSE endpoint:', sseUrl.replace(/token=[^&]+/, 'token=***'));
      console.log('🔍 Connection ID:', connectionIdRef.current);
      console.log('🔍 API URL before processing:', process.env.NEXT_PUBLIC_API_URL);
      console.log('🔍 API URL after processing:', apiUrl);

      try {
        const eventSource = new EventSource(sseUrl);

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('✅ SSE connection opened successfully');
          console.log('🔗 SSE URL:', sseUrl.replace(/token=[^&]+/, 'token=***'));
          console.log('👤 User:', user?.email, 'Role:', user?.role);
          console.log('🆔 Connection ID:', connectionIdRef.current);
          setIsConnected(true);
          reconnectAttempts.current = 0;
          lastMessageTimeRef.current = Date.now();
          isConnectingRef.current = false; // Connection established
          
          // Notify other tabs that this connection is established
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({
              type: 'connection-established',
              connectionId: connectionIdRef.current,
              timestamp: Date.now()
            });
          }
          
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
            // If no message in 90 seconds (pings come every 20s, so 90s means connection is likely dead)
            if (timeSinceLastMessage > 90000 && eventSourceRef.current) {
              console.warn('⚠️ No SSE messages received in 90 seconds, connection may be dead');
              setIsConnected(false);
              if (eventSourceRef.current.readyState === EventSource.OPEN) {
                // Force reconnect by closing and reconnecting
                try {
                  eventSourceRef.current.close();
                } catch (e) {
                  console.warn('Error closing stale connection:', e);
                }
                eventSourceRef.current = null;
                isConnectingRef.current = false; // Allow reconnection
                connectSSE();
              }
            }
          }, 45000); // Check every 45 seconds (less aggressive)
          
          // Connection notifications removed per user request
          // Connection established silently in background
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

            // Create a unique key for this notification to prevent duplicates
            // Use orderId + orderNumber + timestamp + customerName + total for better uniqueness
            const orderId = data.orderId || '';
            const orderNumber = data.orderNumber || '';
            const timestamp = data.timestamp || new Date().toISOString();
            const customerName = data.customerName || '';
            const total = data.total || 0;
            // Create a more unique key that includes all identifying information
            const notificationKey = `${data.type}-${orderId}-${orderNumber}-${timestamp}-${customerName}-${total}`;
            
            // Check if we've already processed this notification
            if (processedNotificationsRef.current.has(notificationKey)) {
              console.log('⚠️ Duplicate notification ignored:', notificationKey);
              return;
            }
            
            // Check if we've processed a similar notification very recently (within 3 seconds)
            // This prevents rapid-fire duplicates from multiple tabs or reconnections
            const orderKey = `${data.type}-${orderId}-${orderNumber}`;
            const lastProcessedTime = lastNotificationTimeRef.current.get(orderKey);
            const now = Date.now();
            
            if (lastProcessedTime && (now - lastProcessedTime) < 3000) {
              console.log('⚠️ Recent duplicate notification ignored (within 3 seconds):', orderKey);
              return;
            }
            
            // Update last processed time
            lastNotificationTimeRef.current.set(orderKey, now);
            
            // Clean up old entries from lastNotificationTimeRef (keep last 50)
            if (lastNotificationTimeRef.current.size > 50) {
              const entries = Array.from(lastNotificationTimeRef.current.entries());
              const recentEntries = entries.filter(([_, time]) => (now - time) < 60000); // Keep entries from last minute
              lastNotificationTimeRef.current = new Map(recentEntries);
            }
            
            // Mark as processed immediately
            processedNotificationsRef.current.add(notificationKey);
            
            // Notify other tabs via BroadcastChannel to prevent them from processing the same notification
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: 'notification-processed',
                notificationKey: notificationKey,
                timestamp: Date.now()
              });
            }
            
            // Clean up old notification keys periodically (keep last 100)
            if (processedNotificationsRef.current.size > 100) {
              const keysArray = Array.from(processedNotificationsRef.current);
              processedNotificationsRef.current = new Set(keysArray.slice(-50)); // Keep last 50
            }
            
            // Set a timeout to remove this key after 5 minutes (shorter window)
            setTimeout(() => {
              processedNotificationsRef.current.delete(notificationKey);
            }, 5 * 60 * 1000); // 5 minutes

            // Check if this notification is already being processed
            if (processingNotificationsRef.current.has(notificationKey)) {
              console.log('⚠️ Notification already being processed, skipping:', notificationKey);
              return;
            }
            
            // Mark as processing
            processingNotificationsRef.current.add(notificationKey);
            
            // Remove from processing set after a delay (in case of errors)
            setTimeout(() => {
              processingNotificationsRef.current.delete(notificationKey);
            }, 5000); // 5 seconds should be enough for any notification to complete
            
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
            // Reduced logging - only log critical parsing errors
            // console.error('❌ Error parsing SSE message:', error);
            // console.error('Raw event data:', event.data);
          }
        };

        eventSource.onerror = (error) => {
          // Reduced logging to prevent console spam
          // Only log if it's a significant error (not just connection attempts)
          if (eventSource.readyState === EventSource.CLOSED) {
            // Silently handle connection errors - they're expected during reconnection
          }
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
                // Reduced logging - silently reconnect
                connectSSE();
              }, delay);
            } else {
              // Reduced logging - only show toast, no console error spam
              toast.error('Connexion SSE perdue', {
                description: 'Impossible de se reconnecter. Veuillez rafraîchir la page.',
                duration: 10000,
              });
            }
          }
        };
      } catch (error) {
        // Reduced logging - silently handle connection failures
        setIsConnected(false);
        isConnectingRef.current = false; // Allow retry
      }
    };

    const handleOrderConfirmedNotification = (notification: SSENotification) => {
      console.log('🔔 Handling order confirmed notification:', notification);
      
      // Double-check: prevent processing if already in store (additional safety)
      const existingNotification = useNotificationStore.getState().notifications.find(
        n => n.orderId === notification.orderId && n.orderNumber === notification.orderNumber && n.type === notification.type
      );
      
      if (existingNotification) {
        const notificationAge = Date.now() - new Date(existingNotification.timestamp).getTime();
        // If notification was added in the last 3 seconds, skip it
        if (notificationAge < 3000) {
          console.log('⚠️ Notification already exists in store (added recently), skipping duplicate:', notification.orderNumber);
          return;
        }
      }
      
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
      
      // Double-check: prevent processing if already in store (additional safety)
      const existingNotification = useNotificationStore.getState().notifications.find(
        n => n.orderId === notification.orderId && n.orderNumber === notification.orderNumber
      );
      
      if (existingNotification) {
        const notificationAge = Date.now() - new Date(existingNotification.timestamp).getTime();
        // If notification was added in the last 3 seconds, skip it
        if (notificationAge < 3000) {
          console.log('⚠️ Notification already exists in store (added recently), skipping duplicate:', notification.orderNumber);
          return;
        }
      }
      
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

    // Connect when component mounts (with a small delay to prevent race conditions)
    const connectTimeout = setTimeout(() => {
      connectSSE();
    }, 100);

    return () => {
      clearTimeout(connectTimeout);
    };

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
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      // Clear processing notifications refs
      processingNotificationsRef.current.clear();
      lastNotificationTimeRef.current.clear();
      setIsConnected(false);
    };
  }, [user?.id, token, addNotification, router]); // Include dependencies to prevent stale closures

  // Connection status indicator removed per user request
  return null;
}
