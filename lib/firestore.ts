import admin from 'firebase-admin';
import { getEnvVar } from './env';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
admin.initializeApp({
credential: admin.credential.cert({
projectId: getEnvVar('FIREBASE_ADMIN_PROJECT_ID'),
clientEmail: getEnvVar('FIREBASE_ADMIN_CLIENT_EMAIL'),
privateKey: getEnvVar('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\n/g, '\n')
})
});
}

const db = admin.firestore();

export { db, admin };

export interface Job {
id: string;
status: 'queued' | 'running' | 'done' | 'error' | 'canceled';
seedUrl: string;
inferredKeyword: string;
area: string;
radius: number;
maxResults: number;
sheetId: string;
sheetUrl: string;
cursor?: {
pageToken?: string;
offset?: number;
};
counts: {
found: number;
appended: number;
deduped: number;
errors: number;
};
createdAt: string;
updatedAt: string;
webhookUrl?: string;
}

export interface Prospect {
jobId: string;
placeId: string;
name: string;
phone: string;
address: string;
website: string;
domain: string;
email?: string;
lat: number;
lng: number;
types: string[];
rating?: number;
user_ratings_total?: number;
source: 'places';
createdAt: string;
}

export const createJob = async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
const doc = await db.collection('jobs').add({
...job,
createdAt: new Date().toISOString(),
updatedAt: new Date().toISOString()
});
return doc.id;
};

export const getJob = async (jobId: string): Promise<Job | null> => {
const doc = await db.collection('jobs').doc(jobId).get();
if (!doc.exists) return null;

const data = doc.data();
return {
id: doc.id,
...data
} as Job;
};

export const updateJob = async (jobId: string, updates: Partial<Job>): Promise<void> => {
await db.collection('jobs').doc(jobId).update({
...updates,
updatedAt: new Date().toISOString()
});
};

export const deleteJob = async (jobId: string): Promise<void> => {
await db.collection('jobs').doc(jobId).delete();
};

export const createProspect = async (prospect: Omit<Prospect, 'createdAt'>): Promise<void> => {
await db.collection('prospects').doc(${prospect.jobId}_${prospect.placeId}).set({
...prospect,
createdAt: new Date().toISOString()
});
};

export const getProspectsSample = async (jobId: string, limit: number = 10): Promise<Prospect[]> => {
const snapshot = await db.collection('prospects')
.where('jobId', '==', jobId)
.limit(limit)
.get();

return snapshot.docs.map(doc => doc.data() as Prospect);
};

export const getRecentJobs = async (limit: number = 10): Promise<Job[]> => {
const snapshot = await db.collection('jobs')
.orderBy('createdAt', 'desc')
.limit(limit)
.get();

return snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
} as Job));
};
