import {
Job,
Prospect,
createJob as createFirestoreJob,
getJob,
updateJob,
createProspect,
getProspectsSample
} from './firestore';
import { searchText, searchNearby, getPlaceDetails } from './google/places';
import { geocode, GeocodeResult } from './google/geocode';
import { createSheet, appendRowsToSheet, shareSheetWithPublic } from './google/sheets';
import { extractEmailsFromWebsite } from './enrich';
import { Deduplicator, DedupeKey } from './dedupe';
import { logging } from './logging';
import { getEnvVarAsNumberWithDefault } from './env';

const BATCH_SIZE = getEnvVarAsNumberWithDefault('BATCH_SIZE', 30);

export interface JobParams {
seedUrl: string;
area: string;
keywordOverride?: string;
radius: number;
maxResults: number;
webhookUrl?: string;
}

export const createJob = async (params: JobParams): Promise<{ jobId: string, sheetId: string, sheetUrl: string, counts: Job['counts'] }> => {
// Infer keyword from seed URL if not provided
const inferredKeyword = params.keywordOverride || inferKeywordFromUrl(params.seedUrl);

// Geocode area to get coordinates
let geocodeResult: GeocodeResult | null = null;
try {
geocodeResult = await geocode(params.area);
} catch (error) {
logging.warn(Failed to geocode area ${params.area}, will use text search instead:, error);
}

// Create Google Sheet
const { sheetId, sheetUrl } = await createSheet(Prospector Job - ${inferredKeyword} in ${params.area});

// Create initial job in Firestore
const jobId = await createFirestoreJob({
status: 'queued',
seedUrl: params.seedUrl,
inferredKeyword,
area: params.area,
radius: params.radius,
maxResults: params.maxResults,
sheetId,
sheetUrl,
counts: {
found: 0,
appended: 0,
deduped: 0,
errors: 0
},
webhookUrl: params.webhookUrl
});

// Process first batch immediately
await processNextBatch(jobId);

// Get updated job status
const job = await getJob(jobId);
if (!job) {
throw new Error(Job not found after creation: ${jobId});
}

return {
jobId,
sheetId,
sheetUrl,
counts: job.counts
};
};

