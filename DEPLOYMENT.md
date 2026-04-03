# Edgewise Deployment Guide

Complete guide for deploying Edgewise to production.

## 📋 Prerequisites

- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- Node.js 18+
- Python 3.11+
- Domain name (for production)
- SSL certificate (for production)

## 🚀 Quick Start (Local Development)

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/your-org/edgewise.git
cd edgewise

# Copy environment files
cp .env.example .env

# Update .env with your API keys
nano .env
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Initialize Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Load initial data (sports, markets, sportsbooks)
docker-compose exec backend python scripts/seed_data.py
```

### 4. Access Services

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Database: localhost:5432

## 🏗️ Production Deployment

### Option 1: Docker Deployment (Recommended)

#### 1. Build Production Images

```bash
# Backend
cd backend
docker build -t edgewise-backend:latest .

# Frontend
cd frontend
docker build -t edgewise-frontend:latest .
```

#### 2. Deploy to Container Registry

```bash
# Tag images
docker tag edgewise-backend:latest your-registry/edgewise-backend:latest
docker tag edgewise-frontend:latest your-registry/edgewise-frontend:latest

# Push to registry
docker push your-registry/edgewise-backend:latest
docker push your-registry/edgewise-frontend:latest
```

#### 3. Deploy with Docker Compose (Production)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: always
    networks:
      - edgewise-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always
    networks:
      - edgewise-network

  backend:
    image: your-registry/edgewise-backend:latest
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      SECRET_KEY: ${SECRET_KEY}
      DEBUG: false
    depends_on:
      - postgres
      - redis
    restart: always
    networks:
      - edgewise-network

  frontend:
    image: your-registry/edgewise-frontend:latest
    environment:
      VITE_API_URL: https://api.edgewise.app
    restart: always
    networks:
      - edgewise-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: always
    networks:
      - edgewise-network

volumes:
  postgres_data:
  redis_data:

networks:
  edgewise-network:
```

### Option 2: Railway Deployment

#### Backend

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Link to project
railway link

# Add environment variables via Railway dashboard
# Then deploy
railway up
```

#### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### Option 3: AWS Deployment

#### Infrastructure Setup (Terraform)

```hcl
# terraform/main.tf
provider "aws" {
  region = "us-east-1"
}

# ECS Cluster
resource "aws_ecs_cluster" "edgewise" {
  name = "edgewise-cluster"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "edgewise-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true
  
  db_name             = "edgewise"
  username            = var.db_username
  password            = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  skip_final_snapshot    = false
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "edgewise-redis"
  engine              = "redis"
  node_type           = "cache.t3.medium"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "edgewise-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
}
```

Deploy with Terraform:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 🔒 Security Configuration

### 1. Environment Variables

Never commit `.env` files. Use secret management:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name edgewise/prod/db-password \
  --secret-string "your-secure-password"

# Railway
railway variables set ANTHROPIC_API_KEY=your-key

# Vercel
vercel env add VITE_API_URL production
```

### 2. SSL/TLS Setup

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.edgewise.app;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. CORS Configuration

```python
# backend/app/core/config.py
ALLOWED_ORIGINS = [
    "https://edgewise.app",
    "https://www.edgewise.app",
    "https://app.edgewise.app"
]
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

```python
# backend/app/core/monitoring.py
from prometheus_client import Counter, Histogram
import logging

# Metrics
api_requests = Counter('api_requests_total', 'Total API requests')
api_latency = Histogram('api_request_duration_seconds', 'API latency')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### 2. Database Monitoring

```sql
-- Create monitoring views
CREATE VIEW active_connections AS
SELECT 
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE state = 'active') as active_queries,
    COUNT(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = 'edgewise';

-- Query performance
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. Log Aggregation (ELK Stack)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
```

## 🧪 Testing in Production

### 1. Smoke Tests

```bash
# Health check
curl https://api.edgewise.app/health

# API endpoint test
curl https://api.edgewise.app/api/v1/props?limit=1

# WebSocket test
wscat -c wss://api.edgewise.app/ws
```

### 2. Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://api.edgewise.app/api/v1/props

# Using k6
k6 run load-test.js
```

### 3. Integration Tests

```bash
# Run integration tests
cd backend
pytest tests/integration/

# Run E2E tests
cd frontend
npm run test:e2e
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        run: |
          docker build -t edgewise-backend .
          docker push ${{ secrets.REGISTRY }}/edgewise-backend:latest
      - name: Deploy to Railway
        run: railway up --service backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 📈 Scaling Considerations

### 1. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_props_player_market ON props(player_id, market_id);
CREATE INDEX CONCURRENTLY idx_odds_timestamp_prop ON odds(timestamp DESC, prop_id);

-- Partition large tables
CREATE TABLE odds_2024 PARTITION OF odds
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 2. Redis Caching

```python
# Cache frequently accessed data
@cache.cached(timeout=60, key_prefix='props_list')
def get_props_cached():
    return db.query(Prop).all()
```

### 3. Horizontal Scaling

```yaml
# kubernetes/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edgewise-backend
spec:
  replicas: 3  # Scale to 3 instances
  selector:
    matchLabels:
      app: edgewise-backend
  template:
    metadata:
      labels:
        app: edgewise-backend
    spec:
      containers:
      - name: backend
        image: edgewise-backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## 🆘 Troubleshooting

### Common Issues

1. **Database connection errors**
   ```bash
   # Check connection
   docker-compose exec postgres psql -U edgewise_user -d edgewise
   
   # Check logs
   docker-compose logs postgres
   ```

2. **WebSocket connection failures**
   ```bash
   # Check nginx WebSocket config
   # Verify upgrade headers are set
   ```

3. **High memory usage**
   ```bash
   # Monitor containers
   docker stats
   
   # Check database queries
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

## 📞 Support

- Documentation: https://docs.edgewise.app
- Status Page: https://status.edgewise.app
- Support Email: support@edgewise.app

## 📄 License

MIT License - See LICENSE file for details
