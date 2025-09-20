const express = require('express');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, refreshTokenValidation } = require('../middleware/validation');
const { auth, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Apply auth rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', registerValidation, asyncHandler(authController.register));
router.post('/login', loginValidation, asyncHandler(authController.login));
router.post('/refresh-token', refreshTokenValidation, asyncHandler(authController.refreshToken));

// Protected routes
router.post('/logout', auth, asyncHandler(authController.logout));
router.get('/profile', auth, asyncHandler(authController.getProfile));

// Admin routes
router.get('/users', auth, requireAdmin, asyncHandler(authController.getAllUsers));

module.exports = router;