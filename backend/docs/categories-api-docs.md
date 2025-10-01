# Categories API Documentation

## Overview

This document provides comprehensive API documentation for categories endpoints in the Care Management system. Categories are used to organize care items into logical groups (e.g., Clothing, Hygiene, Food, Medical).

**Important:** Categories are user-specific. Each authenticated user has their own set of categories that are isolated from other users. When a user first accesses the system, default categories are automatically created for them.

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

## Categories API

### Base Path: `/api/categories`

This API manages care item categories, providing endpoints to create, retrieve, update, and soft-delete categories.

### 1. Create Category

**Endpoint:** `POST /api/categories`
**Method:** POST
**Description:** Creates a new category

#### Request Body

```json
{
  "name": "string",              // Required - Category name (must be unique)
  "description": "string",       // Optional - Category description
  "color_code": "string",        // Optional - Hex color code for UI display (default: #6B7280)
  "display_order": "number"      // Optional - Sort order for display (default: 0)
}
```

**Field Details:**
- `name`: Required, must be unique among your active categories (case-sensitive, trimmed)
- `description`: Optional, defaults to empty string
- `color_code`: Optional, should be a hex color code (e.g., "#3B82F6")
- `display_order`: Optional, integer for sorting categories

**Note:** Category names only need to be unique within your own categories. Different users can have categories with the same name.

#### Response

**Success (201 Created):**
```json
{
  "message": "Category created successfully",
  "id": "string",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "color_code": "string",
    "display_order": "number",
    "is_active": true,
    "created_by": "string",
    "created_at": "ISO-date-string",
    "updated_at": "ISO-date-string"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data (see validation errors below)
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Validation Errors

```json
// Missing or empty name
{
  "error": "Category name is required and must be a non-empty string"
}

// Duplicate name
{
  "error": "A category with this name already exists"
}
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clothing",
    "description": "Clothing and apparel items",
    "color_code": "#8B5CF6",
    "display_order": 0
  }'
