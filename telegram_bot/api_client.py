import httpx
from config import BACKEND_URL, BOT_HEADERS


async def api_get(path: str, params: dict = None) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{BACKEND_URL}{path}", headers=BOT_HEADERS, params=params)
        r.raise_for_status()
        return r.json()


async def api_post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{BACKEND_URL}{path}", headers=BOT_HEADERS, json=body)
        r.raise_for_status()
        return r.json()


async def api_get_bytes(path: str, params: dict = None) -> bytes:
    """Obtiene respuesta como bytes (para imágenes PNG)."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(f"{BACKEND_URL}{path}", headers=BOT_HEADERS, params=params)
        r.raise_for_status()
        return r.content
