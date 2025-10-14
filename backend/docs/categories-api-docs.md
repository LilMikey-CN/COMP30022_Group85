# Categories API Documentation

## Overview

Categories live under each user document at `users/{uid}/categories/options` and provide the reusable values that care tasks reference through `category_id`. Every user receives a pre-seeded set of default categories (Hygiene, Clothing, Food, Medical Supplies, Household) the first time their profile is initialised. All endpoints below operate on the authenticated user's category options document and never affect other users.

## Authentication

Include a valid Firebase JWT in the `Authorization` header for every request:

```
Authorization: Bearer <firebase-jwt-token>
```

Requests with missing or invalid tokens return `401 Unauthorized`.

## Base URL

Local development server: `http://localhost:3000`

## Endpoints

### 1. List Categories

**GET** `/api/categories`

Returns the full category array stored in `users/{uid}/categories/options`.

**Success (200 OK)**
```json
{
  "categories": [
    {
      "id": "hygiene",
      "name": "Hygiene",
      "description": "Personal care and hygiene essentials",
      "color_code": "#4C51BF",
      "created_at": "2024-05-01T00:00:00.000Z",
      "updated_at": "2024-05-01T00:00:00.000Z"
    }
  ]
}
```

The endpoint always initialises default categories before returning results, so the array is never empty for a new user.

---

### 2. Create Category

**POST** `/api/categories`

Adds a new entry to the user's category options. The server generates a unique `id` (slug plus random suffix) and appends timestamp metadata.

**Request Body**
```json
{
  "name": "string",        // required, must be unique (case-insensitive)
  "description": "string", // optional, defaults to ""
  "color_code": "#RRGGBB"  // optional, defaults to #6B7280
}
```

**Validation Notes**
- `name` must be a non-empty string and unique among existing categories (case-insensitive).
- `color_code`, when provided, must be a valid hex colour (e.g. `#38A169`).

**Success (201 Created)**
```json
{
  "message": "Category created successfully",
  "data": {
    "id": "personal-safety-1a2b",
    "name": "Personal Safety",
    "description": "Safety-related purchases",
    "color_code": "#D69E2E",
    "created_at": "2024-05-02T00:00:00.000Z",
    "updated_at": "2024-05-02T00:00:00.000Z"
  }
}
```

**Error Responses**
- `409 Conflict` – name already exists for the user.
- `400 Bad Request` – invalid payload (e.g. malformed colour code).

---

### 3. Update Category

**PATCH** `/api/categories/{categoryId}`

Allows partial updates to `name`, `description`, or `color_code`.

**Request Body (any subset)**
```json
{
  "name": "Essential Supplies",
  "description": "Restocked monthly",
  "color_code": "#2F855A"
}
```

**Rules**
- Updating `name` enforces the same uniqueness constraint as creation.
- Partial updates leave unspecified fields unchanged.

**Success (200 OK)**
```json
{
  "message": "Category updated successfully",
  "data": {
    "id": "medical-supplies",
    "name": "Medical Supplies",
    "description": "Healthcare items",
    "color_code": "#E53E3E",
    "created_at": "2024-05-01T00:00:00.000Z",
    "updated_at": "2024-05-03T12:34:56.000Z"
  }
}
```

---

### 4. Delete Category

**DELETE** `/api/categories/{categoryId}`

Removes a category from the options document if no care tasks currently reference it.

**Rules**
- If any task in `users/{uid}/care_tasks` still uses the category ID, the request returns `400 Bad Request` with an explanatory error.
- When deletion succeeds, subsequent calls to `GET /api/categories` no longer list the category.

**Success (200 OK)**
```json
{
  "message": "Category deleted successfully",
  "id": "household"
}
```

**Error (400 Bad Request)**
```json
{
  "error": "Cannot delete category while tasks are assigned to it"
}
```

---

## Default Categories

On initialisation each user receives these defaults (IDs are fixed and reused across environments):

| id                | name              | color_code | description                                      |
|-------------------|-------------------|------------|--------------------------------------------------|
| `hygiene`         | Hygiene           | `#4C51BF`  | Personal care and hygiene essentials             |
| `clothing`        | Clothing          | `#3182CE`  | Clothing and apparel items                       |
| `food`            | Food              | `#38A169`  | Groceries and daily food supplies                |
| `medical-supplies`| Medical Supplies  | `#E53E3E`  | Medical and healthcare related supplies          |
| `household`       | Household         | `#805AD5`  | Household maintenance and cleaning essentials    |

These can be edited or removed (subject to the task constraint) just like any user-created category.
