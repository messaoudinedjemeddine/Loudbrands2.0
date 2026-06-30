# 🚀 Deployment Guide - LOUD BRANDS

This guide will help you deploy the LOUD BRANDS e-commerce platform on Heroku (backend) and Vercel (frontend).

## 📋 Prerequisites

- GitHub account
- Heroku account
- Vercel account
- PostgreSQL database (Heroku Postgres)

## 🔧 Backend Deployment (Heroku)

### 1. Create Heroku App

```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create a new app
heroku create loudbrands-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini
```

### 2. Environment Variables

Set the following environment variables in Heroku:

```bash
# Database (automatically set by Heroku Postgres)
DATABASE_URL=$(heroku config:get DATABASE_URL)

# JWT Secret
heroku config:set JWT_SECRET="your-super-secret-jwt-key"

# Yalidine API
heroku config:set YALIDINE_API_KEY="your-yalidine-api-key"
heroku config:set YALIDINE_API_SECRET="your-yalidine-api-secret"

# CORS
heroku config:set FRONTEND_URL="https://your-frontend-domain.vercel.app"
```

### 3. Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Deploy to Heroku
git subtree push --prefix=backend heroku master

# Or if using Heroku Git
heroku git:remote -a loudbrands-api
git push heroku master
```

### 4. Database Setup

```bash
# Run migrations
heroku run npx prisma migrate deploy

# Generate Prisma client
heroku run npx prisma generate

# Seed database (optional)
heroku run npm run db:seed
```

## 🎨 Frontend Deployment (Vercel)

### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `messaoudinedjemeddine/loudbrandsdeploy`
4. Set the root directory to `frontend`

### 2. Environment Variables

Set these in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://loudbrands-api.herokuapp.com
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. Build Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 🔗 Domain Configuration

### Custom Domain (Optional)

1. **Backend (Heroku)**:
   - Go to Heroku dashboard → Settings → Domains
   - Add your custom domain
   - Configure DNS records

2. **Frontend (Vercel)**:
   - Go to Vercel dashboard → Project → Settings → Domains
   - Add your custom domain
   - Configure DNS records

## 🔄 Continuous Deployment

Both platforms support automatic deployment:

- **Heroku**: Deploys automatically when you push to the `main` branch
- **Vercel**: Deploys automatically when you push to any branch

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   ```bash
   # Check database status
   heroku pg:info
   
   # Reset database (if needed)
   heroku pg:reset
   ```

2. **Build Failures**:
   - Check environment variables
   - Verify all dependencies are in package.json
   - Check build logs in Heroku/Vercel dashboard

3. **CORS Issues**:
   - Ensure FRONTEND_URL is set correctly in Heroku
   - Check that the frontend URL matches exactly

### Useful Commands

```bash
# Check Heroku logs
heroku logs --tail

# Check Vercel logs
vercel logs

# Test API endpoints
curl https://loudbrands-api.herokuapp.com/api/health

# Test frontend
curl https://your-domain.vercel.app
```

## 📊 Monitoring

- **Heroku**: Use Heroku metrics and logs
- **Vercel**: Use Vercel analytics and function logs
- **Database**: Monitor Heroku Postgres metrics

## 🔐 Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] API keys are properly secured
- [ ] CORS is configured correctly
- [ ] Environment variables are not exposed
- [ ] Database is properly secured
- [ ] HTTPS is enabled

## 📞 Support

If you encounter issues:

1. Check the logs in both platforms
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
5. Review the troubleshooting section above

---

**Happy Deploying! 🚀**
