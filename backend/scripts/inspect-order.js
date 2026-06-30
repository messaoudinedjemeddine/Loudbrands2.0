const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const orderId = 'cmj45gndn0002jjejjl5b098f' // ID from user
    console.log(`Inspecting order: ${orderId}`)

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                        productSize: true
                    }
                }
            }
        })

        if (!order) {
            console.log('Order not found!')
        } else {
            console.log('Order found:', JSON.stringify(order, null, 2))
            order.items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`)
                console.log(`  Product: ${item.product.name}`)
                console.log(`  Size Field (String): "${item.size}"`)
                console.log(`  Size ID: ${item.sizeId}`)
                console.log(`  ProductSize Relation:`, item.productSize)
            })
        }
    } catch (error) {
        console.error('Error inspecting order:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
