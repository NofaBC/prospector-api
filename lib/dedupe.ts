/**
 * Deduplication utilities
 */

export interface DedupeTracker {
  placeIds: Set<string>;
  domains: Set<string>;
}

/**
 * Create a new dedupe tracker
 */
export function createDedupeTracker(): DedupeTracker {
  return {
    placeIds: new Set(),
    domains: new Set()
  };
}

/**
 * Normalize domain for deduplication
 */
export function normalizeDomain(url: string): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    let domain = urlObj.hostname.toLowerCase();
    
    // Remove www.
    domain = domain.replace(/^www\./, '');
    
    return domain;
  } catch {
    return null;
  }
}

/**
 * Check if prospect should be included (not a duplicate)
 */
export function shouldInclude(
  tracker: DedupeTracker,
  placeId: string,
  website?: string
): boolean {
  // Check place_id
  if (tracker.placeIds.has(placeId)) {
    return false;
  }

  // Check domain if website exists
  if (website) {
    const domain = normalizeDomain(website);
    if (domain && tracker.domains.has(domain)) {
      return false;
    }
  }

  return true;
}

/**
 * Mark prospect as seen
 */
export function markAsSeen(
  tracker: DedupeTracker,
  placeId: string,
  website?: string
): void {
  tracker.placeIds.add(placeId);
  
  if (website) {
    const domain = normalizeDomain(website);
    if (domain) {
      tracker.domains.add(domain);
    }
  }
}
