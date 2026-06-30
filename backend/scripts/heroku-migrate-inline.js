// Script inline pour exécuter directement dans la console Heroku
// Copiez-collez ce code dans la console Heroku (More → Run console)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    try {
        console.log('🔄 Démarrage de la migration...');
        
        // Créer la table
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
        console.log('✅ Table stock_movements créée');

        // Créer les index
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type");`);
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "stock_movements_operationType_idx" ON "stock_movements"("operationType");`);
        console.log('✅ Index créés');

        console.log('🎉 Migration terminée avec succès!');
        
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('ℹ️  La table existe déjà. Migration ignorée.');
        } else {
            console.error('❌ Erreur:', error.message);
            throw error;
        }
    } finally {
        await prisma.$disconnect();
    }
})();
