# RBAC & Multi-Tenancy Architecture

## Multi-Tenancy Model

### Shared Database, Logical Isolation (Row-Level Security)

All tenants share the same MySQL database but are isolated at the row level using `tenant_id`:

```
┌─────────────────────────────────────┐
│         MySQL Database              │
├─────────────────────────────────────┤
│  tenants                            │
│  ├─ id=1 (Tenant A)                │
│  ├─ id=2 (Tenant B)                │
│                                     │
│  users (NOT tenant-aware)          │
│  ├─ id=1 (John)                    │
│  ├─ id=2 (Jane)                    │
│                                     │
│  user_tenants (N:M mapping)        │
│  ├─ user_id=1, tenant_id=1, role=ORG_ADMIN
│  ├─ user_id=1, tenant_id=2, role=USER
│  ├─ user_id=2, tenant_id=1, role=MANAGER
│                                     │
│  projects (tenant-aware)            │
│  ├─ id=101, tenant_id=1, ...       │
│  ├─ id=102, tenant_id=2, ...       │
│                                     │
│  tasks (tenant-aware)               │
│  ├─ id=201, tenant_id=1, ...       │
│  ├─ id=202, tenant_id=2, ...       │
└─────────────────────────────────────┘
```

### Isolation Enforcement

1. **JWT Token** includes `tenant_id` claim
2. **TenantFilter** extracts tenant from JWT → sets `TenantContext`
3. **TenantAwareEntity** auto-injects `tenant_id` on save via `@PrePersist`
4. **Repositories** all query by `tenant_id` (e.g., `findByTenantIdAndProjectId()`)
5. **@PostLoad** hook throws exception if entity's `tenant_id` ≠ current tenant

**Result:** User cannot cross-read/write to another tenant's data even if they know the ID.

---

## RBAC (Role-Based Access Control)

### Role Hierarchy

```
ORG_ADMIN (7 permissions)
├── PROJECT_READ, PROJECT_WRITE
├── TASK_READ, TASK_WRITE, TASK_ASSIGN
├── USER_MANAGE, TENANT_SETTINGS

MANAGER (5 permissions)
├── PROJECT_READ, PROJECT_WRITE
├── TASK_READ, TASK_WRITE, TASK_ASSIGN

USER (3 permissions)
├── PROJECT_READ
├── TASK_READ, TASK_WRITE
```

### Authentication Flow

```
1. User logs in
   POST /auth/login { email, password }
   
2. AuthService authenticates
   - Verify password (BCrypt)
   - Get user's tenants (user_tenants join)
   - For first tenant, fetch role-permission mapping
   
3. JwtTokenProvider generates token
   {
     "sub": "1",                    // userId
     "email": "user@company.com",
     "tenant_id": 1,
     "role": "ORG_ADMIN",
     "permissions": ["PROJECT_READ", "PROJECT_WRITE", ...]
   }
   
4. Frontend stores token in localStorage
```

### Authorization Flow

```
1. Authenticated request arrives
   GET /projects
   Header: Authorization: Bearer <jwt_token>

2. TenantFilter
   - Extract token from header
   - Validate signature
   - Get tenant_id from token
   - TenantContext.setCurrentTenantId(tenantId)

3. JwtAuthenticationFilter
   - Get userId, role, permissions from token
   - Create Spring Authentication with authorities:
     - Add "ROLE_ORG_ADMIN"
     - Add "PROJECT_READ", "PROJECT_WRITE", etc.
   - Set in SecurityContextHolder

4. Endpoint guard @PreAuthorize
   @GetMapping
   @PreAuthorize("hasAuthority('PROJECT_READ')")
   public List<ProjectDTO> getAllProjects()

5. Service-layer guard (defense in depth)
   @Service
   @PreAuthorize("hasAuthority('PROJECT_READ')")
   public List<ProjectDTO> getAllProjects()
   
6. Query execution
   - ProjectService calls: projectRepository.findAllByTenantId(tenantId)
   - TenantContext.getCurrentTenantId() returns tenant_id
   - Query filters by tenant_id automatically

Result: User can only access projects in their current tenant with proper permissions
```

### Tenant Switching (Multi-Tenant User)

User belongs to multiple tenants:

