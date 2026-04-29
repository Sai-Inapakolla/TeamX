# Deployment Guide

## Production Deployment

This guide covers deploying to production with MySQL, environment-specific configs, and Docker.

### Prerequisites

- Docker & Docker Compose
- MySQL 8.0+ (managed hosting or self-hosted)
- Redis (optional, for caching/sessions)
- SSL certificate (for HTTPS)

---

## Environment Configuration

### 1. Create Production Config

Create `config/application-prod.yml`:

```yaml
spring:
  application:
    name: saas-platform

  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: validate  # Don't auto-update in prod
    show-sql: false
    database-platform: org.hibernate.dialect.MySQLDialect

  flyway:
    enabled: true
    locations: classpath:db/migration

  security:
    cors:
      allowed-origins: ${CORS_ALLOWED_ORIGINS}
      allowed-methods: GET,POST,PUT,DELETE,OPTIONS

jwt:
  secret: ${JWT_SECRET}  # Min 32 chars, secure random
  expiration: 900000     # 15 minutes
  refresh-expiration: 604800000  # 7 days

server:
  port: 8080
  servlet:
    context-path: /api/v1
  error:
    include-message: never  # Don't expose stack traces
    include-stacktrace: never

logging:
  level:
    root: WARN
    com.saas.platform: INFO
  file:
    name: /var/log/saas-platform/app.log
    max-size: 10MB
    max-history: 30
```

### 2. Set Environment Variables

```bash
# Database
export DB_HOST=mysql.prod.example.com
export DB_PORT=3306
export DB_NAME=saas_platform_prod
export DB_USER=saas_prod_user
export DB_PASSWORD=<strong-password>

# JWT
export JWT_SECRET=<generate-32-char-random-secret>

# CORS
export CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Frontend
export REACT_APP_API_URL=https://api.yourdomain.com
```

Or store in `.env` file (and add to `.gitignore`):

```bash
# .env (git-ignored)
DB_HOST=mysql.prod.example.com
DB_PORT=3306
# ... etc
```

---

## Docker Deployment

### 1. Update docker-compose.yml for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: saas-mysql-prod
    environment:
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - saas-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: saas-backend-prod
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    depends_on:
      - mysql
    restart: always
    networks:
      - saas-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_URL: ${REACT_APP_API_URL}
    container_name: saas-frontend-prod
    restart: always
    networks:
      - saas-network
    ports:
      - "80:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:latest
    container_name: saas-nginx-prod
    restart: always
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
    networks:
      - saas-network

volumes:
  mysql-data:

networks:
  saas-network:
    driver: bridge
```

### 2. Create Nginx Config

Create `nginx.conf` for reverse proxy + SSL:

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api/v1 {
        proxy_pass http://backend:8080/api/v1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Deploy

```bash
# Load environment variables
export $(cat .env | xargs)

# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build backend Docker image
        run: |
          docker build -t saas-backend:latest ./backend
          docker tag saas-backend:latest myregistry.azurecr.io/saas-backend:latest
      
      - name: Build frontend Docker image
        run: |
          docker build -t saas-frontend:latest ./frontend
          docker tag saas-frontend:latest myregistry.azurecr.io/saas-frontend:latest
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.REGISTRY_USER }} -p ${{ secrets.REGISTRY_PASSWORD }} myregistry.azurecr.io
          docker push myregistry.azurecr.io/saas-backend:latest
          docker push myregistry.azurecr.io/saas-frontend:latest
      
      - name: Deploy to production
        run: |
          ssh deploy@prod.server.com "cd /app && docker-compose pull && docker-compose up -d"
```

---

## Database Migration

### First-Time Production Deployment

1. Create empty MySQL database
2. Run migrations via Flyway
3. Seed initial data

```bash
# Backend will auto-run Flyway on startup
docker-compose -f docker-compose.prod.yml up backend

# Verify schema created
docker exec saas-mysql-prod mysql -u $DB_USER -p $DB_PASSWORD $DB_NAME -e "SHOW TABLES;"
```

### Backup & Recovery

```bash
# Backup database
docker exec saas-mysql-prod mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i saas-mysql-prod mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < backup_20260325.sql
```

---

## Monitoring & Logging

### Health Check

```bash
curl https://api.yourdomain.com/health
```

### Logs

```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Persistent logs
tail -f /var/log/saas-platform/app.log
```

### Metrics (Future)

Plan to add:
- Prometheus for metrics scraping
- Grafana for dashboards
- ELK stack for centralized logging

---

## Troubleshooting

### Database Connection Failed

```bash
# Verify MySQL is accessible
docker exec saas-backend-prod curl mysql:3306
```

### Flyway Migration Failed

```bash
# Check migration status
docker exec saas-mysql-prod mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT * FROM flyway_schema_history;"

# Manually repair if needed
docker exec saas-mysql-prod mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "DELETE FROM flyway_schema_history WHERE success=0;"
```

---

**See also:** [docs/setup-guide.md](setup-guide.md), [docs/architecture.md](architecture.md)