```

#### Example Response

```json
{
  "message": "Category created successfully",
  "id": "cat-abc123",
  "data": {
    "id": "cat-abc123",
    "name": "Clothing",
    "description": "Clothing and apparel items",
    "color_code": "#8B5CF6",
    "display_order": 0,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Categories

**Endpoint:** `GET /api/categories`
**Method:** GET
**Description:** Retrieves all categories belonging to the authenticated user. Auto-initializes default categories if the user has no categories yet.

#### Query Parameters

- `is_active` (string, optional): Filter by active status
  - `"true"` - Only active categories (default)
  - `"false"` - Only inactive categories
  - `"all"` - All categories regardless of status

#### Response

**Success (200 OK):**
```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "color_code": "string",
      "display_order": "number",
      "is_active": "boolean",
      "created_by": "string",
      "created_at": "ISO-date-string",
      "updated_at": "ISO-date-string"
    }
  ]
}
```

**Note:** If the authenticated user has no categories yet, the endpoint automatically creates four default categories for that user:
1. Clothing (#8B5CF6, display_order: 0)
2. Hygiene (#10B981, display_order: 1)
3. Food (#F59E0B, display_order: 2)
4. Medical (#EF4444, display_order: 3)

Each user gets their own set of default categories.

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
# Get all active categories
curl -X GET http://localhost:3000/api/categories \
  -H "Authorization: Bearer <your-firebase-token>"

# Get all categories including inactive
curl -X GET "http://localhost:3000/api/categories?is_active=all" \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "categories": [
    {
      "id": "cat-1",
      "name": "Clothing",
      "description": "Clothing and apparel items",
      "color_code": "#8B5CF6",
      "display_order": 0,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "cat-2",
      "name": "Hygiene",
      "description": "Personal hygiene and care products",
      "color_code": "#10B981",
      "display_order": 1,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Update Category

**Endpoint:** `PUT /api/categories/:id`
**Method:** PUT
**Description:** Updates a category. Only provided fields will be updated.

#### Request Body

```json
{
  "name": "string",              // Optional - Must be unique if provided
  "description": "string",       // Optional
  "color_code": "string",        // Optional
  "display_order": "number",     // Optional
  "is_active": "boolean"         // Optional - Can manually deactivate/reactivate
}
```

**Field Details:**
- All fields are optional - only include fields you want to update
- `name`: Must be unique among your active categories (excluding the category being updated)
- Partial updates supported - unchanged fields retain their current values
- Can only update categories that you created

#### Response

**Success (200 OK):**
```json
{
  "message": "Category updated successfully",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "color_code": "string",
    "display_order": "number",
    "is_active": "boolean",
    "created_at": "ISO-date-string",
    "updated_at": "ISO-date-string"
  }
}
```

**Error Responses:**
- `404 Not Found` - Category not found
- `403 Forbidden` - Category belongs to another user
- `400 Bad Request` - Invalid data (e.g., duplicate name)
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Validation Errors

```json
// Duplicate name
{
  "error": "A category with this name already exists"
}

// Empty name
{
  "error": "Category name is required and must be a non-empty string"
}
```

#### Example Request

```bash
curl -X PUT http://localhost:3000/api/categories/cat-abc123 \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for clothing items",
    "color_code": "#9333EA"
  }'
```

#### Example Response

```json
{
  "message": "Category updated successfully",
  "data": {
    "id": "cat-abc123",
    "name": "Clothing",
    "description": "Updated description for clothing items",
    "color_code": "#9333EA",
    "display_order": 0,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

### 4. Delete Category (Soft Delete)

**Endpoint:** `DELETE /api/categories/:id`
**Method:** DELETE
**Description:** Soft deletes a category by setting `is_active` to `false`. The category data is preserved but hidden from default queries. Can only delete categories that you created.

#### Response

**Success (200 OK):**
```json
{
  "message": "Category deactivated successfully",
  "id": "string"
}
```

**Error Responses:**
- `404 Not Found` - Category not found
- `403 Forbidden` - Category belongs to another user
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X DELETE http://localhost:3000/api/categories/cat-abc123 \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "message": "Category deactivated successfully",
  "id": "cat-abc123"
}
```

---

## Data Models

### Category Schema

```typescript
interface Category {
  id: string;                    // Firestore document ID (auto-generated)
  name: string;                  // Category name (unique among user's active categories)
  description: string;           // Category description
  color_code: string;            // Hex color code for UI display
  display_order: number;         // Sort order for display
  is_active: boolean;            // Active status (false = soft deleted)
  created_by: string;            // User ID who created this category (read-only)
  created_at: Date;              // System field (read-only)
  updated_at: Date;              // System field (auto-updated)
}
```

### Field Descriptions

| Field | Type | Updateable | Description |
|-------|------|------------|-------------|
| `id` | string | No | Firestore document ID |
| `name` | string | Yes | Category name (must be unique among user's active categories) |
| `description` | string | Yes | Category description |
| `color_code` | string | Yes | Hex color code for UI display (e.g., "#8B5CF6") |
| `display_order` | number | Yes | Sort order for displaying categories |
| `is_active` | boolean | Yes | Active status (false = soft deleted) |
| `created_by` | string | No | User ID who created this category |
| `created_at` | Date | No | Timestamp when category was created |
| `updated_at` | Date | No | Timestamp when category was last updated |

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
- `201 Created` - Category created successfully
- `400 Bad Request` - Invalid request data (validation error)
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Attempting to modify another user's category
- `404 Not Found` - Category not found
- `500 Internal Server Error` - Server error

### Validation Rules

1. **name**: Must be non-empty string, unique among user's active categories
2. **description**: Optional, defaults to empty string
3. **color_code**: Optional, should be hex color code, defaults to #6B7280
4. **display_order**: Optional integer, defaults to 0
5. **is_active**: Boolean, automatically set to true on creation
6. **created_by**: Automatically set to authenticated user's UID, cannot be changed
7. **Uniqueness**: Category names are checked for uniqueness only among the user's active categories
8. **Case Sensitivity**: Category names are case-sensitive
9. **Trimming**: Category names are automatically trimmed of leading/trailing whitespace

---

## Usage Notes

### Default Categories

When a user first accesses the categories endpoint (GET /api/categories) and has no categories yet, the system automatically creates four default categories for that user:

1. **Clothing** - Purple (#8B5CF6), display_order: 0
2. **Hygiene** - Green (#10B981), display_order: 1
3. **Food** - Orange (#F59E0B), display_order: 2
4. **Medical** - Red (#EF4444), display_order: 3

Each user gets their own independent set of default categories.

### Soft Delete Behavior

- Deleted categories have `is_active` set to `false`
- Soft-deleted categories are excluded from default queries (`GET /api/categories`)
- To view deleted categories, use `?is_active=all` or `?is_active=false`
- Deleted categories can be reactivated by updating `is_active` to `true` via PUT

### Category Name Uniqueness

- Names must be unique among your **active** categories only
- Different users can have categories with the same name
- You can create a category with the same name as one of your deactivated categories
- When updating a category name, it's checked against all your other active categories (excluding itself)

### User Ownership

- Categories are scoped to individual users via the `created_by` field
- You can only view, update, and delete your own categories
- Attempting to modify another user's category returns `403 Forbidden`
- The GET endpoint automatically filters to return only your categories

### Display Order

- Categories are sorted by `display_order` first, then by `name`
- Lower `display_order` values appear first
- Multiple categories can have the same `display_order` (will be sorted by name)

---

## Integration Examples

### React/TypeScript Example

```typescript
import { getAuth } from 'firebase/auth';

interface Category {
  id: string;
  name: string;
  description: string;
  color_code: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get all categories
async function getCategories(): Promise<Category[]> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch('http://localhost:3000/api/categories', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const result = await response.json();
  return result.categories;
}

// Create category
async function createCategory(categoryData: {
  name: string;
  description?: string;
  color_code?: string;
  display_order?: number;
}): Promise<Category> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create category');
  }

  const result = await response.json();
  return result.data;
}

// Update category
async function updateCategory(id: string, updates: Partial<{
  name: string;
  description: string;
  color_code: string;
  display_order: number;
  is_active: boolean;
}>): Promise<Category> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update category');
  }

  const result = await response.json();
  return result.data;
}

// Delete category
async function deleteCategory(id: string): Promise<void> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }
}

// Usage
try {
  const categories = await getCategories();
  console.log('Categories:', categories);

  const newCategory = await createCategory({
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    color_code: '#3B82F6',
    display_order: 4
  });
  console.log('Created category:', newCategory);

  const updated = await updateCategory(newCategory.id, {
    description: 'Updated description'
  });
  console.log('Updated category:', updated);

  await deleteCategory(newCategory.id);
  console.log('Category deleted');
} catch (error) {
  console.error('Error:', error);
}
```

---

## Testing

### Test Credentials

For development/testing, you can use Firebase emulator or test accounts. Ensure you have valid Firebase JWT tokens.

### Example Test Scenarios

1. **Get categories for empty database** (should auto-create 4 default categories)
2. **Create new category** with all fields
3. **Create category with only name** (other fields should use defaults)
4. **Attempt to create duplicate category** (should return 400 error)
5. **Update category name** to unique value (should succeed)
6. **Update category name** to duplicate (should return 400 error)
7. **Soft delete category** (should set is_active to false)
8. **Get all categories** with `is_active=all` (should include deleted ones)
9. **Reactivate deleted category** by updating is_active to true

---

*API Version: 1.0.0*
*Last Updated: 2024*
