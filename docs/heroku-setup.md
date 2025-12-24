# 🚀 Heroku Setup for LOUD BRANDS Backend

## Quick Setup Commands

```bash
# 1. Install Heroku CLI (if not already installed)
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create a new Heroku app
heroku create loudbrands-api

# 4. Add PostgreSQL database
heroku addons:create heroku-postgresql:mini

# 5. Set environment variables
heroku config:set JWT_SECRET="your-super-secret-jwt-key-here"
heroku config:set YALIDINE_API_KEY="your-yalidine-api-key"
heroku config:set YALIDINE_API_SECRET="your-yalidine-api-secret"
heroku config:set FRONTEND_URL="https://your-frontend-domain.vercel.app"

# 6. Deploy the backend
cd backend
git subtree push --prefix=backend heroku master

# 7. Run database migrations
heroku run npx prisma migrate deploy
heroku run npx prisma generate

# 8. Optional: Seed the database
heroku run npm run db:seed
```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Heroku Postgres |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key` |
| `YALIDINE_API_KEY` | Yalidine API key | `your-yalidine-api-key` |
| `YALIDINE_API_SECRET` | Yalidine API secret | `your-yalidine-api-secret` |
| `FRONTEND_URL` | Frontend domain for CORS | `https://your-domain.vercel.app` |

## Useful Commands

```bash
# Check app status
heroku ps

# View logs
heroku logs --tail

# Open app in browser
heroku open

# Check config variables
heroku config

# Run commands in Heroku
heroku run npm run db:seed
heroku run npx prisma studio
```

## Troubleshooting

1. **Build fails**: Check that all dependencies are in `package.json`
2. **Database issues**: Run `heroku pg:info` to check database status
3. **CORS errors**: Verify `FRONTEND_URL` is set correctly
4. **JWT errors**: Ensure `JWT_SECRET` is set and strong
