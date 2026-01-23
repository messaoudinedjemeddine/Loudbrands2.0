# CallMeBot Quick Setup Guide

## Quick Start (5 minutes)

### Step 1: Activate CallMeBot
1. Open WhatsApp on your phone
2. Send a message to: **+34 603 84 26 20**
3. Type: `/start`
4. You'll receive a confirmation and your API key

### Step 2: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Your WhatsApp number (the one that will receive notifications)
ADMIN_WHATSAPP_NUMBER=+213XXXXXXXXX

# Use CallMeBot as the provider
WHATSAPP_PROVIDER=callmebot

# Your CallMeBot API key (from Step 1)
CALLMEBOT_API_KEY=your_api_key_here
```

**Example for Algeria:**
```env
ADMIN_WHATSAPP_NUMBER=+213555123456
WHATSAPP_PROVIDER=callmebot
CALLMEBOT_API_KEY=12345678
```

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

### Step 4: Test It

1. Restart your backend server
2. Place a test order on your website
3. Check your WhatsApp for the notification!

## Troubleshooting

### No message received?
- ✅ Make sure you sent `/start` to CallMeBot on WhatsApp
- ✅ Verify your API key is correct
- ✅ Check that `ADMIN_WHATSAPP_NUMBER` includes country code (e.g., +213 for Algeria)
- ✅ Check server logs for error messages

### Error: "CallMeBot returned error"
- The API key might be incorrect
- Try generating a new API key by sending `/start` again to CallMeBot
- Make sure your phone number format is correct (no spaces, with country code)

### Rate Limits
- CallMeBot allows approximately 1 message per minute
- For higher volume, consider upgrading to Twilio or WhatsApp Cloud API

## Message Format

You'll receive a formatted message like this:

```
🛒 Nouvelle Commande #ORD-12345

👤 Client:
• Nom: John Doe
• Téléphone: +213555123456

📦 Articles:
1. T-Shirt (M) x2 - 5000 DA
2. Jeans (L) x1 - 8000 DA

💰 Total:
• Sous-total: 13000 DA
• Frais de livraison: 500 DA
• Total: 13500 DA

🚚 Livraison:
📍 Livraison à domicile
123 Main Street
• Wilaya: Alger
• Commune: Hydra

🔗 Voir la commande: https://loudbrandss.com/admin/orders/abc123
```

## Need Help?

- CallMeBot Website: https://www.callmebot.com/blog/free-api-whatsapp-messages/
- Check server logs: Look for "WhatsApp message sent via CallMeBot" or error messages
- Verify environment variables are loaded: Check that `process.env.CALLMEBOT_API_KEY` is set

