const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/categories - Create a new category
 */
router.post('/', async (req, res) => {
  try {
    const { name, parentId, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        parentId: parentId || null,
        color: color || null,
        icon: icon || null,
        videoCount: 0
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/categories - List all categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        videos: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Update video counts
    const categoriesWithCounts = categories.map(cat => ({
      ...cat,
      videoCount: cat.videos.length,
      videos: undefined // Remove videos array from response
    }));

    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/categories/:id - Get category details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        videos: {
          select: {
            id: true,
            title: true,
            author: true,
            watchStatus: true,
            createdAt: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      ...category,
      videoCount: category.videos.length
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/categories/:id - Update category
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId, color, icon } = req.body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (parentId !== undefined) {
      updateData.parentId = parentId;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/categories/:id - Delete category
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has videos
    const category = await prisma.category.findUnique({
      where: { id },
      include: { videos: true }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Unassign videos from this category
    await prisma.video.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/categories/tree - Get hierarchical category tree
 */
router.get('/tree/structure', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        videos: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        videoCount: cat.videos.length,
        videos: undefined,
        children: []
      });
    });

    // Second pass: build tree
    categories.forEach(cat => {
      const categoryNode = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryNode);
        } else {
          rootCategories.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    res.json(rootCategories);
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/categories/:id/subcategories - Get subcategories
 */
router.get('/:id/subcategories', async (req, res) => {
  try {
    const { id } = req.params;

    const subcategories = await prisma.category.findMany({
      where: { parentId: id },
      include: {
        videos: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(
      subcategories.map(cat => ({
        ...cat,
        videoCount: cat.videos.length,
        videos: undefined
      }))
    );
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
