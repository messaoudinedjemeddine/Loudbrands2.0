-- Rollback migrations that were applied after commit 5d20c56
-- (so only migrations from that commit are considered "applied").
-- Run this once on your DB (e.g. Heroku: heroku pg:psql -a loudbrands-backend-eu < prisma/rollback-post-5d20c56.sql)
-- or: heroku pg:psql -a loudbrands-backend-eu -f prisma/rollback-post-5d20c56.sql

DELETE FROM _prisma_migrations
WHERE migration_name = '20260202120000_fix_stock_reception_payment_status';
