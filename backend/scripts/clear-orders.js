const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Starting to clear all orders...')

    try {
        const deleteOrders = await prisma.order.deleteMany()
        console.log(`Successfully deleted ${deleteOrders.count} orders.`)
    } catch (error) {
        console.error('Error deleting orders:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
