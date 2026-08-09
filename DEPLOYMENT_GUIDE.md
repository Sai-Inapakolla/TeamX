# 🚀 TeamX — Azure App Service & Production Deployment Guide

This guide provides step-by-step instructions for deploying **TeamX** to **Microsoft Azure App Service** with **Azure SQL Database** (or PaaS/Docker alternatives).

---

## 📑 Architecture Overview

```
                   TeamX SaaS Platform
                            │
       ┌────────────────────┴────────────────────┐
       │                                         │
       ▼                                         ▼
Frontend App Service                      Backend App Service
  (Node 18 / Next.js 14)                   (Java 21 / Spring Boot)
       │                                         │
       │                                         ▼
       │                                Azure SQL Database
       │                                  (teamX DB)
       └────────────── HTTPS API ────────────────┘
```

---

## 🛠️ Pre-Deployment Fixes (Applied)

- [x] **Backend Java Runtime Mismatch**: Fixed `backend/Dockerfile` to use **Java 21** (`eclipse-temurin:21-jre-alpine`) matching Maven `pom.xml`.
- [x] **Frontend Production Start Script**: Updated `frontend/package.json` `"start"` script to `"next start -p 3000"`.
- [x] **Frontend Dockerfile**: Updated `frontend/Dockerfile` to a multi-stage **Next.js 14** production build.
- [x] **Azure SQL & Driver Support**: Enabled `SPRING_DATASOURCE_DRIVER_CLASS_NAME` and `SPRING_JPA_DATABASE_PLATFORM` environment variables in `application-prod.yml`.

---

## 🚀 Azure App Service Step-by-Step Deployment

### STEP 1: Provision Azure SQL Database
1. Go to the **Azure Portal** → Search for **SQL Databases** → Click **Create**.
2. Set Database Name: `teamX`.
3. Under Compute + Storage, select **Serverless / Basic (Free/Student Tier)**.
4. Set Server Admin Login: `TeamX-Admin`.
5. Set a strong password (e.g. `Your_Secure_Azure_Password_2026!`).
6. Under **Networking**, enable **"Allow Azure services and resources to access this server"**.

---

### STEP 2: Deploy Backend App Service (Spring Boot / Java 21)
1. Go to **Azure Portal** → **App Services** → Click **Create** → **Web App**.
2. Select Runtime Stack: **Java 21** (Java SE) / Tomcat or Docker Container.
3. App Name: `teamx-backend-api` (URL: `https://teamx-backend-api.azurewebsites.net`).
4. Select Operating System: **Linux**.
5. Select App Service Plan (Free / F1 or B1 Basic).
6. Click **Review + Create** → **Create**.

#### Configure Backend Environment Variables:
Go to `teamx-backend-api` → **Configuration** → **Application settings** → Add the following keys:

| Environment Variable Key | Example Production Value |
| :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:sqlserver://your-server.database.windows.net:1433;database=teamX;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;` |
| `SPRING_DATASOURCE_USERNAME` | `TeamX-Admin@your-server` |
| `SPRING_DATASOURCE_PASSWORD` | `Your_Secure_Azure_Password_2026!` |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | `com.microsoft.sqlserver.jdbc.SQLServerDriver` |
| `SPRING_JPA_DATABASE_PLATFORM` | `org.hibernate.dialect.SQLServerDialect` |
| `JWT_SECRET` | *(Generate 32+ character random string)* |
| `CORS_ALLOWED_ORIGINS` | `https://teamx-frontend.azurewebsites.net` |

---

### STEP 3: Deploy Frontend App Service (Next.js 14 / Node 18)
1. Go to **Azure Portal** → **App Services** → Click **Create** → **Web App**.
2. Select Runtime Stack: **Node 18 LTS** or **Node 20 LTS**.
3. App Name: `teamx-frontend` (URL: `https://teamx-frontend.azurewebsites.net`).
4. Select Operating System: **Linux**.
5. Click **Review + Create** → **Create**.

#### Configure Frontend Environment Variable:
Go to `teamx-frontend` → **Configuration** → **Application settings** → Add:

| Environment Variable Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://teamx-backend-api.azurewebsites.net/api/v1` |

---

### STEP 4: Configure Firewall & CORS Integration
1. In `teamx-backend-api` settings, copy your Backend **Outbound IP addresses**.
2. Go to **Azure SQL Server** → **Networking** → **Firewall rules** → Add Backend Outbound IPs.
3. Update `CORS_ALLOWED_ORIGINS` in backend settings to match your frontend domain: `https://teamx-frontend.azurewebsites.net`.

---

## 🧪 Post-Deployment Health Verification

Test the backend health check endpoint:
```bash
curl -X POST https://teamx-backend-api.azurewebsites.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}'
```

Expected Output:
```json
{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": 1, "email": "admin@test.com" }
}
```
