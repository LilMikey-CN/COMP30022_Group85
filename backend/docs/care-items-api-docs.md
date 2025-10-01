# Care Items API Documentation

## Overview

This document provides comprehensive API documentation for care items endpoints in the Care Management system. Care items represent supplies, products, or services needed for client care (e.g., winter jacket, toothpaste, medication).

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

## Care Items API

### Base Path: `/api/care-items`

This API manages care items, providing endpoints to create, retrieve, update, and manage care items.

### 1. Create Care Item

**Endpoint:** `POST /api/care-items`
**Method:** POST
**Description:** Creates a new care item. All fields are optional with sensible defaults.

#### Request Body

```json
{
  "name": "string",                    // Optional - Item name
  "estimated_unit_cost": "number",     // Optional - Estimated cost per unit (default: 0)
  "quantity_per_purchase": "number",   // Optional - Typical quantity purchased (default: 1)
  "quantity_unit": "string",           // Optional - Unit of measurement (e.g., "piece", "pack")
  "start_date": "YYYY-MM-DD",         // Optional - When item becomes needed (default: today)
  "end_date": "YYYY-MM-DD",           // Optional - When item is no longer needed
  "category_id": "string"              // Optional - Reference to category
}
```

**Field Details:**
- All fields are optional - validation is handled by frontend
- `name`: Defaults to empty string if not provided
- `estimated_unit_cost`: Defaults to 0 if not provided
- `quantity_per_purchase`: Defaults to 1 if not provided
- `quantity_unit`: Defaults to empty string if not provided
- `start_date`: Defaults to current date if not provided
- `end_date`: Null by default (no end date)
- `category_id`: If provided, must reference an existing category that belongs to you

#### Response

**Success (201 Created):**
```json
{
  "message": "Care item created successfully",
  "id": "string",
  "data": {
    "id": "string",
    "name": "string",
    "estimated_unit_cost": "number",
    "quantity_per_purchase": "number",
    "quantity_unit": "string",
    "start_date": "ISO-date-string",
    "end_date": "ISO-date-string | null",
    "is_active": true,
    "category_id": "string | null",
    "created_by": "string",
    "deactivated_at": null,
    "created_at": "ISO-date-string",
    "updated_at": "ISO-date-string"
  }
}
```

**Error Responses:**
- `404 Not Found` - Category not found (if category_id provided but doesn't exist)
- `403 Forbidden` - Category belongs to another user
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X POST http://localhost:3000/api/care-items \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Winter Jacket",
    "estimated_unit_cost": 89.99,
    "quantity_per_purchase": 1,
    "quantity_unit": "piece",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "category_id": "cat-clothing-123"
  }'
