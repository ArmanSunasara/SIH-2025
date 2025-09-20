# API Documentation

## Overview

The Water Quality Prediction System provides a RESTful API with comprehensive authentication, prediction management, and ML services. All endpoints return JSON responses and follow REST conventions.

## Base URLs

- **Backend API**: `http://localhost:5000/api` (Development) | `https://api.yourdomain.com/api` (Production)
- **ML Service**: `http://localhost:5001/ml` (Development) | `https://ml.yourdomain.com/ml` (Production)

## Authentication

### JWT Token Structure

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration
- **Automatic Refresh**: Frontend handles token refresh automatically

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Register a new user account.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Validation Rules
- Email: Valid email format, unique
- Password: Minimum 8 characters, must contain letters and numbers

#### Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789",
      "email": "user@example.com",
      "createdAt": "2023-07-01T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    }
  ]
}

// 500 - Server Error
{
  "success": false,
  "message": "Internal server error"
}
```

### Login User

**POST** `/api/auth/login`

Authenticate user and receive tokens.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token

**POST** `/api/auth/refresh-token`

Get new access token using refresh token.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Logout

**POST** `/api/auth/logout`

Invalidate current session tokens.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Profile

**GET** `/api/auth/profile`

Get current user profile information.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789",
      "email": "user@example.com",
      "createdAt": "2023-07-01T10:00:00.000Z",
      "predictionCount": 15,
      "lastLogin": "2023-07-15T14:30:00.000Z"
    }
  }
}
```

## Prediction Endpoints

### Create Prediction

**POST** `/api/predictions`

Create a new water quality prediction.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "waterParameters": {
    "ph": 7.2,
    "hardness": 180.5,
    "solids": 1200.0,
    "chloramines": 3.8,
    "sulfate": 285.0,
    "conductivity": 425.5,
    "organic_carbon": 12.3,
    "trihalomethanes": 75.2,
    "turbidity": 3.1
  },
  "location": "Sample Location (optional)",
  "notes": "Additional notes (optional)"
}
```

#### Parameter Validation
```json
{
  "ph": "number, min: 0, max: 14",
  "hardness": "number, min: 0, max: 1000",
  "solids": "number, min: 0, max: 10000",
  "chloramines": "number, min: 0, max: 20",
  "sulfate": "number, min: 0, max: 1000",
  "conductivity": "number, min: 0, max: 2000",
  "organic_carbon": "number, min: 0, max: 50",
  "trihalomethanes": "number, min: 0, max: 200",
  "turbidity": "number, min: 0, max: 20"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Prediction created successfully",
  "data": {
    "prediction": {
      "id": "64a1b2c3d4e5f6790",
      "userId": "64a1b2c3d4e5f6789",
      "waterParameters": {
        "ph": 7.2,
        "hardness": 180.5,
        "solids": 1200.0,
        "chloramines": 3.8,
        "sulfate": 285.0,
        "conductivity": 425.5,
        "organic_carbon": 12.3,
        "trihalomethanes": 75.2,
        "turbidity": 3.1
      },
      "result": {
        "potability": 1,
        "confidence": 0.87,
        "quality_score": 8.2,
        "recommendations": [
          "Water quality is good for consumption",
          "Consider monitoring turbidity levels"
        ]
      },
      "location": "Sample Location",
      "notes": "Additional notes",
      "createdAt": "2023-07-15T15:00:00.000Z"
    }
  }
}
```

### Get User Predictions

**GET** `/api/predictions`

Get all predictions for the authenticated user with pagination.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
```
?page=1&limit=10&sort=createdAt&order=desc&location=filter
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "id": "64a1b2c3d4e5f6790",
        "waterParameters": { /* ... */ },
        "result": { /* ... */ },
        "location": "Sample Location",
        "createdAt": "2023-07-15T15:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_predictions": 25,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Get Specific Prediction

**GET** `/api/predictions/:id`

Get a specific prediction by ID.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "prediction": {
      "id": "64a1b2c3d4e5f6790",
      "userId": "64a1b2c3d4e5f6789",
      "waterParameters": { /* ... */ },
      "result": { /* ... */ },
      "location": "Sample Location",
      "notes": "Additional notes",
      "createdAt": "2023-07-15T15:00:00.000Z",
      "updatedAt": "2023-07-15T15:00:00.000Z"
    }
  }
}
```

### Update Prediction

**PUT** `/api/predictions/:id`

Update prediction notes and location (parameters and results are immutable).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "location": "Updated Location",
  "notes": "Updated notes"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Prediction updated successfully",
  "data": {
    "prediction": { /* updated prediction object */ }
  }
}
```

### Delete Prediction

**DELETE** `/api/predictions/:id`

Delete a specific prediction.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Prediction deleted successfully"
}
```

### Get Prediction Statistics

**GET** `/api/predictions/stats`

Get user's prediction statistics and analytics.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_predictions": 25,
      "potable_predictions": 18,
      "non_potable_predictions": 7,
      "average_confidence": 0.82,
      "most_recent": "2023-07-15T15:00:00.000Z",
      "parameter_averages": {
        "ph": 7.1,
        "hardness": 195.2,
        "solids": 1150.5,
        "chloramines": 4.2,
        "sulfate": 295.8,
        "conductivity": 415.3,
        "organic_carbon": 11.8,
        "trihalomethanes": 68.4,
        "turbidity": 3.5
      },
      "monthly_counts": [
        {"month": "2023-07", "count": 12},
        {"month": "2023-06", "count": 8},
        {"month": "2023-05", "count": 5}
      ]
    }
  }
}
```

