# Water Quality Prediction System

A production-ready, enterprise-grade full-stack application that predicts water quality using machine learning. Built with modern architecture following senior full-stack engineering best practices.

## 🌊 Features

- **Secure Authentication**: JWT with refresh tokens, rate limiting, and session management
- **ML-Powered Predictions**: Advanced water quality prediction using 9 parameters
- **Comprehensive Security**: Input validation, XSS protection, CORS, CSP headers
- **Modern Architecture**: MVC pattern, service layer, modular design
- **Production Ready**: Multi-stage Docker builds, monitoring, logging, CI/CD
- **High Performance**: Lazy loading, code splitting, optimized builds
- **Enterprise Features**: Comprehensive error handling, audit logging, health checks

## 🏗️ Architecture

### System Overview
```
┌────────────────────┐
│   Load Balancer    │
│      (Nginx)       │
└─────────┬──────────┘
          │
    ┌─────┴───┬─────────┐
    │         │         │
┌───┴───┐ ┌───┴───┐ ┌───┴────┐
│Frontend│ │Backend│ │ML Service│
│ React  │ │Node.js│ │ FastAPI  │
│Port3000│ │Port5000│ │ Port5001 │
└────────┘ └───┬────┘ └──────────┘
             │
         ┌───┴───┐
         │MongoDB│
         │Port27017│
         └─────────┘
```

### Production Architecture Features
- **Load Balancing**: Nginx reverse proxy with SSL termination
- **Security**: Rate limiting, CORS, CSP headers, input validation
- **Monitoring**: Prometheus metrics, Grafana dashboards, alerting
- **Logging**: Centralized logging with Winston and Python logging
- **CI/CD**: Automated testing, security scanning, deployment
- **Containerization**: Multi-stage Docker builds with optimization

### Directory Structure
```
water-quality-system/
├── frontend/                 # React Frontend (Optimized)
│   ├── src/
│   │   ├── components/      # Lazy-loaded components
│   │   ├── pages/          # Code-split pages
│   │   ├── services/       # API clients with retry logic
│   │   ├── utils/          # Security utilities
│   │   └── hooks/          # Custom React hooks
│   └── .env.*              # Environment configs
├── backend/                  # Node.js Backend (MVC)
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic
│   ├── middleware/         # Security & validation
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utilities & helpers
│   └── tests/              # Jest test suites
├── ml-service/               # Python ML Service (Modular)
│   ├── models/             # ML model management
│   ├── services/           # Prediction services
│   ├── utils/              # ML utilities
│   ├── middleware/         # FastAPI middleware
│   └── tests/              # Pytest test suites
├── nginx/                    # Nginx Configuration
│   ├── nginx.conf          # Main config
│   └── conf.d/             # Site configurations
├── monitoring/               # Monitoring Stack
│   ├── prometheus/         # Metrics collection
│   ├── grafana/            # Visualization
│   └── alertmanager/       # Alert management
├── .github/workflows/        # CI/CD Pipeline
├── docker-compose.*.yml      # Multi-environment configs
└── docs/                     # Documentation
```

## 🚀 Quick Start

### Option 1: Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd water-quality-system

# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build
```

### Option 2: Production Environment
```bash
# Production deployment with monitoring
docker-compose -f docker-compose.prod.yml up --build

# Or with monitoring stack
docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up --build
```

### Option 3: Simple Local Setup
```bash
# Standard setup
docker-compose up --build
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:5001
- **MongoDB**: localhost:27017
- **Prometheus** (if monitoring enabled): http://localhost:9090
- **Grafana** (if monitoring enabled): http://localhost:3001

## 💻 Local Development

### 1. Backend Setup (Node.js)
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start MongoDB (if not using Docker)
# mongodb://localhost:27017/waterdb

# Run in development mode
npm run dev
```

### 2. ML Service Setup (Python)
```bash
cd ml-service

# Create virtual environment (optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train model (optional - app includes fallback mock model)
python train_model.py

# Run the service
python app.py
```

### 3. Frontend Setup (React)
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm start
```

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database
MONGO_URI=mongodb://localhost:27017/waterdb

