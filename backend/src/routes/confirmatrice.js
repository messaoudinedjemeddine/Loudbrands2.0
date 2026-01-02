const express = require('express');
const { authenticateToken, requireConfirmatrice } = require('../middleware/auth');
const prisma = require('../config/database');
const { z } = require('zod');
const yalidineService = require('../services/yalidine');

const router = express.Router();

// Helper function to format order data for Yalidine shipment
const formatOrderForYalidine = (order) => {
  // Create product list from order items
  // Create product list from order items
  const productList = order.items.map(item => {
    // Prefer the explicit size string, fallback to productSize.size, fallback to empty
    const sizeStr = item.size || (item.productSize ? item.productSize.size : '');
    // Format: 1x ItemName (Size)
    return `${item.quantity}x ${item.product.name}${sizeStr ? ` (${sizeStr})` : ''}`;
  }).join('\n');

  // Get customer name
  const customerName = `${order.customerName}`;
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Get delivery details (prefer explicit names saved at checkout)
  const deliveryDetails = order.deliveryDetails || {};
  console.log('📦 formatOrderForYalidine - deliveryDetails:', JSON.stringify(deliveryDetails));

  // Calculate stopdesk_id
  // Must use the Yalidine Center ID (integer) saved in deliveryDetails.centerId
  let stopdeskId = null;
  if (order.deliveryType === 'PICKUP') {
    if (deliveryDetails.centerId) {
      stopdeskId = parseInt(deliveryDetails.centerId);
    } else {
      // Fallback logic (risky if deliveryDesk in DB doesn't store yalidine ID)
      console.warn(`⚠️ No deliveryDetails.centerId found for pickup order ${order.orderNumber}. Using 0 or invalid ID.`);
      stopdeskId = null; // Yalidine API might reject this if is_stopdesk is true
    }
  }

  const payload = {
    order_id: order.orderNumber,
    from_wilaya_name: 'Batna', // Default from wilaya
    firstname: firstName,
    familyname: lastName,
    contact_phone: order.customerPhone,
    address: order.deliveryAddress || '',
    // Use saved name first, then fallback to relational data, then fallback logic
    to_commune_name: deliveryDetails.communeName || order.deliveryDesk?.name || order.city?.name || '',
    to_wilaya_name: deliveryDetails.wilayaName || order.city?.name || '',
    product_list: productList,
    price: Math.round(order.subtotal), // Use subtotal to avoid double delivery fee
    do_insurance: false,
    declared_value: Math.round(order.subtotal), // Use subtotal for insurance as well
    length: 10, // Default dimensions
    width: 10,
    height: 10,
    weight: 1, // Default weight
    freeshipping: false,
    is_stopdesk: order.deliveryType === 'PICKUP',
    stopdesk_id: stopdeskId,
    has_exchange: false,
    product_to_collect: null
  };

  console.log('📦 Yalidine Payload prepared:', JSON.stringify(payload, null, 2));
  return payload;
};