## ML Service Endpoints

### Make Prediction

**POST** `/ml/predict`

Make a water quality prediction using the ML model.

#### Request Body
```json
{
  "ph": 7.2,
  "hardness": 180.5,
  "solids": 1200.0,
  "chloramines": 3.8,
  "sulfate": 285.0,
  "conductivity": 425.5,
  "organic_carbon": 12.3,
  "trihalomethanes": 75.2,
  "turbidity": 3.1
}
```

#### Response (200 OK)
```json
{
  "prediction": {
    "potability": 1,
    "confidence": 0.87,
    "quality_score": 8.2,
    "feature_importance": {
      "ph": 0.15,
      "hardness": 0.12,
      "solids": 0.18,
      "chloramines": 0.08,
      "sulfate": 0.11,
      "conductivity": 0.14,
      "organic_carbon": 0.09,
      "trihalomethanes": 0.07,
      "turbidity": 0.06
    },
    "recommendations": [
      "Water quality is good for consumption",
      "Consider monitoring turbidity levels"
    ]
  },
  "model_info": {
    "version": "1.0.0",
    "algorithm": "Random Forest",
    "training_date": "2023-07-01",
    "accuracy": 0.89
  }
}
```

### Health Check

**GET** `/ml/health`

Check ML service health and model status.

#### Response (200 OK)
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "1.0.0",
  "uptime_seconds": 3600,
  "memory_usage": "245 MB",
  "last_prediction": "2023-07-15T14:55:00.000Z"
}
```

### Service Metrics

**GET** `/ml/metrics`

Get Prometheus-formatted metrics for monitoring.

#### Response (200 OK)
```
# HELP ml_predictions_total Total number of predictions made
# TYPE ml_predictions_total counter
ml_predictions_total 1523

# HELP ml_prediction_confidence_avg Average prediction confidence
# TYPE ml_prediction_confidence_avg gauge
ml_prediction_confidence_avg 0.84

# HELP ml_model_accuracy Model accuracy score
# TYPE ml_model_accuracy gauge
ml_model_accuracy 0.89
```

### Model Information

**GET** `/ml/model/info`

Get detailed information about the current ML model.

#### Response (200 OK)
```json
{
  "model": {
    "name": "Water Quality Predictor",
    "version": "1.0.0",
    "algorithm": "Random Forest",
    "features": [
      "ph", "hardness", "solids", "chloramines", "sulfate",
      "conductivity", "organic_carbon", "trihalomethanes", "turbidity"
    ],
    "training_data": {
      "samples": 3276,
      "training_date": "2023-07-01",
      "validation_accuracy": 0.89,
      "test_accuracy": 0.87
    },
    "performance_metrics": {
      "precision": 0.88,
      "recall": 0.85,
      "f1_score": 0.86,
      "auc_roc": 0.91
    }
  }
}
```

## System Endpoints

### Backend Health Check

**GET** `/api/health`

Check backend service health and dependencies.

#### Response (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2023-07-15T15:00:00.000Z",
  "version": "2.0.0",
  "environment": "production",
  "dependencies": {
    "database": {
      "status": "connected",
      "response_time_ms": 12
    },
    "ml_service": {
      "status": "available",
      "response_time_ms": 45
    }
  },
  "system": {
    "uptime_seconds": 7200,
    "memory_usage": "156 MB",
    "cpu_usage": "12%"
  }
}
```

### Application Metrics

**GET** `/api/metrics`

Get Prometheus-formatted application metrics.

#### Response (200 OK)
```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",endpoint="/api/predictions",status="200"} 1234

# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{le="0.1"} 890
```

## Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2023-07-15T15:00:00.000Z",
  "path": "/api/predictions",
  "errors": [ /* detailed validation errors if applicable */ ]
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Authentication required or token invalid
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per 15 minutes per user
- **ML prediction endpoint**: 60 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1689430800
```

## SDK Examples

### JavaScript/Node.js

```javascript
const WaterQualityAPI = require('@your-org/water-quality-sdk');

const api = new WaterQualityAPI({
  baseURL: 'https://api.yourdomain.com',
  apiKey: 'your-api-key'
});

// Make prediction
const prediction = await api.predictions.create({
  waterParameters: {
    ph: 7.2,
    hardness: 180.5,
    // ... other parameters
  }
});

console.log(prediction.result);
```

### Python

```python
from water_quality_sdk import WaterQualityAPI

api = WaterQualityAPI(
    base_url='https://api.yourdomain.com',
    api_key='your-api-key'
)

# Make prediction
prediction = api.predictions.create({
    'water_parameters': {
        'ph': 7.2,
        'hardness': 180.5,
        # ... other parameters
    }
})

print(prediction['result'])
```

### cURL Examples

```bash
# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Make prediction with token
curl -X POST https://api.yourdomain.com/api/predictions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"waterParameters":{"ph":7.2,"hardness":180.5}}'
```

## Changelog

### Version 2.0.0 (Current)
- Added JWT refresh token support
- Enhanced validation and error handling
- Added prediction statistics endpoint
- Improved security with rate limiting
- Added comprehensive monitoring endpoints

### Version 1.0.0
- Initial API release
- Basic authentication and prediction functionality