release: cd backend && (node scripts/migrate-with-retry.js || echo "⚠️ Migration failed - continuing deployment. Run 'heroku run npx prisma migrate deploy' manually if needed.")
web: npm start
