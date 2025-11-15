import { getEnvVar } from '../env';
import { logging } from '../logging';

const API_KEY = getEnvVar('GOOGLE_MAPS_API_KEY');
const PLACES_BASE_URL = 'https://places.googleapis.com/v1 ';

interface Place {
name: string;
id: string;
displayName?: { text: string };
primaryType: string;
types: string[];
formattedAddress?: string;
location?: { latitude: number; longitude: number };
rating?: number;
userRatingCount?: number;
phoneNumber?: string;
websiteUri?: string;
}

interface TextSearchResponse {
places: Place[];
nextPageToken?: string;
}

interface NearbySearchResponse {
places: Place[];
nextPageToken?: string;
}

interface PlaceDetailsResponse {
name: string;
id: string;
displayName?: { text: string };
primaryType: string;
types: string[];
formattedAddress?: string;
location?: { latitude: number; longitude: number };
rating?: number;
userRatingCount?: number;
phoneNumber?: string;
websiteUri?: string;
}

export const searchText = async (
query: string,
radius: number,
pageToken?: string
): Promise<TextSearchResponse> => {
const params = new URLSearchParams({
key: API_KEY,
query,
radius: radius.toString(),
language: 'en'
});

if (pageToken) {
params.append('pageToken', pageToken);
}

const url = ${PLACES_BASE_URL}/places:searchText?${params.toString()};

return makeRequest(url, 'POST', {
textQuery: query,
locationBias: {
circle: {
radius: radius,
center: {
latitude: 0,
longitude: 0
}
}
}
});
};

export const searchNearby = async (
lat: number,
lng: number,
radius: number,
keyword: string,
pageToken?: string
): Promise<NearbySearchResponse> => {
const params = new URLSearchParams({
key: API_KEY,
radius: radius.toString(),
language: 'en'
});

if (pageToken) {
params.append('pageToken', pageToken);
}

const url = ${PLACES_BASE_URL}/places:searchNearby?${params.toString()};

return makeRequest(url, 'POST', {
includedTypes: [keyword],
locationRestriction: {
circle: {
center: {
latitude: lat,
longitude: lng
},
radius: radius
}
}
});
};

export const getPlaceDetails = async (placeId: string): Promise<PlaceDetailsResponse> => {
const fields = [
'id',
'displayName',
'primaryType',
'types',
'formattedAddress',
'location',
'rating',
'userRatingCount',
'phoneNumber',
'websiteUri'
];

const url = ${PLACES_BASE_URL}/places/${placeId}?key=${API_KEY}&requestedLanguage=en&requestedRegion=us&fields=${fields.join(',')};

return makeRequest(url, 'GET');
};

const makeRequest = async (url: string, method: string, body?: any): Promise<any> => {
let retries = 3;
let delay = 1000;

while (retries >= 0) {
try {
const response = await fetch(url, {
method,
headers: {
'Content-Type': 'application/json'
},
...(body && { body: JSON.stringify(body) })
});

if (response.status === 429 || response.status >= 500) {
if (retries === 0) {
throw new Error(`API request failed with status ${response.status}`);
}

logging.warn(`Places API request failed with status ${response.status}, retrying in ${delay}ms...`);
await sleep(delay);
delay *= 2; // Exponential backoff
retries--;
continue;
}

if (!response.ok) {
throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
}

return await response.json();
} catch (error) {
if (retries === 0) {
throw error;
}

logging.warn(`Places API request failed, retrying in ${delay}ms...`, error);
await sleep(delay);
delay *= 2; // Exponential backoff
retries--;
}
}

throw new Error('Unexpected flow in makeRequest');
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
