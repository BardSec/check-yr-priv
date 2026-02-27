"""
Microsoft Graph API client — thin async wrapper around httpx.
All methods accept an access token and return parsed JSON.
"""
from typing import Any, AsyncGenerator

import httpx

from app.config import settings

GRAPH = settings.graph_base


async def _get_all_pages(client: httpx.AsyncClient, url: str) -> list[dict]:
    """Follow @odata.nextLink pagination."""
    results: list[dict] = []
    while url:
        r = await client.get(url)
        r.raise_for_status()
        data = r.json()
        results.extend(data.get("value", []))
        url = data.get("@odata.nextLink")
    return results


def _client(token: str) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )


async def get_me(token: str) -> dict:
    async with _client(token) as c:
        r = await c.get(f"{GRAPH}/me?$select=id,displayName,userPrincipalName,mail")
        r.raise_for_status()
        return r.json()


async def get_organization(token: str) -> dict:
    async with _client(token) as c:
        r = await c.get(f"{GRAPH}/organization?$select=id,displayName,verifiedDomains")
        r.raise_for_status()
        data = r.json()
        return data["value"][0] if data.get("value") else {}


async def get_role_definitions(token: str) -> list[dict]:
    """Fetch all Entra ID built-in and custom role definitions."""
    async with _client(token) as c:
        url = f"{GRAPH}/roleManagement/directory/roleDefinitions?$select=id,displayName,description,isBuiltIn,isEnabled"
        return await _get_all_pages(c, url)


async def get_active_role_assignments(token: str) -> list[dict]:
    """
    Fetch *active* PIM role assignment schedules (includes direct + permanent).
    Also falls back to the simpler unified roleAssignments endpoint.
    """
    async with _client(token) as c:
        # PIM active scheduled assignments (time-bound activations)
        try:
            url = (
                f"{GRAPH}/roleManagement/directory/roleAssignmentScheduleInstances"
                "?$expand=principal,roleDefinition&$top=999"
            )
            return await _get_all_pages(c, url)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (403, 404):
                # Fallback: classic roleAssignments (no PIM metadata)
                url = (
                    f"{GRAPH}/roleManagement/directory/roleAssignments"
                    "?$expand=principal,roleDefinition&$top=999"
                )
                return await _get_all_pages(c, url)
            raise


async def get_eligible_role_assignments(token: str) -> list[dict]:
    """Fetch PIM *eligible* role assignment schedules."""
    async with _client(token) as c:
        try:
            url = (
                f"{GRAPH}/roleManagement/directory/roleEligibilityScheduleInstances"
                "?$expand=principal,roleDefinition&$top=999"
            )
            return await _get_all_pages(c, url)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (403, 404):
                return []
            raise


async def get_ca_policies(token: str) -> list[dict]:
    """Fetch Conditional Access policies."""
    async with _client(token) as c:
        try:
            url = f"{GRAPH}/identity/conditionalAccess/policies"
            return await _get_all_pages(c, url)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in (403, 404):
                return []
            raise


async def get_user_by_id(token: str, user_id: str) -> dict:
    async with _client(token) as c:
        r = await c.get(
            f"{GRAPH}/users/{user_id}"
            "?$select=id,displayName,userPrincipalName,accountEnabled,assignedLicenses"
        )
        if r.status_code == 404:
            return {}
        r.raise_for_status()
        return r.json()


async def get_named_locations(token: str) -> list[dict]:
    async with _client(token) as c:
        try:
            r = await c.get(f"{GRAPH}/identity/conditionalAccess/namedLocations")
            r.raise_for_status()
            return r.json().get("value", [])
        except httpx.HTTPStatusError:
            return []
