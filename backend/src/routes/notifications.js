const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');
const router = express.Router();

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
// These should ideally be in environment variables
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (!publicVapidKey || !privateVapidKey) {
    console.warn('⚠️ VAPID keys are missing from environment variables. Push notifications will not work.');
} else {
    webpush.setVapidDetails(
        'mailto:admin@loudbrands.com',
        publicVapidKey,
        privateVapidKey
    );
}

// Get VAPID Public Key
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: publicVapidKey });
});

// Subscribe user to notifications
router.post('/subscribe', async (req, res) => {
    const subscriptionSchema = z.object({
        userId: z.string(),
        subscription: z.object({
            endpoint: z.string(),
            keys: z.object({
                p256dh: z.string(),
                auth: z.string()
            })
        })
    });

    try {
        const { userId, subscription } = subscriptionSchema.parse(req.body);

        // Save subscription to database
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                userId,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                updatedAt: new Date()
            },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        });

        res.status(201).json({ message: 'Subscription added successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(400).json({ error: 'Invalid subscription data' });
    }
});

// Test notification (Optional)
router.post('/test', async (req, res) => {
    // Logic to send test notification would go here
    res.status(200).json({ message: 'Test endpoint ready' });
});

module.exports = router;
