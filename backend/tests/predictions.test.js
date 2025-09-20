const request = require('supertest');
const app = require('../server');

describe('Prediction Routes', () => {
  let user, token;

  beforeEach(async () => {
    user = await global.testUtils.createTestUser();
    token = global.testUtils.generateTestToken(user._id);
  });

  describe('POST /api/predictions/save', () => {
    test('should save prediction with valid data', async () => {
      const predictionData = {
        input: {
          pH: 7.0,
          hardness: 200,
          solids: 20000,
          chloramines: 7.0,
          sulfate: 300,
          conductivity: 500,
          organicCarbon: 15,
          trihalomethanes: 80,
          turbidity: 4.0
        },
        prediction: 1,
        probability: 0.8,
        result: 'Safe',
        confidence: 0.8
      };

      const response = await request(app)
        .post('/api/predictions/save')
        .set('Authorization', `Bearer ${token}`)
        .send(predictionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prediction).toBe(1);
      expect(response.body.data.result).toBe('Safe');
      expect(response.body.data.userId).toBe(user._id.toString());
    });

    test('should reject prediction with invalid input', async () => {
      const predictionData = {
        input: {
          pH: -1, // Invalid pH
          hardness: 200
          // Missing required fields
        },
        prediction: 1,
        probability: 0.8,
        result: 'Safe',
        confidence: 0.8
      };

      const response = await request(app)
        .post('/api/predictions/save')
        .set('Authorization', `Bearer ${token}`)
        .send(predictionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject unauthorized request', async () => {
      const predictionData = {
        input: {
          pH: 7.0,
          hardness: 200,
          solids: 20000,
          chloramines: 7.0,
          sulfate: 300,
          conductivity: 500,
          organicCarbon: 15,
          trihalomethanes: 80,
          turbidity: 4.0
        },
        prediction: 1,
        probability: 0.8,
        result: 'Safe',
        confidence: 0.8
      };

      const response = await request(app)
        .post('/api/predictions/save')
        .send(predictionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/predictions/history', () => {
    beforeEach(async () => {
      // Create test predictions
      for (let i = 0; i < 5; i++) {
        await global.testUtils.createTestPrediction(user._id, {
          prediction: i % 2,
          result: i % 2 === 1 ? 'Safe' : 'Not Safe'
        });
      }
    });

    test('should get user prediction history', async () => {
      const response = await request(app)
        .get('/api/predictions/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toHaveLength(5);
      expect(response.body.data.pagination.total).toBe(5);
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/predictions/history?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(5);
    });

    test('should sort results', async () => {
      const response = await request(app)
        .get('/api/predictions/history?sortBy=prediction&sortOrder=asc')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toHaveLength(5);
      
      // Check if sorted by prediction ascending
      const predictions = response.body.data.predictions.map(p => p.prediction);
      expect(predictions[0]).toBeLessThanOrEqual(predictions[predictions.length - 1]);
    });

    test('should reject unauthorized request', async () => {
      const response = await request(app)
        .get('/api/predictions/history')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/predictions/stats', () => {
    beforeEach(async () => {
      // Create test predictions with known distribution
      await global.testUtils.createTestPrediction(user._id, { prediction: 1, confidence: 0.9 });
      await global.testUtils.createTestPrediction(user._id, { prediction: 1, confidence: 0.8 });
      await global.testUtils.createTestPrediction(user._id, { prediction: 0, confidence: 0.7 });
    });

    test('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/predictions/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPredictions).toBe(3);
      expect(response.body.data.safePredictions).toBe(2);
      expect(response.body.data.unsafePredictions).toBe(1);
      expect(response.body.data.safePercentage).toBe('66.67');
      expect(response.body.data.avgConfidence).toBeCloseTo(0.8, 1);
    });

    test('should return empty stats for new user', async () => {
      const newUser = await global.testUtils.createTestUser({ email: 'new@example.com' });
      const newToken = global.testUtils.generateTestToken(newUser._id);

      const response = await request(app)
        .get('/api/predictions/stats')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalPredictions).toBe(0);
      expect(response.body.data.safePredictions).toBe(0);
      expect(response.body.data.unsafePredictions).toBe(0);
    });
  });

  describe('GET /api/predictions/:id', () => {
    let prediction;

    beforeEach(async () => {
      prediction = await global.testUtils.createTestPrediction(user._id);
    });

    test('should get prediction by ID', async () => {
      const response = await request(app)
        .get(`/api/predictions/${prediction._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(prediction._id.toString());
      expect(response.body.data.userId).toBe(user._id.toString());
    });

    test('should reject request for non-existent prediction', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/predictions/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should reject request with invalid ID format', async () => {
      const response = await request(app)
        .get('/api/predictions/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/predictions/:id', () => {
    let prediction;

    beforeEach(async () => {
      prediction = await global.testUtils.createTestPrediction(user._id);
    });

    test('should delete prediction by ID', async () => {
      const response = await request(app)
        .delete(`/api/predictions/${prediction._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    test('should reject deletion of non-existent prediction', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/predictions/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});