// All confirmatrice routes require authentication and confirmatrice role
router.use(authenticateToken);
router.use(requireConfirmatrice);

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingOrders, confirmedOrders, canceledOrders, noResponseOrders, totalOrders] = await Promise.all([
      // Pending orders (NEW status)
      prisma.order.count({
        where: {
          callCenterStatus: 'NEW'
        }
      }),
      // Confirmed orders today
      prisma.order.count({
        where: {
          callCenterStatus: 'CONFIRMED',
          updatedAt: {
            gte: today
          }
        }
      }),
      // Canceled orders
      prisma.order.count({
        where: {
          callCenterStatus: 'CANCELED'
        }
      }),
      // No response orders
      prisma.order.count({
        where: {
          callCenterStatus: 'NO_RESPONSE'
        }
      }),
      // Total orders (all statuses except DONE)
      prisma.order.count({
        where: {
          callCenterStatus: {
            in: ['NEW', 'CONFIRMED', 'PENDING', 'DOUBLE_ORDER', 'DELAYED', 'NO_RESPONSE', 'CANCELED']
          }
        }
      })
    ]);

    res.json({
      pendingOrders,
      confirmedOrders,
      canceledOrders,
      noResponseOrders,
      totalOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get orders that need confirmation (all statuses except DONE)
router.get('/orders/pending', async (req, res) => {
  try {
    const [orders, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where: {
          callCenterStatus: {
            in: ['NEW', 'CONFIRMED', 'PENDING', 'DOUBLE_ORDER', 'DELAYED', 'NO_RESPONSE']
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  sizes: true
                }
              },
              productSize: true
            }
          },
          city: true,
          deliveryDesk: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      // Get total counts by status (for stats cards)
      prisma.order.groupBy({
        by: ['callCenterStatus'],
        _count: {
          callCenterStatus: true
        }
      })
    ]);

    // Format status counts into an object
    const statusBreakdown = statusCounts.reduce((acc, item) => {
      acc[item.callCenterStatus] = item._count.callCenterStatus;
      return acc;
    }, {});

    // Calculate total orders (sum of all statuses)
    const totalOrders = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);

    res.json({
      orders,
      stats: {
        totalOrders,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

// Confirm an order and create Yalidine shipment
router.patch('/orders/:orderId/confirm', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    // First, get the order with all details
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                sizes: true
              }
            },
            productSize: true
          }
        },
        city: true,
        deliveryDesk: true
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        callCenterStatus: 'CONFIRMED',
        notes: notes ? `${existingOrder.notes || ''}\n[CONFIRMED] ${notes}` : existingOrder.notes
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                sizes: true
              }
            },
            productSize: true
          }
        },
        city: true,
        deliveryDesk: true
      }
    });

    // Create Yalidine shipment
    try {
      const shipmentData = formatOrderForYalidine(updatedOrder);
      console.log('🚚 Creating Yalidine shipment for order:', orderId);
      console.log('📦 Shipment data:', shipmentData);

      const yalidineResult = await yalidineService.createParcel(shipmentData);

      if (yalidineResult.success) {
        // Update order with tracking information
        await prisma.order.update({
          where: { id: orderId },
          data: {
            trackingNumber: yalidineResult.tracking,
            yalidineShipmentId: yalidineResult.import_id,
            notes: `${updatedOrder.notes || ''}\n[YALIDINE] Shipment created: ${yalidineResult.tracking}`
          }
        });

        console.log('✅ Yalidine shipment created successfully:', yalidineResult.tracking);
      } else {
        console.error('❌ Failed to create Yalidine shipment:', yalidineResult.message);
        // Don't fail the order confirmation, just log the error
      }
    } catch (yalidineError) {
      console.error('❌ Error creating Yalidine shipment:', yalidineError);
      // Don't fail the order confirmation, just log the error
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// Cancel an order
router.patch('/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        callCenterStatus: 'CANCELED',
        notes: reason ? `${order.notes || ''}\n[CANCELED] ${reason}` : order.notes
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
    console.error('Error canceling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Mark order as no response
router.patch('/orders/:orderId/no-response', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        callCenterStatus: 'NO_RESPONSE',
        notes: notes ? `${order.notes || ''}\n[NO RESPONSE] ${notes}` : order.notes
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
    console.error('Error marking order as no response:', error);
    res.status(500).json({ error: 'Failed to update order status' });
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
            product: {
              include: {
                sizes: true
              }
            },
            productSize: true
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

// Update order details
router.patch('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryType,
      deliveryAddress,
      callCenterStatus,
      notes
    } = req.body;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName,
        customerPhone,
        customerEmail,
        deliveryType,
        deliveryAddress,
        callCenterStatus,
        notes: notes ? `${order.notes || ''}\n[UPDATED] ${notes}` : order.notes
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                sizes: true
              }
            },
            productSize: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update order item quantity
router.patch('/orders/:orderId/items/:itemId', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity } = req.body;

    const orderItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: true
      }
    });

    // Recalculate order totals
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: { product: true }
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryFee: true }
    });

    const total = subtotal + (order?.deliveryFee || 0);

    await prisma.order.update({
      where: { id: orderId },
      data: { subtotal, total }
    });

    res.json(orderItem);
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ error: 'Failed to update order item' });
  }
});

// Remove order item
router.delete('/orders/:orderId/items/:itemId', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    await prisma.orderItem.delete({
      where: { id: itemId }
    });

    // Recalculate order totals
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: { product: true }
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryFee: true }
    });

    const total = subtotal + (order?.deliveryFee || 0);

    await prisma.order.update({
      where: { id: orderId },
      data: { subtotal, total }
    });

    res.json({ message: 'Order item removed successfully' });
  } catch (error) {
    console.error('Error removing order item:', error);
    res.status(500).json({ error: 'Failed to remove order item' });
  }
});

// Add product to order
router.post('/orders/:orderId/items', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, sizeId } = req.body;

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { sizes: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get size details if provided
    let size = null;
    if (sizeId) {
      size = await prisma.productSize.findUnique({
        where: { id: sizeId }
      });
    }

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        productId,
        quantity,
        price: product.price,
        size: size?.size || null,
        sizeId: sizeId || null
      },
      include: {
        product: true,
        productSize: true
      }
    });

    // Recalculate order totals
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
      include: { product: true }
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryFee: true }
    });

    const total = subtotal + (order?.deliveryFee || 0);

    await prisma.order.update({
      where: { id: orderId },
      data: { subtotal, total }
    });

    res.json(orderItem);
  } catch (error) {
    console.error('Error adding product to order:', error);
    res.status(500).json({ error: 'Failed to add product to order' });
  }
});

// Get confirmatrice dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [pendingOrders, confirmedOrders, canceledOrders, noResponseOrders] = await Promise.all([
      prisma.order.count({ where: { callCenterStatus: 'NEW' } }),
      prisma.order.count({ where: { callCenterStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { callCenterStatus: 'CANCELED' } }),
      prisma.order.count({ where: { callCenterStatus: 'NO_RESPONSE' } })
    ]);

    res.json({
      pendingOrders,
      confirmedOrders,
      canceledOrders,
      noResponseOrders,
      totalOrders: pendingOrders + confirmedOrders + canceledOrders + noResponseOrders
    });
  } catch (error) {
    console.error('Error fetching confirmatrice stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
