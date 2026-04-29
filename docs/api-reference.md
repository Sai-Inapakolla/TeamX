# API Reference

## Authentication Endpoints

### POST /auth/login
Login with credentials and get JWT tokens.

**Request:**
```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@test.com",
    "firstName": "Admin",
    "lastName": "User"
  },
  "tenants": [
    {
      "id": 1,
      "name": "Test Organization",
      "role": "ORG_ADMIN"
    }
  ]
}
```

### POST /auth/tenant-switch
Switch to a different tenant (for users belonging to multiple tenants).

**Auth:** Requires valid JWT

**Request:**
```json
{
  "tenantId": 2
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tenantId": 2,
  "tenantName": "Other Organization",
  "role": "USER"
}
```

---

## Project Endpoints

All requests must include:
```
Authorization: Bearer <accessToken>
```

### GET /projects
List all projects in current tenant.

**Permissions:** `PROJECT_READ`

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Q1 Planning",
    "description": "Q1 OKRs and planning",
    "status": "ACTIVE",
    "createdAt": "2026-03-25T10:00:00Z"
  }
]
```

### GET /projects/{id}
Get a specific project.

**Permissions:** `PROJECT_READ`

**Response (200):**
```json
{
  "id": 1,
  "name": "Q1 Planning",
  "description": "...",
  "ownerId": 42,
  "status": "ACTIVE",
  "createdAt": "2026-03-25T10:00:00Z",
  "updatedAt": "2026-03-25T10:00:00Z"
}
```

### POST /projects
Create a new project.

**Permissions:** `PROJECT_WRITE`

**Request:**
```json
{
  "name": "Q1 Planning",
  "description": "Q1 OKRs and planning",
  "ownerId": 42,
  "status": "ACTIVE"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Q1 Planning",
  "...": "..."
}
```

---

## Task Endpoints

### GET /projects/{projectId}/tasks
List all tasks in a project.

**Permissions:** `TASK_READ`

**Response (200):**
```json
[
  {
    "id": 1,
    "projectId": 1,
    "title": "Design Data Model",
    "description": "...",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assignedTo": 42,
    "dueDate": "2026-04-01",
    "createdAt": "2026-03-25T10:00:00Z"
  }
]
```

### POST /projects/{projectId}/tasks
Create a new task.

**Permissions:** `TASK_WRITE`

**Request:**
```json
{
  "title": "Design Data Model",
  "description": "...",
  "assignedTo": 42,
  "priority": "HIGH",
  "dueDate": "2026-04-01",
  "status": "TODO"
}
```

**Response (200):**
```json
{
  "id": 1,
  "projectId": 1,
  "title": "...",
  "...": "..."
}
```

---

## Admin Endpoints

All admin endpoints require `ROLE_ORG_ADMIN` permission.

### POST /admin/users/assign
Assign a user to the current tenant with a role.

**Permissions:** `ROLE_ORG_ADMIN`

**Request:**
```json
{
  "userId": 5,
  "tenantId": 1,
  "role": "MANAGER"
}
```

**Response (200):**
```json
{
  "userId": 5,
  "tenantId": 1,
  "role": "MANAGER",
  "status": "ACTIVE"
}
```

### GET /admin/users
List all users in current tenant.

**Permissions:** `ROLE_ORG_ADMIN`

**Response (200):**
```json
[
  {
    "userId": 1,
    "tenantId": 1,
    "role": "ORG_ADMIN",
    "status": "ACTIVE"
  },
  {
    "userId": 42,
    "tenantId": 1,
    "role": "MANAGER",
    "status": "ACTIVE"
  }
]
```

### DELETE /admin/users/{userId}
Remove a user from the current tenant.

**Permissions:** `ROLE_ORG_ADMIN`

**Response (204 No Content)**

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this action"
}
```

### 404 Not Found
```json
{
  "error": "NotFound",
  "message": "Resource not found or does not belong to your tenant"
}
```

### 400 Bad Request
```json
{
  "error": "BadRequest",
  "message": "Invalid input parameters"
}
```

---

## Authentication

All endpoints except `/auth/login` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The JWT contains:
- `sub` — User ID
- `email` — User email
- `tenant_id` — Current tenant ID
- `role` — User's role (ORG_ADMIN, MANAGER, USER)
- `permissions` — Array of permission strings

---

## Rate Limiting

Currently no rate limiting. In production, add rate limits:
- 100 requests/minute per IP
- 1000 requests/hour per user
