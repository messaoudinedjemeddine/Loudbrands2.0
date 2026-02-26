const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sizeMapping = {
    // Numeric strings to Letters
    '34': 'XS',
    '36': 'S',
    '38': 'M',
    '40': 'L',
    '42': 'XL',
    '44': 'XL',
    '46': 'XXL',
    '48': 'XXL',
    '50': 'XXXL',
    '52': 'XXXL',
    // Handle cases where ranges might be stored (less likely but good to cover)
    '42-44': 'XL',
    '46-48': 'XXL',
    '50-52': 'XXXL'
}

async function main() {
    console.log('Starting size migration to letters...')

    try {
        const allSizes = await prisma.productSize.findMany({
            include: { product: true }
        })

        console.log(`Found ${allSizes.length} size records correctly.`)

        let updatedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const sizeRecord of allSizes) {
            const currentSize = sizeRecord.size.trim()

            // keyof sizeMapping logic
            const newSize = sizeMapping[currentSize]

            if (newSize) {
                if (newSize !== currentSize) {
                    try {
                        await prisma.productSize.update({
                            where: { id: sizeRecord.id },
                            data: { size: newSize }
                        })
                        console.log(`Updated ${sizeRecord.product.name} (ID: ${sizeRecord.id}): ${currentSize} -> ${newSize}`)
                        updatedCount++
                    } catch (updateError) {
                        console.error(`Failed to update ${sizeRecord.id}:`, updateError)
                        errorCount++
                    }
                } else {
                    skippedCount++
                }
            } else {
                // Check if it's already a letter or unknown
                if (['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(currentSize.toUpperCase())) {
                    // Already correct format
                    skippedCount++
                } else {
                    console.warn(`Unmapped size found for ${sizeRecord.product.name}: "${currentSize}" - Skipping`)
                    skippedCount++
                }
            }
        }

        console.log('Migration complete.')
        console.log(`Updated: ${updatedCount}`)
        console.log(`Skipped: ${skippedCount}`)
        console.log(`Errors: ${errorCount}`)

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
