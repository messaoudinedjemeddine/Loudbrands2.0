// Yalidine webhook endpoint: https://<backend>/api/webhooks/yalidine
//
// Mounted in server.js with express.raw() BEFORE the JSON parser and rate limiter, so that
// req.body is the raw Buffer Yalidine signed.
//
// GET  ?subscribe=…&crc_token=…  → echo crc_token (Yalidine re-validates from time to time)
// POST signed JSON delivery       → verify signature, store events, answer 200 immediately,
//                                   then process the events in the background.

const express = require('express');
const webhook = require('../services/yalidine-webhook');

const router = express.Router();

router.get('/yalidine', (req, res) => {
  const { subscribe, crc_token: crcToken } = req.query;
  if (subscribe !== undefined && crcToken !== undefined) {
    return res.status(200).type('text/plain').send(String(crcToken));
  }
  return res.status(400).type('text/plain').send('Missing crc_token or subscribe parameter');
});

router.post('/yalidine', async (req, res) => {
  const secret = process.env.YALIDINE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ YALIDINE_WEBHOOK_SECRET is not set: refusing webhook delivery');
    return res.status(503).type('text/plain').send('Webhook secret not configured');
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
  const signature = req.get('x-yalidine-signature') || req.get('x_yalidine_signature');
  if (!webhook.isValidSignature(rawBody, signature, secret)) {
    console.warn('⚠️ Yalidine webhook: missing or invalid signature');
    return res.status(400).type('text/plain').send('invalid signature');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return res.status(400).type('text/plain').send('invalid JSON');
  }

  try {
    const { received, stored } = await webhook.storeDelivery(payload);
    console.log(`📦 Yalidine webhook ${payload.type}: ${received} event(s), ${stored} new`);
    res.status(200).type('text/plain').send('OK');
  } catch (error) {
    // Storage failed (e.g. database down): let Yalidine retry later.
    console.error('❌ Yalidine webhook: could not store events:', error.message);
    return res.status(500).type('text/plain').send('Internal Server Error');
  }

  // After answering: process in the background.
  setImmediate(() => {
    webhook.processPendingEvents().catch((e) => console.error('❌ Webhook processing error:', e.message));
  });
});

module.exports = router;
