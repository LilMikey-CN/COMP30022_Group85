const request = require('supertest');

// Mock S3 Client
const mockS3Send = jest.fn();
const mockS3Client = { send: mockS3Send };

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => mockS3Client),
  ListObjectsV2Command: jest.fn(params => params),
  HeadObjectCommand: jest.fn(params => params),
  DeleteObjectCommand: jest.fn(params => params),
  DeleteObjectsCommand: jest.fn(params => params),
  GetObjectCommand: jest.fn(params => params)
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-signed-url.com')
}));

// Simple multer mock
jest.mock('multer-s3', () => {
  return jest.fn().mockReturnValue({});
});

// Set environment variables
process.env.DO_SPACES_ENDPOINT = 'https://syd1.digitaloceanspaces.com';
process.env.DO_SPACES_BUCKET = 'test-bucket';
process.env.DO_SPACES_KEY = 'test-key';
process.env.DO_SPACES_SECRET = 'test-secret';
process.env.DO_SPACES_REGION = 'syd1';

const app = require('../server.js');

describe('Simple Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('GET /images - Business Logic', () => {
    it('should format response correctly when S3 returns data', async () => {
      const mockS3Response = {
        Contents: [
          {
            Key: 'test-image.jpg',
            LastModified: new Date('2024-01-01'),
            Size: 1024
          }
        ],
        IsTruncated: false,
        NextContinuationToken: undefined
      };

      mockS3Send.mockResolvedValue(mockS3Response);

      const response = await request(app)
        .get('/images')
        .expect(200);

      expect(response.body.images).toHaveLength(1);
      expect(response.body.images[0]).toEqual({
        key: 'test-image.jpg',
        lastModified: new Date('2024-01-01').toISOString(),
        size: 1024,
        url: 'https://syd1.digitaloceanspaces.com/test-bucket/test-image.jpg'
      });
      expect(response.body.count).toBe(1);
      expect(response.body.isTruncated).toBe(false);
    });

    it('should handle empty S3 response', async () => {
      mockS3Send.mockResolvedValue({
        Contents: undefined,
        IsTruncated: false
      });

      const response = await request(app)
        .get('/images')
        .expect(200);

      expect(response.body.images).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should handle S3 errors', async () => {
      mockS3Send.mockRejectedValue(new Error('S3 Error'));

      const response = await request(app)
        .get('/images')
        .expect(500);

      expect(response.body.error).toBe('Failed to list images');
    });
  });

  describe('GET /images/:key - Business Logic', () => {
    it('should format image details response', async () => {
      const mockHeadResponse = {
        ContentType: 'image/jpeg',
        ContentLength: 2048,
        LastModified: new Date('2024-01-01')
      };

      mockS3Send.mockResolvedValue(mockHeadResponse);

      const response = await request(app)
        .get('/images/test.jpg')
        .expect(200);

      expect(response.body).toEqual({
        key: 'test.jpg',
        url: 'https://mock-signed-url.com',
        publicUrl: 'https://syd1.digitaloceanspaces.com/test-bucket/test.jpg',
        contentType: 'image/jpeg',
        contentLength: 2048,
        lastModified: mockHeadResponse.LastModified.toISOString()
      });
    });

    it('should handle NotFound errors correctly', async () => {
      const notFoundError = new Error('Not found');
      notFoundError.name = 'NotFound';
      mockS3Send.mockRejectedValue(notFoundError);

      const response = await request(app)
        .get('/images/nonexistent.jpg')
        .expect(404);

      expect(response.body.error).toBe('Image not found');
    });

    it('should handle other S3 errors', async () => {
      mockS3Send.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/images/test.jpg')
        .expect(500);

      expect(response.body.error).toBe('Failed to get image');
    });
  });

  describe('DELETE /images/:key - Business Logic', () => {
    it('should return success response', async () => {
      mockS3Send.mockResolvedValue({});

      const response = await request(app)
        .delete('/images/test.jpg')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Image deleted successfully',
        key: 'test.jpg'
      });
      expect(mockS3Send).toHaveBeenCalledWith(expect.objectContaining({
        Bucket: 'test-bucket',
        Key: 'test.jpg'
      }));
    });

    it('should handle deletion errors', async () => {
      mockS3Send.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/images/test.jpg')
        .expect(500);

      expect(response.body.error).toBe('Failed to delete image');
    });
  });

  describe('POST /images/delete-batch - Input Validation', () => {
    it('should validate input parameters', async () => {
      // No keys provided
      let response = await request(app)
        .post('/images/delete-batch')
        .send({})
        .expect(400);
      expect(response.body.error).toBe('No keys provided');

      // Empty array
      response = await request(app)
        .post('/images/delete-batch')
        .send({ keys: [] })
        .expect(400);
      expect(response.body.error).toBe('No keys provided');

      // Non-array
      response = await request(app)
        .post('/images/delete-batch')
        .send({ keys: 'not-an-array' })
        .expect(400);
      expect(response.body.error).toBe('No keys provided');
    });

    it('should process valid batch delete request', async () => {
      const mockResponse = {
        Deleted: [{ Key: 'image1.jpg' }, { Key: 'image2.jpg' }],
        Errors: []
      };
      mockS3Send.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/images/delete-batch')
        .send({ keys: ['image1.jpg', 'image2.jpg'] })
        .expect(200);

      expect(response.body.message).toBe('Images deleted successfully');
      expect(response.body.deleted).toEqual(['image1.jpg', 'image2.jpg']);
      expect(response.body.errors).toEqual([]);
    });
  });
});