const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const imagekit = require('../config/imagekit');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload single image
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get folder from request body or use default
    const folder = req.body.folder || 'loudbrands';

    // Upload to ImageKit
    const result = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: `/${folder}` // ImageKit folder paths should start with '/'
    });

    res.json({
      message: 'File uploaded successfully',
      url: result.url,
      publicId: result.fileId,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Upload multiple images
router.post('/images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Get folder from request body or use default
    const folder = req.body.folder || 'loudbrands';

    // Upload all files to ImageKit
    const uploadPromises = req.files.map(async (file) => {
      const result = await imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: file.originalname,
        folder: `/${folder}`
      });
      return {
        url: result.url,
        publicId: result.fileId,
        originalName: file.originalname,
        size: file.size
      };
    });

    const files = await Promise.all(uploadPromises);

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload files' });
  }
});

// Delete uploaded file from ImageKit
router.delete('/:publicId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from ImageKit
    await imagekit.deleteFile(publicId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

module.exports = router;