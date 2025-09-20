const express = require('express');
const predictionController = require('../controllers/predictionController');
const { savePredictionValidation, paginationValidation, mongoIdValidation } = require('../middleware/validation');
const { auth, requireOwnership } = require('../middleware/auth');
const { predictionLimiter } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');
const Prediction = require('../models/Prediction');

const router = express.Router();

// Apply prediction rate limiting to save and stats routes
router.use(['/save', '/stats'], predictionLimiter);

// Protected routes (require authentication)
router.use(auth);

// Save prediction result
router.post('/save', savePredictionValidation, asyncHandler(predictionController.savePrediction));

// Get user's prediction history
router.get('/history', paginationValidation, asyncHandler(predictionController.getPredictionHistory));

// Get prediction statistics for user
router.get('/stats', asyncHandler(predictionController.getPredictionStats));

// Get specific prediction by ID (with ownership check)
router.get('/:id', 
  mongoIdValidation,
  requireOwnership(Prediction),
  asyncHandler(predictionController.getPredictionById)
);

// Delete prediction by ID (with ownership check)
router.delete('/:id',
  mongoIdValidation,
  requireOwnership(Prediction),
  asyncHandler(predictionController.deletePrediction)
);

// Get global statistics (admin only or public depending on requirements)
router.get('/global/stats', asyncHandler(predictionController.getGlobalStats));

module.exports = router;