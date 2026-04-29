# Quick Start Guide

## ✅ Frontend Setup Complete!

The npm dependencies have been successfully installed.

## 🚀 Run the Application

### Start Frontend Development Server

```bash
cd D:\My projects\SAAS_application\frontend
npm start
```

This will start the React development server on **http://localhost:3000**

---

## 📝 Before You Start

### 1. Configure Database Connections

Replace `_` placeholders in these files with your actual database credentials:

**Backend Configuration** (`backend/src/main/resources/application.yml`):
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/saas_platform
    username: your_mysql_username
    password: your_mysql_password
  data:
    mongodb:
      uri: mongodb://localhost:27017/saas_analytics
      database: saas_analytics

jwt:
  secret: your-super-secret-jwt-key-change-this-in-production
```

### 2. Create Databases

**MySQL**:
```sql
CREATE DATABASE saas_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**MongoDB**:
```javascript
use saas_analytics;
```

### 3. Run Database Migrations

Execute the SQL DDL from the design document to create tables. See:
`C:\Users\Lenovo\.gemini\antigravity\brain\...\database_design.md`

---

## 🏃 Start All Services

### Option 1: Manual Start (Recommended for Development)

**Terminal 1 - Backend**:
```bash
cd D:\My projects\SAAS_application\backend
mvn spring-boot:run
```
Backend runs on: http://localhost:8080

**Terminal 2 - Frontend**:
```bash
cd D:\My projects\SAAS_application\frontend
npm start
```
Frontend runs on: http://localhost:3000

**Terminal 3 - ML Service** (Optional):
```bash
cd D:\My projects\SAAS_application\ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
ML Service runs on: http://localhost:5000

### Option 2: Docker (Full Stack)

After configuring database credentials in `docker-compose.yml`:

```bash
cd D:\My projects\SAAS_application
docker-compose up --build
```

---

## 🧪 Test the Application

1. **Build Backend First** (to generate JAR):
```bash
cd backend
mvn clean package -DskipTests
```

2. **Start Backend**:
```bash
mvn spring-boot:run
```

3. **In another terminal, start Frontend**:
```bash
cd frontend
npm start
```

4. **Open browser**: http://localhost:3000

---

## 🔧 Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running on port 8080
- Check CORS settings in `SecurityConfig.java`
- Verify database connections

### "Login fails"
- Create a test user in MySQL database
- Ensure password is BCrypt hashed
- Check JWT configuration

### "Port already in use"
- Backend (8080): Change in `application.yml`
- Frontend (3000): React will offer alternative port

---

## 📚 Next Steps

1. ✅ **Dependencies installed** - Frontend is ready
2. ⏳ **Configure databases** - Replace `_` placeholders
3. ⏳ **Create database schema** - Run SQL scripts
4. ⏳ **Create test data** - Insert a test tenant and user
5. ⏳ **Start backend** - Run Spring Boot
6. ⏳ **Start frontend** - Run React app
7. ⏳ **Test login** - Access http://localhost:3000

---

**Current Status**: ✅ Frontend ready to run with `npm start`
