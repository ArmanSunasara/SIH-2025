# Testing Guide

## Overview

Comprehensive testing strategy for the Water Quality Prediction System covering unit, integration, E2E, performance, and security testing.

## Testing Strategy

### Testing Pyramid
```
    /\     E2E Tests (Few)
   /  \    
  /____\   Integration Tests (Some) 
 /______\  Unit Tests (Many)
```

### Coverage Goals
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load testing
- **Security Tests**: Auth & validation

## Frontend Testing (React + Jest)

### Setup (`frontend/jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  }
};
```

### Component Testing Example
```javascript
// PredictionForm.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { PredictionForm } from './PredictionForm';

test('validates pH input range', async () => {
  render(<PredictionForm />);
  const phInput = screen.getByLabelText(/ph/i);
  
  fireEvent.change(phInput, { target: { value: '15' } });
  fireEvent.blur(phInput);
  
  expect(screen.getByText(/pH must be between 0 and 14/i)).toBeInTheDocument();
});
```

### Running Tests
```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage
npm run test:watch         # Watch mode
```

## Backend Testing (Node.js + Jest)

### Setup (`backend/jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 }
  }
};
```

### Controller Testing Example
```javascript
// authController.test.js
const request = require('supertest');
const app = require('../../server');

describe('Auth Controller', () => {
  test('POST /register - should register user', async () => {
    const userData = { email: 'test@example.com', password: 'password123' };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
  });
});
```

### Service Testing Example
```javascript
// authService.test.js
const authService = require('../../services/authService');

describe('Auth Service', () => {
  test('should hash password correctly', async () => {
    const password = 'test123';
    const hashedPassword = await authService.hashPassword(password);
    
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(50);
  });
});
```

## ML Service Testing (Python + Pytest)

### Setup (`ml-service/pytest.ini`)
```ini
[tool:pytest]
testpaths = tests
addopts = --cov=. --cov-report=html --cov-fail-under=85
```

### API Testing Example
```python
# test_prediction_api.py
import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

def test_predict_water_quality(client):
    water_data = {
        "ph": 7.2, "hardness": 180.5, "solids": 1200.0,
        "chloramines": 3.8, "sulfate": 285.0, "conductivity": 425.5,
        "organic_carbon": 12.3, "trihalomethanes": 75.2, "turbidity": 3.1
    }
    
    response = client.post("/ml/predict", json=water_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "potability" in data["prediction"]
    assert data["prediction"]["confidence"] > 0
```

### Model Testing Example
```python
# test_model_manager.py
from models.model_manager import ModelManager
from utils.validators import WaterQualityData

def test_model_prediction():
    manager = ModelManager()
    
    water_data = WaterQualityData(
        ph=7.2, hardness=180.5, solids=1200.0,
        chloramines=3.8, sulfate=285.0, conductivity=425.5,
        organic_carbon=12.3, trihalomethanes=75.2, turbidity=3.1
    )
    
    result = manager.predict(water_data)
    
    assert "potability" in result
    assert "confidence" in result
    assert 0 <= result["confidence"] <= 1
```

## Integration Testing

### Full API Flow Testing
```javascript
// integration/prediction-flow.test.js
describe('Prediction Flow Integration', () => {
  test('complete prediction workflow', async () => {
    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    
    const { accessToken } = registerResponse.body.data;
    
    // Create prediction
    const predictionData = {
      waterParameters: { ph: 7.2, hardness: 180 /* ... */ }
    };
    
    const predictionResponse = await request(app)
      .post('/api/predictions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(predictionData)
      .expect(201);
    
    expect(predictionResponse.body.data.prediction.result).toBeDefined();
    
    // Get predictions history
    const historyResponse = await request(app)
      .get('/api/predictions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    
    expect(historyResponse.body.data.predictions).toHaveLength(1);
  });
});
```

## End-to-End Testing (Cypress)

### Setup (`e2e/cypress.config.js`)
```javascript
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  }
};
```

### E2E Test Example
```javascript
// cypress/e2e/prediction-flow.cy.js
describe('Water Quality Prediction Flow', () => {
  it('allows user to make predictions', () => {
    // Register new user
    cy.visit('/register');
    cy.get('[data-testid=email-input]').type('test@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=register-button]').click();
    
    // Navigate to prediction page
    cy.get('[data-testid=predict-nav]').click();
    
    // Fill prediction form
    cy.get('[data-testid=ph-input]').type('7.2');
    cy.get('[data-testid=hardness-input]').type('180');
    // ... fill other fields
    
    // Submit prediction
    cy.get('[data-testid=predict-button]').click();
    
    // Verify result
    cy.get('[data-testid=prediction-result]').should('be.visible');
    cy.get('[data-testid=potability-score]').should('contain.text', 'Potable');
  });
});
```

## Performance Testing

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"

scenarios:
  - name: "Authentication flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          
  - name: "Prediction flow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      - post:
          url: "/api/predictions"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            waterParameters:
              ph: 7.2
              hardness: 180
              # ... other parameters
```

### Running Performance Tests
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery-config.yml

# Generate report
artillery run --output report.json artillery-config.yml
artillery report report.json
```

## Security Testing

### Authentication Testing
```javascript
// security/auth-security.test.js
describe('Authentication Security', () => {
  test('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/predictions')
      .expect(401);
    
    expect(response.body.message).toContain('authorization denied');
  });
  
  test('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/predictions')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
    
    expect(response.body.message).toContain('not valid');
  });
  
  test('should enforce rate limiting', async () => {
    const loginData = { email: 'test@example.com', password: 'wrong' };
    
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/auth/login').send(loginData);
    }
    
    // Should be rate limited
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(429);
    
    expect(response.body.message).toContain('Too many requests');
  });
});
```

### Input Validation Testing
```python
# test_input_validation.py
def test_invalid_ph_value(client):
    invalid_data = {"ph": 15.0}  # pH > 14 is invalid
    
    response = client.post("/ml/predict", json=invalid_data)
    
    assert response.status_code == 422
    assert "validation error" in response.json()["detail"][0]["msg"].lower()

