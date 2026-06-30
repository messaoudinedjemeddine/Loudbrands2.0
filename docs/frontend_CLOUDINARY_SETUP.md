# Cloudinary Setup for LOUD BRANDS

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get Cloudinary Credentials

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to your Dashboard
4. Copy the following from your Dashboard:
   - Cloud Name
   - API Key
   - API Secret

## Free Tier Benefits

- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month
- Unlimited uploads
- Global CDN

## How It Works

1. **Product Images**: Uploaded to `loudbrands/products/` folder
2. **Category Images**: Uploaded to `loudbrands/categories/` folder
3. **Automatic Optimization**: Images are automatically optimized for web
4. **Global CDN**: Images are served from the fastest location worldwide

## File Upload Limits

- **File Types**: JPEG, PNG, WebP, GIF
- **Max File Size**: 10MB per image
- **Multiple Files**: Supported for categories

## Integration

The existing admin dashboard will now use Cloudinary instead of local storage. No changes needed to the admin interface - it will work seamlessly with the new cloud storage.
