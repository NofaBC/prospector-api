# prospector-api/api/prospect.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Union
from . import store

router = APIRouter()

class GeoZip(BaseModel):
    zip: str
    radiusMiles: int

class GeoCityState(BaseModel):
    city: str
    state: str
    radiusMiles: int

Geo = Union[GeoZip, GeoCityState]

class SearchRequest(BaseModel):
    service: str
    geo: Geo

class SearchResponse(BaseModel):
    prospectSetId: str
    count: int

class GetSetResponse(BaseModel):
    id: str
    service: str
    geo: Dict[str, str]
    created_at: float
    leads: list[store.Lead]

@router.post("/prospect/search", response_model=SearchResponse)
async def prospect_search(request: SearchRequest):
    prospect_set = await store.search_prospects(request.service, request.geo.model_dump())
    return SearchResponse(prospectSetId=prospect_set.id, count=len(prospect_set.leads))

@router.get("/prospect/sets/{set_id}", response_model=GetSetResponse)
async def get_prospect_set(set_id: str):
    prospect_set = await store.get_prospect_set(set_id)
    if not prospect_set:
        raise HTTPException(status_code=404, detail="Prospect set not found")
    return GetSetResponse(
        id=prospect_set.id,
        service=prospect_set.service,
        geo=prospect_set.geo,
        created_at=prospect_set.created_at,
        leads=prospect_set.leads
    )
