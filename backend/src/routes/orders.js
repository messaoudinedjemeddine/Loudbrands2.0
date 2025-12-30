const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { getWilayaById, getWilayaName } = require('../utils/wilaya-mapper');
const DeliveryDeskMapper = require('../utils/delivery-desk-mapper');
const router = express.Router();

const prisma = new PrismaClient();

const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(10, 'Valid phone number is required'),
  customerEmail: z.string().email().optional(),
  deliveryType: z.enum(['HOME_DELIVERY', 'PICKUP']),
  deliveryAddress: z.string().optional(),
  wilayaId: z.number().min(1, 'Wilaya is required'),
  communeId: z.string().optional(), // Added communeId
  communeName: z.string().optional(), // Added communeName
  wilayaName: z.string().optional(), // Added wilayaName
  deliveryDeskId: z.string().optional(),
  deliveryDeskName: z.string().optional(),
  deliveryFee: z.union([z.number().min(0, 'Delivery fee must be non-negative'), z.undefined()]).optional(),
  notes: z.string().transform(val => val ? `Client: ${val}` : val).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    sizeId: z.string().optional()
  })).min(1, 'At least one item is required')
}).refine((data) => {
  // For PICKUP orders, deliveryDeskId should be provided and not empty
  if (data.deliveryType === 'PICKUP' && (!data.deliveryDeskId || data.deliveryDeskId.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Delivery desk ID is required for pickup orders",
  path: ["deliveryDeskId"]
});

// Create new order
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Received order data:', req.body);

    let orderData;
    try {
      orderData = createOrderSchema.parse(req.body);
    } catch (validationError) {
      console.error('❌ Validation error:', validationError.errors);
      console.error('❌ Received data:', req.body);
      return res.status(400).json({
        error: 'Invalid input data',
        details: validationError.errors,
        receivedData: req.body
      });
    }

    // Get wilaya information using the mapper utility
    const wilayaInfo = getWilayaById(orderData.wilayaId);
    if (!wilayaInfo) {
      return res.status(400).json({
        error: `Unsupported wilaya ID: ${orderData.wilayaId}`
      });
    }

    const cityName = wilayaInfo.name;

    // Find the city by name with fallback options
    let city = await prisma.city.findFirst({
      where: { name: cityName }
    });

    // If not found, try alternative name formats
    if (!city) {
      // Try with different case variations and alternative names
      city = await prisma.city.findFirst({
        where: {
          OR: [
            { name: { equals: cityName, mode: 'insensitive' } },
            { name: { contains: cityName, mode: 'insensitive' } },
            { nameAr: { contains: cityName, mode: 'insensitive' } },
            // Try with alternative names from the mapper
            ...wilayaInfo.alternatives.map(alt => ({
              name: { equals: alt, mode: 'insensitive' }
            })),
            ...wilayaInfo.alternatives.map(alt => ({
              nameAr: { contains: alt, mode: 'insensitive' }
            }))
          ]
        }
      });
    }

    if (!city) {
      console.log(`City not found for wilaya ID ${orderData.wilayaId} with name: ${cityName}. Creating city...`);

      // Create the city if it doesn't exist
      try {
        city = await prisma.city.create({
          data: {
            name: cityName,
            nameAr: wilayaInfo.nameAr,
            code: wilayaInfo.code,
            deliveryFee: 300, // Default delivery fee
            isActive: true
          }
        });
        console.log(`✅ Created new city: ${city.name} (${city.nameAr})`);
      } catch (createError) {
        console.error(`❌ Failed to create city ${cityName}:`, createError);
        console.error('Available cities in database:', await prisma.city.findMany({ select: { name: true, nameAr: true } }));
        return res.status(400).json({
          error: `City not found for wilaya: ${cityName}. Please contact support.`
        });
      }
    }

    // Generate order number
    // Fix: Find the latest order to increment properly (avoids collisions if orders were deleted or IDs modified manually)
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let nextOrderNum = 1;
    if (lastOrder && lastOrder.orderNumber && lastOrder.orderNumber.startsWith('ORD-')) {
      const match = lastOrder.orderNumber.match(/ORD-(\d+)/);
      if (match) {
        nextOrderNum = parseInt(match[1]) + 1;
      }
    }
    const orderNumber = `ORD-${String(nextOrderNum).padStart(6, '0')}`;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { sizes: true }
      });

      if (!product || !product.isActive) {
        return res.status(400).json({
          error: `Product not found: ${item.productId}`
        });
      }

      // Check stock
      let availableStock = product.stock;
      let sizeString = null;

      if (item.sizeId) {
        const size = product.sizes.find(s => s.id === item.sizeId);
        if (!size) {
          return res.status(400).json({
            error: `Size not found for product: ${product.name}`
          });
        }
        availableStock = size.stock;
        sizeString = size.size;
      }

      /* 
      // DISABLED STOCK CHECK - Custom Requirement
      // Allow orders even if stock is insufficient (Backorders)
      if (availableStock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product: ${product.name}`
        });
      }
      */

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        sizeId: item.sizeId,
        size: sizeString
      });
    }

    // Use delivery fee from frontend or calculate default
    const deliveryFee = (orderData.deliveryFee !== undefined && orderData.deliveryFee !== null) ? orderData.deliveryFee : (orderData.deliveryType === 'HOME_DELIVERY' ? 500 : 0);
    const total = subtotal + deliveryFee;

    console.log('🔍 Order creation debug:', {
      subtotal,
      deliveryFee,
      total,
      deliveryType: orderData.deliveryType,
      frontendDeliveryFee: orderData.deliveryFee
    });

    // Handle delivery desk for pickup orders
    let deliveryDeskId = null;
    if (orderData.deliveryType === 'PICKUP') {
      // Use the mapper to find or create a delivery desk for this city
      const centerName = orderData.deliveryDeskName || `Yalidine Center - ${city.name}`;
      deliveryDeskId = await DeliveryDeskMapper.findOrCreateDeliveryDesk(
        city.id,
        orderData.deliveryDeskId, // Yalidine center ID
        centerName // Yalidine center name
      );

      if (deliveryDeskId) {
        console.log(`✅ Delivery desk resolved: ${deliveryDeskId}`);
      } else {
        console.log(`⚠️ Could not resolve delivery desk for city: ${city.name} (${city.id})`);
        // Order will be created without a delivery desk
      }
    }

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          deliveryType: orderData.deliveryType,
          deliveryAddress: orderData.deliveryAddress,
          deliveryFee,
          subtotal,
          total,
          notes: orderData.notes,
          cityId: city.id,
          deliveryDeskId: deliveryDeskId,
          // deliveryDetails restored
          deliveryDetails: {
            wilayaId: String(orderData.wilayaId),
            wilayaName: orderData.wilayaName,
            communeId: orderData.communeId,
            communeName: orderData.communeName,
            centerId: orderData.deliveryDeskId,
            centerName: orderData.deliveryDeskName
          },
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          city: true,
          deliveryDesk: true
        }
      });

      // Update stock
      for (const item of orderData.items) {
        if (item.sizeId) {
          await tx.productSize.update({
            where: { id: item.sizeId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return newOrder;
    });

    // Send notification to Admin users
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        include: { pushSubscriptions: true }
      });

      const notificationPayload = JSON.stringify({
        title: 'New Order Received',
        body: `Order #${orderNumber} received from ${orderData.customerName}. Total: ${total} DA`,
        url: `/admin/orders/${order.id}`, // Deep link to order
        data: {
          orderId: order.id
        }
      });

      const webpush = require('web-push');
      // Configuration is already done in notifications.js or we re-do it here or in a separate config
      // But we need to make sure web-push is configured with keys.
      // Since it's global process, it might rely on env or we import the keys again.
      // Best practice: utility file. For now, hardcoding keys here as well to be safe or import config.
      // Actually, let's just use the keys directly here to avoid import issues if not configured globally.
      const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
      const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

      if (publicVapidKey && privateVapidKey) {
        webpush.setVapidDetails(
          'mailto:admin@loudbrands.com',
          publicVapidKey,
          privateVapidKey
        );
      } else {
        console.warn('Skipping notifications: VAPID keys not configured');
      }

      for (const user of adminUsers) {
        for (const sub of user.pushSubscriptions) {
          try {
            await webpush.sendNotification({
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, notificationPayload);
          } catch (error) {
            console.error('Error sending notification to user', user.id, error);
            if (error.statusCode === 410) {
              // Subscription expired
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }
    } catch (notifyError) {
      console.error('Failed to send admin notifications:', notifyError);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.errors
      });
    }

    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, city } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status && status !== 'all') {
      where.callCenterStatus = status;
    }
    if (city && city !== 'all') {
      where.city = {
        name: city
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  }
                }
              }
            }
          },
          city: true,
          deliveryDesk: true
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            productSize: true
          }
        },
        city: true,
        deliveryDesk: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;