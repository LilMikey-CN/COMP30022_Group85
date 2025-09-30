# User Profile API Documentation

## Overview

This document provides comprehensive API documentation for user profile related endpoints in the Care Management system. These endpoints manage the guardian/family member's own profile information (not the client/care recipient profile).

## Authentication

All endpoints require Firebase JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

**Authentication Error Responses:**
- `401 Unauthorized` - No token provided or invalid token
- Token must be a valid Firebase ID token or custom token

## Base URLs

- **Production/Development**: `http://localhost:3000` (or your configured server URL)
- **Frontend CORS**: Configured for `http://localhost:3001` by default

---

## User Profile API

### Base Path: `/api/users/profile`

This API manages the authenticated user's own profile information, including their display name, contact details, and avatar.

### 1. Get User Profile

**Endpoint:** `GET /api/users/profile`
**Method:** GET
**Description:** Retrieves the complete profile for the authenticated user

#### Response

**Success (200 OK):**
```json
{
  "message": "User profile retrieved successfully",
  "data": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "emailVerified": boolean,
    "avatar_url": "string | null",
    "mobile_phone": "string | null",
    "contact_address": "string | null",
    "created_at": "ISO-date-string",
    "updated_at": "ISO-date-string"
  }
}
```

**Error Responses:**
- `404 Not Found` - User profile not found (user document hasn't been created yet)
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "message": "User profile retrieved successfully",
  "data": {
    "uid": "abc123xyz",
    "email": "guardian@example.com",
    "displayName": "John Smith",
    "emailVerified": true,
    "avatar_url": "https://storage.example.com/avatars/abc123.jpg",
    "mobile_phone": "0412345678",
    "contact_address": "123 Main St, Melbourne VIC 3000",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

### 2. Update User Profile

**Endpoint:** `PATCH /api/users/profile`
**Method:** PATCH
**Description:** Updates specific fields in the user's profile. If the user document doesn't exist, it will be created automatically.

#### Request Body

```json
{
  "displayName": "string",        // Optional - Guardian's display name
  "avatar_url": "string",         // Optional - URL to avatar image (from Digital Ocean or other storage)
  "mobile_phone": "string",       // Optional - Guardian's mobile phone number
  "contact_address": "string"     // Optional - Guardian's physical address
}
```

**Field Details:**
- All fields are optional - only include the fields you want to update
- `displayName`: Must be a non-empty string
- `avatar_url`: Must be a non-empty string (should be a valid URL)
- `mobile_phone`: Can be any string (including empty string)
- `contact_address`: Can be any string (including empty string)

#### Response

**Success (200 OK):**
```json
{
  "message": "User profile updated successfully",
  "data": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "emailVerified": boolean,
    "avatar_url": "string | null",
    "mobile_phone": "string | null",
    "contact_address": "string | null",
    "created_at": "ISO-date-string",
    "updated_at": "ISO-date-string"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data format (see validation errors below)
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Validation Errors

```json
// Empty displayName
{
  "error": "displayName must be a non-empty string"
}

// Empty avatar_url
{
  "error": "avatar_url must be a non-empty string"
}

// Non-string mobile_phone
{
  "error": "mobile_phone must be a string"
}

// Non-string contact_address
{
  "error": "contact_address must be a string"
}
```

#### Example Request - Update Display Name

```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane Doe"
  }'
```

#### Example Request - Update Multiple Fields

```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane Doe",
    "avatar_url": "https://storage.example.com/avatars/newavatar.jpg",
    "mobile_phone": "0498765432",
    "contact_address": "456 Oak Ave, Sydney NSW 2000"
  }'
