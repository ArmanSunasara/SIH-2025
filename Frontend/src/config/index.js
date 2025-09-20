// Environment configuration utility
class Config {
  constructor() {
    this.env = process.env.REACT_APP_ENV || 'development';
    this.isDevelopment = this.env === 'development';
    this.isProduction = this.env === 'production';
    this.isTest = process.env.NODE_ENV === 'test';
  }

  // API Configuration
  get apiUrl() {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  get mlApiUrl() {
    return process.env.REACT_APP_ML_API_URL || 'http://localhost:5001';
  }

  // Application Settings
  get version() {
    return process.env.REACT_APP_VERSION || '1.0.0';
  }

  get debug() {
    return process.env.REACT_APP_DEBUG === 'true';
  }

  get logLevel() {
    return process.env.REACT_APP_LOG_LEVEL || 'info';
  }

  // External Services
  get analyticsEnabled() {
    return process.env.REACT_APP_ANALYTICS_ENABLED === 'true';
  }

  get sentryDsn() {
    return process.env.REACT_APP_SENTRY_DSN || '';
  }

  // Feature Flags
  get features() {
    return {
      advancedStats: process.env.REACT_APP_FEATURE_ADVANCED_STATS === 'true',
      exportData: process.env.REACT_APP_FEATURE_EXPORT_DATA === 'true',
    };
  }

  // Security
  get cspNonce() {
    return process.env.REACT_APP_CSP_NONCE || '';
  }

  // HTTP Configuration
  get httpTimeout() {
    return parseInt(process.env.REACT_APP_HTTP_TIMEOUT) || 10000;
  }

  get httpRetries() {
    return parseInt(process.env.REACT_APP_HTTP_RETRIES) || 3;
  }

  // Validation
  validate() {
    const requiredEnvVars = [
      'REACT_APP_API_URL',
      'REACT_APP_ML_API_URL'
    ];

    const missing = requiredEnvVars.filter(
      varName => !process.env[varName]
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }

    // Validate URLs
    try {
      new URL(this.apiUrl);
      new URL(this.mlApiUrl);
    } catch (error) {
      throw new Error('Invalid API URL configuration');
    }
  }

  // Get configuration object for debugging
  getAll() {
    return {
      env: this.env,
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isTest: this.isTest,
      apiUrl: this.apiUrl,
      mlApiUrl: this.mlApiUrl,
      version: this.version,
      debug: this.debug,
      logLevel: this.logLevel,
      analyticsEnabled: this.analyticsEnabled,
      features: this.features,
      httpTimeout: this.httpTimeout,
      httpRetries: this.httpRetries
    };
  }
}

// Create and validate configuration instance
const config = new Config();

// Only validate in non-test environments
if (!config.isTest) {
  try {
    config.validate();
  } catch (error) {
    console.error('Configuration validation failed:', error.message);
    if (config.isProduction) {
      throw error; // Fail fast in production
    }
  }
}

// Log configuration in development
if (config.isDevelopment && config.debug) {
  console.log('App Configuration:', config.getAll());
}

export default config;