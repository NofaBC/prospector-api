import admin from 'firebase-admin';

let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * This runs at runtime (not build time) to avoid environment variable issues
 */
function initFirebase() {
  if (initialized) return admin;
  
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error(
        'Missing required Firebase environment variables: ' +
        `FIREBASE_ADMIN_PROJECT_ID=${!!projectId}, ` +
        `FIREBASE_ADMIN_CLIENT_EMAIL=${!!clientEmail}, ` +
        `FIREBASE_ADMIN_PRIVATE_KEY=${!!privateKey}`
      );
    }

    // Only initialize if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Replace escaped newlines with actual newlines
          privateKey: privateKey.replace(/\\n/g, '\n')
        })
      });
    }

    initialized = true;
    return admin;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

/**
 * Get Firestore instance
 * Call this function from your API routes, not at module level
 */
export function getFirestore() {
  const app = initFirebase();
  return app.firestore();
}

/**
 * Get Firebase Admin instance
 */
export function getAdmin() {
  return initFirebase();
}

/**
 * Helper to get a document reference
 */
export function getDocRef(collection: string, docId: string) {
  return getFirestore().collection(collection).doc(docId);
}

/**
 * Helper to get a collection reference
 */
export function getCollectionRef(collection: string) {
  return getFirestore().collection(collection);
}
