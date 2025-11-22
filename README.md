Prospector-api

Business Data Enrichment

A Next.js application that extracts business data from Google Places and enriches it with email addresses, storing results in Google Sheets and Firestore.

⚠️ Common deploy issue: Vercel failures usually mean missing WareCell Firebase Admin credentials. Ensure the FIREBASE_ADMIN_* (or a base64 JSON variant) are set in the Vercel project settings. If Firestore can’t initialize, you’ll see errors like FirestoreConfigError.

Features

Extract business data from Google Places based on a seed URL and location

Enrich business websites with email addresses (respecting robots.txt)

Store results in Google Sheets and Firestore

Deduplicate results by Place ID and domain

Rate limiting and retry mechanisms

Webhook support for job completion notifications

Setup
Google Cloud Setup

Enable the following APIs in your Google Cloud Console:

Places API

Geocoding API

Google Sheets API

Google Drive API

Create two service accounts:

Firebase Admin SDK

Google Sheets/Drive access

For the Sheets/Drive service account:

Download the JSON key file

Either create spreadsheets in the service account’s Drive or share a folder with the service account

Environment Variables

Copy .env.example to .env.local and fill in your values:

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Admin (WareCell)
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Or supply FIREBASE_ADMIN_PRIVATE_KEY_BASE64 (base64 of the private key)
# Or supply FIREBASE_ADMIN_SERVICE_ACCOUNT / FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64 with the full JSON

# Google service account used for Sheets/Drive
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@your-google-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Optional override if Drive uses a different SA:
# GOOGLE_SERVICE_ACCOUNT_EMAIL=drive-service-account@your-google-project-id.iam.gserviceaccount.com
# Or use GOOGLE_PRIVATE_KEY_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY / *_BASE64

# Google Maps / Places
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional defaults
DEFAULT_WEBHOOK_URL=https://your-webhook-endpoint.com
RATE_LIMIT_WINDOW=600
RATE_LIMIT_MAX=60
BATCH_SIZE=30
MAX_RESULTS_CAP=300


Note: The FIREBASE_ADMIN_* values (or the FIREBASE_ADMIN_SERVICE_ACCOUNT JSON) must come from the WareCell Firebase service account so the API can reach your production datastore.

Tip: On Vercel, base64-encoding the entire service-account JSON (for both Google and Firebase) avoids multiline env issues.

Vercel Deployment

Install Vercel CLI: npm install -g vercel

Link your project: vercel link

Add the FIREBASE_ADMIN* WareCell credentials plus the other environment variables in the Vercel dashboard (Project → Settings → Environment Variables) or via CLI

Deploy: vercel --prod

Vercel project settings (recommended defaults):

Framework Preset: Next.js

Root Directory: ./

Install/Build/Output: leave empty (use Next.js defaults)

API Endpoints
POST /api/run

Start a new job to extract business data.

Request body:

{
  "seedUrl": "https://example.com/services/dentist",
  "area": "21108",
  "keywordOverride": "dentist",
  "radius": 16000,
  "maxResults": 100,
  "webhookUrl": "https://your-webhook.com"
}


Response:

{
  "jobId": "job123",
  "sheetId": "sheet123",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/sheet123",
  "counts": {
    "found": 0,
    "appended": 0,
    "deduped": 0,
    "errors": 0
  }
}

GET /api/jobs/{id}

Get job status and sample prospects.

POST /api/jobs/{id}

Process the next batch of results for the job.

DELETE /api/jobs/{id}

Cancel a running job.

POST /api/webhook

Forward job completion notifications to your webhook URL.

Rate Limiting

The API implements rate limiting based on IP address and seed URL:

Default: 60 requests per 10 minutes per IP + seed URL combination

Configurable via RATE_LIMIT_WINDOW and RATE_LIMIT_MAX

Returns 429 with Retry-After header when the limit is exceeded

Batching Model

Each job processes results in batches (default 30 items per batch). Client or Vercel cron can trigger the next batch by POSTing to /api/jobs/{id}. This model works well with Vercel’s serverless function time limits.

Testing

To test locally:

Start the development server: npm run dev

Submit a job via the UI or API

Process batches manually by clicking “Process Next Batch” or calling the API

Example curl command to start a job:

curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "seedUrl": "https://example.com/services/remodeler",
    "area": "21108",
    "radius": 16000,
    "maxResults": 50
  }'

Webhook Support

When a job completes, if a webhook URL was provided, the system will send a POST request with the following payload:

{
  "jobId": "job123",
  "status": "done",
  "counts": {
    "found": 50,
    "appended": 45,
    "deduped": 5,
    "errors": 0
  }
}

Security

All Google credentials and Firebase Admin keys are server-only

CORS is locked to your site for POST routes

Input validation via Zod

Rate limiting to prevent abuse

robots.txt is respected during enrichment

Local Development vs Production

Local development: Use .env.local for environment variables

Production (Vercel): Set environment variables in the Vercel dashboard

The batch processing model is designed to work within Vercel’s serverless function time limits (max ~60 seconds per function). For large jobs, the client needs to periodically trigger the next batch.

License: Proprietary — NOFA Business Consulting, LLC. All rights reserved.
