import express from 'express';
import { createBooking, getBookings, updateBooking, deleteBooking } from '../controllers/bookingController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createBooking);
router.get('/', protectAdmin, getBookings);
router.put('/:id', protectAdmin, updateBooking);
router.delete('/:id', protectAdmin, deleteBooking);

export default router;
