const { body, param, query } = require('express-validator');

// User validation schemas
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format')
];

// Prediction validation schemas
const savePredictionValidation = [
  body('input')
    .isObject()
    .withMessage('Input must be an object'),
  body('input.pH')
    .isFloat({ min: 0, max: 14 })
    .withMessage('pH must be a number between 0 and 14'),
  body('input.hardness')
    .isFloat({ min: 0 })
    .withMessage('Hardness must be a non-negative number'),
  body('input.solids')
    .isFloat({ min: 0 })
    .withMessage('Solids must be a non-negative number'),
  body('input.chloramines')
    .isFloat({ min: 0 })
    .withMessage('Chloramines must be a non-negative number'),
  body('input.sulfate')
    .isFloat({ min: 0 })
    .withMessage('Sulfate must be a non-negative number'),
  body('input.conductivity')
    .isFloat({ min: 0 })
    .withMessage('Conductivity must be a non-negative number'),
  body('input.organicCarbon')
    .isFloat({ min: 0 })
    .withMessage('Organic carbon must be a non-negative number'),
  body('input.trihalomethanes')
    .isFloat({ min: 0 })
    .withMessage('Trihalomethanes must be a non-negative number'),
  body('input.turbidity')
    .isFloat({ min: 0 })
    .withMessage('Turbidity must be a non-negative number'),
  body('prediction')
    .isIn([0, 1])
    .withMessage('Prediction must be 0 or 1'),
  body('probability')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Probability must be a number between 0 and 1'),
  body('result')
    .isIn(['Safe', 'Not Safe'])
    .withMessage('Result must be either "Safe" or "Not Safe"'),
  body('confidence')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Confidence must be a number between 0 and 1')
];

// Query validation schemas
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'prediction', 'confidence', 'result'])
    .withMessage('Sort field must be one of: createdAt, prediction, confidence, result'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"')
];

// Parameter validation schemas
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// ML prediction input validation
const mlPredictionValidation = [
  body('features')
    .isArray({ min: 9, max: 9 })
    .withMessage('Features must be an array of exactly 9 numbers'),
  body('features.*')
    .isFloat()
    .withMessage('All features must be numbers')
];

// Password update validation
const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  savePredictionValidation,
  paginationValidation,
  mongoIdValidation,
  mlPredictionValidation,
  updatePasswordValidation
};