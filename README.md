# 🚀 TeamX — Multi-Tenant Project Management SaaS Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**TeamX** is a full-stack, enterprise-grade, multi-tenant B2B SaaS application built for modern organizations requiring secure project tracking, dynamic Kanban workflows, role-based access control (RBAC), team analytics, and strict row-level tenant data isolation.

---

## 🌟 Key Features

### 🏢 Enterprise Multi-Tenancy
- **Logical Tenant Isolation**: Single database shared across organizations with strict row-level security (`tenant_id` scoping) at entity, repository, and service layers.
- **Multi-Tenant User Memberships**: Users can belong to multiple organizations with distinct roles per tenant.
- **Dynamic Tenant Switching**: Instant context switching without requiring full re-authentication.

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **JWT Authentication**: Stateless, tenant-aware JSON Web Token generation with access & refresh token lifecycle.
- **Fine-Grained Permissions**: 3 core roles (`ORG_ADMIN`, `MANAGER`, `USER`) mapping to 13 discrete action permissions.
- **Dual-Layer Security Guard**: Access enforcement at API controllers via `@PreAuthorize` and at the service/database layer.

### 📋 Project & Task Management
- **Kanban Board Workflows**: Interactive task status tracking (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`).
- **Rich Task Metadata**: Priority indicators (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due dates, assignees, and file attachments via Cloudinary integration.
- **Scoped Search & Filtering**: Instant search across projects, task titles, assignee filters, and status criteria.

### 📊 Analytics & Organization Management
- **Dashboard & Productivity Insights**: Real-time project completion stats, workload breakdown, and user activity timelines.
- **Member & Invite System**: Admin user management, role modification, email invitation workflows via SendGrid, and member revocation.
- **Activity Auditing**: Scoped logs tracking project updates, task state transitions, and administrative events.

---

## 📐 Architecture Overview

### Multi-Tenancy Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             HTTP Client / React UI           │
                               └──────────────────────┬───────────────────────┘
                                                      │ Bearer JWT (contains tenant_id)
                                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Spring Boot Backend Layer                                       │
│                                                                                                        │
│   ┌──────────────────────┐        ┌──────────────────────┐        ┌─────────────────────────────┐   │
│   │     TenantFilter     ├───────►│    SecurityContext   ├───────►│  @PreAuthorize Guards       │   │
│   │ Extract & Set Context│        │  Inject Authorities  │        │ (PROJECT_READ, TASK_WRITE...)│   │
│   └──────────────────────┘        └──────────────────────┘        └──────────────┬──────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┼─────────────────────┘
                                                                                   │
                                                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Database Row-Level Isolation                                    │
│                                                                                                        │
│  MySQL Database (saas_platform)                                                                        │
│  ├── tenants        (id, name, created_at)                                                             │
│  ├── users          (id, email, password_hash)                                                         │
│  ├── user_tenants   (user_id, tenant_id, role)  <-- N:M Membership & Role Mapping                     │
│  ├── projects       (id, tenant_id, name, status, owner_id)                                            │
│  └── tasks          (id, tenant_id, project_id, title, status, priority, assigned_to)                   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### RBAC Permission Matrix

| Action / Resource | Permission | `ORG_ADMIN` | `MANAGER` | `USER` |
| :--- | :--- | :---: | :---: | :---: |
| View Projects | `PROJECT_READ` | ✅ | ✅ | ✅ |
| Create / Edit Projects | `PROJECT_WRITE` | ✅ | ✅ | ❌ |
| View Tasks | `TASK_READ` | ✅ | ✅ | ✅ |
| Create / Edit Tasks | `TASK_WRITE` | ✅ | ✅ | ✅ |
| Assign Tasks | `TASK_ASSIGN` | ✅ | ✅ | ❌ |
| Manage Organization Users | `USER_MANAGE` | ✅ | ❌ | ❌ |
| Organization Settings | `TENANT_SETTINGS` | ✅ | ❌ | ❌ |

---

## 📁 Repository Structure

```
TeamX/
├── backend/                         # Spring Boot 3.4 REST API Service (Java 21)
│   ├── src/main/java/com/saas/platform/
│   │   ├── config/                  # Security, Web CORS & Flyway configurations
│   │   ├── controller/              # Auth, Project, Task, Tenant & Admin Controllers
│   │   ├── dto/                     # Request/Response Data Transfer Objects
│   │   ├── entity/                  # JPA Domain Entities (TenantAwareEntity base)
│   │   ├── repository/              # Spring Data JPA Repositories (Tenant-scoped)
│   │   ├── security/                # JWT Provider, Tenant Filter & Security Utils
│   │   └── service/                 # Core Business Logic & Isolation Enforcement
│   ├── src/main/resources/
│   │   ├── db/migration/            # Flyway SQL Migration scripts
│   │   └── application.yml          # Spring environment config
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                        # Next.js 14 / React 18 SPA UI (TypeScript)
│   ├── src/
│   │   ├── app/                     # Next.js App Router entry points
│   │   ├── components/              # Layout, TaskModal, ProjectCard, UI components
│   │   ├── contexts/                # AuthContext provider
│   │   ├── services/                # Axios API client services
│   │   ├── styles/                  # Tailwind CSS & custom styling
│   │   └── views/                   # Dashboard, Login, Register, Projects, Teams views
│   ├── Dockerfile
│   └── package.json
├── config/                          # Environment configuration templates (dev, prod, test)
├── docs/                            # Comprehensive System Documentation
│   ├── architecture.md              # Multi-tenant DB & Security Architecture
│   ├── api-reference.md             # REST API endpoint specifications
│   ├── rbac.md                      # Role & Permission matrix guide
│   ├── setup-guide.md               # Step-by-step developer setup guide
│   └── deployment.md                # Production deployment guidelines
├── scripts/                         # Powershell helper startup scripts
└── docker-compose.yml               # Multi-container local deployment spec
```

---

## 💻 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Three.js / React Three Fiber.
- **Backend**: Java 21, Spring Boot 3.4, Spring Security 6, Spring Data JPA, Hibernate, MapStruct, Lombok, JWT (`jjwt`).
- **Database**: MySQL 8.0 (Relational / Row-Level Multi-Tenancy), MongoDB 5.0 (Audit / Unstructured Data), Flyway Database Migrations.
- **Cloud Integrations**: Cloudinary (Task Attachment Storage), SendGrid (Email Invitations).
- **Containerization & Tooling**: Docker, Docker Compose, Maven.

---

## ⚡ Quick Start

### Prerequisites
Ensure you have the following installed on your machine:
- **Java JDK 21+**
- **Node.js 18+** & **npm 9+**
- **Maven 3.8+**
- **MySQL 8.0+** & **MongoDB 5.0+** (or Docker)

---

### Option A: Using Docker Compose (Recommended)

To spin up the entire application stack (MySQL, MongoDB, Backend, Frontend) with a single command:

```bash
docker-compose up --build
```

Access the services:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

---

### Option B: Local Manual Setup

#### 1. Database Setup (MySQL)
Create the database and service user:
```sql
CREATE DATABASE saas_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'saas_user'@'localhost' IDENTIFIED BY 'saas_password';
GRANT ALL PRIVILEGES ON saas_platform.* TO 'saas_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Start Backend Service
```bash
cd backend
mvn clean spring-boot:run
```
The backend server will automatically run Flyway migrations and seed demo data on initial startup at `http://localhost:8080/api/v1`.

#### 3. Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The client dashboard will start at `http://localhost:3000`.

---

## 🔑 Demo Login Credentials

Upon initial database seeding, you can log in with the default administrator account:

- **Email**: `admin@test.com`
- **Password**: `password123`
- **Default Tenant**: `Test Organization`

---

## 🌐 API Overview

| Method | Endpoint | Description | Permission Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & receive JWT token | Public |
| `POST` | `/api/v1/auth/tenant-switch` | Switch active tenant context | Authenticated |
| `GET` | `/api/v1/projects` | List projects for active tenant | `PROJECT_READ` |
| `POST` | `/api/v1/projects` | Create project under active tenant | `PROJECT_WRITE` |
| `GET` | `/api/v1/projects/{id}/tasks` | List tasks for specific project | `TASK_READ` |
| `POST` | `/api/v1/projects/{id}/tasks` | Create task under project | `TASK_WRITE` |
| `GET` | `/api/v1/admin/users` | List tenant members | `USER_MANAGE` |
| `POST` | `/api/v1/admin/users/assign` | Assign user to tenant with role | `USER_MANAGE` |

*For complete endpoint request/response payloads, refer to [`docs/api-reference.md`](docs/api-reference.md).*

---

## ⚙️ Environment Variables

### Backend Configuration ([`backend/src/main/resources/application.yml`](backend/src/main/resources/application.yml))

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/saas_platform` | MySQL connection JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `saas_user` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | `saas_password` | Database password |
| `MONGODB_URI` | `mongodb://localhost:27017/saas_logs` | MongoDB connection string |
| `JWT_SECRET` | *(Random 256-bit string)* | Secret key for JWT signing |
| `CLOUDINARY_URL` | `cloudinary://...` | Cloudinary API credentials |

### Frontend Configuration ([`frontend/.env.local`](frontend/.env.local))

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/api/v1` | Backend API base URL |

---

## 🧪 Testing & Code Quality

### Run Backend Unit & Integration Tests
```bash
cd backend
mvn test
```

### Run Coverage Reports (Jacoco)
```bash
cd backend
mvn clean test jacoco:report
# View report in backend/target/site/jacoco/index.html
```

### Run Frontend Typecheck & Linter
```bash
cd frontend
npm run lint
```

---

## 📚 Documentation Links

- 📖 [Architecture & Multi-Tenancy Specification](docs/architecture.md)
- 🔌 [API Reference Guide](docs/api-reference.md)
- 🔐 [Role-Based Access Control (RBAC) Design](docs/rbac.md)
- 🛠️ [Detailed Developer Setup Guide](docs/setup-guide.md)
- 🚀 [Production Deployment Guide](docs/deployment.md)

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
