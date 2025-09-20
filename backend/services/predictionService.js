const Prediction = require('../models/Prediction');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class PredictionService {
  async savePrediction(predictionData) {
    try {
      const { userId, input, prediction, probability, result, confidence } = predictionData;

      // Validate input data
      this.validatePredictionInput(input);

      // Create new prediction record
      const predictionRecord = new Prediction({
        userId,
        input: {
          pH: input.pH,
          hardness: input.hardness,
          solids: input.solids,
          chloramines: input.chloramines,
          sulfate: input.sulfate,
          conductivity: input.conductivity,
          organicCarbon: input.organicCarbon,
          trihalomethanes: input.trihalomethanes,
          turbidity: input.turbidity
        },
        prediction,
        probability,
        result,
        confidence
      });

      await predictionRecord.save();

      return predictionRecord;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Save prediction service error: ${error.message}`);
      throw new ApiError(500, 'Failed to save prediction');
    }
  }

  async getUserPredictions(userId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;

      // Validate sort parameters
      const allowedSortFields = ['createdAt', 'prediction', 'confidence', 'result'];
      const allowedSortOrders = ['asc', 'desc'];

      if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, 'Invalid sort field');
      }

      if (!allowedSortOrders.includes(sortOrder)) {
        throw new ApiError(400, 'Invalid sort order');
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const predictions = await Prediction.find({ userId })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Prediction.countDocuments({ userId });

      return {
        predictions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Get user predictions service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch predictions');
    }
  }

  async getUserStats(userId) {
    try {
      const stats = await Prediction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalPredictions: { $sum: 1 },
            safePredictions: {
              $sum: { $cond: [{ $eq: ['$prediction', 1] }, 1, 0] }
            },
            unsafePredictions: {
              $sum: { $cond: [{ $eq: ['$prediction', 0] }, 1, 0] }
            },
            avgConfidence: { $avg: '$confidence' },
            maxConfidence: { $max: '$confidence' },
            minConfidence: { $min: '$confidence' },
            lastPrediction: { $max: '$createdAt' }
          }
        }
      ]);

      const result = stats[0] || {
        totalPredictions: 0,
        safePredictions: 0,
        unsafePredictions: 0,
        avgConfidence: 0,
        maxConfidence: 0,
        minConfidence: 0,
        lastPrediction: null
      };

      // Calculate additional metrics
      result.safePercentage = result.totalPredictions > 0 ? 
        ((result.safePredictions / result.totalPredictions) * 100).toFixed(2) : 0;
      
      result.unsafePercentage = result.totalPredictions > 0 ? 
        ((result.unsafePredictions / result.totalPredictions) * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      logger.error(`Get user stats service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch user statistics');
    }
  }

  async getPredictionById(predictionId, userId) {
    try {
      const prediction = await Prediction.findOne({ 
        _id: predictionId, 
        userId 
      }).lean();

      return prediction;
    } catch (error) {
      logger.error(`Get prediction by ID service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch prediction');
    }
  }

  async deletePrediction(predictionId, userId) {
    try {
      const result = await Prediction.findOneAndDelete({ 
        _id: predictionId, 
        userId 
      });

      return result;
    } catch (error) {
      logger.error(`Delete prediction service error: ${error.message}`);
      throw new ApiError(500, 'Failed to delete prediction');
    }
  }

  async getGlobalStats() {
    try {
      const stats = await Prediction.aggregate([
        {
          $group: {
            _id: null,
            totalPredictions: { $sum: 1 },
            safePredictions: {
              $sum: { $cond: [{ $eq: ['$prediction', 1] }, 1, 0] }
            },
            unsafePredictions: {
              $sum: { $cond: [{ $eq: ['$prediction', 0] }, 1, 0] }
            },
            avgConfidence: { $avg: '$confidence' },
            totalUsers: { $addToSet: '$userId' }
          }
        },
        {
          $addFields: {
            totalUsers: { $size: '$totalUsers' }
          }
        }
      ]);

      const result = stats[0] || {
        totalPredictions: 0,
        safePredictions: 0,
        unsafePredictions: 0,
        avgConfidence: 0,
        totalUsers: 0
      };

      result.safePercentage = result.totalPredictions > 0 ? 
        ((result.safePredictions / result.totalPredictions) * 100).toFixed(2) : 0;

      return result;
    } catch (error) {
      logger.error(`Get global stats service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch global statistics');
    }
  }

  validatePredictionInput(input) {
    const requiredFields = [
      'pH', 'hardness', 'solids', 'chloramines', 'sulfate', 
      'conductivity', 'organicCarbon', 'trihalomethanes', 'turbidity'
    ];

    for (const field of requiredFields) {
      if (input[field] === undefined || input[field] === null) {
        throw new ApiError(400, `Missing required field: ${field}`);
      }
      
      if (typeof input[field] !== 'number' || isNaN(input[field])) {
        throw new ApiError(400, `Invalid value for field ${field}: must be a number`);
      }

      if (input[field] < 0) {
        throw new ApiError(400, `Invalid value for field ${field}: must be non-negative`);
      }
    }

    // Validate specific ranges
    if (input.pH < 0 || input.pH > 14) {
      throw new ApiError(400, 'pH must be between 0 and 14');
    }
  }

  async getRecentPredictions(userId, limit = 5) {
    try {
      const predictions = await Prediction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return predictions;
    } catch (error) {
      logger.error(`Get recent predictions service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch recent predictions');
    }
  }
}

module.exports = new PredictionService();