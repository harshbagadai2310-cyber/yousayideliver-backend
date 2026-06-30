import express from 'express';
import {
  getPortfolioItems, createPortfolioItem, updatePortfolioItem, deletePortfolioItem,
  getNiches, createNiche, updateNiche, deleteNiche,
  getCategories, createCategory, updateCategory, deleteCategory
} from '../controllers/portfolioController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Niche routes
router.get('/niches', getNiches);
router.post('/niches', protectAdmin, createNiche);
router.put('/niches/:id', protectAdmin, updateNiche);
router.delete('/niches/:id', protectAdmin, deleteNiche);

// Category routes
router.get('/categories', getCategories);
router.post('/categories', protectAdmin, createCategory);
router.put('/categories/:id', protectAdmin, updateCategory);
router.delete('/categories/:id', protectAdmin, deleteCategory);

// Portfolio Item routes
router.get('/', getPortfolioItems);
router.post('/', protectAdmin, createPortfolioItem);
router.put('/:id', protectAdmin, updatePortfolioItem);
router.delete('/:id', protectAdmin, deletePortfolioItem);

export default router;
