/**
 * Environment variable validation and access
 * All env vars are validated at runtime, not build time
 */

export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  
  return parsed;
}

export function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value.toLowerCase() === 'true' || value === '1';
}

// Export specific env vars as functions (lazy evaluation)
export const env = {
  // App
  get appUrl() {
    return getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  },
  
  // Firebase
  get firebaseProjectId() {
    return getEnv('FIREBASE_ADMIN_PROJECT_ID');
  },
  get firebaseClientEmail() {
    return getEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
  },
  get firebasePrivateKey() {
    return getEnv('FIREBASE_ADMIN_PRIVATE_KEY');
  },
  
  // Google
  get googleProjectId() {
    return getEnv('GOOGLE_PROJECT_ID');
  },
  get googleClientEmail() {
    return getEnv('GOOGLE_CLIENT_EMAIL');
  },
  get googlePrivateKey() {
    return getEnv('GOOGLE_PRIVATE_KEY');
  },
  get googleMapsApiKey() {
    return getEnv('GOOGLE_MAPS_API_KEY');
  },
  
  // Optional
  get defaultWebhookUrl() {
    return getEnv('DEFAULT_WEBHOOK_URL', '');
  },
  get rateLimitWindow() {
    return getEnvNumber('RATE_LIMIT_WINDOW', 600);
  },
  get rateLimitMax() {
    return getEnvNumber('RATE_LIMIT_MAX', 60);
  },
  get batchSize() {
    return getEnvNumber('BATCH_SIZE', 30);
  },
  get maxResultsCap() {
    return getEnvNumber('MAX_RESULTS_CAP', 300);
  }
};
