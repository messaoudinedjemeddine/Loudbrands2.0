require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateStockMovements() {
    try {
        console.log('Creating stock_movements table...');
        
        // Execute the SQL migration
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "stock_movements" (
                "id" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "barcode" TEXT,
                "productName" TEXT NOT NULL,
                "productReference" TEXT,
                "size" TEXT,
                "quantity" INTEGER NOT NULL,
                "oldStock" INTEGER,
                "newStock" INTEGER,
                "orderNumber" TEXT,
                "trackingNumber" TEXT,
                "notes" TEXT,
                "operationType" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('Creating indexes...');
        
        // Create indexes
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
        `);
        
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type");
        `);
        
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "stock_movements_operationType_idx" ON "stock_movements"("operationType");
        `);

        console.log('✅ Migration completed successfully!');
        console.log('The stock_movements table has been created with all necessary indexes.');
        
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Table stock_movements already exists. Migration skipped.');
        } else {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    } finally {
        await prisma.$disconnect();
    }
}

migrateStockMovements();
