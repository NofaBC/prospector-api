# Prospector-api

Business Data Enrichment

A Next.js application that extracts business data from Google Places and enriches it with email addresses, storing results in Google Sheets and Firestore.

## Features

- Extract business data from Google Places based on a seed URL and location
- Enrich business websites with email addresses (respecting robots.txt)
- Store results in Google Sheets and Firestore
- Deduplicate results by place ID and domain
- Rate limiting and retry mechanisms
- Webhook support for job completion notifications

## Setup

### Google Cloud Setup

Enable the following APIs in your Google Cloud Console:
- Places API
- Geocoding API
- Google Sheets API
- Google Drive API

Create two service accounts:
1. One for Firebase Admin SDK
2. One for Google Sheets/Drive access

For the Sheets/Drive service account:
- Download the JSON key file
- Either create spreadsheets in the service account's Drive or share a folder with the service account

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@your-google-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
DEFAULT_WEBHOOK_URL=https://your-webhook-endpoint.com
RATE_LIMIT_WINDOW=600
RATE_LIMIT_MAX=60
BATCH_SIZE=30
MAX_RESULTS_CAP=300
```

The FIREBASE_ADMIN_* values must come from the WareCell Firebase service account so the API can reach your production datastore.

## Vercel Deployment

1. Install Vercel CLI: `npm install -g vercel`
2. Link your project: `vercel link`
3. Add the FIREBASE_ADMIN_* WareCell credentials plus the other environment variables in the Vercel dashboard or via CLI
4. Deploy: `vercel --prod`

## API Endpoints

### POST /api/run

Start a new job to extract business data.

Request body:

```json
{
  "seedUrl": "https://example.com/services/dentist",
  "area": "21108",
  "keywordOverride": "dentist",
  "radius": 16000,
  "maxResults": 100,
  "webhookUrl": "https://your-webhook.com"
}
```

Response:

```json
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
```

### GET /api/jobs/{id}

Get job status and sample prospects.

### POST /api/jobs/{id}

Process the next batch of results for the job.

### DELETE /api/jobs/{id}

Cancel a running job.

### POST /api/webhook

Forward job completion notifications to your webhook URL.

## Rate Limiting

The API implements rate limiting based on IP address and seed URL:

- Default: 60 requests per 10 minutes per IP + seed URL combination
- Configurable via RATE_LIMIT_WINDOW and RATE_LIMIT_MAX environment variables
- Returns 429 status with Retry-After header when limit is exceeded

## Batching Model

Each job processes results in batches (default 30 items per batch). Client or Vercel cron can trigger the next batch by POSTing to `/api/jobs/{id}`. This model works well with Vercel's serverless function time limits.

## Testing

To test locally:

1. Start the development server: `npm run dev`
2. Submit a job via the UI or API
3. Process batches manually by clicking "Process Next Batch" or calling the API

Example curl command to start a job:

```bash
curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "seedUrl": "https://example.com/services/remodeler",
    "area": "21108",
    "radius": 16000,
    "maxResults": 50
  }'
```

## Webhook Support

When a job completes, if a webhook URL was provided, the system will send a POST request with the following payload:

```json
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
```

## Security

- All Google credentials and Firebase Admin keys are server-only
- CORS is locked to your site for POST routes
- Input validation via Zod
- Rate limiting to prevent abuse

## Local Development vs Production

- **Local development:** Use `.env.local` for environment variables
- **Production (Vercel):** Set environment variables in the Vercel dashboard

The batch processing model is designed to work within Vercel's serverless time limits (max 60 seconds per function). For large jobs, the client needs to periodically trigger the next batch.
