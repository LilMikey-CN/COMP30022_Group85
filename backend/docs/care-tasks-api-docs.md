# Care Tasks API Documentation

## Overview

Care tasks describe recurring or one-off responsibilities linked to a client's care plan. Each authenticated user stores tasks inside their personal Firestore document (`users/{uid}/care_tasks`). Tasks reference categories by `category_id` so they remain aligned with the reusable category list saved at `users/{uid}/categories/options`.

## Authentication

All endpoints require a valid Firebase JWT in the `Authorization` header:

```
Authorization: Bearer <firebase-jwt-token>
```

Requests made with invalid, missing, or expired tokens return `401 Unauthorized`.

## Base URL

Default local URL: `http://localhost:3000`

---

## Endpoints

### 1. Create Care Task

**POST** `/api/care-tasks`

Creates a new care task and generates the first execution.

#### Request Body

```json
{
  "name": "string",                      // Required
  "description": "string",               // Optional (defaults "")
  "start_date": "YYYY-MM-DD",            // Required
  "end_date": "YYYY-MM-DD",              // Optional
  "recurrence_interval_days": 0,           // Required, integer >= 0
  "task_type": "PURCHASE" | "GENERAL",  // Required
  "category_id": "string",               // Required, must exist in category options
  "estimated_unit_cost": 12.5,             // Optional number ≥ 0
  "quantity_per_purchase": 1,              // Optional integer ≥ 1
  "quantity_unit": "bottle"              // Optional string
}
```

#### Validation Rules
- `task_type` must be `PURCHASE` or `GENERAL`.
- `recurrence_interval_days` must be an integer ≥ 0 (0 = one-off).
- `end_date`, when provided, must not be before `start_date`.
- `category_id` must exist in the user's category options document.
- `estimated_unit_cost`, when provided, must be a number ≥ 0.
- `quantity_per_purchase`, when provided, must be an integer ≥ 1.

#### Success Response (`201 Created`)

```json
{
  "message": "Care task created successfully",
  "id": "task-123",
  "generated_execution_id": "exec-456",
  "data": {
    "id": "task-123",
    "name": "Buy Toothpaste",
    "description": "",
    "start_date": "2024-03-01T00:00:00.000Z",
    "end_date": null,
    "recurrence_interval_days": 30,
    "task_type": "PURCHASE",
    "is_active": true,
    "category_id": "hygiene",
    "estimated_unit_cost": 12.5,
    "quantity_per_purchase": 2,
    "quantity_unit": "tubes",
    "user_id": "user-uid",
    "deactivated_at": null,
    "created_at": "2024-02-01T08:00:00.000Z",
    "updated_at": "2024-02-01T08:00:00.000Z"
  }
}
```

---

### 2. List Care Tasks

**GET** `/api/care-tasks`

Returns care tasks owned by the authenticated user.

#### Query Parameters
- `task_type`: Filter by `PURCHASE` or `GENERAL`.
- `category_id`: Filter tasks linked to a specific category.
- `is_active`: `true` (default), `false`, or `all`.
- `start_date_from`, `start_date_to`: ISO date window for task start dates.
- `limit` (default 50) & `offset` (default 0) for pagination.

#### Success Response (`200 OK`)

```json
{
  "care_tasks": [
    {
      "id": "task-123",
      "name": "Buy Toothpaste",
      "task_type": "PURCHASE",
      "start_date": "2024-03-01T00:00:00.000Z",
      "end_date": null,
      "recurrence_interval_days": 30,
      "is_active": true,
      "category_id": "hygiene",
      "estimated_unit_cost": 12.5,
      "quantity_per_purchase": 2,
      "quantity_unit": "tubes",
      "user_id": "user-uid",
      "created_at": "2024-02-01T08:00:00.000Z",
      "updated_at": "2024-02-01T08:00:00.000Z",
      "deactivated_at": null
    }
  ],
  "count": 1,
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

---

### 3. Fetch Care Task Details

**GET** `/api/care-tasks/{taskId}`

Returns a single care task if it belongs to the authenticated user.

#### Error Codes
- `404 Not Found` – Task does not exist.
- `403 Forbidden` – Task exists but is owned by another user.

---

### 4. Update Care Task

**PUT / PATCH** `/api/care-tasks/{taskId}`

Performs partial updates. Ownership checks are enforced.

#### Supported Fields
- `name`, `description`, `start_date`, `end_date`
- `recurrence_interval_days`
- `task_type`
- `category_id`
- `estimated_unit_cost`, `quantity_per_purchase`, `quantity_unit`

#### Notes
- Switching task type does not change the requirement for `category_id`; it must continue to exist in the user's category options.
- Date validation rules mirror creation endpoint.
- Recurrence interval must remain ≥ 0.

---

### 5. Deactivate & Reactivate

- **DELETE** `/api/care-tasks/{taskId}` – Soft delete (sets `is_active = false`).
- **POST** `/api/care-tasks/{taskId}/deactivate` – Alias for delete.
- **PATCH** `/api/care-tasks/{taskId}/reactivate` or **POST** `/api/care-tasks/{taskId}/reactivate` – Restores a task (`is_active = true`).

Deactivating a task stops future automatic execution generation.

---

### 6. Generate Future Executions

**POST** `/api/care-tasks/{taskId}/generate-executions`

Creates the next scheduled execution for recurring tasks.

#### Behaviour
- Returns `400` if the task is inactive or one-off (`recurrence_interval_days = 0`).
- Returns `200` with `execution_id: null` when the task end date is reached.

---

### 7. Manual Execution Management

#### Create Manual Execution

**POST** `/api/care-tasks/{taskId}/executions`

```json
{
  "scheduled_date": "YYYY-MM-DD",   // Optional (defaults to today)
  "execution_date": "YYYY-MM-DD",   // Optional
  "status": "TODO" | "DONE" | "CANCELLED",
  "quantity_purchased": 1,           // Integer ≥ 1
  "quantity_unit": "string",        // Optional
  "actual_cost": 12.5,               // Optional number
  "notes": "string"                  // Optional
}
```

- If `status` is `DONE` and `execution_date` is omitted, the endpoint stamps the current time and assigns `executed_by` to the caller.
- Returns `201 Created` with the newly created execution payload.

#### List Executions for a Task

**GET** `/api/care-tasks/{taskId}/executions`

- Query parameters: `status`, `limit`, `offset`.
- Only returns executions owned by the authenticated user.

---

## Task Execution Endpoints

### Update Execution

**PATCH** `/api/care-tasks/{taskId}/executions/{executionId}`

Allows editing status, quantities, cost, evidence URL, execution date, and notes for a specific execution belonging to the supplied task. Ownership checks are enforced on both the task and execution identifiers.

## Error Handling Summary

| Status | Scenario |
|--------|----------|
| 400 | Validation failure (invalid dates, recurrence interval, missing/unknown category, invalid status, etc.) |
| 401 | Missing or invalid authentication token |
| 403 | Attempt to access or mutate resources that belong to another user |
| 404 | Referenced care task, execution, or category not found |
| 500 | Unexpected server error |

---

## Postman / Testing Tips

- Include the Firebase Bearer token on every call.
- Use `recurrence_interval_days = 0` for one-off tasks; greater than zero enables recurring generation.
- Run manual execution creation for ad-hoc completions or large purchases outside the automated schedule.
- Use `/api/care-tasks/{taskId}/executions` to record completions or ad-hoc work.
