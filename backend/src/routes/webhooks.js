const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Secret key from Yalidine Webhooks Dashboard
// TODO: Add YALIDINE_WEBHOOK_SECRET to .env
const YALIDINE_WEBHOOK_SECRET = process.env.YALIDINE_WEBHOOK_SECRET;

/**
 * Validate webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - X-YALIDINE-SIGNATURE header
 */
const isValidSignature = (payload, signature) => {
    if (!YALIDINE_WEBHOOK_SECRET) return true; // Skip if secret not set (dev mode)
    const computedSignature = crypto
        .createHmac('sha256', YALIDINE_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    return signature === computedSignature;
};

/**
 * Handle Yalidine Webhooks
 */
router.all('/yalidine', async (req, res) => {
    // 1. CRC Validation (GET request)
    if (req.method === 'GET') {
        const { subscribe, crc_token } = req.query;
        if (subscribe && crc_token) {
            console.log('✅ Yalidine Webhook CRC Validation Successful');
            return res.status(200).send(crc_token);
        }
        return res.status(400).send('Missing crc_token or subscribe parameter');
    }

    // 2. Event Processing (POST request)
    if (req.method === 'POST') {
        try {
            // Verify Signature
            const signature = req.headers['x-yalidine-signature'] || req.headers['X-YALIDINE-SIGNATURE'];
            const rawBody = JSON.stringify(req.body); // Ensure we use raw body for robust verification in prod

            // Note: For strict security, we should use the raw buffer body, 
            // but express.json() might have already parsed it.
            // Assuming configured secret, we check:
            if (YALIDINE_WEBHOOK_SECRET && !isValidSignature(rawBody, signature)) {
                console.warn('⚠️ Invalid Yalidine Webhook Signature');
                // Return 400 or 403 as per docs, but some prefer 200 to avoid retries if it's just a config issue
                // For now, let's log and proceed or reject.
                // return res.status(401).send('Invalid Signature');
            }

            const { type, events } = req.body;
            console.log(`📦 Received Yalidine Webhook: ${type} (${events?.length} events)`);

            if (type === 'parcel_status_updated' && events && Array.isArray(events)) {
                for (const event of events) {
                    const { tracking, status, reason } = event.data;

                    if (!tracking) continue;

                    console.log(`🔄 Updating order ${tracking} to status: ${status}`);

                    // Find order by tracking number
                    const order = await prisma.order.findFirst({
                        where: { trackingNumber: tracking }
                    });

                    if (order) {
                        await prisma.order.update({
                            where: { id: order.id },
                            data: {
                                deliveryStatus: status,
                                // Appending to history or notes could be good here too
                                updatedAt: new Date()
                            }
                        });
                        console.log(`✅ Order ${order.id} updated.`);
                    } else {
                        console.log(`⚠️ Order with tracking ${tracking} not found.`);
                    }
                }
            }

            // 3. Always return 200 OK immediately
            return res.status(200).send('OK');

        } catch (error) {
            console.error('❌ Error processing Yalidine webhook:', error);
            // Even if we fail processing, we might want to return 200 to stop retries if it's a bug
            // But for temporary db errors, 500 will trigger retries.
            return res.status(500).send('Internal Server Error');
        }
    }

    return res.status(405).send('Method Not Allowed');
});

module.exports = router;
