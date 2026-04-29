# Project Structure Reference

This file is a quick navigation map of the current project.

## Top-level folders

SAAS_application/
- backend: Spring Boot API
- frontend: React app
- ml-service: Python service
- docs: setup and architecture docs
- config: environment config templates
- scripts: local run scripts
- docker-compose.yml: local multi-service orchestration

## Backend map

backend/src/main/java/com/saas/platform/
- config: app and security configuration
- controller: API endpoints
- service: business logic
- repository: database access
- entity: JPA models
- dto: API request/response objects
- security: JWT, tenant context, permission helpers

backend/src/main/resources/
- application.yml
- db/migration/

## Frontend map

frontend/src/
- pages: screens
- services: API calls
- contexts: auth/session state
- styles: CSS
- App.tsx and index.tsx: app bootstrap and routing

## Scripts map

scripts/
- start-backend.ps1
- start-frontend.ps1
- start-ml-service.ps1

## Where to edit what

- Add/change API route: backend/src/main/java/com/saas/platform/controller/
- Change business rules: backend/src/main/java/com/saas/platform/service/
- Change DB query: backend/src/main/java/com/saas/platform/repository/
- Change JWT/tenant behavior: backend/src/main/java/com/saas/platform/security/
- Change UI page: frontend/src/pages/
- Change frontend API integration: frontend/src/services/

## Why com/saas/platform exists

This is Java package naming (namespace), not unnecessary folders.

- com: domain root
- saas: organization/product namespace
- platform: application namespace

Then subfolders split responsibilities to keep the code maintainable as it grows.