# JWT Configuration
JWT_SECRET=supersecretkey-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=refreshsecret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=10485760
LOG_FILE_MAX_FILES=5
```

### Frontend (.env.development)
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ML_URL=http://localhost:5001
REACT_APP_ENVIRONMENT=development
REACT_APP_LOG_LEVEL=debug
```

### Frontend (.env.production)
```env
REACT_APP_BACKEND_URL=https://your-api-domain.com
REACT_APP_ML_URL=https://your-ml-domain.com
REACT_APP_ENVIRONMENT=production
REACT_APP_LOG_LEVEL=error
```

### ML Service (.env)
```env
# FastAPI Configuration
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000","http://localhost:5000"]

# Security
API_KEY_HEADER=X-API-Key
RATE_LIMIT_PER_MINUTE=60

# Model Configuration
MODEL_PATH=./models/water_quality_model.pkl
MODEL_VERSION=1.0.0
```

## 📊 Water Quality Parameters

The ML model expects 9 input parameters:

1. **pH**: Acidity/alkalinity level (6.5-8.5 ideal)
2. **Hardness**: Mineral content (mg/L)
3. **Solids**: Total dissolved solids (ppm)
4. **Chloramines**: Disinfectant level (ppm)
5. **Sulfate**: Sulfate concentration (mg/L)
6. **Conductivity**: Electrical conductivity (μS/cm)
7. **Organic Carbon**: Organic matter (ppm)
8. **Trihalomethanes**: Chemical byproducts (μg/L)
9. **Turbidity**: Water clarity (NTU)

## 🛠️ API Endpoints

### Authentication (Secure JWT with Refresh Tokens)
- `POST /api/auth/register` - Register new user with validation
- `POST /api/auth/login` - User login with rate limiting
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens
- `GET /api/auth/profile` - Get user profile (JWT required)

### Predictions (Full CRUD with Authorization)
- `POST /api/predictions` - Create new prediction (JWT required)
- `GET /api/predictions` - Get user's prediction history (JWT required)
- `GET /api/predictions/:id` - Get specific prediction (JWT required)
- `PUT /api/predictions/:id` - Update prediction (JWT required)
- `DELETE /api/predictions/:id` - Delete prediction (JWT required)
- `GET /api/predictions/stats` - Get prediction statistics (JWT required)

### ML Service (Secured with API Keys)
- `POST /ml/predict` - Make water quality prediction
- `GET /ml/health` - Service health check
- `GET /ml/metrics` - Service metrics (Prometheus format)
- `GET /ml/model/info` - Model information and version

### System Endpoints
- `GET /api/health` - Backend health check
- `GET /api/metrics` - Application metrics
- `GET /api/docs` - API documentation (development only)

## 🐳 Docker Commands

### Development Environment
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production Environment
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up --build

# With monitoring stack
docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up --build

# Stop production environment
docker-compose -f docker-compose.prod.yml down
```

### Standard Commands
```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs [service-name]

# Remove volumes (reset database)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache
```

### Monitoring Commands
```bash
# View application metrics
curl http://localhost:9090/metrics

# Check service health
curl http://localhost:5000/api/health
curl http://localhost:5001/ml/health

