# WhatsApp Notification Setup Guide

This guide explains how to configure WhatsApp notifications for new orders.

## Overview

When a customer places an order, the system can automatically send a WhatsApp message to a configured admin phone number with order details.

## Supported Providers

### 1. Twilio WhatsApp API (Recommended)
- **Pros**: Most reliable, official WhatsApp Business API
- **Cons**: Paid service (pay-as-you-go pricing)
- **Setup**: Requires Twilio account and WhatsApp Business approval

### 2. WhatsApp Cloud API (Meta) ⭐ Recommended for Production
- **Pros**: 
  - Official Meta API (most reliable)
  - **Free tier: 1,000 conversations/month**
  - No rate limits (within free tier)
  - Professional and scalable
  - Supports rich features (templates, media, interactive messages)
- **Cons**: 
  - Requires Meta Business account (30-60 min setup)
  - May need business verification for production
  - More complex initial setup than CallMeBot
- **Best for**: Production environments, businesses expecting growth
- **Setup**: See detailed guide in `WHATSAPP_CLOUD_API_SETUP.md`

### 3. CallMeBot (Free Alternative)
- **Pros**: Free, simple setup
- **Cons**: Requires recipient to activate CallMeBot on their WhatsApp
- **Setup**: Get API key from callmebot.com

## Configuration

Add the following environment variables to your `.env` file:

### Required (All Providers)
```env
# The WhatsApp number to receive notifications (with country code, e.g., +213XXXXXXXXX)
ADMIN_WHATSAPP_NUMBER=+213XXXXXXXXX

# Choose provider: 'twilio', 'cloud-api', or 'callmebot'
WHATSAPP_PROVIDER=twilio
```

### Twilio Configuration
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Your Twilio WhatsApp number
```

**How to get Twilio credentials:**
1. Sign up at https://www.twilio.com
2. Get a Twilio phone number with WhatsApp capability
3. Complete WhatsApp Business verification
4. Get your Account SID and Auth Token from the Twilio Console

### WhatsApp Cloud API Configuration
```env
WHATSAPP_CLOUD_API_TOKEN=your_access_token
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=your_phone_number_id
```

**How to get Cloud API credentials:**
1. Create a Meta Business account
2. Set up a WhatsApp Business Account
3. Create a Meta App in Facebook Developers
4. Get your access token and phone number ID from the app dashboard

### CallMeBot Configuration (Free & Easy)
```env
ADMIN_WHATSAPP_NUMBER=+213XXXXXXXXX  # Your WhatsApp number with country code
WHATSAPP_PROVIDER=callmebot
CALLMEBOT_API_KEY=your_api_key
```

**Step-by-step setup for CallMeBot:**

1. **Activate CallMeBot on your WhatsApp:**
   - Open WhatsApp on your phone
   - Send a message to: `+34 603 84 26 20` (CallMeBot's WhatsApp number)
   - Type: `/start` or `/start YOUR_API_KEY` (if you already have one)
   - You'll receive a confirmation message

2. **Get your API key:**
   - Visit: https://www.callmebot.com/blog/free-api-whatsapp-messages/
   - Scroll down to find the API key generator
   - Enter your phone number (with country code, e.g., 213XXXXXXXXX for Algeria)
   - Click "Generate API Key"
   - Copy the generated API key

3. **Alternative method (if the website doesn't work):**
   - Send a message to CallMeBot on WhatsApp: `+34 603 84 26 20`
   - Type: `/start`
   - You'll receive an API key in the response
   - Save this API key

4. **Configure your environment:**
   - Add the API key to your `.env` file
   - Set `WHATSAPP_PROVIDER=callmebot`
   - Set `ADMIN_WHATSAPP_NUMBER` to your WhatsApp number (with country code)

**Important Notes:**
- CallMeBot is free but has rate limits (usually 1 message per minute)
- The recipient phone number must have activated CallMeBot on their WhatsApp
- Messages are sent via HTTP GET request, so they're simple but less secure
- For production with high volume, consider Twilio or WhatsApp Cloud API

## Message Format

The WhatsApp notification includes:
- Order number
- Customer information (name, phone, email)
- Order items with quantities and sizes
- Subtotal, delivery fee, and total
- Delivery information (address or pickup location)
- Wilaya and commune
- Notes (if any)
- Direct link to view the order in admin panel

## Testing

After configuration, test by placing a test order. The WhatsApp message should be sent automatically to the configured `ADMIN_WHATSAPP_NUMBER`.

## Troubleshooting

### No message received
1. Check that `ADMIN_WHATSAPP_NUMBER` is correctly formatted (with country code)
2. Verify provider credentials are correct
3. Check server logs for error messages
4. For Twilio: Ensure your WhatsApp number is approved
5. For CallMeBot: Ensure you've activated CallMeBot on your WhatsApp

### Error messages
- Check server console logs for detailed error messages
- Verify all required environment variables are set
- Ensure the provider account is active and has credits (for paid services)

## Notes

- WhatsApp notifications are sent asynchronously and won't block order creation
- If WhatsApp fails, the order will still be created successfully
- The system logs all WhatsApp notification attempts for debugging

