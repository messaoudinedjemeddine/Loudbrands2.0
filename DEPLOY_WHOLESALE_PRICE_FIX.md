# 🚀 Deploy Wholesale Price Fix - Next Steps

## ✅ Current Status
- ✅ Code deployed to Heroku (commit 43e2c05)
- ✅ Route fix applied (moved `/products/wholesale-prices` before `/products/:id`)
- ⚠️ **Migration needs to be run manually**

## 📋 Next Steps

### Step 1: Run the Database Migration

The migration needs to be executed to add the `wholesalePrice` column to your database:

```powershell
# Login to Heroku (if not already logged in)
heroku login

# Run the migration
heroku run npx prisma migrate deploy -a loudbrands-backend-eu
```

This will:
- Add the `wholesalePrice` column to the `products` table
- Make it nullable (as defined in the schema)

### Step 2: Verify the Migration

Check that the migration ran successfully:

```powershell
# Check recent logs
heroku logs --tail -a loudbrands-backend-eu | Select-String -Pattern "migrate|wholesale"
```

You should see output indicating the migration was applied.

### Step 3: Test the Endpoint

Test the PUT endpoint to ensure it works:

```powershell
# You can test using curl or check in your frontend
# The endpoint should now work: PUT /api/admin/products/wholesale-prices
```

Or test via your frontend at: `https://loudbrandss.com/admin/wholesale-prices`

## 🔍 Verify Everything Works

1. **Check Heroku Dashboard**:
   - Go to: https://dashboard.heroku.com/apps/loudbrands-backend-eu
   - Check the "Activity" tab for the release phase execution

2. **Check Database**:
   - The `products` table should now have a `wholesalePrice` column
   - You can verify this by checking your database directly

3. **Test the API**:
   - Try updating wholesale prices from the admin panel
   - The PUT request should no longer return 404

## 📝 What Was Fixed

1. **Route Ordering**: Moved `/products/wholesale-prices` route before `/products/:id` in `admin.js`
   - This prevents Express from matching "wholesale-prices" as an ID parameter

2. **Database Migration**: Created migration to add `wholesalePrice` column
   - Migration file: `backend/prisma/migrations/20260228222615_add_wholesale_price_to_products/migration.sql`
   - Adds nullable `DOUBLE PRECISION` column

## 🎯 Expected Result

After running the migration:
- ✅ PUT `/api/admin/products/wholesale-prices` returns 200 (not 404)
- ✅ Wholesale prices can be updated in bulk
- ✅ Database has the `wholesalePrice` column
