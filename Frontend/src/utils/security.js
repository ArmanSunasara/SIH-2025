import DOMPurify from 'dompurify';
import config from '../config';

// Input sanitization utilities
export const sanitizeUtils = {
  // Sanitize HTML content
  sanitizeHtml: (dirty, options = {}) => {
    const defaultOptions = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
      ALLOWED_ATTR: ['class'],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      ...options
    };

    return DOMPurify.sanitize(dirty, defaultOptions);
  },

  // Sanitize user input (remove all HTML)
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  },

  // Sanitize form data object
  sanitizeFormData: (formData) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeUtils.sanitizeInput(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeUtils.sanitizeInput(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  },

  // Validate and sanitize email
  sanitizeEmail: (email) => {
    const sanitized = sanitizeUtils.sanitizeInput(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized.toLowerCase();
  },

  // Validate and sanitize numeric input
  sanitizeNumeric: (value, options = {}) => {
    const { min, max, decimals = 2 } = options;
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      throw new Error('Invalid numeric value');
    }
    
    if (min !== undefined && num < min) {
      throw new Error(`Value must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new Error(`Value must not exceed ${max}`);
    }
    
    return Number(num.toFixed(decimals));
  }
};

// Content Security Policy utilities
export const cspUtils = {
  // Generate CSP nonce for inline scripts
  generateNonce: () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
  },

  // Set CSP meta tag
  setCSPMeta: (nonce) => {
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspUtils.generateCSPContent(nonce);
    document.head.appendChild(meta);
  },

  // Generate CSP content string
  generateCSPContent: (nonce) => {
    const policies = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' " + config.apiUrl + " " + config.mlApiUrl,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    return policies.join('; ');
  }
};

// XSS protection utilities
export const xssUtils = {
  // Escape HTML entities
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Validate and sanitize URL
  sanitizeUrl: (url) => {
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  },

  // Check for potential XSS patterns
  detectXSS: (input) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi,
      /<link\b/gi,
      /<meta\b/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }
};

// Input validation utilities
export const validationUtils = {
  // Validate password strength
  validatePassword: (password) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    };
  },

  // Validate water quality parameters
  validateWaterQuality: (params) => {
    const validations = {
      pH: { min: 0, max: 14, required: true },
      hardness: { min: 0, max: 1000, required: true },
      solids: { min: 0, max: 50000, required: true },
      chloramines: { min: 0, max: 20, required: true },
      sulfate: { min: 0, max: 1000, required: true },
      conductivity: { min: 0, max: 2000, required: true },
      organicCarbon: { min: 0, max: 50, required: true },
      trihalomethanes: { min: 0, max: 200, required: true },
      turbidity: { min: 0, max: 20, required: true }
    };

    const errors = [];
    const sanitized = {};

    for (const [key, rules] of Object.entries(validations)) {
      const value = params[key];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }
      
      try {
        sanitized[key] = sanitizeUtils.sanitizeNumeric(value, {
          min: rules.min,
          max: rules.max
        });
      } catch (error) {
        errors.push(`${key}: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }
};

// Secure storage utilities
export const storageUtils = {
  // Encrypt data before storing (basic implementation)
  setSecureItem: (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      const encoded = btoa(serialized); // Basic encoding, use proper encryption in production
      localStorage.setItem(key, encoded);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  },

  // Decrypt data after retrieving
  getSecureItem: (key) => {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      
      const serialized = atob(encoded);
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  },

  // Remove item securely
  removeSecureItem: (key) => {
    localStorage.removeItem(key);
  },

  // Clear all secure storage
  clearSecureStorage: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Initialize security features
export const initSecurity = () => {
  // Set CSP if nonce is available
  if (config.cspNonce) {
    cspUtils.setCSPMeta(config.cspNonce);
  }

  // Configure DOMPurify
  DOMPurify.setConfig({
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  });

  // Add custom hooks for additional security
  DOMPurify.addHook('beforeSanitizeElements', (node) => {
    // Remove any suspicious attributes
    if (node.hasAttributes) {
      const attrs = Array.from(node.attributes);
      attrs.forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'javascript') {
          node.removeAttribute(attr.name);
        }
      });
    }
  });
};

export default {
  sanitizeUtils,
  cspUtils,
  xssUtils,
  validationUtils,
  storageUtils,
  initSecurity
};