# Backend Setup Guide

## ❌ Problem: Maven Not Installed

The backend needs Maven or Java to run, but Maven is not installed on your system.

## ✅ Solution: 3 Options

### Option 1: Use Your IDE (Easiest)

If you have **IntelliJ IDEA** or **Eclipse**:

1. Open the project folder: `D:\My projects\SAAS_application\backend`
2. Right-click on `SaasPlatformApplication.java`
3. Select **"Run"** or **"Debug"**

The IDE will handle everything automatically.

---

### Option 2: Install Maven (Recommended)

**Download Maven:**
1. Go to: https://maven.apache.org/download.cgi
2. Download `apache-maven-3.9.x-bin.zip`
3. Extract to `C:\Program Files\Maven`
4. Add to PATH: `C:\Program Files\Maven\bin`

**Then run:**
```bash
cd D:\My projects\SAAS_application\backend
mvn spring-boot:run
```

---

### Option 3: Use Maven Wrapper (If Available)

```bash
cd D:\My projects\SAAS_application\backend
.\mvnw.cmd spring-boot:run
```

---

## ⚠️ Before Running Backend:

**1. Configure Database** in `src/main/resources/application.yml`:

Replace ALL `_` with real values:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/saas_platform
    username: root
    password: your_mysql_password
  data:
    mongodb:
      uri: mongodb://localhost:27017/saas_analytics
      database: saas_analytics
jwt:
  secret: super-secret-key-change-this
```

**2. Have MySQL Running** on port 3306

**3. Have MongoDB Running** on port 27017 (optional for basic functionality)

---

## 🎯 What I Recommend:

Since you don't have Maven installed, **use an IDE like IntelliJ IDEA Community Edition** (it's free and has built-in Maven support).

**Download IntelliJ IDEA:**
https://www.jetbrains.com/idea/download/

Then:
1. Open IntelliJ
2. File → Open → Select `D:\My projects\SAAS_application\backend`
3. Wait for Maven to sync
4. Run `SaasPlatformApplication.java`

---

**Current Status:**
- ✅ Frontend running on http://localhost:3000
- ❌ Backend not running (needs Maven or IDE)
- ❌ Database not configured yet
