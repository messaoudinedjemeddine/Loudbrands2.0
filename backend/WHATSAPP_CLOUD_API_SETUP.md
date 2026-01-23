# WhatsApp Cloud API (Meta) Setup Guide

## Overview

WhatsApp Cloud API is Meta's official API for sending WhatsApp messages. It's free for up to 1,000 conversations per month, making it a great option for small to medium businesses.

## Pros & Cons

### ✅ Pros:
- **Official Meta API** - Reliable and supported by Meta
- **Free Tier** - 1,000 conversations/month free
- **No rate limits** (within free tier)
- **Professional** - Uses official WhatsApp Business API
- **Rich features** - Supports templates, media, interactive messages

### ❌ Cons:
- **Requires Meta Business Account** - Setup process is more complex
- **Business Verification** - May need business verification for production
- **Initial Setup Time** - Takes 30-60 minutes to set up properly

## Step-by-Step Setup

### Step 1: Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Click "Create Account" or sign in with Facebook
3. Complete the business account setup:
   - Enter your business name
   - Add business details
   - Verify your business (may require documents)

### Step 2: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as the app type
4. Fill in app details:
   - App Name: "Loud Brands WhatsApp" (or your choice)
   - App Contact Email: Your email
   - Business Account: Select your business account
5. Click "Create App"

### Step 3: Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set Up" on WhatsApp
3. You'll be redirected to WhatsApp setup

### Step 4: Get Your Phone Number ID

1. In the WhatsApp section, go to "API Setup"
2. You'll see your **Phone Number ID** (a long number like `123456789012345`)
3. Copy this number - you'll need it for configuration

### Step 5: Get Your Access Token

1. Still in the WhatsApp API Setup page
2. Find the "Temporary access token" section
3. Click "Generate Token" or copy the existing token
4. **Important**: This is a temporary token (valid for 24 hours)
5. For production, you'll need to create a permanent token (see Step 6)

### Step 6: Create Permanent Access Token (Recommended)

1. Go to "WhatsApp" → "API Setup" in your app
2. Scroll to "Access Tokens"
3. Click "Add or manage phone numbers"
4. Follow the steps to verify your phone number
5. Once verified, you can generate a permanent token

**Alternative: Use System User Token (More Secure)**

1. Go to "Business Settings" → "Users" → "System Users"
2. Create a new System User
3. Assign it to your app with "WhatsApp Business Management" permissions
4. Generate a token for the System User
5. This token doesn't expire (unless revoked)

### Step 7: Configure Your Environment

Add these to your `backend/.env` file:

```env
# Your WhatsApp number (the one that will receive notifications)
ADMIN_WHATSAPP_NUMBER=+213XXXXXXXXX

# Use WhatsApp Cloud API
WHATSAPP_PROVIDER=cloud-api

# Your access token (from Step 5 or 6)
WHATSAPP_CLOUD_API_TOKEN=your_access_token_here

# Your phone number ID (from Step 4)
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=123456789012345
```

**Example:**
```env
ADMIN_WHATSAPP_NUMBER=+213555123456
WHATSAPP_PROVIDER=cloud-api
WHATSAPP_CLOUD_API_TOKEN=EAABwzLix...your_long_token
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=123456789012345
```

### Step 8: Test the Integration

1. Restart your backend server
2. Place a test order on your website
3. Check your WhatsApp for the notification!

## Important Notes

### Phone Number Format
- The `ADMIN_WHATSAPP_NUMBER` should be in international format with country code
- Example for Algeria: `+213555123456`
- Example for US: `+15551234567`

### Access Token Security
- **Never commit tokens to Git**
- Store tokens in environment variables only
- Temporary tokens expire after 24 hours
- Use System User tokens for production (they don't expire)

### Free Tier Limits
- **1,000 conversations per month** are free
- A conversation is a 24-hour window of messaging
- After 1,000, you pay per conversation (very affordable)
- See [WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing) for details

### Message Templates (For Production)
- For business-initiated messages, you need pre-approved message templates
- Templates are approved by Meta (usually takes 24-48 hours)
- For testing, you can send messages without templates to your own number
- See [WhatsApp Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates) for details

## Troubleshooting

### Error: "Invalid OAuth access token"
- Your access token may have expired (if using temporary token)
- Generate a new token or use a System User token
- Check that the token has the correct permissions

### Error: "Phone number ID not found"
- Verify your `WHATSAPP_CLOUD_API_PHONE_NUMBER_ID` is correct
- Check that the phone number is verified in your Meta Business account

### No message received
- Check server logs for error messages
- Verify all environment variables are set correctly
- Ensure your phone number is verified in Meta Business
- For testing, make sure you're sending to a number you control

### Rate Limits
- Free tier: 1,000 conversations/month
- If you exceed this, you'll be charged per conversation
- Check your usage in Meta Business Manager

## Comparison with Other Options

| Feature | WhatsApp Cloud API | CallMeBot | Twilio |
|---------|-------------------|-----------|--------|
| Cost | Free (1K/month) | Free | Paid |
| Setup Time | 30-60 min | 5 min | 15-30 min |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Official API | ✅ Yes | ❌ No | ✅ Yes |
| Rate Limits | 1K/month free | ~1/min | Based on plan |
| Business Features | ✅ Full | ❌ Limited | ✅ Full |

## Next Steps

1. Complete the setup steps above
2. Test with a test order
3. For production, consider:
   - Creating message templates for better deliverability
   - Setting up webhooks for delivery receipts
   - Monitoring usage in Meta Business Manager

## Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)

