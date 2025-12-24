const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Maps Yalidine center information to local delivery desk
 * This function helps bridge the gap between Yalidine centers and local delivery desks
 */
class DeliveryDeskMapper {
  
  /**
   * Find or create a delivery desk for a given city
   * @param {string} cityId - The city ID
   * @param {string} yalidineCenterId - The Yalidine center ID (optional)
   * @param {string} yalidineCenterName - The Yalidine center name (optional)
   * @returns {Promise<string|null>} - The delivery desk ID or null
   */
  static async findOrCreateDeliveryDesk(cityId, yalidineCenterId = null, yalidineCenterName = null) {
    try {
      // First, try to find an existing delivery desk in the city
      const existingDesk = await prisma.deliveryDesk.findFirst({
        where: {
          cityId: cityId,
          isActive: true
        }
      });

      if (existingDesk) {
        console.log(`✅ Found existing delivery desk: ${existingDesk.name} (${existingDesk.id})`);
        return existingDesk.id;
      }

      // If no existing desk, create one based on Yalidine center info
      if (yalidineCenterName) {
        const city = await prisma.city.findUnique({
          where: { id: cityId }
        });

        if (city) {
          const newDesk = await prisma.deliveryDesk.create({
            data: {
              name: yalidineCenterName,
              nameAr: yalidineCenterName, // You might want to translate this
              address: `Yalidine Center - ${city.name}`,
              phone: null,
              isActive: true,
              cityId: cityId
            }
          });

          console.log(`✅ Created new delivery desk: ${newDesk.name} (${newDesk.id})`);
          return newDesk.id;
        }
      }

      console.log(`⚠️ Could not find or create delivery desk for city: ${cityId}`);
      return null;

    } catch (error) {
      console.error('❌ Error in findOrCreateDeliveryDesk:', error);
      return null;
    }
  }

  /**
   * Get delivery desk info for a city
   * @param {string} cityId - The city ID
   * @returns {Promise<Object|null>} - Delivery desk info or null
   */
  static async getDeliveryDeskInfo(cityId) {
    try {
      const desk = await prisma.deliveryDesk.findFirst({
        where: {
          cityId: cityId,
          isActive: true
        },
        include: {
          city: true
        }
      });

      return desk;
    } catch (error) {
      console.error('❌ Error getting delivery desk info:', error);
      return null;
    }
  }

  /**
   * List all delivery desks
   * @returns {Promise<Array>} - Array of delivery desks
   */
  static async listAllDeliveryDesks() {
    try {
      const desks = await prisma.deliveryDesk.findMany({
        where: {
          isActive: true
        },
        include: {
          city: true
        },
        orderBy: {
          city: {
            name: 'asc'
          }
        }
      });

      return desks;
    } catch (error) {
      console.error('❌ Error listing delivery desks:', error);
      return [];
    }
  }
}

module.exports = DeliveryDeskMapper;
