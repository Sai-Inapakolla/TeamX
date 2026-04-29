# RBAC Details

## Role-Based Access Control (RBAC)

This project implements a fine-grained role-based access control system with permission matrices.

## Roles

Three roles are defined in the system:

### 1. ORG_ADMIN (Organization Administrator)

Full access to all resources and settings within a tenant.

**Permissions:**
- `PROJECT_READ` — View all projects
- `PROJECT_WRITE` — Create, edit, delete projects
- `TASK_READ` — View all tasks
- `TASK_WRITE` — Create, edit, delete tasks
- `TASK_ASSIGN` — Assign tasks to users
- `USER_MANAGE` — Manage users in tenant
- `TENANT_SETTINGS` — Configure tenant settings

**Typical Users:** Tenant admins, organization leads

---

### 2. MANAGER (Project Manager)

Manage projects and tasks, assign work.

**Permissions:**
- `PROJECT_READ` — View assigned projects
- `PROJECT_WRITE` — Edit assigned projects
- `TASK_READ` — View assigned tasks
- `TASK_WRITE` — Create and edit tasks
- `TASK_ASSIGN` — Assign tasks to team members

**Typical Users:** Project managers, team leads

---

### 3. USER (Regular User)

Limited access; primarily to read and work on assigned tasks.

**Permissions:**
- `PROJECT_READ` — View projects
- `TASK_READ` — View tasks
- `TASK_WRITE` — Update own tasks

**Typical Users:** Team members, contributors

---

## Permission Matrix

| Permission | ORG_ADMIN | MANAGER | USER | Notes |
|-----------|-----------|---------|------|-------|
| PROJECT_READ | ✅ | ✅ | ✅ | Read access to projects |
| PROJECT_WRITE | ✅ | ✅ | ❌ | Create/edit/delete projects |
| TASK_READ | ✅ | ✅ | ✅ | Read tasks |
| TASK_WRITE | ✅ | ✅ | ✅ | Create/edit tasks |
| TASK_ASSIGN | ✅ | ✅ | ❌ | Assign tasks to users |
| USER_MANAGE | ✅ | ❌ | ❌ | Add/remove users from tenant |
| TENANT_SETTINGS | ✅ | ❌ | ❌ | Configure tenant-wide settings |

---

## How RBAC Works

### 1. Role Assignment

When a user is invited or added to a tenant, they are assigned a role:

```sql
INSERT INTO user_tenants (user_id, tenant_id, role)
VALUES (5, 1, 'MANAGER');
```

Role values: `ORG_ADMIN`, `MANAGER`, `USER`

### 2. Permission Lookup

The `RolePermissionMapper` maps roles to permissions:

```java
Map<String, Set<String>> ROLE_PERMISSIONS = {
  "ORG_ADMIN": {"PROJECT_READ", "PROJECT_WRITE", ..., "TENANT_SETTINGS"},
  "MANAGER": {"PROJECT_READ", "PROJECT_WRITE", ..., "TASK_ASSIGN"},
  "USER": {"PROJECT_READ", "TASK_READ", "TASK_WRITE"}
};
```

### 3. JWT Token Claims

On login, the token includes role + permissions:

```json
{
  "sub": "5",
  "email": "jane@company.com",
  "tenant_id": 1,
  "role": "MANAGER",
  "permissions": ["PROJECT_READ", "PROJECT_WRITE", "TASK_READ", "TASK_WRITE", "TASK_ASSIGN"]
}
```

### 4. Spring Security Integration

The `JwtAuthenticationFilter` extracts these and creates Spring Security authorities:

```java
UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
  userId,
  null,
  authorities  // ["ROLE_MANAGER", "PROJECT_READ", "PROJECT_WRITE", ...]
);
SecurityContextHolder.getContext().setAuthentication(auth);
```

### 5. Method-Level Authorization

Controllers and services use `@PreAuthorize` to guard endpoints:

