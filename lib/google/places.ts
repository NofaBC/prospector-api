import { env } from '../env';
import { logError, logInfo } from '../logging';

export interface PlaceResult {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
}

/**
 * Search for places using Text Search
 */
export async function searchPlacesText(
  query: string,
  pageToken?: string
): Promise<{ results: PlaceResult[]; nextPageToken?: string }> {
  try {
    const apiKey = env.googleMapsApiKey;
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', apiKey);
    
    if (pageToken) {
      url.searchParams.append('pagetoken', pageToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logError(`Places Text Search failed: ${data.status}`);
      return { results: [] };
    }

    const results = (data.results || []).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types
    }));

    logInfo(`Found ${results.length} places for query: ${query}`);

    return {
      results,
      nextPageToken: data.next_page_token
    };
  } catch (error) {
    logError('Error in Places Text Search', error);
    return { results: [] };
  }
}

/**
 * Search for places using Nearby Search
 */
export async function searchPlacesNearby(
  lat: number,
  lng: number,
  keyword: string,
  radius: number,
  pageToken?: string
): Promise<{ results: PlaceResult[]; nextPageToken?: string }> {
  try {
    const apiKey = env.googleMapsApiKey;
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.append('location', `${lat},${lng}`);
    url.searchParams.append('radius', radius.toString());
    url.searchParams.append('keyword', keyword);
    url.searchParams.append('key', apiKey);
    
    if (pageToken) {
      url.searchParams.append('pagetoken', pageToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logError(`Places Nearby Search failed: ${data.status}`);
      return { results: [] };
    }

    const results = (data.results || []).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types
    }));

    logInfo(`Found ${results.length} places near ${lat},${lng}`);

    return {
      results,
      nextPageToken: data.next_page_token
    };
  } catch (error) {
    logError('Error in Places Nearby Search', error);
    return { results: [] };
  }
}

/**
 * Get Place Details
 */
export async function getPlaceDetails(placeId: string): Promise<Partial<PlaceResult> | null> {
  try {
    const apiKey = env.googleMapsApiKey;
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', 'name,formatted_phone_number,website,formatted_address');
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      logError(`Place Details failed for ${placeId}: ${data.status}`);
      return null;
    }

    const result = data.result;
    return {
      phone: result.formatted_phone_number,
      website: result.website,
      address: result.formatted_address
    };
  } catch (error) {
    logError(`Error getting details for ${placeId}`, error);
    return null;
  }
}

/**
 * Infer keyword from seed URL
 */
export function inferKeyword(seedUrl: string): string {
  try {
    const url = new URL(seedUrl);
    const pathname = url.pathname.toLowerCase();
    
    // Common business type mappings
    const keywords: { [key: string]: string } = {
      'dentist': 'dentist',
      'dental': 'dentist',
      'lawyer': 'lawyer',
      'attorney': 'lawyer',
      'plumber': 'plumber',
      'plumbing': 'plumber',
      'electrician': 'electrician',
      'electrical': 'electrician',
      'remodel': 'remodeler',
      'contractor': 'contractor',
      'hvac': 'hvac',
      'restaurant': 'restaurant',
      'cafe': 'cafe',
      'gym': 'gym',
      'fitness': 'fitness'
    };

    for (const [key, value] of Object.entries(keywords)) {
      if (pathname.includes(key)) {
        return value;
      }
    }

    // Default to a generic term from the path
    const segments = pathname.split('/').filter(s => s.length > 0);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }

    return 'business';
  } catch {
    return 'business';
  }
}
