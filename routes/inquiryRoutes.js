import express from 'express';
import { createInquiry, getInquiries, updateInquiry, deleteInquiry } from '../controllers/inquiryController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createInquiry);
router.get('/', protectAdmin, getInquiries);
router.put('/:id', protectAdmin, updateInquiry);
router.delete('/:id', protectAdmin, deleteInquiry);

export default router;
