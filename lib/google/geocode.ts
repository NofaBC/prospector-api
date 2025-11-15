import { getEnvVar } from '../env';
import { logging } from '../logging';

const API_KEY = getEnvVar('GOOGLE_MAPS_API_KEY');
const GEOCODE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json ';

export interface GeocodeResult {
lat: number;
lng: number;
formatted_address: string;
}

export const geocode = async (address: string): Promise<GeocodeResult | null> => {
const params = new URLSearchParams({
address,
key: API_KEY
});

const url = ${GEOCODE_BASE_URL}?${params.toString()};

let retries = 3;
let delay = 1000;

while (retries >= 0) {
try {
const response = await fetch(url);

if (!response.ok) {
throw new Error(`Geocoding API request failed with status ${response.status}`);
}

const data = await response.json();

if (data.status !== 'OK' || !data.results || data.results.length === 0) {
return null;
}

const result = data.results[0];
return {
lat: result.geometry.location.lat,
lng: result.geometry.location.lng,
formatted_address: result.formatted_address
};
} catch (error) {
if (retries === 0) {
logging.error('Geocoding failed after retries:', error);
throw error;
}

logging.warn(`Geocoding failed, retrying in ${delay}ms...`, error);
await sleep(delay);
delay *= 2; // Exponential backoff
retries--;
}
}

return null;
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
