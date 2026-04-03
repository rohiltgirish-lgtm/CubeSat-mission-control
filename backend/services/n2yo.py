import os
import httpx

class N2YOClient:
    def __init__(self):
        self.api_key = os.getenv("N2YO_API_KEY")
        self.base_url = "https://api.n2yo.com/rest/v1/satellite"
        self.celestrak_url = "https://celestrak.org/NORAD/elements/gp.php"

    @staticmethod
    def _parse_tle_lines(raw_tle: str):
        lines = [line.strip() for line in raw_tle.splitlines() if line.strip()]
        if len(lines) < 2:
            return None, None, None

        # CelesTrak may return: name, line1, line2
        if len(lines) >= 3 and lines[1].startswith("1 ") and lines[2].startswith("2 "):
            return lines[0], lines[1], lines[2]

        if lines[0].startswith("1 ") and lines[1].startswith("2 "):
            return None, lines[0], lines[1]

        return None, None, None

    async def _get_tle_from_celestrak(self, norad_id: int):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.celestrak_url,
                params={"CATNR": norad_id, "FORMAT": "TLE"},
            )
            response.raise_for_status()

        sat_name, line1, line2 = self._parse_tle_lines(response.text)
        if not line1 or not line2:
            return {"error": "CelesTrak TLE unavailable"}

        return {
            "info": {"satname": sat_name or f"NORAD {norad_id}", "satid": norad_id, "source": "celestrak"},
            "tle": f"{line1}\r\n{line2}",
        }

    async def get_tle(self, norad_id: int):
        if not self.api_key or self.api_key == "your_n2yo_api_key_here":
            return await self._get_tle_from_celestrak(norad_id)
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/tle/{norad_id}?apiKey={self.api_key}"
                )
                response.raise_for_status()
                data = response.json()
                if "error" in data:
                    return await self._get_tle_from_celestrak(norad_id)
                data.setdefault("info", {})
                data["info"].setdefault("source", "n2yo")
                return data
        except Exception:
            return await self._get_tle_from_celestrak(norad_id)
            
    async def get_positions(self, norad_id: int, observer_lat: float, observer_lng: float, observer_alt: float, seconds: int):
        if not self.api_key or self.api_key == "your_n2yo_api_key_here":
             return {"error": "API key required for positions"}
             
        async with httpx.AsyncClient() as client:
             response = await client.get(
                 f"{self.base_url}/positions/{norad_id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}?apiKey={self.api_key}"
             )
             response.raise_for_status()
             return response.json()

n2yo_client = N2YOClient()
