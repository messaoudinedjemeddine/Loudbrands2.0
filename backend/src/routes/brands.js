const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Get all brands
router.get('/', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// Get brand by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        categories: true,
        products: true
      }
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

// Create new brand
router.post('/', async (req, res) => {
  try {
    const { name, nameAr, description, descriptionAr, logo, slug } = req.body;

    // Validate required fields
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check if brand with same name or slug already exists
    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existingBrand) {
      return res.status(400).json({ error: 'Brand with this name or slug already exists' });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        logo,
        slug
      }
    });

    res.status(201).json({ brand });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// Update brand
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameAr, description, descriptionAr, logo, slug, isActive } = req.body;

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id }
    });

    if (!existingBrand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Check if name or slug conflicts with other brands
    if (name || slug) {
      const conflictingBrand = await prisma.brand.findFirst({
        where: {
          OR: [
            { name: name || existingBrand.name },
            { slug: slug || existingBrand.slug }
          ],
          NOT: {
            id
          }
        }
      });

      if (conflictingBrand) {
        return res.status(400).json({ error: 'Brand with this name or slug already exists' });
      }
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        nameAr,
        description,
        descriptionAr,
        logo,
        slug,
        isActive
      }
    });

    res.json({ brand });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            categories: true,
            products: true
          }
        }
      }
    });

    if (!existingBrand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Check if brand has categories or products
    if (existingBrand._count.categories > 0 || existingBrand._count.products > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete brand with existing categories or products. Please reassign or delete them first.' 
      });
    }

    await prisma.brand.delete({
      where: { id }
    });

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

module.exports = router;