```
1. User logs in
   → Gets token for tenant_id=1 (first in list)
   
2. User wants to switch to tenant_id=2
   POST /auth/tenant-switch { tenantId: 2 }
   
3. AuthService checks:
   - userBelongsToTenant(userId, tenantId=2)?
   - If yes, generate new token with tenant_id=2
   
4. Frontend receives new token
   - localStorage.setItem('accessToken', newToken)
   - All subsequent requests use new tenant context
```

---

## Data Flow Example

### Create a Project (With RBAC & Tenancy)

```
1. Frontend
   POST /api/v1/projects
   {
     "name": "Q1 Planning",
     "description": "..."
   }
   Headers: { Authorization: Bearer <jwt_with_tenant_id=1> }

2. TenantFilter
   - Extracts tenant_id=1 from JWT
   - TenantContext.setCurrentTenantId(1)

3. JwtAuthenticationFilter
   - Gets userId=42, role=MANAGER, permissions=[PROJECT_READ, PROJECT_WRITE, ...]
   - SecurityContext.setAuthentication(...)

4. ProjectController
   @PostMapping
   @PreAuthorize("hasAuthority('PROJECT_WRITE')")
   public ResponseEntity<ProjectDTO> createProject(ProjectDTO dto)
   
   ✅ Check passes (user has PROJECT_WRITE permission)

5. ProjectService.createProject()
   @PreAuthorize("hasAuthority('PROJECT_WRITE')")
   - Gets current userId: SecurityUtils.getCurrentUserId() → 42
   - Gets current tenantId: TenantContext.getCurrentTenantId() → 1
   - Builds Project entity:
     {
       id: null,
       tenantId: 1,
       name: "Q1 Planning",
       createdBy: 42,
       ...
     }

6. ProjectRepository.save(project)
   - JPA calls @PrePersist on TenantAwareEntity
   - If tenantId == null: tenantId = TenantContext.getCurrentTenantId() → 1
   - INSERT into projects (tenant_id=1, name, created_by=42, ...)

7. Database
   INSERT INTO projects (id, tenant_id, name, created_by, ...)
   VALUES (NULL, 1, 'Q1 Planning', 42, ...)

8. Response
   {
     "id": 101,
     "name": "Q1 Planning",
     "status": "ACTIVE",
     "createdAt": "2026-03-25T..."
   }
```

### Tenant Isolation Verification

Tenant A user tries to read Tenant B's project:

```
1. Tenant A user (tenant_id=1) gets token with tenant_id=1
2. POST to /projects with authorization header
3. TenantFilter sets TenantContext.currentTenant = 1
4. ProjectService calls: projectRepository.findAllByTenantId(1)
5. Returns only projects where tenant_id=1
6. Tenant B projects (tenant_id=2) NOT in results

Even if user manually tries: /projects/102 (Tenant B project)
- ProjectService calls: projectRepository.findByIdAndTenantId(102, 1)
- Query: SELECT * FROM projects WHERE id=102 AND tenant_id=1
- Returns 0 rows (id=102 exists but tenant_id=2)
- ServiceLayer throws 404

✅ Tenant isolation enforced at DB level
```

---

## Permission Matrix

| Permission | ORG_ADMIN | MANAGER | USER |
|-----------|-----------|---------|------|
| PROJECT_READ | ✅ | ✅ | ✅ |
| PROJECT_WRITE | ✅ | ✅ | ❌ |
| TASK_READ | ✅ | ✅ | ✅ |
| TASK_WRITE | ✅ | ✅ | ✅ |
| TASK_ASSIGN | ✅ | ✅ | ❌ |
| USER_MANAGE | ✅ | ❌ | ❌ |
| TENANT_SETTINGS | ✅ | ❌ | ❌ |

---

## Key Classes

- **TenantContext** — ThreadLocal storage of current tenant_id
- **TenantFilter** — Extracts tenant from JWT, sets context
- **TenantAwareEntity** — Base for tenant-isolated entities
- **RolePermissionMapper** — Static role → permissions mapping
- **RolePermissionRepository** — DB-backed role-permission queries
- **SecurityUtils** — Extract current user from SecurityContext
- **AdminService** — User-tenant assignment & management
