import express from 'express';
import { uploadFile, getFiles, getFileStream, deleteFile } from '../controllers/mediaController.js';
import upload from '../middleware/upload.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', protectAdmin, upload.single('file'), uploadFile);
router.get('/files', protectAdmin, getFiles);
router.get('/:fileId', getFileStream);
router.delete('/:fileId', protectAdmin, deleteFile);

export default router;
