# Quick Setup - WhatsApp Cloud API

## ✅ Your Credentials (Ready to Use)

You have all the credentials needed! Here's how to set them up:

## Step 1: Add to Your .env File

Open `backend/.env` and add these lines:

```env
# Your WhatsApp number (the one that will receive order notifications)
# Replace with your actual WhatsApp number (e.g., +213555123456)
ADMIN_WHATSAPP_NUMBER=+213XXXXXXXXX

# Use WhatsApp Cloud API
WHATSAPP_PROVIDER=cloud-api

# Your WhatsApp Cloud API credentials
WHATSAPP_CLOUD_API_TOKEN=EAARIr2b5ZBO0BQbVzZB5ZCOVGoYS7fnZBNhPnxYNNoxcqBbLcAW2Ha5NNDfOrrAHt2fxviGV13TCTvIzIecGUQTZACG4782Mp70C81kSOLjHTFCn0IfZCIVNzco6ZB54UrhaRZAKZC29DzWRFVg0Cb977Op7BEtu8OEXxKWY0IWuDrqxz4ed6rTzQCUxvrmDBjN5fiirt53rEAcrtBo7ZAb89YLkH0l1qKfOHhbKQ8CWS1xnlEpxLOiTtvZBuIoN36dx4qKPZCTvJ5WU0JTMxTYrkiWoOZCleWFFt85FmQ3TnBroZD
WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=968834689645123
```

**Important**: 
- Replace `ADMIN_WHATSAPP_NUMBER` with your actual WhatsApp number (format: +213XXXXXXXXX)
- The access token is **temporary** and expires in 24 hours
- See `GET_PERMANENT_TOKEN.md` for how to get a permanent token

## Step 2: Restart Your Backend Server

After adding the environment variables, restart your backend:

```bash
cd backend
npm start
# or if using nodemon
npm run dev
```

## Step 3: Test It!

1. Place a test order on your website
2. Check your WhatsApp for the notification
3. You should receive a formatted message with all order details

## ⚠️ Important: Temporary Token

Your current access token will expire in **24 hours**. 

**Before it expires**, you should:
1. Get a permanent token (see `GET_PERMANENT_TOKEN.md`)
2. Or extend the temporary token in your Meta App Dashboard

## Quick Token Extension (60 Days)

If you need more time before setting up a permanent token:

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps)
2. Select your app
3. Go to **WhatsApp** → **API Setup**
4. Click **Generate Token** or **Extend Token**
5. Copy the new token (valid for 60 days)
6. Update `WHATSAPP_CLOUD_API_TOKEN` in your `.env` file

## Your Account Info (For Reference)

- **Business Account ID**: 704349945879390
- **Phone Number ID**: 968834689645123
- **Access Token**: (temporary, expires in 24h)

## Troubleshooting

### No message received?
1. ✅ Check that `ADMIN_WHATSAPP_NUMBER` is correct (with country code)
2. ✅ Verify the token hasn't expired
3. ✅ Check server logs for error messages
4. ✅ Make sure your phone number is verified in Meta Business

### "Invalid OAuth access token" error?
- The token has expired (24 hours)
- Generate a new token from Meta App Dashboard
- Update your `.env` file and restart server

### "Phone number ID not found"?
- Verify `WHATSAPP_CLOUD_API_PHONE_NUMBER_ID=968834689645123` is correct
- Check that the phone number is verified in Meta Business

## Next Steps

1. ✅ Add credentials to `.env` file
2. ✅ Set `ADMIN_WHATSAPP_NUMBER` to your WhatsApp number
3. ✅ Restart backend server
4. ✅ Test with a test order
5. ⚠️ Get permanent token (see `GET_PERMANENT_TOKEN.md`)

## Need Help?

- Check server logs for detailed error messages
- See `GET_PERMANENT_TOKEN.md` for permanent token setup
- See `WHATSAPP_CLOUD_API_SETUP.md` for detailed documentation

