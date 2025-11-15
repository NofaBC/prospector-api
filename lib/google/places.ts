// lib/google/places.ts
import type { RequestInit } from 'node-fetch';

const BASE = 'https://maps.googleapis.com/maps/api/place';

type TextSearchArgs = {
  keyword: string;
  lat: number;
  lng: number;
  apiKey: string;
  pagetoken?: string;
  radiusMeters?: number; // optional for biasing
};

type PlaceDetailsArgs = {
  placeId: string;
  apiKey: string;
};

export async function textSearch({
  keyword,
  lat,
  lng,
  apiKey,
  pagetoken,
  radiusMeters = 25000
}: TextSearchArgs) {
  const params = new URLSearchParams({
    key: apiKey,
    query: keyword,
    location: `${lat},${lng}`,
    radius: String(radiusMeters)
  });
  if (pagetoken) params.set('pagetoken', pagetoken);

  const url = `${BASE}/textsearch/json?${params.toString()}`;
  const options: RequestInit = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Places TextSearch failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<any>;
}

export async function placeDetails({ placeId, apiKey }: PlaceDetailsArgs) {
  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'international_phone_number',
    'website',
    'rating',
    'user_ratings_total',
    'geometry/location'
  ].join(',');

  const url = `${BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;
  const options: RequestInit = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Place Details failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<any>;
}
