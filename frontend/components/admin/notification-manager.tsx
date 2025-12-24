'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function NotificationManager() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        }
    };

    const subscribeToPush = async () => {
        if (!user) {
            toast.error('You must be logged in to subscribe');
            return;
        }

        setLoading(true);
        try {
            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID Public Key is missing configuration');
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send subscription to backend
            // We need to implement this API call in our frontend API client or fetch directly
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization header if needed
                },
                body: JSON.stringify({
                    userId: user.id,
                    subscription: subscription
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription on server');
            }

            setIsSubscribed(true);
            setPermission('granted');
            toast.success('Notifications enabled!');
        } catch (error) {
            console.error('Failed to subscribe to notifications', error);
            toast.error('Failed to enable notifications');
        } finally {
            setLoading(false);
        }
    };

    if (permission === 'denied') {
        return (
            <Button variant="ghost" size="icon" disabled title="Notifications blocked">
                <BellOff className="h-5 w-5 text-muted-foreground" />
            </Button>
        );
    }

    if (isSubscribed) {
        return null; // Don't show anything if already subscribed, or maybe show active icon
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={subscribeToPush}
            disabled={loading}
            className="gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Enable Notifications
        </Button>
    );
}
