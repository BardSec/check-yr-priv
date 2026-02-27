import secrets

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse, Response

from app.auth.microsoft import acquire_token_by_code, get_auth_url, load_cache
from app.auth.session import clear_session, get_session, save_session
from app.config import settings
from app.services.graph import get_me

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
async def login(request: Request):
    state = secrets.token_urlsafe(16)
    session = await get_session(request)
    session["oauth_state"] = state
    url = get_auth_url(state)
    response = RedirectResponse(url)
    await save_session(response, session)
    return response


@router.get("/callback")
async def callback(request: Request, code: str | None = None, state: str | None = None, error: str | None = None):
    if error:
        return RedirectResponse(f"{settings.app_base_url}/?error={error}")

    session = await get_session(request)
    expected_state = session.get("oauth_state")
    if not state or state != expected_state:
        return RedirectResponse(f"{settings.app_base_url}/?error=invalid_state")

    cache = load_cache(session.get("token_cache"))
    result = acquire_token_by_code(code, cache)

    if "error" in result:
        return RedirectResponse(f"{settings.app_base_url}/?error={result.get('error_description', 'auth_failed')}")

    session["token_cache"] = cache.serialize()
    session["account"] = result.get("id_token_claims", {})
    session.pop("oauth_state", None)

    response = RedirectResponse(settings.app_base_url)
    await save_session(response, session)
    return response


@router.get("/me")
async def me(request: Request):
    session = await get_session(request)
    account = session.get("account")
    if not account:
        return JSONResponse({"authenticated": False}, status_code=401)
    return {"authenticated": True, "user": account}


@router.post("/logout")
async def logout(request: Request):
    response = RedirectResponse(settings.app_base_url)
    await clear_session(request, response)
    return response
