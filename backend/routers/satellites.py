from fastapi import APIRouter, HTTPException
from services.n2yo import n2yo_client

router = APIRouter()

@router.get("/{norad_id}/tle")
async def get_satellite_tle(norad_id: int):
    try:
        data = await n2yo_client.get_tle(norad_id)
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/{norad_id}/positions")
async def get_satellite_positions(norad_id: int, lat: float, lng: float, alt: float, seconds: int = 300):
    try:
        data = await n2yo_client.get_positions(norad_id, lat, lng, alt, seconds)
        if "error" in data:
             raise HTTPException(status_code=400, detail=data["error"])
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
