# TeamX - Multi-Tenant Project Management SaaS

TeamX is a multi-tenant project management SaaS for organizations that need secure project tracking, Kanban task management, role-based access, and clean tenant isolation.

## Features

- Multi-tenancy with tenant-scoped projects, tasks, and users
- JWT authentication with tenant-aware login
- RBAC with 3 roles and 13 permissions
- Kanban board for task workflow
- User management with invite, role update, and remove actions
- Organization settings for tenant details and members
- Activity logs for project, task, and user events
- Basic notifications for assignments and recent updates
- Project search, task status filters, and assignee filters
- Loading, error, and empty states across core pages

## Screenshots

Add screenshots from the running app in this section before sharing the project publicly.

## Architecture

- Frontend: React 18 + TypeScript
- Backend: Spring Boot + MySQL + MongoDB
- ML Service: Python FastAPI
- Multi-Tenancy: Shared database with logical tenant isolation
- Auth: JWT + Spring Security + RBAC

## Why this many folders in main/java/com/saas/platform?

The path backend/src/main/java/com/saas/platform is normal Java package structure, not extra random folders.

- com/saas/platform: package namespace (like company.domain.app)
- config: security and app configuration
- controller: REST endpoints
- service: business logic
- repository: database access layer
- entity: JPA domain models
- dto: request and response models
- security: JWT, filters, tenant context

This structure keeps code clean as the app grows. If everything is in one folder, maintenance becomes difficult quickly.

Think of it as 2 levels:

- Level 1: package namespace (com/saas/platform)
- Level 2: responsibility folders (controller, service, repository, etc.)

## Where should I edit?

- Login/auth endpoint logic: backend/src/main/java/com/saas/platform/controller/AuthController.java and backend/src/main/java/com/saas/platform/service/AuthService.java
- Project APIs and rules: backend/src/main/java/com/saas/platform/controller/ProjectController.java and backend/src/main/java/com/saas/platform/service/ProjectService.java
- Task APIs and rules: backend/src/main/java/com/saas/platform/controller/TaskController.java and backend/src/main/java/com/saas/platform/service/TaskService.java
- Admin role assignment: backend/src/main/java/com/saas/platform/controller/AdminController.java and backend/src/main/java/com/saas/platform/service/AdminService.java
- JWT/tenant security flow: backend/src/main/java/com/saas/platform/security/
- DB queries: backend/src/main/java/com/saas/platform/repository/
- Data models: backend/src/main/java/com/saas/platform/entity/
- Frontend pages: frontend/src/pages/
- Frontend API calls: frontend/src/services/

## Project Structure

SAAS_application/
- backend/
   - src/main/java/com/saas/platform/
      - config/
      - controller/
      - service/
      - repository/
      - entity/
      - dto/
      - security/
   - src/main/resources/application.yml
   - pom.xml
- frontend/
   - src/
      - contexts/
      - pages/
      - services/
      - styles/
   - package.json
- ml-service/
   - main.py
   - requirements.txt
- docs/
   - architecture.md
   - setup-guide.md
   - api-reference.md
   - rbac.md
   - deployment.md
- config/
- scripts/
- docker-compose.yml

## Quick Start

Prerequisites:
- Java 21+
- Node.js 18+
- Python 3.11+
- Maven 3.8+

Run locally:
- Backend: go to backend and run mvn spring-boot:run
- Frontend: go to frontend and run npm install, then npm start
- ML service: go to ml-service and run python main.py

## Documentation

- docs/setup-guide.md
- docs/architecture.md
- docs/api-reference.md
- docs/rbac.md
- docs/deployment.md

Status: RBAC and tenant isolation implemented. Production hardening in progress.
