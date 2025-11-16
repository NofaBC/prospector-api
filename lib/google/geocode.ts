import { env } from '../env';
import { logError, logInfo } from '../logging';

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

/**
 * Geocode an address or area to lat/lng
 */
export async function geocodeArea(area: string): Promise<GeoLocation | null> {
  try {
    const apiKey = env.googleMapsApiKey;
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', area);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      logError(`Geocoding failed for ${area}: ${data.status}`);
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    logInfo(`Geocoded ${area} to ${location.lat}, ${location.lng}`);

    return {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address
    };
  } catch (error) {
    logError(`Error geocoding ${area}`, error);
    return null;
  }
}

/**
 * Check if a string is a US ZIP code
 */
export function isZipCode(area: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(area.trim());
}