```

#### Example Response

```json
{
  "message": "User profile updated successfully",
  "data": {
    "uid": "abc123xyz",
    "email": "guardian@example.com",
    "displayName": "Jane Doe",
    "emailVerified": true,
    "avatar_url": "https://storage.example.com/avatars/newavatar.jpg",
    "mobile_phone": "0498765432",
    "contact_address": "456 Oak Ave, Sydney NSW 2000",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-22T09:15:00.000Z"
  }
}
```

---

## Data Models

### User Profile Schema

```typescript
interface UserProfile {
  uid: string;                      // Firebase Auth UID (read-only)
  email: string;                    // From Firebase Auth (read-only)
  displayName: string;              // Guardian's display name (updateable)
  emailVerified: boolean;           // From Firebase Auth (read-only)
  avatar_url: string | null;        // URL to avatar image (updateable)
  mobile_phone: string | null;      // Guardian's mobile phone (updateable)
  contact_address: string | null;   // Guardian's physical address (updateable)
  created_at: Date;                 // System field (read-only)
  updated_at: Date;                 // System field (auto-updated)
}
```

### Field Descriptions

| Field | Type | Updateable | Description |
|-------|------|------------|-------------|
| `uid` | string | No | Firebase Authentication user ID |
| `email` | string | No | User's email from Firebase Auth |
| `displayName` | string | Yes | User's display name (guardian/family member name) |
| `emailVerified` | boolean | No | Email verification status from Firebase Auth |
| `avatar_url` | string\|null | Yes | URL to user's avatar/profile picture |
| `mobile_phone` | string\|null | Yes | User's mobile phone number |
| `contact_address` | string\|null | Yes | User's physical/mailing address |
| `created_at` | Date | No | Timestamp when user document was created |
| `updated_at` | Date | No | Timestamp when user document was last updated |

---

## Error Handling

### Common Error Response Format

```json
{
  "error": "Error message",
  "message": "Additional details (optional)"
}
```

### HTTP Status Codes

- `200 OK` - Successful operation
- `400 Bad Request` - Invalid request data (validation error)
- `401 Unauthorized` - Authentication required or failed
- `404 Not Found` - User profile not found
- `500 Internal Server Error` - Server error

### Validation Rules

1. **displayName**: Must be a non-empty string (cannot be empty or whitespace-only)
2. **avatar_url**: Must be a non-empty string (cannot be empty or whitespace-only)
3. **mobile_phone**: Must be a string (can be empty, no format restrictions)
4. **contact_address**: Must be a string (can be empty)
5. **Partial Updates**: Only fields included in the request body will be updated
6. **Auto-creation**: If user document doesn't exist, it will be created automatically on first PATCH

---

## Usage Notes

### Avatar Upload Flow

The `avatar_url` field stores a URL string only. The recommended flow for avatar uploads is:

1. **Frontend uploads image** directly to Digital Ocean Spaces (or other storage service)
2. **Storage service returns** a public URL
3. **Frontend calls** `PATCH /api/users/profile` with the returned URL in `avatar_url`
4. **Backend validates** and stores the URL

Example:
```javascript
// 1. Upload to Digital Ocean
const uploadedUrl = await uploadToDigitalOcean(imageFile);

// 2. Update user profile with the URL
await fetch('/api/users/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    avatar_url: uploadedUrl
  })
});
```

### First-time Profile Setup

When a user first authenticates:
- A user document may not exist in Firestore yet
- Calling `GET /api/users/profile` will return `404 Not Found`
- Calling `PATCH /api/users/profile` will automatically create the user document with:
  - Basic info from Firebase Auth (uid, email, emailVerified, displayName)
  - The profile fields you provide in the request
  - System timestamps (created_at, updated_at)

### Read-only Fields

The following fields cannot be updated via this API:
- `uid` - Set by Firebase Auth
- `email` - Managed through Firebase Auth
- `emailVerified` - Managed through Firebase Auth
- `created_at` - Set on document creation
- `updated_at` - Automatically updated by the system

To update email or email verification, use Firebase Auth methods.

---

## Integration Examples

### React/TypeScript Example

```typescript
import { getAuth } from 'firebase/auth';

interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  avatar_url: string | null;
  mobile_phone: string | null;
  contact_address: string | null;
  created_at: string;
  updated_at: string;
}

// Get user profile
async function getUserProfile(): Promise<UserProfileData> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch('http://localhost:3000/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  const result = await response.json();
  return result.data;
}

// Update user profile
async function updateUserProfile(updates: Partial<{
  displayName: string;
  avatar_url: string;
  mobile_phone: string;
  contact_address: string;
}>): Promise<UserProfileData> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch('http://localhost:3000/api/users/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  const result = await response.json();
  return result.data;
}

// Usage
try {
  const profile = await getUserProfile();
  console.log('Current profile:', profile);

  const updated = await updateUserProfile({
    displayName: 'Jane Smith',
    mobile_phone: '0412345678'
  });
  console.log('Updated profile:', updated);
} catch (error) {
  console.error('Error:', error);
}
```

---

## Testing

### Test Credentials

For development/testing, you can use Firebase emulator or test accounts. Ensure you have valid Firebase JWT tokens.

### Example Test Scenarios

1. **Get profile for new user** (should return 404)
2. **Create profile** by calling PATCH with initial data
3. **Get profile** after creation (should return 200)
4. **Update single field** (e.g., only displayName)
5. **Update multiple fields** at once
6. **Validate error handling** with invalid data

---

*API Version: 1.0.0*
*Last Updated: 2024*