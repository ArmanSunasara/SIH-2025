const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthService {
  async registerUser(email, password) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'User already exists with this email');
      }

      // Create new user
      const user = new User({ email, password });
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user._id);

      // Save refresh token
      await this.saveRefreshToken(user._id, refreshToken);

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Registration service error: ${error.message}`);
      throw new ApiError(500, 'Registration failed');
    }
  }

  async loginUser(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError(400, 'Invalid credentials');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new ApiError(400, 'Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user._id);

      // Save refresh token
      await this.saveRefreshToken(user._id, refreshToken);

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          lastLogin: user.lastLogin
        }
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Login service error: ${error.message}`);
      throw new ApiError(500, 'Login failed');
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshsecret');
      
      // Check if refresh token exists in database
      const tokenDoc = await RefreshToken.findOne({ 
        token: refreshToken, 
        userId: decoded.userId,
        isActive: true 
      });
      
      if (!tokenDoc) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Check if token is expired
      if (tokenDoc.expiresAt < new Date()) {
        await RefreshToken.findByIdAndDelete(tokenDoc._id);
        throw new ApiError(401, 'Refresh token expired');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(decoded.userId);

      // Replace old refresh token with new one
      await RefreshToken.findByIdAndDelete(tokenDoc._id);
      await this.saveRefreshToken(decoded.userId, newRefreshToken);

      return {
        token: accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Token refresh service error: ${error.message}`);
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(refreshToken) {
    try {
      if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
      }
    } catch (error) {
      logger.error(`Logout service error: ${error.message}`);
      // Don't throw error for logout, just log it
    }
  }

  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      return {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`Get profile service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch user profile');
    }
  }

  async generateTokens(userId) {
    const accessTokenPayload = { userId };
    const refreshTokenPayload = { userId };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET || 'refreshsecret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId, token) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const refreshTokenDoc = new RefreshToken({
        userId,
        token,
        expiresAt,
        isActive: true
      });

      await refreshTokenDoc.save();
    } catch (error) {
      logger.error(`Save refresh token error: ${error.message}`);
      throw new ApiError(500, 'Failed to save refresh token');
    }
  }

  async validateAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw error;
    }
  }

  async getAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;
      
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      const total = await User.countDocuments();
      
      return {
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      logger.error(`Get all users service error: ${error.message}`);
      throw new ApiError(500, 'Failed to fetch users');
    }
  }
}

module.exports = new AuthService();