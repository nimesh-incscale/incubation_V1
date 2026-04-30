"""Startup India Seed Fund Portfolio API proxy.

Proxies the public Startup India Seed Fund portfolio dataset so the React
frontend can consume it without CORS / SSL chain issues, and adds light
in-memory caching plus normalisation.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
import logging
import requests
import urllib3
from pathlib import Path
from typing import Any, Dict, List

# The upstream API uses a self-signed / non-standard chain on a non-standard
# port, so disable SSL warnings for the proxy call only.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB (kept for parity with template – not strictly required here).
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

UPSTREAM_URL = "https://seedfundapi.startupindia.gov.in:3535/api/portfoliofilter"
UPSTREAM_IMAGE_BASE = "https://seedfundapi.startupindia.gov.in:3535"

app = FastAPI(title="Seed Fund Portfolio Proxy")
api_router = APIRouter(prefix="/api")

# Simple in-process cache.
_cache: Dict[str, Any] = {"ts": 0, "data": []}
CACHE_TTL_SECONDS = 60 * 10  # 10 minutes


def _normalise_item(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Coerce upstream record into a stable shape for the frontend."""
    image = raw.get("image") or ""
    if image and not image.startswith("http"):
        image = f"{UPSTREAM_IMAGE_BASE}{image}"

    sectors_raw = raw.get("sectors") or ""
    sectors_list = [s.strip() for s in sectors_raw.split(",") if s.strip()]

    return {
        "id": raw.get("Id") or raw.get("id"),
        "image": image,
        "incubator_name": raw.get("incubator_name") or "",
        "description": raw.get("description") or "",
        "sectors": sectors_raw,
        "sectors_list": sectors_list,
        "state": raw.get("state") or "",
        "city": raw.get("city") or "",
        "first_total_approved_amt": int(raw.get("first_total_approved_amt") or 0),
        "reapply_total_approved_amt": int(raw.get("reapply_total_approved_amt") or 0),
        "totalRemainingAmount": int(raw.get("totalRemainingAmount") or 0),
        "totalGrantremainingAmount": int(raw.get("totalGrantremainingAmount") or 0),
        "evaluation": raw.get("Evaluation") or 0,
        "incubator_user_id": raw.get("incubator_user_id"),
    }


def _fetch_upstream(force: bool = False) -> List[Dict[str, Any]]:
    now = time.time()
    if not force and _cache["data"] and (now - _cache["ts"] < CACHE_TTL_SECONDS):
        return _cache["data"]

    try:
        resp = requests.post(
            UPSTREAM_URL,
            json={},
            timeout=20,
            verify=False,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        payload = resp.json()
    except Exception as exc:  # noqa: BLE001
        logging.exception("Upstream fetch failed")
        if _cache["data"]:
            return _cache["data"]
        raise HTTPException(status_code=502, detail=f"Upstream fetch failed: {exc}")

    raw_items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(raw_items, list):
        raise HTTPException(status_code=502, detail="Unexpected upstream payload shape")

    items = [_normalise_item(it) for it in raw_items]
    _cache["data"] = items
    _cache["ts"] = now
    return items


@api_router.get("/")
async def root():
    return {"message": "Seed Fund Portfolio Proxy", "items_cached": len(_cache["data"])}


@api_router.get("/portfolio")
async def get_portfolio():
    """Return all incubator portfolio items (normalised)."""
    items = _fetch_upstream()
    return {"count": len(items), "data": items}


@api_router.get("/portfolio/refresh")
async def refresh_portfolio():
    items = _fetch_upstream(force=True)
    return {"count": len(items), "refreshed_at": _cache["ts"]}


@api_router.get("/portfolio/facets")
async def get_facets():
    """Return distinct values & numeric ranges for filter UI."""
    items = _fetch_upstream()

    states = sorted({i["state"] for i in items if i["state"]})
    cities = sorted({i["city"] for i in items if i["city"]})
    incubators = sorted({i["incubator_name"] for i in items if i["incubator_name"]})

    sectors: set = set()
    for it in items:
        for s in it["sectors_list"]:
            sectors.add(s)
    sectors_sorted = sorted(sectors)

    def _range(field: str) -> Dict[str, int]:
        vals = [i[field] for i in items] or [0]
        return {"min": min(vals), "max": max(vals)}

    return {
        "states": states,
        "cities": cities,
        "incubators": incubators,
        "sectors": sectors_sorted,
        "ranges": {
            "first_total_approved_amt": _range("first_total_approved_amt"),
            "reapply_total_approved_amt": _range("reapply_total_approved_amt"),
            "totalRemainingAmount": _range("totalRemainingAmount"),
            "totalGrantremainingAmount": _range("totalGrantremainingAmount"),
        },
        "total": len(items),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
