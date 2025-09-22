# Digital Ocean Spaces CRUD API

A Node.js Express API for performing CRUD operations on Digital Ocean Spaces using AWS SDK v3. This API provides endpoints for uploading, listing, retrieving, updating, and deleting images stored in Digital Ocean Spaces.

## Features

- Single and multiple image uploads
- List images with pagination support
- Get image details with signed download URLs
- Update/replace existing images
- Delete single or multiple images
- File type validation (images only)
- File size limits (10MB max)
- Comprehensive test suite (unit + integration tests)
- AWS SDK v3 compatibility

## Prerequisites

- Node.js (v14 or higher)
- Digital Ocean Spaces account with API credentials
- Digital Ocean Space created and configured

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create a `.env` file** with your Digital Ocean Spaces credentials:
```env
DO_SPACES_KEY=your-access-key-here
DO_SPACES_SECRET=your-secret-key-here
DO_SPACES_ENDPOINT=https://syd1.digitaloceanspaces.com
DO_SPACES_REGION=syd1
DO_SPACES_BUCKET=your-space-name-here
PORT=3000
```

3. **Run the server:**
```bash
# Production
npm start

# Development with auto-reload
npm run dev
```

The API will be available at `http://localhost:3000`

## Testing

```bash
# Run all tests
npm test

# Run unit tests only (fast, mocked)
npm run test:unit

# Run integration tests only (uses real credentials)
npm run test:integration

# Run both test suites
npm run test:all

# Watch mode for development
npm run test:watch
```

## API Documentation


### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Digital Ocean Spaces CRUD API is running"
}
```

cURL Example:
```bash
curl http://localhost:3000/health
``` 

---

#### Upload Single Image
```http
POST /upload
Content-Type: multipart/form-data
```

**Body:**
- `image` (file): Image file to upload

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "file": {
    "key": "1640995200000-123456789.jpg",
    "location": "https://your-space.syd1.digitaloceanspaces.com/1640995200000-123456789.jpg",
    "size": 245760,
    "mimetype": "image/jpeg"
  }
}
```

**cURL Example:**
```bash
curl -X POST \
  -F "image=@/path/to/your/image.jpg" \
  http://localhost:3000/upload
```

---

#### Upload Multiple Images
```http
POST /upload-multiple
Content-Type: multipart/form-data
```

**Body:**
- `images` (files): Up to 10 image files

**Response:**
```json
{
  "message": "2 images uploaded successfully",
  "files": [
    {
      "key": "1640995200000-123456789.jpg",
      "location": "https://your-space.syd1.digitaloceanspaces.com/1640995200000-123456789.jpg",
      "size": 245760,
      "mimetype": "image/jpeg"
    },
    {
      "key": "1640995201000-987654321.png",
      "location": "https://your-space.syd1.digitaloceanspaces.com/1640995201000-987654321.png",
      "size": 189440,
      "mimetype": "image/png"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png" \
  http://localhost:3000/upload-multiple
```

---

#### List All Images
```http
GET /images?limit=50&continuationToken=abc123
```

**Query Parameters:**
- `limit` (optional): Number of images to return (default: 100, max: 1000)
- `continuationToken` (optional): Token for pagination

**Response:**
```json
{
  "images": [
    {
      "key": "1640995200000-123456789.jpg",
      "lastModified": "2021-12-31T23:00:00.000Z",
      "size": 245760,
      "url": "https://your-space.syd1.digitaloceanspaces.com/1640995200000-123456789.jpg"
    }
  ],
  "count": 1,
  "isTruncated": false,
  "nextContinuationToken": null
}
```

**cURL Example:**
```bash
curl http://localhost:3000/images?limit=10
```

---

#### Get Specific Image
```http
GET /images/:key
```

**Path Parameters:**
- `key`: The image key/filename

**Response:**
```json
{
  "key": "1640995200000-123456789.jpg",
  "url": "https://signed-url-expires-in-1-hour.com",
  "publicUrl": "https://your-space.syd1.digitaloceanspaces.com/1640995200000-123456789.jpg",
  "contentType": "image/jpeg",
  "contentLength": 245760,
  "lastModified": "2021-12-31T23:00:00.000Z"
}
```