```

#### Example Response

```json
{
  "message": "Care item created successfully",
  "id": "item-abc123",
  "data": {
    "id": "item-abc123",
    "name": "Winter Jacket",
    "estimated_unit_cost": 89.99,
    "quantity_per_purchase": 1,
    "quantity_unit": "piece",
    "start_date": "2024-01-01T00:00:00.000Z",
    "end_date": "2024-12-31T00:00:00.000Z",
    "is_active": true,
    "category_id": "cat-clothing-123",
    "created_by": "user-xyz789",
    "deactivated_at": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Care Items

**Endpoint:** `GET /api/care-items`
**Method:** GET
**Description:** Retrieves all care items with filtering and pagination

#### Query Parameters

- `category_id` (string, optional): Filter by category ID
- `is_active` (string, optional): Filter by active status
  - `"true"` - Only active items (default)
  - `"false"` - Only inactive items
  - `"all"` - All items regardless of status
- `limit` (number, optional): Maximum number of results. Default: 50
- `offset` (number, optional): Number of records to skip. Default: 0

#### Response

**Success (200 OK):**
```json
{
  "care_items": [
    {
      "id": "string",
      "name": "string",
      "estimated_unit_cost": "number",
      "quantity_per_purchase": "number",
      "quantity_unit": "string",
      "start_date": "ISO-date-string",
      "end_date": "ISO-date-string | null",
      "is_active": "boolean",
      "category_id": "string | null",
      "created_by": "string",
      "deactivated_at": "ISO-date-string | null",
      "created_at": "ISO-date-string",
      "updated_at": "ISO-date-string"
    }
  ],
  "count": "number",
  "pagination": {
    "limit": "number",
    "offset": "number"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
# Get all active care items
curl -X GET http://localhost:3000/api/care-items \
  -H "Authorization: Bearer <your-firebase-token>"

# Get care items for specific category
curl -X GET "http://localhost:3000/api/care-items?category_id=cat-clothing-123" \
  -H "Authorization: Bearer <your-firebase-token>"

# Get with pagination
curl -X GET "http://localhost:3000/api/care-items?limit=10&offset=20" \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "care_items": [
    {
      "id": "item-1",
      "name": "Winter Jacket",
      "estimated_unit_cost": 89.99,
      "quantity_per_purchase": 1,
      "quantity_unit": "piece",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-12-31T00:00:00.000Z",
      "is_active": true,
      "category_id": "cat-clothing-123",
      "created_by": "user-xyz789",
      "deactivated_at": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "item-2",
      "name": "Toothpaste",
      "estimated_unit_cost": 4.50,
      "quantity_per_purchase": 2,
      "quantity_unit": "tube",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": null,
      "is_active": true,
      "category_id": "cat-hygiene-456",
      "created_by": "user-xyz789",
      "deactivated_at": null,
      "created_at": "2024-01-16T09:15:00.000Z",
      "updated_at": "2024-01-16T09:15:00.000Z"
    }
  ],
  "count": 2,
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

### 3. Get Care Item by ID

**Endpoint:** `GET /api/care-items/:id`
**Method:** GET
**Description:** Retrieves a specific care item by ID

#### Response

**Success (200 OK):**
```json
{
  "id": "string",
  "name": "string",
  "estimated_unit_cost": "number",
  "quantity_per_purchase": "number",
  "quantity_unit": "string",
  "start_date": "ISO-date-string",
  "end_date": "ISO-date-string | null",
  "is_active": "boolean",
  "category_id": "string | null",
  "created_by": "string",
  "deactivated_at": "ISO-date-string | null",
  "created_at": "ISO-date-string",
  "updated_at": "ISO-date-string"
}
```

**Error Responses:**
- `404 Not Found` - Care item not found
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X GET http://localhost:3000/api/care-items/item-abc123 \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "id": "item-abc123",
  "name": "Winter Jacket",
  "estimated_unit_cost": 89.99,
  "quantity_per_purchase": 1,
  "quantity_unit": "piece",
  "start_date": "2024-01-01T00:00:00.000Z",
  "end_date": "2024-12-31T00:00:00.000Z",
  "is_active": true,
  "category_id": "cat-clothing-123",
  "created_by": "user-xyz789",
  "deactivated_at": null,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### 4. Update Care Item

**Endpoint:** `PUT /api/care-items/:id`
**Method:** PUT
**Description:** Updates a care item. All fields can be updated. Only provided fields will be changed.

#### Request Body

```json
{
  "name": "string",                    // Optional
  "estimated_unit_cost": "number",     // Optional
  "quantity_per_purchase": "number",   // Optional
  "quantity_unit": "string",           // Optional
  "start_date": "YYYY-MM-DD",         // Optional
  "end_date": "YYYY-MM-DD",           // Optional
  "category_id": "string",             // Optional
  "is_active": "boolean"               // Optional - Can manually deactivate/reactivate
}
```

**Field Details:**
- All fields are optional - only include fields you want to update
- `category_id`: If provided, must reference an existing category that belongs to you
- Partial updates supported - unchanged fields retain their current values

#### Response

**Success (200 OK):**
```json
{
  "message": "Care item updated successfully",
  "data": {
    "id": "string",
    "name": "string",
    "estimated_unit_cost": "number",
    "quantity_per_purchase": "number",
    "quantity_unit": "string",
    "start_date": "ISO-date-string",
    "end_date": "ISO-date-string | null",
    "is_active": "boolean",
    "category_id": "string | null",
    "created_by": "string",
    "deactivated_at": "ISO-date-string | null",
    "created_at": "ISO-date-string",
    "updated_at": "ISO-date-string"
  }
}
```

**Error Responses:**
- `404 Not Found` - Care item not found or category not found (if category_id provided)
- `403 Forbidden` - Category belongs to another user
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X PUT http://localhost:3000/api/care-items/item-abc123 \
  -H "Authorization: Bearer <your-firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estimated_unit_cost": 95.00,
    "quantity_per_purchase": 2
  }'
```

#### Example Response

```json
{
  "message": "Care item updated successfully",
  "data": {
    "id": "item-abc123",
    "name": "Winter Jacket",
    "estimated_unit_cost": 95.00,
    "quantity_per_purchase": 2,
    "quantity_unit": "piece",
    "start_date": "2024-01-01T00:00:00.000Z",
    "end_date": "2024-12-31T00:00:00.000Z",
    "is_active": true,
    "category_id": "cat-clothing-123",
    "created_by": "user-xyz789",
    "deactivated_at": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z"
  }
}
```

### 5. Delete Care Item (Soft Delete)

**Endpoint:** `DELETE /api/care-items/:id`
**Method:** DELETE
**Description:** Soft deletes a care item by setting `is_active` to `false` and recording `deactivated_at`. The item data is preserved but hidden from default queries.

#### Response

**Success (200 OK):**
```json
{
  "message": "Care item deactivated successfully",
  "id": "string"
}
```

**Error Responses:**
- `404 Not Found` - Care item not found
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X DELETE http://localhost:3000/api/care-items/item-abc123 \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "message": "Care item deactivated successfully",
  "id": "item-abc123"
}
```

### 6. Reactivate Care Item

**Endpoint:** `PATCH /api/care-items/:id/reactivate`
**Method:** PATCH
**Description:** Reactivates a previously deactivated care item by setting `is_active` to `true` and clearing `deactivated_at`.

#### Response

**Success (200 OK):**
```json
{
  "message": "Care item reactivated successfully",
  "id": "string"
}
```

**Error Responses:**
- `404 Not Found` - Care item not found
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

#### Example Request

```bash
curl -X PATCH http://localhost:3000/api/care-items/item-abc123/reactivate \
  -H "Authorization: Bearer <your-firebase-token>"
```

#### Example Response

```json
{
  "message": "Care item reactivated successfully",
  "id": "item-abc123"
}
```

---

## Data Models

### Care Item Schema

```typescript
interface CareItem {
  id: string;                          // Firestore document ID (auto-generated)
  name: string;                        // Item name
  estimated_unit_cost: number;         // Estimated cost per unit
  quantity_per_purchase: number;       // Typical quantity purchased at once
  quantity_unit: string;               // Unit of measurement (e.g., "piece", "pack", "bottle")
  start_date: Date;                    // When item becomes needed
  end_date: Date | null;               // When item is no longer needed
  is_active: boolean;                  // Active status (false = soft deleted)
  category_id: string | null;          // Reference to category
  created_by: string;                  // User ID who created the item
  deactivated_at: Date | null;         // When item was deactivated
  created_at: Date;                    // System field (read-only)
  updated_at: Date;                    // System field (auto-updated)
}
```

### Field Descriptions

| Field | Type | Updateable | Description |
|-------|------|------------|-------------|
| `id` | string | No | Firestore document ID |
| `name` | string | Yes | Name/description of the care item |
| `estimated_unit_cost` | number | Yes | Estimated cost per unit (in currency) |
| `quantity_per_purchase` | number | Yes | Typical quantity purchased at once |
| `quantity_unit` | string | Yes | Unit of measurement (e.g., "piece", "pack", "bottle") |
| `start_date` | Date | Yes | Date when item becomes needed |
| `end_date` | Date\|null | Yes | Date when item is no longer needed (null = ongoing) |
| `is_active` | boolean | Yes | Active status (false = soft deleted) |
| `category_id` | string\|null | Yes | Reference to category document |
| `created_by` | string | No | User ID who created the item |
| `deactivated_at` | Date\|null | No | Timestamp when item was deactivated |
| `created_at` | Date | No | Timestamp when item was created |
| `updated_at` | Date | No | Timestamp when item was last updated |

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
- `201 Created` - Care item created successfully
- `400 Bad Request` - Invalid request data (validation error)
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Category belongs to another user
- `404 Not Found` - Care item or category not found
- `500 Internal Server Error` - Server error

### Validation Rules

1. **All Fields Optional**: No required fields on creation - frontend handles validation
2. **Default Values**:
   - `name`: Empty string
   - `estimated_unit_cost`: 0
   - `quantity_per_purchase`: 1
   - `quantity_unit`: Empty string
   - `start_date`: Current date
   - `end_date`: null
   - `category_id`: null
3. **Category Reference**: If `category_id` is provided, it must reference an existing category that belongs to the authenticated user
4. **Category Ownership**: When creating or updating a care item with a `category_id`, the system verifies the category belongs to you
5. **Date Formats**: Accept ISO date strings (YYYY-MM-DD) and convert to Date objects
6. **Soft Delete**: Deletion sets `is_active` to false and `deactivated_at` to current timestamp

---

## Usage Notes

### Soft Delete Behavior

- Deleted items have `is_active` set to `false` and `deactivated_at` set to deletion timestamp
- Soft-deleted items are excluded from default queries (`GET /api/care-items`)
- To view deleted items, use `?is_active=all` or `?is_active=false`
- Deleted items can be reactivated using `PATCH /api/care-items/:id/reactivate`

### Category Relationship

- Care items can optionally belong to a category via `category_id`
- Categories are user-specific - you can only assign care items to your own categories
- Attempting to use another user's category returns `403 Forbidden`
- If category is deleted/deactivated, associated items remain but maintain the category reference
- Use `?category_id=<id>` to filter items by category

### Pagination

- Default limit: 50 items per request
- Results ordered by `created_at` descending (newest first)
- Use `limit` and `offset` parameters for pagination
- `count` in response indicates number of items returned (not total)

### Date Handling

- Dates are stored as Firestore Timestamp objects
- API accepts ISO date strings (YYYY-MM-DD) in requests
- API returns ISO date-time strings in responses
- `end_date` is optional - null indicates ongoing need for the item

### Created By Tracking

- `created_by` is automatically set to the authenticated user's UID
- Cannot be changed after creation
- Useful for tracking which guardian/family member added each item

---

## Integration Examples

### React/TypeScript Example

```typescript
import { getAuth } from 'firebase/auth';

interface CareItem {
  id: string;
  name: string;
  estimated_unit_cost: number;
  quantity_per_purchase: number;
  quantity_unit: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  category_id: string | null;
  created_by: string;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Get all care items
async function getCareItems(options?: {
  category_id?: string;
  is_active?: 'true' | 'false' | 'all';
  limit?: number;
  offset?: number;
}): Promise<{ care_items: CareItem[]; count: number }> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const params = new URLSearchParams();
  if (options?.category_id) params.append('category_id', options.category_id);
  if (options?.is_active) params.append('is_active', options.is_active);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const url = `http://localhost:3000/api/care-items?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch care items');
  }

  return await response.json();
}

// Get care item by ID
async function getCareItem(id: string): Promise<CareItem> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`http://localhost:3000/api/care-items/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch care item');
  }

  return await response.json();
}

