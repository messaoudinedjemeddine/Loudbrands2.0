# Release phase: apply pending Prisma migrations before the new code goes live.
# Uses a single database connection; if it fails, Heroku keeps the previous release running.
release: cd backend && npx prisma migrate deploy
web: npm start
