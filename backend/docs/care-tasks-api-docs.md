# Care Tasks API Documentation

## Overview

Care tasks describe recurring or one-off responsibilities linked to a client's care plan. Tasks can optionally reference a care item for purchasing workflows and automatically generate task executions based on recurrence rules.

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
  "recurrence_interval_days": 0,          // Required, integer >= 0
  "task_type": "PURCHASE" | "GENERAL", // Required
  "care_item_id": "string"               // Required when task_type = PURCHASE
}
```

#### Validation Rules
- `task_type` must be `PURCHASE` or `GENERAL`.
- `recurrence_interval_days` must be an integer ≥ 0 (0 = one-off).
- `end_date`, when provided, must not be before `start_date`.
- `care_item_id` must belong to the authenticated user when supplied.
- For `PURCHASE` tasks, `care_item_id` is mandatory.

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
    "care_item_id": "care-item-1",
    "created_by": "user-uid",
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
- `care_item_id`: Filter tasks linked to a specific care item.
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
      "care_item_id": "care-item-1",
      "created_by": "user-uid",
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
- `care_item_id`

#### Notes
- Switching to `PURCHASE` requires a valid `care_item_id` belonging to the user.
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

### 1. Update Execution

**PUT** `/api/task-executions/{executionId}`

Allows editing status, quantities, cost, evidence URL, execution date, and notes. All ownership checks trace back to the parent care task.

### 2. Mark Execution Complete

**POST** `/api/task-executions/{executionId}/complete`

Convenience endpoint that:
- Forces `status = DONE`.
- Sets `execution_date` to the provided value or now.
- Records `executed_by` as the authenticated user.
- Accepts optional `actual_cost`, `quantity_purchased`, and `notes` updates.

### 3. Cover Additional Executions

**PATCH** `/api/task-executions/{executionId}/cover-executions`

Marks a set of executions as `COVERED`, linking them to a bulk purchase execution owned by the user.

```json
{
  "execution_ids": ["exec-2", "exec-3"]
}
```

### 4. List Covered Executions

**GET** `/api/task-executions/{executionId}/covered-executions`

Returns executions whose `covered_by_execution_id` matches the provided execution. Ownership is validated before data is returned.

### 5. Global Execution Listing

**GET** `/api/task-executions`

- Optional filters: `status`, `care_task_id`, `executed_by`, `date_from`, `date_to`, `limit`, `offset`.
- When `care_task_id` is omitted, results are restricted to executions whose parent tasks belong to the user.

---

## Error Handling Summary

| Status | Scenario |
|--------|----------|
| 400 | Validation failure (invalid dates, recurrence interval, missing care item for purchase task, invalid status, etc.) |
| 401 | Missing or invalid authentication token |
| 403 | Attempt to access or mutate resources that belong to another user |
| 404 | Referenced care item, care task, or execution not found |
| 500 | Unexpected server error |

---

## Postman / Testing Tips

- Include the Firebase Bearer token on every call.
- Use `recurrence_interval_days = 0` for one-off tasks; greater than zero enables recurring generation.
- Run manual execution creation for ad-hoc completions or large purchases outside the automated schedule.
- Use `/api/task-executions/{id}/complete` to streamline marking tasks done while recording quantities and costs.

