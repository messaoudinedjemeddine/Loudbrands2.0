# 🚀 Vercel Environment Variables for LoudBrands Frontend

## Required Environment Variables

Copy these environment variables into your Vercel Dashboard:

### 1. **NEXT_PUBLIC_API_URL**
```
Name: NEXT_PUBLIC_API_URL
Value: https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api
Environment: Production ✅ Preview ✅ Development ✅
```

## 📋 Step-by-Step Instructions

### Step 1: Access Vercel Dashboard
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **frontend** project

### Step 2: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Add the variable above:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api`
   - **Environment**: Select all (Production, Preview, Development)

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete

## 🔧 What This Does

- **Links your frontend to the backend API**
- **Enables all API calls** (products, orders, auth, admin, etc.)
- **Ensures proper CORS configuration**
- **Makes your app fully functional**

## ✅ Verification

After deployment, test these endpoints:
- **Frontend**: `https://your-frontend-domain.vercel.app`
- **API Health**: `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/health`
- **API Info**: `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api`

## 🚨 Important Notes

- **No additional environment variables needed** - your backend is already configured
- **CORS is properly set up** for your Vercel domain
- **All API endpoints are working** and tested
- **Authentication is fully functional**

## 🎯 Expected Result

After setting up the environment variable and redeploying:
- ✅ Frontend will connect to backend
- ✅ Products will load from database
- ✅ Orders can be created
- ✅ Admin dashboard will work
- ✅ Authentication will function
- ✅ All features will be operational

---

**Your backend is ready and deployed at:**
`https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com`

**Just add the environment variable and redeploy your frontend!** 🚀
