/**
 * Removes from _prisma_migrations any migration that was added after commit 5d20c56,
 * so only migrations from that commit are considered applied.
 *
 * Run locally: node scripts/rollback-migrations-after-5d20c56.js
 * Run on Heroku: heroku run "cd backend && node scripts/rollback-migrations-after-5d20c56.js" -a loudbrands-backend-eu
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MIGRATIONS_TO_REMOVE = [
  '20260202120000_fix_stock_reception_payment_status',
];

async function main() {
  for (const name of MIGRATIONS_TO_REMOVE) {
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM _prisma_migrations WHERE migration_name = $1`,
      name
    );
    console.log(`Removed migration record "${name}": ${result} row(s) deleted.`);
  }
  console.log('Done. Only migrations from commit 5d20c56 are now considered applied.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
