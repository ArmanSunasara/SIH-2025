# Deployment Guide

## Overview

This guide covers deployment strategies for the Water Quality Prediction System across different environments, from local development to production-ready deployments with monitoring and security.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Deployment](#development-deployment)
3. [Production Deployment](#production-deployment)
4. [Monitoring Setup](#monitoring-setup)
5. [Security Configuration](#security-configuration)
6. [Scaling and Load Balancing](#scaling-and-load-balancing)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB available space
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows 10/11

#### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1Gbps connection

### Software Requirements

- **Docker**: Version 20.10.0 or later
- **Docker Compose**: Version 2.0.0 or later
- **Git**: For source code management
- **SSL Certificate**: For production HTTPS

### Installation

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## Development Deployment

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd water-quality-system

# Start development environment
docker-compose -f docker-compose.dev.yml up --build
```

### Development Configuration

The development setup includes:
- Hot reload for all services
- Debug logging enabled
- Development-friendly CORS settings
- Local MongoDB instance
- No SSL/TLS requirements

#### Environment Files

Create development environment files:

```bash
# Backend development environment
cat > backend/.env.development << EOF
NODE_ENV=development
MONGO_URI=mongodb://mongo:27017/waterdb_dev
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
EOF

# Frontend development environment
cat > frontend/.env.development << EOF
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ML_URL=http://localhost:5001
REACT_APP_ENVIRONMENT=development
REACT_APP_LOG_LEVEL=debug
EOF

# ML Service development environment
cat > ml-service/.env.development << EOF
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=["http://localhost:3000","http://localhost:5000"]
MODEL_PATH=./models/water_quality_model.pkl
EOF
```

### Development Docker Compose

The `docker-compose.dev.yml` file includes:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    environment:
      - CHOKIDAR_USEPOLLING=true
    
  backend:
    build:
      context: ./backend
      target: development
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - mongo
    
  ml-service:
    build:
      context: ./ml-service
      target: development
    ports:
      - "5001:5001"
    volumes:
      - ./ml-service:/app
    
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_dev_data:/data/db

volumes:
  mongo_dev_data:
```

## Production Deployment

### Production Environment Setup

#### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git htop fail2ban ufw

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Configure fail2ban for security
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### 2. SSL Certificate Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com -d ml.yourdomain.com

# Certificate files will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 3. Production Environment Variables

```bash
# Create production environment directory
sudo mkdir -p /opt/water-quality-system/env

# Backend production environment
sudo tee /opt/water-quality-system/env/backend.env << EOF
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/waterdb_prod
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Frontend production environment
sudo tee /opt/water-quality-system/env/frontend.env << EOF
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_ML_URL=https://ml.yourdomain.com
REACT_APP_ENVIRONMENT=production
REACT_APP_LOG_LEVEL=error
EOF

# ML Service production environment
sudo tee /opt/water-quality-system/env/ml-service.env << EOF
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=["https://yourdomain.com","https://api.yourdomain.com"]
MODEL_PATH=./models/water_quality_model.pkl
API_KEY_HEADER=X-API-Key
RATE_LIMIT_PER_MINUTE=60
EOF
```

#### 4. Production Deployment

```bash
# Clone repository to production directory
cd /opt
sudo git clone <repository-url> water-quality-system
cd water-quality-system

# Copy environment files
sudo cp /opt/water-quality-system/env/* ./

# Deploy with production configuration
sudo docker-compose -f docker-compose.prod.yml up -d --build

# Verify deployment
sudo docker-compose -f docker-compose.prod.yml ps
```

### Production Docker Compose

The `docker-compose.prod.yml` includes optimizations:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend
      target: production
    restart: unless-stopped
    
  backend:
    build:
      context: ./backend
      target: production
    env_file:
      - backend.env
    depends_on:
      - mongo
    restart: unless-stopped
    
  ml-service:
    build:
      context: ./ml-service
      target: production
    env_file:
      - ml-service.env
    restart: unless-stopped
    
  mongo:
    image: mongo:5.0
    volumes:
      - mongo_prod_data:/data/db
      - ./mongo/init:/docker-entrypoint-initdb.d
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    restart: unless-stopped

volumes:
  mongo_prod_data:
    driver: local
```

## Monitoring Setup

### Prometheus and Grafana Deployment

```bash
# Deploy with monitoring stack
docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

# Access monitoring services
# Grafana: https://yourdomain.com:3001 (admin/admin)
# Prometheus: https://yourdomain.com:9090
# Alertmanager: https://yourdomain.com:9093
```

### Monitoring Configuration

#### Prometheus Configuration (`monitoring/prometheus/prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/api/metrics'
    
  - job_name: 'ml-service'
    static_configs:
      - targets: ['ml-service:5001']
    metrics_path: '/ml/metrics'
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
      
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Alert Rules (`monitoring/prometheus/rules/alerts.yml`)

```yaml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(api_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
```

### Log Management

#### Centralized Logging with ELK Stack (Optional)

```yaml
# Add to docker-compose.monitoring.yml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
      
  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./monitoring/logstash/config:/usr/share/logstash/pipeline
      
  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
```

## Security Configuration

### Network Security

#### Firewall Configuration

```bash
# Basic firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Allow specific Docker networks
sudo ufw allow from 172.16.0.0/12 to any port 5000
sudo ufw allow from 172.16.0.0/12 to any port 5001
sudo ufw allow from 172.16.0.0/12 to any port 27017

sudo ufw enable
```

#### Docker Network Security

```yaml
# Custom network in docker-compose.prod.yml
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  backend:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.21.0.0/16
```

### Application Security

#### Secrets Management

```bash
# Use Docker secrets for sensitive data
echo "$(openssl rand -base64 32)" | sudo docker secret create jwt_secret -
echo "$(openssl rand -base64 32)" | sudo docker secret create jwt_refresh_secret -
echo "strong_mongo_password" | sudo docker secret create mongo_password -
```

#### Security Headers (Nginx)

```nginx
# Add to nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### Database Security

#### MongoDB Security Configuration

```javascript
// MongoDB initialization script
// mongo/init/01-init.js
db = db.getSiblingDB('waterdb_prod');

db.createUser({
  user: 'app_user',
  pwd: 'secure_password_from_env',
  roles: [
    { role: 'readWrite', db: 'waterdb_prod' }
  ]
});

db.createCollection('users');
db.createCollection('predictions');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.predictions.createIndex({ userId: 1, createdAt: -1 });
```

## Scaling and Load Balancing

### Horizontal Scaling

#### Docker Swarm Setup

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy stack with scaling
docker stack deploy -c docker-compose.swarm.yml water-quality

# Scale services
docker service scale water-quality_backend=3
docker service scale water-quality_ml-service=2
```

#### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: water-quality/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Load Balancing with Nginx

```nginx
upstream backend {
    least_conn;
    server backend_1:5000;
    server backend_2:5000;
    server backend_3:5000;
}

upstream ml_service {
    least_conn;
    server ml_service_1:5001;
    server ml_service_2:5001;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ml/ {
        proxy_pass http://ml_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup and Recovery

### Database Backup

#### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="waterdb_backup_$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform MongoDB backup
docker exec water-quality-mongo mongodump \
  --db waterdb_prod \
  --out /tmp/backup

# Copy backup from container
docker cp water-quality-mongo:/tmp/backup $BACKUP_DIR/$BACKUP_NAME

# Compress backup
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
```

#### Automated Backup with Cron

```bash
# Add to crontab (crontab -e)
0 2 * * * /opt/water-quality-system/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### Application Backup

```bash
#!/bin/bash
# backup-app.sh

APP_DIR="/opt/water-quality-system"
BACKUP_DIR="/opt/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup application configuration
tar -czf $BACKUP_DIR/app_config_$DATE.tar.gz \
  $APP_DIR/*.env \
  $APP_DIR/docker-compose*.yml \
  $APP_DIR/nginx/ \
  $APP_DIR/monitoring/
```

### Disaster Recovery

#### Recovery Procedure

```bash
# 1. Restore application files
cd /opt
sudo tar -xzf /opt/backups/application/app_config_latest.tar.gz

# 2. Restore database
cd /opt/water-quality-system
docker-compose -f docker-compose.prod.yml up -d mongo

# Wait for MongoDB to start
sleep 30

# Restore database backup
docker cp /opt/backups/mongodb/latest_backup.tar.gz water-quality-mongo:/tmp/
docker exec water-quality-mongo tar -xzf /tmp/latest_backup.tar.gz -C /tmp/
docker exec water-quality-mongo mongorestore /tmp/backup

# 3. Start all services
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check service logs
docker-compose logs backend
docker-compose logs ml-service
docker-compose logs frontend

# Check container status
docker-compose ps

# Check system resources
docker system df
docker system events
```

#### Database Connection Issues

```bash
# Check MongoDB status
docker exec water-quality-mongo mongo --eval "db.adminCommand('ismaster')"

# Check MongoDB logs
docker logs water-quality-mongo

# Test connection from backend
docker exec water-quality-backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on('connected', () => console.log('Connected'));
mongoose.connection.on('error', (err) => console.log('Error:', err));
"
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew --dry-run

# Test SSL configuration
curl -I https://yourdomain.com
```

### Performance Issues

#### Memory Usage

```bash
# Monitor container resource usage
docker stats

# Check system memory
free -h
top -p $(pgrep -d, -f docker)
```

#### Database Performance

```bash
# MongoDB slow query analysis
docker exec water-quality-mongo mongo waterdb_prod --eval "
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty();
"

# Check database indexes
docker exec water-quality-mongo mongo waterdb_prod --eval "
db.predictions.getIndexes();
db.users.getIndexes();
"
```

### Log Analysis

#### Centralized Log Analysis

```bash
# Search for errors in all services
docker-compose logs 2>&1 | grep -i error

# Monitor real-time logs
docker-compose logs -f | grep -E "(error|warning|critical)"

# Analyze specific service logs
docker-compose logs backend | jq '.timestamp, .level, .message'
```

#### Log Rotation

```bash
# Configure log rotation for Docker
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

### Health Checks

#### Service Health Monitoring

```bash
#!/bin/bash
# health-check.sh

SERVICES=("frontend:3000" "backend:5000/api/health" "ml-service:5001/ml/health")

for service in "${SERVICES[@]}"; do
    name=${service%%:*}
    url=${service#*:}
    
    if curl -f -s "http://localhost:$url" > /dev/null; then
        echo "✓ $name is healthy"
    else
        echo "✗ $name is unhealthy"
        # Send alert notification here
    fi
done
```

#### Automated Recovery

```bash
#!/bin/bash
# auto-recovery.sh

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Services down, attempting restart..."
    docker-compose restart
    
    # Wait and check again
    sleep 30
    if ! docker-compose ps | grep -q "Up"; then
        echo "Restart failed, sending alert..."
        # Send critical alert
    fi
fi
```

## Environment-Specific Configurations

### Staging Environment

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      target: production
    environment:
      REACT_APP_BACKEND_URL: https://api-staging.yourdomain.com
      REACT_APP_ML_URL: https://ml-staging.yourdomain.com
      
  backend:
    build:
      context: ./backend
      target: production
    environment:
      NODE_ENV: staging
      MONGO_URI: mongodb://mongo:27017/waterdb_staging
      LOG_LEVEL: debug
```

### Development vs Production Differences

| Component | Development | Production |
|-----------|-------------|------------|
| Logging | Debug level | Info/Error level |
| SSL/TLS | Not required | Required |
| Database | Local MongoDB | Secured MongoDB |
| Monitoring | Optional | Required |
| Backups | Not configured | Automated |
| Scaling | Single instance | Multiple instances |
| Secrets | Environment files | Docker secrets |

This deployment guide provides comprehensive coverage for deploying the Water Quality Prediction System across different environments with proper security, monitoring, and scalability considerations.