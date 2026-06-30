import PortfolioItem from '../models/PortfolioItem.js';
import Niche from '../models/Niche.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

// ==========================================
// Portfolio Item CRUD
// ==========================================

// @desc    Get all portfolio items
// @route   GET /api/portfolio
// @access  Public
export const getPortfolioItems = async (req, res) => {
  try {
    const items = await PortfolioItem.find()
      .populate('niche')
      .populate('category')
      .sort({ createdAt: -1 });

    const fileIds = items
      .map(item => item.imageFileId)
      .filter(id => id != null);

    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const files = await filesCollection.find({ _id: { $in: fileIds } }).toArray();
    
    const fileMap = {};
    files.forEach(f => {
      fileMap[f._id.toString()] = {
        contentType: f.contentType,
        filename: f.filename
      };
    });

    const enrichedItems = items.map(item => {
      const itemObj = item.toObject();
      if (itemObj.imageFileId && fileMap[itemObj.imageFileId.toString()]) {
        itemObj.mediaInfo = fileMap[itemObj.imageFileId.toString()];
      } else {
        itemObj.mediaInfo = null;
      }
      return itemObj;
    });

    res.status(200).json(enrichedItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new portfolio item
// @route   POST /api/portfolio
// @access  Private (Admin)
export const createPortfolioItem = async (req, res) => {
  const { title, niche, category, imageFileId, description } = req.body;

  try {
    if (!title || !niche || !category) {
      return res.status(400).json({ message: 'Title, niche (ID), and category (ID) are required' });
    }

    const item = await PortfolioItem.create({
      title,
      niche,
      category,
      imageFileId: imageFileId || null,
      description: description || ''
    });

    const populatedItem = await PortfolioItem.findById(item._id)
      .populate('niche')
      .populate('category');

    const itemObj = populatedItem.toObject();
    if (itemObj.imageFileId) {
      const db = mongoose.connection.db;
      const file = await db.collection('uploads.files').findOne({ _id: itemObj.imageFileId });
      if (file) {
        itemObj.mediaInfo = { contentType: file.contentType, filename: file.filename };
      }
    }

    res.status(201).json(itemObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a portfolio item
// @route   PUT /api/portfolio/:id
// @access  Private (Admin)
export const updatePortfolioItem = async (req, res) => {
  const { id } = req.params;
  const { title, niche, category, imageFileId, description } = req.body;

  try {
    let item = await PortfolioItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    item.title = title || item.title;
    item.niche = niche || item.niche;
    item.category = category || item.category;
    if (imageFileId !== undefined) {
      item.imageFileId = imageFileId;
    }
    item.description = description !== undefined ? description : item.description;

    await item.save();

    const populatedItem = await PortfolioItem.findById(item._id)
      .populate('niche')
      .populate('category');

    const itemObj = populatedItem.toObject();
    if (itemObj.imageFileId) {
      const db = mongoose.connection.db;
      const file = await db.collection('uploads.files').findOne({ _id: itemObj.imageFileId });
      if (file) {
        itemObj.mediaInfo = { contentType: file.contentType, filename: file.filename };
      }
    }

    res.status(200).json(itemObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a portfolio item
// @route   DELETE /api/portfolio/:id
// @access  Private (Admin)
export const deletePortfolioItem = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await PortfolioItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// Niche CRUD
// ==========================================

// @desc    Get all niches
// @route   GET /api/niches
// @access  Public
export const getNiches = async (req, res) => {
  try {
    const niches = await Niche.find().sort({ name: 1 });
    res.status(200).json(niches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a niche
// @route   POST /api/niches
// @access  Private (Admin)
export const createNiche = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Niche name is required' });
    }

    const exists = await Niche.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Niche already exists' });
    }

    const niche = await Niche.create({ name });
    res.status(201).json(niche);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a niche
// @route   PUT /api/niches/:id
// @access  Private (Admin)
export const updateNiche = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Niche name is required' });
    }

    const niche = await Niche.findById(id);
    if (!niche) {
      return res.status(404).json({ message: 'Niche not found' });
    }

    niche.name = name;
    await niche.save();
    res.status(200).json(niche);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a niche
// @route   DELETE /api/niches/:id
// @access  Private (Admin)
export const deleteNiche = async (req, res) => {
  const { id } = req.params;

  try {
    const niche = await Niche.findById(id);
    if (!niche) {
      return res.status(404).json({ message: 'Niche not found' });
    }

    // Check if any portfolio items are referencing this niche
    const references = await PortfolioItem.countDocuments({ niche: id });
    if (references > 0) {
      return res.status(400).json({ message: `Cannot delete niche. It is referenced by ${references} portfolio item(s).` });
    }

    await niche.deleteOne();
    res.status(200).json({ message: 'Niche deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// Category CRUD
// ==========================================

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.name = name;
    await category.save();
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if any portfolio items are referencing this category
    const references = await PortfolioItem.countDocuments({ category: id });
    if (references > 0) {
      return res.status(400).json({ message: `Cannot delete category. It is referenced by ${references} portfolio item(s).` });
    }

    await category.deleteOne();
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
