// lib/firestore.ts
import admin from 'firebase-admin';

type FirebaseCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

/**
 * Custom error to surface Firestore/Firebase configuration problems clearly.
 */
export class FirestoreConfigError extends Error {
  constructor(message?: string) {
    super(
      message ||
        'Firestore is not configured. Provide either FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY (or *_BASE64) or a FIREBASE_ADMIN_SERVICE_ACCOUNT JSON so the WareCell datastore can be reached.'
    );
    this.name = 'FirestoreConfigError';
  }
}

let initialized = false;
let cachedCredentials: FirebaseCredentials | null = null;

function normalizePrivateKey(privateKey: string) {
  // Replace escaped newlines with actual newlines
  return privateKey.replace(/\\n/g, '\n');
}

function parseServiceAccount(json: string): FirebaseCredentials {
  try {
    const parsed = JSON.parse(json);
    const projectId = parsed.project_id as string | undefined;
    const clientEmail = parsed.client_email as string | undefined;
    const privateKey = parsed.private_key as string | undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new FirestoreConfigError(
        'Invalid FIREBASE_ADMIN_SERVICE_ACCOUNT JSON. Expected project_id, client_email, and private_key fields.'
      );
    }

    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey)
    };
  } catch (error) {
    if (error instanceof FirestoreConfigError) throw error;
    throw new FirestoreConfigError('Unable to parse FIREBASE_ADMIN_SERVICE_ACCOUNT JSON.');
  }
}

function decodeBase64(value?: string) {
  if (!value) return undefined;
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    throw new FirestoreConfigError('Failed to decode base64 Firebase credential.');
  }
}

function resolveFirebaseCredentials(): FirebaseCredentials {
  if (cachedCredentials) return cachedCredentials;

  // Prefer full JSON blobs (plain or base64)
  const serviceAccountJson =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ??
    process.env.FIREBASE_ADMIN_CREDENTIALS_JSON ??
    decodeBase64(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 ??
        process.env.FIREBASE_ADMIN_CREDENTIALS_JSON_BASE64
    );

  if (serviceAccountJson) {
    cachedCredentials = parseServiceAccount(serviceAccountJson);
    return cachedCredentials;
  }

  // Fallback to discrete fields (plain or base64 private key)
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyPlain = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKeyFromB64 = decodeBase64(process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64);
  const privateKey = privateKeyPlain ?? privateKeyFromB64;

  if (projectId && clientEmail && privateKey) {
    cachedCredentials = {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey)
    };
    return cachedCredentials;
  }

  throw new FirestoreConfigError();
}

export function isFirestoreConfigured() {
  try {
    resolveFirebaseCredentials();
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize Firebase Admin SDK at runtime (not build time).
 */
function initFirebase() {
  if (initialized) return admin;

  const credentials = resolveFirebaseCredentials();

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: credentials.projectId,
          clientEmail: credentials.clientEmail,
          privateKey: credentials.privateKey
        })
      });
    }

    initialized = true;
    return admin;
  } catch (error) {
    // Keep the original error for debugging, but surface a clear message upstream
    // eslint-disable-next-line no-console
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

/**
 * Get Firestore instance (call from API routes, not at module top-level).
 */
export function getFirestore() {
  const app = initFirebase();
  return app.firestore();
}

/**
 * Get Firebase Admin instance.
 */
export function getAdmin() {
  return initFirebase();
}

/**
 * Helper: document reference.
 */
export function getDocRef(collection: string, docId: string) {
  return getFirestore().collection(collection).doc(docId);
}

/**
 * Helper: collection reference.
 */
export function getCollectionRef(collection: string) {
  return getFirestore().collection(collection);
}

/**
 * Fetch a small sample of prospects for a given job.
 */
export async function getProspectsSample(jobId: string, limit: number = 5) {
  try {
    const snapshot = await getFirestore()
      .collection('prospects')
      .where('jobId', '==', jobId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching prospects sample for ${jobId}:`, error);
    return [];
  }
}
