const express = require('express');
const { authenticateToken, requireAgentLivraison } = require('../middleware/auth');
const prisma = require('../config/database');
const { z } = require('zod');

const router = express.Router();

// All agent livraison routes require authentication and agent livraison role
router.use(authenticateToken);
router.use(requireAgentLivraison);

// Get orders ready for delivery (CONFIRMED status)
router.get('/orders/ready-for-delivery', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        callCenterStatus: 'CONFIRMED',
        deliveryStatus: 'NOT_READY'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        city: true,
        deliveryDesk: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders ready for delivery:', error);
    res.status(500).json({ error: 'Failed to fetch orders ready for delivery' });
  }
});

// Get orders in transit
router.get('/orders/in-transit', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        deliveryStatus: 'IN_TRANSIT'
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        city: true,
        deliveryDesk: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders in transit:', error);
    res.status(500).json({ error: 'Failed to fetch orders in transit' });
  }
});

// Mark order as ready for delivery
router.patch('/orders/:orderId/mark-ready', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'READY',
        notes: notes ? `${order.notes || ''}\n[READY FOR DELIVERY] ${notes}` : order.notes
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error marking order as ready:', error);
    res.status(500).json({ error: 'Failed to mark order as ready' });
  }
});

// Start delivery (mark as in transit)
router.patch('/orders/:orderId/start-delivery', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'IN_TRANSIT',
        notes: notes ? `${order.notes || ''}\n[DELIVERY STARTED] ${notes}` : order.notes
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({ error: 'Failed to start delivery' });
  }
});

// Complete delivery
router.patch('/orders/:orderId/complete-delivery', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'DONE',
        notes: notes ? `${order.notes || ''}\n[DELIVERY COMPLETED] ${notes}` : order.notes
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ error: 'Failed to complete delivery' });
  }
});

// Get delivery statistics by city
router.get('/delivery/stats-by-city', async (req, res) => {
  try {
    const stats = await prisma.order.groupBy({
      by: ['cityId', 'deliveryStatus'],
      where: {
        callCenterStatus: 'CONFIRMED'
      },
      _count: {
        deliveryStatus: true
      }
    });

    // Group by city
    const cityStats = {};
    for (const stat of stats) {
      if (!cityStats[stat.cityId]) {
        cityStats[stat.cityId] = {
          cityId: stat.cityId,
          notReady: 0,
          ready: 0,
          inTransit: 0,
          done: 0
        };
      }
      cityStats[stat.cityId][stat.deliveryStatus.toLowerCase().replace('_', '')] = stat._count.deliveryStatus;
    }

    // Get city names
    const cities = await prisma.city.findMany({
      where: {
        id: {
          in: Object.keys(cityStats)
        }
      }
    });

    const result = Object.values(cityStats).map(stat => ({
      ...stat,
      cityName: cities.find(city => city.id === stat.cityId)?.name || 'Unknown'
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching delivery stats by city:', error);
    res.status(500).json({ error: 'Failed to fetch delivery stats' });
  }
});

// Get agent livraison dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [notReadyOrders, readyOrders, inTransitOrders, completedOrders] = await Promise.all([
      prisma.order.count({ 
        where: { 
          callCenterStatus: 'CONFIRMED',
          deliveryStatus: 'NOT_READY' 
        } 
      }),
      prisma.order.count({ where: { deliveryStatus: 'READY' } }),
      prisma.order.count({ where: { deliveryStatus: 'IN_TRANSIT' } }),
      prisma.order.count({ where: { deliveryStatus: 'DONE' } })
    ]);

    res.json({
      notReadyOrders,
      readyOrders,
      inTransitOrders,
      completedOrders,
      totalOrders: notReadyOrders + readyOrders + inTransitOrders + completedOrders
    });
  } catch (error) {
    console.error('Error fetching agent livraison stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get order details
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        city: true,
        deliveryDesk: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

module.exports = router;

