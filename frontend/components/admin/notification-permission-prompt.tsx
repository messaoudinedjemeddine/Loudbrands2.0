'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuthStore();

  useEffect(() => {
    // Only show for admin users
    if (!user) return;
    
    const allowedRoles = ['ADMIN', 'CONFIRMATRICE', 'AGENT_LIVRAISON', 'STOCK_MANAGER'];
    if (!allowedRoles.includes(user.role)) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('notification-prompt-dismissed');
      
      // Prompt disabled per user request - always mark as dismissed
      // if (currentPermission === 'default' && !dismissed) {
      //   // Small delay to ensure page is loaded
      //   setTimeout(() => {
      //     setShowPrompt(true);
      //   }, 2000);
      // }
      // Auto-dismiss to prevent popup from showing
      if (currentPermission === 'default' && !dismissed) {
        localStorage.setItem('notification-prompt-dismissed', 'true');
      }
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result === 'granted') {
          console.log('✅ Notification permission granted');
          setShowPrompt(false);
          localStorage.setItem('notification-prompt-dismissed', 'true');
          
          // Show a test notification
          try {
            new Notification('Notifications activées! 🔔', {
              body: 'Vous recevrez des notifications pour les nouvelles commandes',
              icon: '/logo-mini.png',
              badge: '/logo-mini.png',
              tag: 'permission-granted',
            });
          } catch (e) {
            console.log('Could not show test notification:', e);
          }
        } else {
          console.log('❌ Notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50">
      <Card className="shadow-lg border-2 border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Activer les notifications</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-4">
            Recevez des notifications en temps réel pour les nouvelles commandes, même lorsque l'application est en arrière-plan.
          </CardDescription>
          <div className="flex gap-2">
            <Button
              onClick={handleEnableNotifications}
              className="flex-1"
              size="sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              Activer
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