**cURL Example:**
```bash
curl http://localhost:3000/images/1640995200000-123456789.jpg
```

---

#### Update/Replace Image
```http
PUT /images/:key
Content-Type: multipart/form-data
```

**Path Parameters:**
- `key`: The existing image key to replace

**Body:**
- `image` (file): New image file

**Response:**
```json
{
  "message": "Image updated successfully",
  "oldKey": "1640995200000-123456789.jpg",
  "newFile": {
    "key": "1640995300000-987654321.jpg",
    "location": "https://your-space.syd1.digitaloceanspaces.com/1640995300000-987654321.jpg",
    "size": 189440,
    "mimetype": "image/jpeg"
  }
}
```

**cURL Example:**
```bash
curl -X PUT \
  -F "image=@/path/to/new-image.jpg" \
  http://localhost:3000/images/1640995200000-123456789.jpg
```

---

#### Delete Single Image
```http
DELETE /images/:key
```

**Path Parameters:**
- `key`: The image key to delete

**Response:**
```json
{
  "message": "Image deleted successfully",
  "key": "1640995200000-123456789.jpg"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/images/1640995200000-123456789.jpg
```

---

#### Delete Multiple Images
```http
POST /images/delete-batch
Content-Type: application/json
```

**Body:**
```json
{
  "keys": [
    "1640995200000-123456789.jpg",
    "1640995201000-987654321.png"
  ]
}
```

**Response:**
```json
{
  "message": "Images deleted successfully",
  "deleted": [
    "1640995200000-123456789.jpg",
    "1640995201000-987654321.png"
  ],
  "errors": []
}
```

**cURL Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"keys":["1640995200000-123456789.jpg","1640995201000-987654321.png"]}' \
  http://localhost:3000/images/delete-batch
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors, missing files)
- `404` - Not Found (image doesn't exist)
- `500` - Internal Server Error (S3 errors, server issues)

## File Constraints

- **File Size Limit:** 10MB maximum
- **File Types:** Images only (MIME type must start with `image/`)
- **Accepted Formats:** JPG, PNG, GIF, WEBP, etc.
- **Naming:** Files are automatically renamed with timestamp and random number to prevent conflicts

## Architecture

- **Framework:** Express.js
- **Cloud Storage:** Digital Ocean Spaces (S3-compatible)
- **SDK:** AWS SDK v3 (`@aws-sdk/client-s3`)
- **File Upload:** Multer with multer-s3
- **Testing:** Jest with Supertest

## Configuration Options

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DO_SPACES_KEY` | Digital Ocean Spaces access key | `DO006D9AG6KDYC63N4MP` |
| `DO_SPACES_SECRET` | Digital Ocean Spaces secret key | `0F89Tv9Za6...` |
| `DO_SPACES_ENDPOINT` | Spaces endpoint URL | `https://syd1.digitaloceanspaces.com` |
| `DO_SPACES_REGION` | Spaces region | `syd1` |
| `DO_SPACES_BUCKET` | Spaces bucket name | `my-image-bucket` |
| `PORT` | Server port | `3000` |

### Regions Available

- `nyc1` - New York
- `nyc3` - New York 3
- `ams3` - Amsterdam 3
- `sfo3` - San Francisco 3
- `sgp1` - Singapore 1
- `lon1` - London 1
- `fra1` - Frankfurt 1
- `tor1` - Toronto 1
- `blr1` - Bangalore 1
- `syd1` - Sydney 1


### Common Issues

1. **"No file uploaded" error**
   - Ensure you're using the correct form field name (`image` or `images`)
   - Check that Content-Type is `multipart/form-data`

2. **"Only image files are allowed" error**
   - Verify the file has a valid image MIME type
   - Check the file isn't corrupted

3. **"Image not found" (404) error**
   - Verify the image key exists in your Space
   - Check the key spelling and case sensitivity

4. **S3 connection errors**
   - Verify your credentials in the `.env` file
   - Check that your Space bucket name and region are correct
   - Ensure your Digital Ocean Spaces API key has proper permissions

### Debug Mode

Enable verbose logging by setting:
```bash
NODE_ENV=development npm start
```
