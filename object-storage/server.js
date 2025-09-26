require('dotenv').config();
const express = require('express');
const { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure Digital Ocean Spaces with AWS SDK v3
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  },
  region: process.env.DO_SPACES_REGION,
  forcePathStyle: true
});

// Configure multer for file uploads
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.DO_SPACES_BUCKET,
    acl: 'public-read',
    key: function(req, file, cb) {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Routes

// 1. Upload an image
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: 'Image uploaded successfully',
    file: {
      key: req.file.key,
      location: req.file.location,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// 2. Upload multiple images
app.post('/upload-multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadedFiles = req.files.map(file => ({
    key: file.key,
    location: file.location,
    size: file.size,
    mimetype: file.mimetype
  }));

  res.json({
    message: `${req.files.length} images uploaded successfully`,
    files: uploadedFiles
  });
});

// 3. List all images
app.get('/images', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      MaxKeys: req.query.limit || 100
    };

    if (req.query.continuationToken) {
      params.ContinuationToken = req.query.continuationToken;
    }

    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);

    const images = data.Contents ? data.Contents.map(item => ({
      key: item.Key,
      lastModified: item.LastModified,
      size: item.Size,
      url: `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${item.Key}`
    })) : [];

    res.json({
      images: images,
      count: images.length,
      isTruncated: data.IsTruncated,
      nextContinuationToken: data.NextContinuationToken
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// 4. Get/Download a specific image
app.get('/images/:key', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: req.params.key
    };

    // Get object metadata
    const headCommand = new HeadObjectCommand(params);
    const headData = await s3Client.send(headCommand);

    // Get signed URL for download (expires in 1 hour)
    const getCommand = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    res.json({
      key: req.params.key,
      url: url,
      publicUrl: `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${req.params.key}`,
      contentType: headData.ContentType,
      contentLength: headData.ContentLength,
      lastModified: headData.LastModified
    });
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      return res.status(404).json({ error: 'Image not found' });
    }
    console.error('Error getting image:', error);
    res.status(500).json({ error: 'Failed to get image' });
  }
});

// 5. Update/Replace an existing image
app.put('/images/:key', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete the old image
    const deleteParams = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: req.params.key
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3Client.send(deleteCommand);

    res.json({
      message: 'Image updated successfully',
      oldKey: req.params.key,
      newFile: {
        key: req.file.key,
        location: req.file.location,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// 6. Delete an image
app.delete('/images/:key', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: req.params.key
    };

    const deleteCommand = new DeleteObjectCommand(params);
    await s3Client.send(deleteCommand);

    res.json({
      message: 'Image deleted successfully',
      key: req.params.key
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// 7. Delete multiple images
app.post('/images/delete-batch', async (req, res) => {
  try {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'No keys provided' });
    }

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Delete: {
        Objects: keys.map(key => ({ Key: key }))
      }
    };

    const deleteCommand = new DeleteObjectsCommand(params);
    const data = await s3Client.send(deleteCommand);

    res.json({
      message: 'Images deleted successfully',
      deleted: data.Deleted.map(item => item.Key),
      errors: data.Errors
    });
  } catch (error) {
    console.error('Error deleting images:', error);
    res.status(500).json({ error: 'Failed to delete images' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Digital Ocean Spaces CRUD API is running' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Export the app for testing
module.exports = app;

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}