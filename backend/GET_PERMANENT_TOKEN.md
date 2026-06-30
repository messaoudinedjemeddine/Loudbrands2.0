# How to Get a Permanent Access Token

Your current token is **temporary** and will expire in 24 hours. Here's how to get a permanent token:

## Method 1: System User Token (Recommended - Never Expires)

### Step 1: Create a System User

1. Go to [Meta Business Settings](https://business.facebook.com/settings)
2. Navigate to **Users** → **System Users**
3. Click **Add** to create a new System User
4. Enter a name (e.g., "WhatsApp API User")
5. Click **Create System User**

### Step 2: Assign Permissions

1. Click on the System User you just created
2. Click **Assign Assets**
3. Select your **App** (the one you created for WhatsApp)
4. Assign these permissions:
   - ✅ **WhatsApp Business Management**
   - ✅ **WhatsApp Message Management** (if available)
5. Click **Save Changes**

### Step 3: Generate Token

1. Still in the System User page, click **Generate New Token**
2. Select your **App**
3. Select permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
4. Click **Generate Token**
5. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
6. Store it securely in your `.env` file

### Step 4: Update Your .env File

Replace the temporary token with the new System User token:

```env
WHATSAPP_CLOUD_API_TOKEN=your_new_permanent_token_here
```

## Method 2: Extend Temporary Token (Alternative)

If you can't create a System User, you can extend your temporary token:

1. Go to your [Meta App Dashboard](https://developers.facebook.com/apps)
2. Select your app
3. Go to **WhatsApp** → **API Setup**
4. Find the **Access Tokens** section
5. Click **Generate Token** or **Extend Token**
6. The new token will be valid for 60 days (instead of 24 hours)

**Note**: This is still not permanent, but lasts longer.

## Method 3: Use Token Exchange (Advanced)

For production, you can implement token refresh:

1. Use the `access_token` from your app settings
2. Exchange it for a long-lived token (60 days)
3. Set up automatic refresh before expiration

This requires additional code implementation.

## Recommended Approach

**For Production**: Use Method 1 (System User Token)
- ✅ Never expires (unless revoked)
- ✅ More secure
- ✅ Better for production environments

**For Testing**: Use your current temporary token
- ✅ Quick to set up
- ⚠️ Expires in 24 hours
- ⚠️ Need to regenerate frequently

## Security Best Practices

1. **Never commit tokens to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables only

2. **Store tokens securely**
   - Use environment variables
   - Consider using a secrets manager for production

3. **Rotate tokens periodically**
   - Even permanent tokens should be rotated
   - Set a reminder to rotate every 6-12 months

4. **Limit token permissions**
   - Only grant necessary permissions
   - Don't give full admin access unless needed

## Troubleshooting

### Token expired?
- Generate a new token using one of the methods above
- Update your `.env` file
- Restart your backend server

### "Invalid OAuth access token" error?
- Check that the token is correct (no extra spaces)
- Verify the token hasn't expired
- Ensure the token has the correct permissions

### Can't create System User?
- Make sure you're an admin of the Meta Business account
- Check that you have the necessary permissions
- Try using Method 2 (extend temporary token) instead

