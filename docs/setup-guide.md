# Setup Guide

## 📋 Prerequisites

- **Java 21+** — [Download](https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **Python 3.11+** — [Download](https://www.python.org/)
- **Maven 3.8+** — [Download](https://maven.apache.org/)
- **MySQL 8.0+** — [Download](https://dev.mysql.com/downloads/)
- **Docker (optional)** — [Download](https://www.docker.com/)

---

## 🗄️ Database Setup

### MySQL

```bash
# Create database
mysql -u root -p
> CREATE DATABASE saas_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'saas_user'@'localhost' IDENTIFIED BY 'saas_password';
> GRANT ALL PRIVILEGES ON saas_platform.* TO 'saas_user'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;
```

Verify:
```bash
mysql -u saas_user -p saas_platform
> SHOW TABLES;
> EXIT;
```

---

## ⚙️ Configuration

### Step 1: Backend Configuration

Edit [`backend/src/main/resources/application.yml`](../backend/src/main/resources/application.yml):

```yaml
spring:
  application:
    name: saas-platform

  datasource:
    url: jdbc:mysql://localhost:3306/saas_platform
    username: saas_user
    password: saas_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    database-platform: org.hibernate.dialect.MySQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration

jwt:
  secret: your-super-secret-jwt-key-min-32-chars!!!!!
  expiration: 900000
  refresh-expiration: 604800000

server:
  port: 8080
  servlet:
    context-path: /api/v1

cors:
  allowed-origins: http://localhost:3000
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS
```

### Step 2: Frontend Configuration

Frontend automatically connects to `http://localhost:8080/api/v1` during development.

For production, update [`frontend/src/services/api.ts`](../frontend/src/services/api.ts):

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';
```

Set environment variable:
```bash
export REACT_APP_API_URL=https://api.yourdomain.com
```

---

## 🚀 Running Locally

### Development Mode

**Terminal 1 — Backend:**
```bash
cd backend
mvn clean spring-boot:run
```

Backend runs on: http://localhost:8080/api/v1

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install  # First time only
npm start
```

Frontend runs on: http://localhost:3000

**Terminal 3 — ML Service (optional):**
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

ML Service runs on: http://localhost:5000

### Test Login

```
Email: admin@test.com
Password: password123
Tenant: Test Organization
```

---

## 🐳 Running with Docker

### Build All Services

```bash
docker-compose up --build
```

Services start on:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080/api/v1
- ML Service: http://localhost:5000
- MySQL: localhost:3306
- MongoDB: localhost:27017

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## ✅ Verification

### 1. Check Backend Health

```bash
curl http://localhost:8080/api/v1/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}'
```

Expected response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "...",
  "user": { "id": 1, "email": "admin@test.com", ... },
  "tenants": [{ "id": 1, "name": "Test Organization", "role": "ORG_ADMIN" }]
}
```

### 2. Check Frontend

Open http://localhost:3000 in browser → you should see the login page

### 3. Login & Test

1. Enter credentials: `admin@test.com` / `password123`
2. Click "Login"
3. You should see the Dashboard with projects

---

## 🧪 Running Tests

### Backend Unit Tests

```bash
cd backend
mvn test
```

### Specific Test Class

```bash
mvn test -Dtest=TenantIsolationTest
mvn test -Dtest=RolePermissionMapperTest
```

### With Coverage

```bash
mvn clean test jacoco:report
# Open target/site/jacoco/index.html
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🔧 Troubleshooting

### Backend fails to start

**Error:** `Connection refused to MySQL`

**Solution:**
```bash
# Verify MySQL is running
mysql -u root -p -e "SELECT 1" 

# Or check port
netstat -an | grep 3306
```

**Error:** `Port 8080 already in use`

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill it
kill -9 <PID>
```

### Frontend can't connect to backend

**Error:** `CORS error or 404 in API calls`

**Solution:**
1. Ensure backend is running on http://localhost:8080
2. Check `SecurityConfig.java` CORS settings
3. Verify frontend is using correct API URL

### Database schema not created

**Error:** `Table 'saas_platform.users' doesn't exist`

**Solution:**
```bash
# Flyway will auto-create on first startup, but if it fails:
cd backend
mvn flyway:migrate -Dflyway.configFiles=src/main/resources/application.yml
```

---

## 📚 Next Steps

1. Read [docs/rbac.md](rbac.md) for permission system details
2. Read [docs/api-reference.md](api-reference.md) for API documentation
3. For production, see [docs/deployment.md](deployment.md)
