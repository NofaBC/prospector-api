/**
 * Simple logging utility
 */

export function logInfo(message: string, ...args: any[]) {
  console.log(`[INFO] ${message}`, ...args);
}

export function logError(message: string, error?: any) {
  console.error(`[ERROR] ${message}`, error);
}

export function logWarning(message: string, ...args: any[]) {
  console.warn(`[WARN] ${message}`, ...args);
}

export function logDebug(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}
