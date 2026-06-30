import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protectAdmin, logout);
router.get('/me', protectAdmin, getMe);

export default router;
