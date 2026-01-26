# 🎨 Vercel Setup for LOUD BRANDS Frontend

## Quick Setup Steps

### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub: `messaoudinedjemeddine/loudbrandsdeploy`
4. Set **Root Directory** to: `frontend`
5. Click "Deploy"

### 2. Environment Variables

In Vercel dashboard, go to Project Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://loudbrands-api.herokuapp.com` | Backend API URL |
| `NODE_ENV` | `production` | Environment |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Frontend URL |
| `NEXTAUTH_SECRET` | `your-nextauth-secret` | NextAuth secret |

### 3. Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

## Automatic Deployments

Vercel will automatically deploy when you:
- Push to the main branch
- Create a pull request
- Merge a pull request

## Useful Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from local
vercel

# Check deployment status
vercel ls

# View logs
vercel logs
```

## Troubleshooting

1. **Build fails**: Check that all dependencies are in `package.json`
2. **API connection issues**: Verify `NEXT_PUBLIC_API_URL` is correct
3. **Environment variables**: Ensure all required variables are set
4. **Domain issues**: Check DNS configuration

## Performance Tips

1. Enable Vercel Analytics
2. Use Vercel Edge Functions for API routes
3. Optimize images with Next.js Image component
4. Enable automatic HTTPS
