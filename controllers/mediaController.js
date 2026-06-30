import { getGridFSBucket } from '../config/db.js';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import PortfolioItem from '../models/PortfolioItem.js';

// @desc    Upload file to GridFS
// @route   POST /api/media/upload
// @access  Private (Admin)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const bucket = getGridFSBucket();
    
    // Convert buffer to readable stream
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    // Open upload stream in GridFS
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date()
      }
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      return res.status(500).json({ message: `Error saving file: ${err.message}` });
    });

    uploadStream.on('finish', () => {
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully to MongoDB GridFS',
        fileId: uploadStream.id,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        length: req.file.size
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all files metadata
// @route   GET /api/media/files
// @access  Private (Admin)
export const getFiles = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const files = await filesCollection.find().sort({ uploadDate: -1 }).toArray();
    
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stream file content by ID
// @route   GET /api/media/:fileId
// @access  Public
export const getFileStream = async (req, res) => {
  const { fileId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID format' });
    }

    const oId = new mongoose.Types.ObjectId(fileId);
    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    
    const file = await filesCollection.findOne({ _id: oId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const range = req.headers.range;
    const bucket = getGridFSBucket();

    if (range) {
      // Parse Range header e.g. "bytes=32768-" or "bytes=32768-57340"
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;

      // Validate range limits
      if (isNaN(start) || start >= file.length || end >= file.length || start > end) {
        res.set('Content-Range', `bytes */${file.length}`);
        return res.status(416).json({ message: 'Requested range not satisfiable' });
      }

      const chunksize = (end - start) + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': file.contentType || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      // openDownloadStream option: start inclusive, end exclusive (so end + 1)
      const downloadStream = bucket.openDownloadStream(oId, { start, end: end + 1 });
      downloadStream.pipe(res);

      downloadStream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: `Streaming error: ${err.message}` });
        }
      });
    } else {
      // No Range request, serve whole file
      res.status(200);
      res.set({
        'Content-Type': file.contentType || 'application/octet-stream',
        'Content-Length': file.length,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000' // 1 year cache
      });

      const downloadStream = bucket.openDownloadStream(oId);
      downloadStream.pipe(res);

      downloadStream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ message: `Streaming error: ${err.message}` });
        }
      });
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Delete file from GridFS
// @route   DELETE /api/media/:fileId
// @access  Private (Admin)
export const deleteFile = async (req, res) => {
  const { fileId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID format' });
    }

    const oId = new mongoose.Types.ObjectId(fileId);
    
    // Check if the file is currently referenced in any portfolio items
    const references = await PortfolioItem.countDocuments({ imageFileId: oId });
    if (references > 0) {
      return res.status(400).json({ 
        message: `Cannot delete media. It is referenced by ${references} portfolio item(s). Please edit or delete those items first.` 
      });
    }

    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const fileExists = await filesCollection.findOne({ _id: oId });
    
    if (!fileExists) {
      return res.status(404).json({ message: 'File not found' });
    }

    const bucket = getGridFSBucket();
    await bucket.delete(oId);

    res.status(200).json({ success: true, message: 'File deleted from GridFS successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
