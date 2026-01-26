const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('48'),
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z.enum(['price', 'rating', 'createdAt', 'name']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  inStock: z.string().optional(),
  onSale: z.string().optional()
});

// Scan product by barcode (Smart Mode)
router.post('/scan', async (req, res) => {
  try {
    const { barcode, action } = req.body; // action: 'add' | 'remove'

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    // Parse barcode: REF-SIZE (e.g., TSHIRT123-M) or REF (for accessories)
    const lastHyphenIndex = barcode.lastIndexOf('-');
    let reference, sizeName;

    if (lastHyphenIndex === -1) {
      // No hyphen found - treat as reference only (for accessories)
      reference = barcode;
      sizeName = null;
    } else {
      // Has hyphen - parse as REF-SIZE
      reference = barcode.substring(0, lastHyphenIndex);
      sizeName = barcode.substring(lastHyphenIndex + 1);
    }

    // Find product by reference
    const product = await prisma.product.findUnique({
      where: { reference },
      include: { 
        sizes: true,
        category: true // Include category to check if it's an accessory
      }
    });

    if (!product) {
      return res.status(404).json({ error: `Product with reference "${reference}" not found` });
    }

    // Check if product is an accessory (no sizes or category is accessories)
    const categorySlug = product.category?.slug?.toLowerCase() || '';
    const isAccessoire = categorySlug.includes('accessoire') || 
                        categorySlug.includes('accessories') ||
                        !product.sizes || 
                        product.sizes.length === 0;

    if (isAccessoire) {
      // Handle accessories - update product stock directly (no size-based stock)
      let newStock = product.stock || 0;
      if (action === 'add') {
        newStock += 1;
      } else if (action === 'remove') {
        if (newStock > 0) {
          newStock -= 1;
        } else {
          return res.status(400).json({ error: 'Cannot remove stock. Stock is already 0.' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid action. Use "add" or "remove".' });
      }

      // Update product stock
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: newStock }
      });

      res.json({
        success: true,
        product: {
          name: product.name,
          reference: product.reference,
          size: null,
          oldStock: product.stock,
          newStock: newStock,
          image: product.images && product.images.length > 0 ? product.images[0].url : null
        },
        message: `Successfully ${action === 'add' ? 'added' : 'removed'} 1x ${product.name}`
      });
    } else {
      // Handle products with sizes
      if (!sizeName) {
        return res.status(400).json({ error: `Product "${product.name}" requires a size. Format: ${product.reference}-SIZE` });
      }

      // Find size
      const size = product.sizes.find(s => s.size.toLowerCase() === sizeName.toLowerCase());

      if (!size) {
        return res.status(404).json({ error: `Size "${sizeName}" not found for product "${product.name}"` });
      }

      // Calculate new stock
      let newStock = size.stock;
      if (action === 'add') {
        newStock += 1;
      } else if (action === 'remove') {
        if (newStock > 0) {
          newStock -= 1;
        } else {
          return res.status(400).json({ error: 'Cannot remove stock. Stock is already 0.' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid action. Use "add" or "remove".' });
      }

      // Update stock
      await prisma.productSize.update({
        where: { id: size.id },
        data: { stock: newStock }
      });

      // Also update total product stock
      const totalStock = product.sizes.reduce((acc, s) => acc + (s.id === size.id ? newStock : s.stock), 0);
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: totalStock }
      });

      res.json({
        success: true,
        product: {
          name: product.name,
          reference: product.reference,
          size: size.size,
          oldStock: size.stock,
          newStock: newStock,
          image: product.images && product.images.length > 0 ? product.images[0].url : null
        },
        message: `Successfully ${action === 'add' ? 'added' : 'removed'} 1x ${product.name} (${size.size})`
      });
    }

  } catch (error) {
    console.error('Scan API error:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const query = querySchema.parse(req.query);
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      isActive: true
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameAr: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    if (query.category) {
      where.category = {
        slug: query.category
      };
    }

    if (query.brand) {
      where.brand = {
        slug: query.brand
      };
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }

    if (query.inStock === 'true') {
      where.stock = { gt: 0 };
    }

    if (query.onSale === 'true') {
      where.isOnSale = true;
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[query.sortBy] = query.sortOrder;

    // Fetch products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          images: {
            where: { isPrimary: true },
            take: 1
          },
          sizes: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    // Add launch status and orderability to products
    const now = new Date();
    const productsWithLaunchStatus = products.map(product => {
      const isLaunchActive = product.isLaunch && product.launchAt && product.launchAt > now;
      const isOrderable = !isLaunchActive;

      return {
        ...product,
        image: product.images[0]?.url || '/placeholder-product.jpg',
        isLaunchActive,
        isOrderable,
        timeUntilLaunch: isLaunchActive ? product.launchAt.getTime() - now.getTime() : null
      };
    });

    res.json({
      products: productsWithLaunchStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by slug - MUST come before /:id route
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { brand } = req.query;

    // Build where clause
    const where = {
      slug,
      isActive: true
    };

    // Add brand filter if provided
    if (brand) {
      where.brand = {
        slug: brand
      };
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        category: true,
        brand: true,
        images: true,
        sizes: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add launch status and orderability
    const now = new Date();
    const isLaunchActive = product.isLaunch && product.launchAt && product.launchAt > now;
    const isOrderable = !isLaunchActive;

    // Transform the product to match frontend expectations
    const transformedProduct = {
      ...product,
      images: product.images.map(img => img.url), // Convert image objects to URL strings
      isLaunchActive,
      isOrderable,
      timeUntilLaunch: isLaunchActive ? product.launchAt.getTime() - now.getTime() : null
    };

    res.json({ product: transformedProduct });
  } catch (error) {
    console.error('Product fetch by slug error:', error);
    res.status(500).json({ error: 'Failed to fetch product by slug' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { brand } = req.query;

    const where = {
      isActive: true,
      isOnSale: true
    };

    if (brand) {
      where.brand = {
        slug: brand
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: {
          where: { isPrimary: true },
          take: 1
        }
      },
      take: 8,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      products: products.map(product => ({
        ...product,
        image: product.images[0]?.url || '/placeholder-product.jpg'
      }))
    });
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Get djabadour el hemma products (recently added djabadour products)
router.get('/djabadour-el-hemma', async (req, res) => {
  try {
    const { brand } = req.query;

    const where = {
      isActive: true,
      OR: [
        { name: { contains: 'djabadour', mode: 'insensitive' } },
        { nameAr: { contains: 'djabadour', mode: 'insensitive' } }
      ],
      NOT: {
        OR: [
          { category: { slug: { contains: 'accessoire', mode: 'insensitive' } } },
          { category: { slug: { contains: 'accessories', mode: 'insensitive' } } },
          { category: { slug: { contains: 'shoe', mode: 'insensitive' } } },
          { category: { slug: { contains: 'chaussure', mode: 'insensitive' } } },
          { category: { name: { contains: 'accessoire', mode: 'insensitive' } } },
          { category: { name: { contains: 'accessories', mode: 'insensitive' } } },
          { category: { name: { contains: 'shoe', mode: 'insensitive' } } },
          { category: { name: { contains: 'chaussure', mode: 'insensitive' } } }
        ]
      }
    };

    if (brand) {
      where.brand = {
        slug: brand
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        images: {
          where: { isPrimary: true },
          take: 1
        },
        sizes: true
      },
      orderBy: {
        createdAt: 'desc' // Most recently added first
      },
      take: 20 // Get up to 20 products
    });

    // Add launch status and orderability to products
    const now = new Date();
    const productsWithLaunchStatus = products.map(product => {
      const isLaunchActive = product.isLaunch && product.launchAt && product.launchAt > now;
      const isOrderable = !isLaunchActive;

      return {
        ...product,
        image: product.images[0]?.url || '/placeholder-product.jpg',
        isLaunchActive,
        isOrderable,
        timeUntilLaunch: isLaunchActive ? product.launchAt.getTime() - now.getTime() : null
      };
    });

    res.json({
      products: productsWithLaunchStatus
    });
  } catch (error) {
    console.error('Djabadour el hemma products error:', error);
    res.status(500).json({ error: 'Failed to fetch djabadour el hemma products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: true,
        sizes: true
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add launch status and orderability
    const now = new Date();
    const isLaunchActive = product.isLaunch && product.launchAt && product.launchAt > now;
    const isOrderable = !isLaunchActive;

    const productWithLaunchStatus = {
      ...product,
      isLaunchActive,
      isOrderable,
      timeUntilLaunch: isLaunchActive ? product.launchAt.getTime() - now.getTime() : null
    };

    res.json(productWithLaunchStatus);
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product
    const { sizes, ...productData } = updateData;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        sizes: sizes ? {
          deleteMany: {},
          create: sizes.map(s => ({
            size: s.size,
            stock: parseInt(s.stock) || 0
          }))
        } : undefined
      },
      include: {
        category: true,
        brand: true,
        images: true,
        sizes: true
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Update product by slug
router.put('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { slug },
      data: updateData,
      include: {
        category: true,
        brand: true,
        images: true,
        sizes: true
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Product update by slug error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Partial update product by ID
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true,
        images: true,
        sizes: true
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Product partial update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Debug endpoint to list all products with IDs
router.get('/debug/list', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        isActive: true,
        brand: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      where: {
        isActive: true
      }
    });

    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('Error fetching products for debug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

module.exports = router;