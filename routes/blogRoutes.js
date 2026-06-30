import express from 'express';
import { 
  getPublishedBlogs, getBlogBySlug, getAllBlogs, 
  createBlog, updateBlog, deleteBlog 
} from '../controllers/blogController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPublishedBlogs);
router.get('/all', protectAdmin, getAllBlogs);
router.get('/post/:slug', getBlogBySlug);

router.post('/', protectAdmin, createBlog);
router.put('/:id', protectAdmin, updateBlog);
router.delete('/:id', protectAdmin, deleteBlog);

export default router;
