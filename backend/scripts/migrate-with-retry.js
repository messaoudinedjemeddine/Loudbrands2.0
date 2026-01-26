#!/usr/bin/env node

const { execSync } = require('child_process');
const { setTimeout } = require('timers/promises');

const MAX_RETRIES = 5;
const INITIAL_DELAY = 5000; // 5 seconds

async function runMigrationWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Migration attempt ${attempt}/${MAX_RETRIES}...`);
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: __dirname + '/..'
      });
      console.log('✅ Migrations completed successfully!');
      process.exit(0);
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error('❌ All migration attempts failed');
        console.error('⚠️  You may need to run migrations manually: heroku run npx prisma migrate deploy');
        process.exit(1);
      }
      
      const delay = INITIAL_DELAY * attempt;
      console.log(`⏳ Migration failed, waiting ${delay / 1000} seconds before retry...`);
      await setTimeout(delay);
    }
  }
}

runMigrationWithRetry();

