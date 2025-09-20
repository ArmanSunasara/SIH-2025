// Test setup file
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB
  await mongoServer.stop();
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../models/User');
    const defaultUser = {
      email: 'test@example.com',
      password: 'testpassword123'
    };
    const user = new User({ ...defaultUser, ...userData });
    return await user.save();
  },
  
  // Create test prediction
  createTestPrediction: async (userId, predictionData = {}) => {
    const Prediction = require('../models/Prediction');
    const defaultPrediction = {
      userId,
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
    const prediction = new Prediction({ ...defaultPrediction, ...predictionData });
    return await prediction.save();
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' }
    );
  }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests