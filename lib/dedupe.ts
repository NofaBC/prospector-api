export interface DedupeKey {
placeId: string;
domain: string;
}

export class Deduplicator {
private seenPlaceIds = new Set<string>();
private seenDomains = new Set<string>();

add(key: DedupeKey): void {
this.seenPlaceIds.add(key.placeId);
this.seenDomains.add(key.domain);
}

has(key: DedupeKey): boolean {
return this.seenPlaceIds.has(key.placeId) || this.seenDomains.has(key.domain);
}

clear(): void {
this.seenPlaceIds.clear();
this.seenDomains.clear();
}
}
