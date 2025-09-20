const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', errors.array());
      }

      const { email, password } = req.body;
      
      logger.info(`Registration attempt for email: ${email}`);
      
      const result = await authService.registerUser(email, password);
      
      logger.info(`User registered successfully: ${email}`);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error(`Registration error: ${error.message}`, { email: req.body.email });
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation error', errors.array());
      }

      const { email, password } = req.body;
      
      logger.info(`Login attempt for email: ${email}`);
      
      const result = await authService.loginUser(email, password);
      
      logger.info(`User logged in successfully: ${email}`);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`, { email: req.body.email });
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required');
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      logger.error(`Token refresh error: ${error.message}`);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      logger.info(`User logged out: ${req.user?.email}`);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user._id);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error(`Get profile error: ${error.message}`, { userId: req.user?._id });
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const users = await authService.getAllUsers({ page, limit });
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error(`Get all users error: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new AuthController();