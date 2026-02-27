"""
MSAL-based OAuth2 helpers for Microsoft Entra ID.
"""
import msal

from app.config import settings


def _build_msal_app(cache: msal.SerializableTokenCache | None = None) -> msal.ConfidentialClientApplication:
    return msal.ConfidentialClientApplication(
        settings.azure_client_id,
        authority=settings.authority,
        client_credential=settings.azure_client_secret,
        token_cache=cache,
    )


def get_auth_url(state: str) -> str:
    app = _build_msal_app()
    return app.get_authorization_request_url(
        scopes=settings.scopes,
        state=state,
        redirect_uri=settings.azure_redirect_uri,
    )


def acquire_token_by_code(code: str, cache: msal.SerializableTokenCache) -> dict:
    app = _build_msal_app(cache)
    result = app.acquire_token_by_authorization_code(
        code,
        scopes=settings.scopes,
        redirect_uri=settings.azure_redirect_uri,
    )
    return result


def acquire_token_silent(account_info: dict, cache: msal.SerializableTokenCache) -> dict | None:
    app = _build_msal_app(cache)
    accounts = app.get_accounts()
    if not accounts:
        return None
    return app.acquire_token_silent(settings.scopes, account=accounts[0])


def load_cache(serialized: str | None) -> msal.SerializableTokenCache:
    cache = msal.SerializableTokenCache()
    if serialized:
        cache.deserialize(serialized)
    return cache
