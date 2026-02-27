import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

from app.auth.microsoft import acquire_token_silent, load_cache
from app.auth.session import get_session
from app.models.roles import DashboardData
from app.services.analyzer import build_dashboard
from app.services.graph import (
    get_active_role_assignments,
    get_ca_policies,
    get_eligible_role_assignments,
    get_organization,
)

router = APIRouter(prefix="/api", tags=["roles"])


async def _get_token(request: Request) -> str:
    session = await get_session(request)
    if not session.get("account"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    cache = load_cache(session.get("token_cache"))
    result = acquire_token_silent(session["account"], cache)
    if not result or "access_token" not in result:
        raise HTTPException(status_code=401, detail="Token expired — please log in again")
    return result["access_token"]


@router.get("/dashboard", response_model=DashboardData)
async def dashboard(request: Request):
    token = await _get_token(request)
    try:
        org, active, eligible, ca = await asyncio.gather(
            get_organization(token),
            get_active_role_assignments(token),
            get_eligible_role_assignments(token),
            get_ca_policies(token),
        )
    except Exception as exc:
        logger.error("Graph API error: %s", exc)
        raise HTTPException(status_code=502, detail="Microsoft Graph request failed") from exc

    return build_dashboard(org, active, eligible, ca)


@router.get("/health")
async def health():
    return {"status": "ok"}