def test_sql_injection_prevention(client):
    malicious_input = {"ph": "7.0'; DROP TABLE users; --"}
    
    response = client.post("/ml/predict", json=malicious_input)
    
    assert response.status_code == 422
```

## CI/CD Testing Pipeline

### GitHub Actions Workflow (`.github/workflows/test.yml`)
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test:ci
      - run: cd frontend && npm run test:coverage
      
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm run test:coverage
      
  ml-service-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: cd ml-service && pip install -r requirements.txt
      - run: cd ml-service && pytest
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: docker-compose up -d
      - run: npm run wait-for-services
      - run: npm run test:e2e
      - run: docker-compose down
```

## Test Data Management

### Test Fixtures
```javascript
// fixtures/users.js
module.exports = {
  validUser: {
    email: 'test@example.com',
    password: 'securePassword123'
  },
  
  validWaterData: {
    ph: 7.2,
    hardness: 180.5,
    solids: 1200.0,
    chloramines: 3.8,
    sulfate: 285.0,
    conductivity: 425.5,
    organic_carbon: 12.3,
    trihalomethanes: 75.2,
    turbidity: 3.1
  }
};
```

## Running All Tests

### Local Testing
```bash
# Run all frontend tests
cd frontend && npm test

# Run all backend tests  
cd backend && npm test

# Run all ML service tests
cd ml-service && pytest

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

### Docker Testing
```bash
# Run tests in containers
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Generate coverage reports
docker-compose -f docker-compose.test.yml run --rm frontend npm run test:coverage
docker-compose -f docker-compose.test.yml run --rm backend npm run test:coverage
docker-compose -f docker-compose.test.yml run --rm ml-service pytest --cov
```

## Best Practices

### Test Organization
- **Unit Tests**: Test individual functions/components in isolation
- **Integration Tests**: Test service interactions and API endpoints
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test under realistic load conditions
- **Security Tests**: Test authentication, authorization, and input validation

### Test Quality
- Write descriptive test names
- Use arrange-act-assert pattern
- Mock external dependencies
- Test both happy path and error cases
- Maintain high test coverage (>85%)
- Keep tests fast and independent

### Continuous Testing
- Run tests on every commit
- Fail builds on test failures
- Generate and track coverage reports
- Run security scans automatically
- Monitor test performance and flakiness

This testing guide ensures comprehensive coverage of the Water Quality Prediction System with automated testing at every level.