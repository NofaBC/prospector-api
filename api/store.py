# prospector-api/api/store.py
import asyncio
import time
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class Lead(BaseModel):
    id: str
    name: str
    address: str
    phone: Optional[str] = None
    website: Optional[str] = None
    source: str # e.g., "yelp", "google_places", "mock"
    # Add other fields as needed

class ProspectSet(BaseModel):
    id: str
    service: str
    geo: Dict[str, str] # e.g., {"zip": "20878", "radiusMiles": 15}
    created_at: float
    leads: List[Lead]

# In-memory store - replace with DB/Redis later
prospect_sets: Dict[str, ProspectSet] = {}

async def get_prospect_set(set_id: str) -> Optional[ProspectSet]:
    """Get a prospect set by ID."""
    await asyncio.sleep(0.01) # Simulate minimal I/O
    return prospect_sets.get(set_id)

async def create_prospect_set(service: str, geo: Dict[str, str], leads: List[Dict]) -> ProspectSet:
    """Create a new prospect set."""
    import uuid
    set_id = f"set_{uuid.uuid4().hex[:8]}"
    lead_models = [Lead(id=f"lead_{uuid.uuid4().hex[:8]}", **lead) for lead in leads]
    prospect_set = ProspectSet(
        id=set_id,
        service=service,
        geo=geo,
        created_at=time.time(),
        leads=lead_models
    )
    prospect_sets[set_id] = prospect_set
    return prospect_set

def _fake_results(service: str, geo: Dict[str, str]) -> List[Dict]:
    """
    Generates deterministic, fake lead data based on service and geo.
    This is the MVP function - replace with Yelp/Places API calls later.
    """
    # Example: Generate based on service and location
    location_descriptor = geo.get("zip") or f"{geo.get('city')}, {geo.get('state')}"
    base_leads = [
        {
            "name": f"Mock {service.title()} Service {i}",
            "address": f"Mock Address {i}, {location_descriptor}",
            "phone": f"+1-555-000-{i:04d}",
            "website": f"https://mock{i}.com",
            "source": "mock"
        } for i in range(1, 6) # Generate 5 mock leads
    ]
    return base_leads

async def search_prospects(service: str, geo: Dict[str, str]) -> ProspectSet:
    """Search for prospects and create a new prospect set."""
    # MVP: Use fake results
    leads_data = _fake_results(service, geo)
    # In the future: Replace _fake_results with actual API calls
    # leads_data = await _real_search_from_apis(service, geo)

    prospect_set = await create_prospect_set(service, geo, leads_data)
    return prospect_set
