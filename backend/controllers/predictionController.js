const { validationResult } = require('express-validator');
const predictionService = require('../services/predictionService');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class PredictionController {
  async savePrediction(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', errors.array());
      }

      const { input, prediction, probability, result, confidence } = req.body;
      const userId = req.user._id;

      logger.info(`Saving prediction for user: ${userId}`);

      const savedPrediction = await predictionService.savePrediction({
        userId,
        input,
        prediction,
        probability,
        result,
        confidence
      });

      logger.info(`Prediction saved successfully: ${savedPrediction._id}`);

      res.status(201).json({
        success: true,
        message: 'Prediction saved successfully',
        data: savedPrediction
      });
    } catch (error) {
      logger.error(`Save prediction error: ${error.message}`, { userId: req.user?._id });
      next(error);
    }
  }

  async getPredictionHistory(req, res, next) {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'desc';

      logger.info(`Fetching prediction history for user: ${userId}`);

      const result = await predictionService.getUserPredictions(userId, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Get prediction history error: ${error.message}`, { userId: req.user?._id });
      next(error);
    }
  }

  async getPredictionStats(req, res, next) {
    try {
      const userId = req.user._id;

      logger.info(`Fetching prediction stats for user: ${userId}`);

      const stats = await predictionService.getUserStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Get prediction stats error: ${error.message}`, { userId: req.user?._id });
      next(error);
    }
  }

  async getPredictionById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      logger.info(`Fetching prediction by ID: ${id} for user: ${userId}`);

      const prediction = await predictionService.getPredictionById(id, userId);

      if (!prediction) {
        throw new ApiError(404, 'Prediction not found');
      }

      res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      logger.error(`Get prediction by ID error: ${error.message}`, { 
        predictionId: req.params.id,
        userId: req.user?._id 
      });
      next(error);
    }
  }

  async deletePrediction(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      logger.info(`Deleting prediction: ${id} for user: ${userId}`);

      const deleted = await predictionService.deletePrediction(id, userId);

      if (!deleted) {
        throw new ApiError(404, 'Prediction not found');
      }

      logger.info(`Prediction deleted successfully: ${id}`);

      res.json({
        success: true,
        message: 'Prediction deleted successfully'
      });
    } catch (error) {
      logger.error(`Delete prediction error: ${error.message}`, { 
        predictionId: req.params.id,
        userId: req.user?._id 
      });
      next(error);
    }
  }

  async getGlobalStats(req, res, next) {
    try {
      logger.info('Fetching global prediction stats');

      const stats = await predictionService.getGlobalStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Get global stats error: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new PredictionController();