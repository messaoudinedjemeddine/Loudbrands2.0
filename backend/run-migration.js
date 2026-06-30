const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔄 Migration en cours...');
        
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS stock_movements (
                id TEXT NOT NULL,
                type TEXT NOT NULL,
                barcode TEXT,
                "productName" TEXT NOT NULL,
                "productReference" TEXT,
                size TEXT,
                quantity INTEGER NOT NULL,
                "oldStock" INTEGER,
                "newStock" INTEGER,
                "orderNumber" TEXT,
                "trackingNumber" TEXT,
                notes TEXT,
                "operationType" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT stock_movements_pkey PRIMARY KEY (id)
            );
        `);
        console.log('✅ Table créée');

        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS stock_movements_createdAt_idx ON stock_movements("createdAt");');
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS stock_movements_type_idx ON stock_movements(type);');
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS stock_movements_operationType_idx ON stock_movements("operationType");');
        console.log('✅ Index créés');
        console.log('🎉 Migration réussie!');
        
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('relation')) {
            console.log('ℹ️  Table existe déjà');
        } else {
            console.error('❌ Erreur:', error.message);
            process.exit(1);
        }
    } finally {
        await prisma.$disconnect();
    }
})();