export const processNextBatch = async (jobId: string): Promise<void> => {
const job = await getJob(jobId);
if (!job) {
throw new Error(Job not found: ${jobId});
}

// Don't process if job is done, canceled, or already running
if (job.status === 'done' || job.status === 'canceled' || job.status === 'error') {
return;
}

// Update status to running
await updateJob(jobId, { status: 'running' });

try {
// Geocode area to get coordinates
const geocodeResult = await geocode(job.area);

// Use deduplicator to track seen items in this job
const deduplicator = new Deduplicator();

// Load already processed items to initialize deduplicator
// In a real implementation, we'd query Firestore for existing prospects for this job
// For now, we'll just proceed with the batch

// Determine search method based on availability of geocoded coordinates
let searchResults;
if (geocodeResult) {
// Use nearby search since we have coordinates
searchResults = await searchNearby(
geocodeResult.lat,
geocodeResult.lng,
job.radius,
job.inferredKeyword,
job.cursor?.pageToken
);
} else {
// Use text search with area
const query = `${job.inferredKeyword} in ${job.area}`;
searchResults = await searchText(
query,
job.radius,
job.cursor?.pageToken
);
}

const places = searchResults.places || [];

// Process each place
for (const place of places) {
if (job.counts.found >= job.maxResults) {
break;
}

// Get detailed information for the place
let placeDetails;
try {
placeDetails = await getPlaceDetails(place.id);
} catch (error) {
logging.error(`Failed to get details for place ${place.id}:`, error);
await updateJob(jobId, {
counts: {
...job.counts,
errors: job.counts.errors + 1
}
});
continue;
}

// Extract information
const name = placeDetails.displayName?.text || placeDetails.name || '';
const phone = placeDetails.phoneNumber || '';
const address = placeDetails.formattedAddress || '';
const website = placeDetails.websiteUri || '';
const lat = placeDetails.location?.latitude || 0;
const lng = placeDetails.location?.longitude || 0;
const types = placeDetails.types || [];
const rating = placeDetails.rating;
const userRatingCount = placeDetails.userRatingCount;

// Extract domain from website
let domain = '';
if (website) {
try {
const url = new URL(website);
domain = url.hostname.toLowerCase();
} catch (e) {
// Invalid URL, skip domain extraction
}
}

// Create dedupe key
const dedupeKey: DedupeKey = {
placeId: placeDetails.id,
domain
};

// Check for duplicates
if (deduplicator.has(dedupeKey)) {
await updateJob(jobId, {
counts: {
...job.counts,
deduped: job.counts.deduped + 1
}
});
continue;
}

// Mark as seen
deduplicator.add(dedupeKey);

// Extract emails from website if available
let emails: string[] = [];
if (website) {
emails = await extractEmailsFromWebsite(website);
}

// Create prospect object
const prospect: Omit<Prospect, 'createdAt'> = {
jobId,
placeId: placeDetails.id,
name,
phone,
address,
website,
domain,
email: emails.length > 0 ? emails.join(', ') : undefined,
lat,
lng,
types,
rating,
user_ratings_total: userRatingCount,
source: 'places'
};

// Save to Firestore
await createProspect(prospect);

// Append to Google Sheet
await appendRowsToSheet(new (require('google-auth-library').JWT)(), job.sheetId, [{
Name: name,
Phone: phone,
Address: address,
Website: website,
Domain: domain,
Email: emails.length > 0 ? emails.join(', ') : '',
Lat: lat,
Lng: lng,
Rating: rating || null,
Reviews: userRatingCount || null,
'Place ID': placeDetails.id,
Types: types.join(', '),
Source: 'places',
'Created At': new Date().toISOString()
}]);

// Update job counts
await updateJob(jobId, {
counts: {
found: job.counts.found + 1,
appended: job.counts.appended + 1,
deduped: job.counts.deduped,
errors: job.counts.errors
}
});
}

// Update cursor for pagination
if (searchResults.nextPageToken) {
await updateJob(jobId, {
cursor: {
...job.cursor,
pageToken: searchResults.nextPageToken
}
});
} else {
// No more results, mark as done
await updateJob(jobId, {
status: 'done'
});

// Share the sheet publicly
await shareSheetWithPublic(job.sheetId);

// Trigger webhook if provided
if (job.webhookUrl) {
await triggerWebhook(jobId, 'done', (await getJob(jobId))!.counts);
}
}
} catch (error) {
logging.error(Error processing job ${jobId}:, error);
await updateJob(jobId, {
status: 'error',
counts: {
...job.counts,
errors: job.counts.errors + 1
}
});
}
};

export const cancelJob = async (jobId: string): Promise<void> => {
const job = await getJob(jobId);
if (!job) {
throw new Error(Job not found: ${jobId});
}

if (job.status === 'done' || job.status === 'canceled') {
return; // Already completed or canceled
}

await updateJob(jobId, {
status: 'canceled'
});
};

// Helper function to infer keyword from URL
function inferKeywordFromUrl(url: string): string {
try {
const parsedUrl = new URL(url);
const pathParts = parsedUrl.pathname.split('/').filter(p => p.length > 0);

// Look for common business types in the URL
const businessTypes = [
'dentist', 'doctor', 'lawyer', 'attorney', 'plumber', 'electrician',
'contractor', 'remodeler', 'painter', 'cleaner', 'mechanic', 'tutor',
'photographer', 'chiropractor', 'therapist', 'trainer', 'salon', 'spa',
'restaurant', 'cafe', 'bar', 'shop', 'store', 'market'
];

for (const part of pathParts) {
for (const type of businessTypes) {
if (part.toLowerCase().includes(type)) {
return type;
}
}
}

// If no match found, return the last part of the path
return pathParts[pathParts.length - 1] || parsedUrl.hostname.split('.')[0];
} catch (error) {
// If URL parsing fails, return a default
return 'business';
}
}

// Helper function to trigger webhook
async function triggerWebhook(jobId: string, status: string, counts: Job['counts']): Promise<void> {
const webhookUrl = process.env.DEFAULT_WEBHOOK_URL;
if (!webhookUrl) {
logging.info('No default webhook URL configured');
return;
}

try {
const response = await fetch('/api/webhook', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ jobId, status, counts })
});

if (!response.ok) {
logging.error(`Webhook request failed with status ${response.status}`);
} else {
logging.info(`Webhook triggered successfully for job ${jobId}`);
}
} catch (error) {
logging.error('Error triggering webhook:', error);
}
}
