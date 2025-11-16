// lib/firestore.ts - USE THIS
function getFirebaseAdmin() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('Missing FIREBASE_ADMIN_PRIVATE_KEY');
  }
  
  // Decode only when function is called (at runtime)
  const credentials = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey.replace(/\\n/g, '\n')
  };
  
  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
  }
  
  return admin;
}

// Call this function inside API routes, not at module level
export const db = () => getFirebaseAdmin().firestore();