```java
@PostMapping
@PreAuthorize("hasAuthority('PROJECT_WRITE')")
public ResponseEntity<ProjectDTO> createProject(ProjectDTO dto) {
  // Only users with PROJECT_WRITE permission reach here
  return projectService.createProject(dto);
}
```

---

## Usage Examples

### Example 1: ORG_ADMIN Creates a Project

```
1. User with role=ORG_ADMIN logs in
   → Token includes: permissions=["PROJECT_READ", "PROJECT_WRITE", ...]

2. POST /projects with ProjectDTO
   → @PreAuthorize("hasAuthority('PROJECT_WRITE')") ✅ PASS
   
3. ProjectService.createProject()
   → @PreAuthorize("hasAuthority('PROJECT_WRITE')") ✅ PASS
   
4. Project saved with tenant_id=1, createdBy=user_id
```

### Example 2: USER Tries to Create a Project

```
1. User with role=USER logs in
   → Token includes: permissions=["PROJECT_READ", "TASK_READ", "TASK_WRITE"]

2. POST /projects with ProjectDTO
   → @PreAuthorize("hasAuthority('PROJECT_WRITE')") ❌ FAIL
   → Response: 403 Forbidden
```

### Example 3: MANAGER Assigns a Task

```
1. User with role=MANAGER logs in
   → Token includes: permissions=[..., "TASK_ASSIGN"]

2. POST /projects/1/tasks/update-assignment
   → @PreAuthorize("hasAuthority('TASK_ASSIGN')") ✅ PASS
   
3. Task updated with assignedTo=target_user_id
```

---

## Admin Operations

### Assign a User to a Tenant

Only ORG_ADMIN can do this:

```bash
POST /admin/users/assign
{
  "userId": 5,
  "tenantId": 1,
  "role": "MANAGER"
}
```

Backend checks:
1. Current user is ORG_ADMIN ✅
2. User isn't already in tenant ✅
3. Role is valid ✅
4. Insert into user_tenants ✅

### List Tenant Members

```bash
GET /admin/users
Authorization: Bearer <token_for_org_admin>
```

Returns all users and their roles in current tenant.

### Remove a User from Tenant

```bash
DELETE /admin/users/5
Authorization: Bearer <token_for_org_admin>
```

Removes user 5 from current tenant.

---

## Permission Inheritance (Future)

Current state: Permissions are **static per role** (defined in code).

Future enhancement: **Dynamic permissions**
- Store permissions in database
- Allow org-admins to customize permissions for custom roles
- Enable feature flags (e.g., "ADVANCED_REPORTING")

---

## Defense in Depth

RBAC guards exist at multiple layers:

| Layer | Guard | Example |
|-------|-------|---------|
| **Controller** | `@PreAuthorize` | `@PostMapping"/projects"/@PreAuthorize("hasAuthority('PROJECT_WRITE')")` |
| **Service** | `@PreAuthorize` | Method-level guard on business logic |
| **Repository** | Query filtering | `findByIdAndTenantId()` ensures tenant isolation |
| **Entity** | `@PrePersist` hook | Auto-injects `tenant_id` |

This **layered approach** means:
- Even if controller guard fails, service guard catches it
- Even if SQL injection bypasses permissions, queries auto-filter by tenant_id
- Even if someone knows entity IDs, they can't cross-access tenants

---

## Testing RBAC

See `backend/src/test/java/com/saas/platform/security/`:

- `TenantIsolationTest.java` — Verify tenant boundaries
- `RolePermissionMapperTest.java` — Verify permission assignments

Run tests:
```bash
mvn test -Dtest=TenantIsolationTest,RolePermissionMapperTest
```

---

## Configuration

Custom role definitions and permissions can be added in:

1. **Backend:** `RolePermissionMapper.java` (static mappings)
2. **Database:** `role_permissions` table (dynamic mappings, future)
3. **JWT:** `JwtTokenProvider.java` (what gets included in token)

---

**See also:** [docs/architecture.md](architecture.md#rbac-role-based-access-control)
