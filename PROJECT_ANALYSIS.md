# 📊 LOUD BRANDS 2.0 - Project Analysis

## 🎯 Project Overview

**LOUD BRANDS** is a modern e-commerce platform for traditional Algerian fashion with two distinct brands:
- **LOUDIM**
- **LOUD STYLES**

### Deployment Architecture
- **Frontend**: Next.js 14 deployed on Vercel
- **Backend**: Node.js + Express deployed on Heroku
- **Database**: PostgreSQL (Heroku Postgres)
- **Domain**: loudbrandss.com

---

## 📁 Project Structure

```
Loudbrands2.0/
├── frontend/              # Next.js 14 frontend application
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   └── public/           # Static assets
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic services
│   │   ├── middleware/   # Auth and other middleware
│   │   └── config/       # Configuration files
│   └── prisma/           # Database schema and migrations
├── docs/                 # Documentation files
└── scripts/              # Utility scripts
```

---

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 16.0.8 (App Router)
- **Language**: TypeScript 5.2.2
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 3.3.3
- **UI Components**: Radix UI
- **State Management**: Zustand 4.4.7
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion 10.16.16
- **Internationalization**: next-intl 3.20.0
- **Image Upload**: Cloudinary 2.7.0
- **PWA Support**: Service workers, manifest

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 4.18.2
- **ORM**: Prisma 5.7.1
- **Database**: PostgreSQL (Heroku Postgres)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer + Cloudinary
- **Shipping**: Yalidine API integration
- **Notifications**: WhatsApp Cloud API, Web Push

---

## 🌐 API Configuration

### Backend API URL
- **Production**: `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com`
- **API Base Path**: `/api`

### Frontend API Configuration
- **Environment Variable**: `NEXT_PUBLIC_API_URL`
- **Default**: `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api`
- **Configured in**: 
  - `frontend/vercel.json` (Vercel deployment)
  - `frontend/lib/api.ts` (API client)

---

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **Confirmatrice**: Order confirmation role
- **Agent Livraison**: Delivery agent role
- **Customer**: Standard user

### Authentication Flow
- JWT-based authentication
- Token stored in localStorage (Zustand store)
- Protected routes with middleware
- Role-based access control (RBAC)

---

## 📦 Key Features

### E-commerce Features
- ✅ Product catalog with categories and brands
- ✅ Shopping cart functionality
- ✅ Order management system
- ✅ Inventory/stock tracking
- ✅ Multi-language support (Arabic, French)
- ✅ PWA capabilities
- ✅ Image upload and management (Cloudinary)
- ✅ Order tracking (Yalidine integration)

### Admin Features
- ✅ Admin dashboard
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ User management
- ✅ Category and brand management
- ✅ Stock management
- ✅ Analytics and reporting
- ✅ Real-time notifications (SSE)

### Special Features
- ✅ WhatsApp integration for notifications
- ✅ Yalidine shipping integration
- ✅ Cloudinary image hosting
- ✅ Responsive design (mobile-first)
- ✅ Dark mode support
- ✅ RTL support for Arabic

---

## 🗄️ Database Schema (Prisma)

Key Models:
- **User**: Authentication and user data
- **Product**: Product catalog
- **Category**: Product categories
- **Brand**: Product brands
- **Order**: Customer orders
- **OrderItem**: Order line items
- **StockMovement**: Inventory tracking
- **Shipping**: Shipping information

---

## 🚀 Deployment Configuration

### Vercel (Frontend)
- **Project**: `frontend` (root directory: `frontend/`)
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install --legacy-peer-deps`
- **Auto-deploy**: Enabled (on push to GitHub)

### Heroku (Backend)
- **App Name**: `loudbrands-backend-eu`
- **Buildpack**: Node.js
- **Start Command**: `node src/server.js`
- **Database**: Heroku Postgres
- **Auto-deploy**: Enabled (on push to GitHub)

---

## 🔄 Git Workflow & Auto-Deployment

### Current Setup
✅ **Git Repository**: Connected to `https://github.com/messaoudinedjemeddine/Loudbrands2.0`
✅ **Branch**: `master`
✅ **Auto-deployment**: 
   - Vercel deploys frontend automatically on push
   - Heroku deploys backend automatically on push

### Deployment Process
1. **Make changes** to frontend or backend code
2. **Stage changes**: `git add .`
3. **Commit**: `git commit -m "Your message"`
4. **Push**: `git push origin master`
5. **Auto-deploy**: 
   - Vercel detects push → builds and deploys frontend
   - Heroku detects push → builds and deploys backend

### Quick Push Script
Use `push-changes.ps1` for easy deployment:
```powershell
.\push-changes.ps1
```

---

## 📝 Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NODE_ENV`: Production/Development
- Cloudinary variables (if needed)

### Backend (Heroku)
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Heroku)
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: Frontend URL for CORS
- `YALIDINE_API_KEY`: Shipping API key
- `YALIDINE_API_SECRET`: Shipping API secret
- Cloudinary variables
- WhatsApp API credentials

---

## 🔍 Important Files

### Configuration Files
- `frontend/next.config.js`: Next.js configuration
- `frontend/vercel.json`: Vercel deployment config
- `backend/Procfile`: Heroku process configuration
- `backend/prisma/schema.prisma`: Database schema
- `.gitignore`: Git ignore rules

### Key Application Files
- `frontend/lib/api.ts`: API client
- `backend/src/server.js`: Express server entry point
- `frontend/app/layout.tsx`: Root layout
- `backend/src/middleware/auth.js`: Authentication middleware

---

## 🛠️ Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
```

### Backend
```bash
cd backend
npm install
npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
```

---

## 📊 Project Statistics

- **Frontend**: ~211 files (153 TSX, 21 TS)
- **Backend**: ~50+ route handlers
- **Database**: Multiple models with relationships
- **Languages**: TypeScript (82.5%), JavaScript (16.0%), CSS (1.0%)

---

## ✅ Pre-Deployment Checklist

Before making changes:
- [ ] Test changes locally
- [ ] Check environment variables are set
- [ ] Verify database migrations (if schema changed)
- [ ] Test API endpoints
- [ ] Check build errors
- [ ] Review git status before committing

After pushing:
- [ ] Monitor Vercel deployment logs
- [ ] Monitor Heroku deployment logs
- [ ] Test deployed application
- [ ] Verify API connectivity
- [ ] Check for any runtime errors

---

## 🐛 Common Issues & Solutions

### Build Failures
- Check `package.json` dependencies
- Verify Node.js version matches (20.x for backend)
- Check for TypeScript errors
- Review build logs in Vercel/Heroku

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration in backend
- Verify backend is running
- Check network connectivity

### Database Issues
- Run migrations: `heroku run npx prisma migrate deploy`
- Generate Prisma client: `heroku run npx prisma generate`
- Check database connection string

---

## 📞 Support Resources

- **GitHub Repo**: https://github.com/messaoudinedjemeddine/Loudbrands2.0
- **Vercel Dashboard**: https://vercel.com/nedjem-eddine-messaoudis-projects/frontend
- **Heroku Dashboard**: https://dashboard.heroku.com/apps/loudbrands-backend-eu
- **Live Site**: https://www.loudbrandss.com

---

## 🎯 Next Steps for Development

1. ✅ **Git Setup**: Repository connected and ready
2. ✅ **Auto-deployment**: Configured on Vercel and Heroku
3. 🔄 **Make Changes**: Edit code, commit, and push
4. 📊 **Monitor**: Watch deployment logs
5. ✅ **Test**: Verify changes in production

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status**: ✅ Ready for Development