// Create care item
async function createCareItem(itemData: {
  name?: string;
  estimated_unit_cost?: number;
  quantity_per_purchase?: number;
  quantity_unit?: string;
  start_date?: string;
  end_date?: string;
  category_id?: string;
}): Promise<CareItem> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch('http://localhost:3000/api/care-items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create care item');
  }

  const result = await response.json();
  return result.data;
}

// Update care item
async function updateCareItem(id: string, updates: Partial<{
  name: string;
  estimated_unit_cost: number;
  quantity_per_purchase: number;
  quantity_unit: string;
  start_date: string;
  end_date: string;
  category_id: string;
  is_active: boolean;
}>): Promise<CareItem> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`http://localhost:3000/api/care-items/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update care item');
  }

  const result = await response.json();
  return result.data;
}

// Delete care item
async function deleteCareItem(id: string): Promise<void> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`http://localhost:3000/api/care-items/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete care item');
  }
}

// Reactivate care item
async function reactivateCareItem(id: string): Promise<void> {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`http://localhost:3000/api/care-items/${id}/reactivate`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reactivate care item');
  }
}

// Usage
try {
  // Get all active items
  const { care_items } = await getCareItems();
  console.log('Care items:', care_items);

  // Get items for specific category
  const clothingItems = await getCareItems({
    category_id: 'cat-clothing-123'
  });
  console.log('Clothing items:', clothingItems);

  // Create new item
  const newItem = await createCareItem({
    name: 'Winter Jacket',
    estimated_unit_cost: 89.99,
    quantity_per_purchase: 1,
    quantity_unit: 'piece',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    category_id: 'cat-clothing-123'
  });
  console.log('Created item:', newItem);

  // Update item
  const updated = await updateCareItem(newItem.id, {
    estimated_unit_cost: 95.00
  });
  console.log('Updated item:', updated);

  // Delete item
  await deleteCareItem(newItem.id);
  console.log('Item deleted');

  // Reactivate item
  await reactivateCareItem(newItem.id);
  console.log('Item reactivated');
} catch (error) {
  console.error('Error:', error);
}
```

---

## Testing

### Test Credentials

For development/testing, you can use Firebase emulator or test accounts. Ensure you have valid Firebase JWT tokens.

### Example Test Scenarios

1. **Create care item** with all fields
2. **Create care item** with no fields (should use defaults)
3. **Create care item** with invalid category_id (should return 404)
4. **Get all care items** (should return array with pagination info)
5. **Get care items by category** using category_id filter
6. **Get specific care item** by ID
7. **Update care item** - partial update with some fields
8. **Update care item** - change category to different valid category
9. **Soft delete care item** (should set is_active to false)
10. **Get all items** with `is_active=all` (should include deleted)
11. **Reactivate care item** (should restore is_active to true)
12. **Pagination** - test limit and offset parameters

---

*API Version: 1.0.0*
*Last Updated: 2024*
