"""
Redis-backed, signed session cookie manager.
"""
import json
import secrets
from typing import Optional

import redis.asyncio as aioredis
from itsdangerous import BadSignature, TimestampSigner
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings

SESSION_COOKIE = "cyp_session"
SESSION_TTL = 3600 * 8  # 8 hours


def _signer() -> TimestampSigner:
    return TimestampSigner(settings.secret_key)


def _make_sid() -> str:
    return secrets.token_urlsafe(32)


def _get_sid(request: Request) -> Optional[str]:
    raw = request.cookies.get(SESSION_COOKIE)
    if not raw:
        return None
    try:
        return _signer().unsign(raw, max_age=SESSION_TTL).decode()
    except BadSignature:
        return None


async def get_redis() -> aioredis.Redis:
    return await aioredis.from_url(settings.redis_url, decode_responses=True)


async def get_session(request: Request) -> dict:
    sid = _get_sid(request)
    if not sid:
        return {}
    r = await get_redis()
    raw = await r.get(f"session:{sid}")
    await r.aclose()
    if not raw:
        return {}
    return json.loads(raw)


async def save_session(response: Response, data: dict, existing_sid: Optional[str] = None) -> str:
    sid = existing_sid or _make_sid()
    r = await get_redis()
    await r.setex(f"session:{sid}", SESSION_TTL, json.dumps(data))
    await r.aclose()
    signed = _signer().sign(sid).decode()
    response.set_cookie(
        SESSION_COOKIE,
        signed,
        httponly=True,
        samesite="lax",
        secure=settings.app_base_url.startswith("https"),
        max_age=SESSION_TTL,
    )
    return sid


async def clear_session(request: Request, response: Response) -> None:
    sid = _get_sid(request)
    if sid:
        r = await get_redis()
        await r.delete(f"session:{sid}")
        await r.aclose()
    response.delete_cookie(SESSION_COOKIE)