# Access monitoring services
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
# Alertmanager: http://localhost:9093
```

## 📁 Project Structure

```
water-quality-system/
├── frontend/                     # React Frontend (Optimized)
│   ├── public/
│   ├── src/
│   │   ├── components/          # Lazy-loaded components
│   │   ├── pages/              # Code-split pages
│   │   ├── services/           # API services with retry
│   │   ├── utils/              # Security utilities
│   │   ├── hooks/              # Custom React hooks
│   │   └── context/            # React context
│   ├── .env.development        # Development config
│   ├── .env.production         # Production config
│   ├── Dockerfile              # Multi-stage build
│   ├── nginx.conf              # Nginx configuration
│   ├── package.json            # Optimized dependencies
│   └── jest.config.js          # Testing configuration
├── backend/                      # Node.js Backend (MVC)
│   ├── controllers/            # Route controllers
│   │   ├── authController.js
│   │   └── predictionController.js
│   ├── services/               # Business logic
│   │   ├── authService.js
│   │   └── predictionService.js
│   ├── middleware/             # Security & validation
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── security.js
│   │   └── errorHandler.js
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── utils/                  # Utilities & helpers
│   ├── tests/                  # Jest test suites
│   ├── server.js               # Main application
│   ├── Dockerfile              # Multi-stage build
│   └── package.json            # Secure dependencies
├── ml-service/                   # Python ML Service (Modular)
│   ├── models/                 # ML model management
│   │   ├── model_manager.py
│   │   └── water_quality_model.pkl
│   ├── services/               # Prediction services
│   │   └── prediction_service.py
│   ├── utils/                  # ML utilities
│   │   ├── validators.py
│   │   └── logger.py
│   ├── middleware/             # FastAPI middleware
│   │   └── security.py
│   ├── tests/                  # Pytest test suites
│   ├── app.py                  # FastAPI application
│   ├── train_model.py          # Model training script
│   ├── Dockerfile              # Optimized Python build
│   └── requirements.txt        # Pinned dependencies
├── nginx/                        # Nginx Configuration
│   ├── nginx.conf              # Main config
│   └── conf.d/
│       └── default.conf        # Site configuration
├── monitoring/                   # Monitoring Stack
│   ├── prometheus/
│   │   ├── prometheus.yml      # Metrics config
│   │   └── rules/
│   │       └── alerts.yml      # Alert rules
│   ├── grafana/
│   │   └── dashboards/         # Pre-built dashboards
│   └── alertmanager/
│       └── alertmanager.yml    # Alert routing
├── .github/
│   └── workflows/              # CI/CD Pipeline
│       ├── ci.yml              # Main CI pipeline
│       ├── security.yml        # Security scanning
│       └── deploy.yml          # Deployment pipeline
├── docs/                         # Documentation
│   ├── api.md                  # API documentation
│   ├── deployment.md           # Deployment guide
│   └── testing.md              # Testing guide
├── docker-compose.yml            # Standard deployment
├── docker-compose.dev.yml        # Development setup
├── docker-compose.prod.yml       # Production setup
├── docker-compose.monitoring.yml # Monitoring stack
├── .gitignore                    # Git ignore rules
├── .dockerignore                 # Docker ignore rules
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
└── README.md                     # This file
```

## 🧪 Testing the Application

### 1. Automated Testing
```bash
# Run all tests
npm test                    # Frontend tests
cd backend && npm test      # Backend tests
cd ml-service && pytest    # ML service tests

# Run tests with coverage
npm run test:coverage
cd backend && npm run test:coverage
cd ml-service && pytest --cov

# Run integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### 2. Manual Testing
- **Register**: Go to http://localhost:3000/register
- **Login**: Use your credentials to sign in
- **Predict**: Fill in all 9 water quality parameters
- **History**: View your prediction history and statistics

