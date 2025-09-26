const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Import the app
const app = require('../server.js');

describe('Digital Ocean Spaces Integration Tests', () => {
  let uploadedKeys = []; // Track uploaded files for cleanup

  afterAll(async () => {
    // Cleanup: Delete all uploaded test files
    if (uploadedKeys.length > 0) {
      await request(app)
        .post('/images/delete-batch')
        .send({ keys: uploadedKeys });
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Digital Ocean Spaces CRUD API is running'
      });
    });
  });

  describe('POST /upload', () => {
    it('should upload a single image successfully', async () => {
      // Create a test image buffer
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const response = await request(app)
        .post('/upload')
        .attach('image', testImageBuffer, 'test-image.png')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Image uploaded successfully');
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('key');
      expect(response.body.file).toHaveProperty('location');
      expect(response.body.file).toHaveProperty('size');
      expect(response.body.file).toHaveProperty('mimetype', 'image/png');

      // Track for cleanup
      uploadedKeys.push(response.body.file.key);
    }, 30000);

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/upload')
        .expect(400);

      expect(response.body).toEqual({
        error: 'No file uploaded'
      });
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is a text file');

      const response = await request(app)
        .post('/upload')
        .attach('image', textBuffer, 'test.txt')
        .expect(500);

      expect(response.body.error).toContain('Only image files are allowed');
    });
  });

  describe('POST /upload-multiple', () => {
    it('should upload multiple images successfully', async () => {
      const testImageBuffer1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
      const testImageBuffer2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const response = await request(app)
        .post('/upload-multiple')
        .attach('images', testImageBuffer1, 'test1.png')
        .attach('images', testImageBuffer2, 'test2.png')
        .expect(200);

      expect(response.body.message).toContain('images uploaded successfully');
      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files).toHaveLength(2);

      // Track for cleanup
      response.body.files.forEach(file => {
        uploadedKeys.push(file.key);
      });
    }, 30000);

    it('should return 400 when no files are uploaded', async () => {
      const response = await request(app)
        .post('/upload-multiple')
        .expect(400);

      expect(response.body).toEqual({
        error: 'No files uploaded'
      });
    });
  });

  describe('GET /images', () => {
    beforeAll(async () => {
      // Upload a test image first
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const uploadResponse = await request(app)
        .post('/upload')
        .attach('image', testImageBuffer, 'list-test.png');

      uploadedKeys.push(uploadResponse.body.file.key);
    });

    it('should list images successfully', async () => {
      const response = await request(app)
        .get('/images')
        .expect(200);

      expect(response.body).toHaveProperty('images');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('isTruncated');
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/images?limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('images');
      expect(response.body.images.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /images/:key', () => {
    let testKey;

    beforeAll(async () => {
      // Upload a test image first
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const uploadResponse = await request(app)
        .post('/upload')
        .attach('image', testImageBuffer, 'get-test.png');

      testKey = uploadResponse.body.file.key;
      uploadedKeys.push(testKey);
    });

    it('should get image details successfully', async () => {
      const response = await request(app)
        .get(`/images/${testKey}`)
        .expect(200);

      expect(response.body).toHaveProperty('key', testKey);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('publicUrl');
      expect(response.body).toHaveProperty('contentType');
      expect(response.body).toHaveProperty('contentLength');
      expect(response.body).toHaveProperty('lastModified');
    });

    it('should return 404 when image is not found', async () => {
      const response = await request(app)
        .get('/images/nonexistent-image.jpg')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Image not found'
      });
    });
  });

  describe('PUT /images/:key', () => {
    let testKey;

    beforeAll(async () => {
      // Upload a test image first
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const uploadResponse = await request(app)
        .post('/upload')
        .attach('image', testImageBuffer, 'update-test.png');

      testKey = uploadResponse.body.file.key;
      uploadedKeys.push(testKey);
    });

    it('should update an existing image successfully', async () => {
      const newImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const response = await request(app)
        .put(`/images/${testKey}`)
        .attach('image', newImageBuffer, 'updated-test.png')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Image updated successfully');
      expect(response.body).toHaveProperty('oldKey', testKey);
      expect(response.body).toHaveProperty('newFile');
      expect(response.body.newFile).toHaveProperty('key');

      // Track new key for cleanup and remove old key
      const oldKeyIndex = uploadedKeys.indexOf(testKey);
      if (oldKeyIndex > -1) {
        uploadedKeys.splice(oldKeyIndex, 1);
      }
      uploadedKeys.push(response.body.newFile.key);
    }, 30000);

    it('should return 400 when no file is provided for update', async () => {
      const response = await request(app)
        .put(`/images/${testKey}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'No file uploaded'
      });
    });
  });

  describe('DELETE /images/:key', () => {
    let testKey;

    beforeAll(async () => {
      // Upload a test image first
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      const uploadResponse = await request(app)
        .post('/upload')
        .attach('image', testImageBuffer, 'delete-test.png');

      testKey = uploadResponse.body.file.key;
    });

    it('should delete an image successfully', async () => {
      const response = await request(app)
        .delete(`/images/${testKey}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Image deleted successfully',
        key: testKey
      });

      // Verify image is actually deleted
      await request(app)
        .get(`/images/${testKey}`)
        .expect(404);
    });
  });

  describe('POST /images/delete-batch', () => {
    let testKeys = [];

    beforeAll(async () => {
      // Upload multiple test images
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

      for (let i = 0; i < 3; i++) {
        const uploadResponse = await request(app)
          .post('/upload')
          .attach('image', testImageBuffer, `batch-delete-${i}.png`);

        testKeys.push(uploadResponse.body.file.key);
      }
    });

    it('should delete multiple images successfully', async () => {
      const response = await request(app)
        .post('/images/delete-batch')
        .send({ keys: testKeys })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Images deleted successfully');
      expect(response.body).toHaveProperty('deleted');
      expect(response.body.deleted).toHaveLength(testKeys.length);
      expect(response.body.deleted).toEqual(expect.arrayContaining(testKeys));
    });

    it('should return 400 when no keys are provided', async () => {
      const response = await request(app)
        .post('/images/delete-batch')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'No keys provided'
      });
    });

    it('should return 400 when empty keys array is provided', async () => {
      const response = await request(app)
        .post('/images/delete-batch')
        .send({ keys: [] })
        .expect(400);

      expect(response.body).toEqual({
        error: 'No keys provided'
      });
    });

    it('should return 400 when keys is not an array', async () => {
      const response = await request(app)
        .post('/images/delete-batch')
        .send({ keys: 'not-an-array' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'No keys provided'
      });
    });
  });
});