### 3. API Testing
```bash
# Health checks
curl http://localhost:5000/api/health
curl http://localhost:5001/ml/health

# Authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Make prediction
curl -X POST http://localhost:5001/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"ph":7.0,"hardness":200,"solids":1000,"chloramines":4,"sulfate":300,"conductivity":400,"organic_carbon":10,"trihalomethanes":80,"turbidity":4}'
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT with Refresh Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Session Management**: Secure token storage and rotation
- **Input Validation**: Comprehensive validation using Joi/Pydantic
- **Password Security**: Bcrypt hashing with salt rounds

### Security Headers & Middleware
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **CORS**: Configurable cross-origin resource sharing
- **XSS Protection**: Input sanitization and output encoding
- **SQL Injection Prevention**: Parameterized queries
- **DoS Protection**: Rate limiting and request size limits

### Container Security
- **Non-root Users**: All containers run as non-privileged users
- **Multi-stage Builds**: Minimal attack surface
- **Security Scanning**: Automated vulnerability checks in CI/CD
- **Secret Management**: Environment-based configuration

### API Security
- **API Key Authentication**: ML service protection
- **Request Validation**: Schema-based validation
- **Error Handling**: No sensitive information in responses
- **Audit Logging**: Comprehensive security event logging

## 🚦 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`.github/workflows/ci.yml`)
- **Code Quality**: ESLint, Prettier, Black, Flake8
- **Testing**: Unit tests, integration tests, coverage reports
- **Security**: Dependency scanning, SAST analysis
- **Build**: Multi-platform Docker builds
- **Performance**: Bundle size analysis, performance tests

#### 2. Security Scanning (`.github/workflows/security.yml`)
- **Dependencies**: Snyk, npm audit, safety
- **Code Analysis**: CodeQL, Bandit, ESLint security rules
- **Container Security**: Trivy, Hadolint
- **Secret Detection**: GitLeaks, TruffleHog

#### 3. Deployment Pipeline (`.github/workflows/deploy.yml`)
- **Environment Promotion**: Dev → Staging → Production
- **Infrastructure as Code**: Docker Compose validation
- **Health Checks**: Post-deployment verification
- **Rollback**: Automated rollback on failure

### Pipeline Features
- **Parallel Execution**: Fast feedback loops
- **Caching**: Dependencies and build artifacts
- **Notifications**: Slack/Email alerts on failures
- **Quality Gates**: Coverage thresholds, security scores

## 📊 Monitoring & Observability

### Metrics Collection (Prometheus)
- **Application Metrics**: Request rates, response times, error rates
- **System Metrics**: CPU, memory, disk usage
- **Business Metrics**: Prediction accuracy, user activity
- **Custom Metrics**: ML model performance, prediction confidence

### Visualization (Grafana)
- **Pre-built Dashboards**: System overview, application performance
- **Real-time Monitoring**: Live metrics and alerts
- **Historical Analysis**: Trend analysis and capacity planning
- **Custom Dashboards**: Business-specific metrics

### Alerting (Alertmanager)
- **Threshold Alerts**: CPU, memory, disk space
- **Application Alerts**: High error rates, slow responses
- **Business Alerts**: Prediction accuracy degradation
- **Integration**: Slack, PagerDuty, email notifications

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: Debug, info, warn, error
- **Request Tracing**: Correlation IDs across services
- **Security Logs**: Authentication, authorization events

### Health Checks
- **Liveness Probes**: Service availability
- **Readiness Probes**: Service ready to handle requests
- **Dependency Checks**: Database, external service connectivity
- **Deep Health**: ML model loading, data validation

## 🔍 Troubleshooting

### Common Issues

**Frontend not connecting to backend:**
- Check environment variables in `frontend/.env`
- Ensure backend is running on port 5000

**ML Service connection failed:**
- Verify ML service is running on port 5001
- Check if model files exist in `ml-service/ml/` directory

**Database connection issues:**
- Ensure MongoDB is running
- Check connection string in backend environment

**Docker build failures:**
- Try: `docker-compose down -v && docker-compose up --build`
- Ensure sufficient disk space and memory

### Logs and Debugging

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs ml-service
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

## 🚀 Production Deployment

### Prerequisites for Production
- Docker Compose V2
- Reverse proxy (nginx/traefik) for SSL
- Domain name with SSL certificate
- Environment variables configured

### Security Considerations
- Change JWT_SECRET to a strong random string
- Use environment-specific database credentials
- Enable SSL/TLS in production
- Configure CORS properly
- Use Docker secrets for sensitive data

### Production Environment Variables
```env
# Backend
MONGO_URI=mongodb://mongo:27017/waterdb_prod
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production

# Frontend
REACT_APP_BACKEND_URL=https://your-domain.com/api
REACT_APP_ML_URL=https://your-domain.com/ml
```

## 📈 Future Enhancements

- [ ] Model retraining pipeline
- [ ] Real-time prediction updates
- [ ] Data visualization dashboard
- [ ] Batch prediction processing
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Integration with IoT sensors
- [ ] Multi-language support

## Contributors  
- [@RanaHeet24](https://github.com/RanaHeet24)  
- [@ArmanSunasara](https://github.com/ArmanSunasra)  

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs
3. Create an issue with detailed information
4. Include environment details and error messages

---

**Built with ❤️ using React, Node.js, FastAPI, and Docker**