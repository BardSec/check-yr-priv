"""
Combines raw Graph data into the structured DashboardData model.
"""
from datetime import datetime, timezone
from typing import Optional

from app.models.roles import (
    CAPolicy,
    DashboardData,
    HIGH_PRIVILEGE_ROLES,
    RoleAssignment,
    RoleSummary,
)


def _principal_name(p: Optional[dict]) -> str:
    if not p:
        return "Unknown"
    return p.get("displayName") or p.get("userPrincipalName") or p.get("id", "Unknown")


def _principal_type(p: Optional[dict]) -> str:
    if not p:
        return "Unknown"
    odata = p.get("@odata.type", "")
    if "user" in odata.lower():
        return "User"
    if "group" in odata.lower():
        return "Group"
    if "servicePrincipal" in odata.lower():
        return "ServicePrincipal"
    return "Unknown"


def _parse_assignment(raw: dict, assignment_type: str) -> Optional[RoleAssignment]:
    role_def = raw.get("roleDefinition") or {}
    principal = raw.get("principal") or {}

    role_def_id = raw.get("roleDefinitionId") or role_def.get("id", "")
    if not role_def_id:
        return None

    role_name = role_def.get("displayName") or raw.get("roleDefinitionId", "Unknown Role")
    principal_id = raw.get("principalId") or principal.get("id", "")
    end_dt_raw = raw.get("endDateTime") or raw.get("scheduleInfo", {}).get("expiration", {}).get("endDateTime")
    start_dt_raw = raw.get("startDateTime") or raw.get("scheduleInfo", {}).get("startDateTime")

    end_dt = datetime.fromisoformat(end_dt_raw.rstrip("Z")) if end_dt_raw else None
    start_dt = datetime.fromisoformat(start_dt_raw.rstrip("Z")) if start_dt_raw else None

    return RoleAssignment(
        id=raw.get("id", ""),
        roleDefinitionId=role_def_id,
        roleName=role_name,
        principalId=principal_id,
        principalName=_principal_name(principal),
        principalUpn=principal.get("userPrincipalName"),
        principalType=_principal_type(principal),
        assignmentType=assignment_type,
        memberType=raw.get("memberType"),
        startDateTime=start_dt,
        endDateTime=end_dt,
        isHighPrivilege=role_def_id in HIGH_PRIVILEGE_ROLES,
        isPermanent=end_dt is None,
    )


def _parse_ca_policy(raw: dict) -> CAPolicy:
    conditions = raw.get("conditions") or {}
    grant_controls = raw.get("grantControls") or {}
    users_cond = conditions.get("users") or {}
    roles_cond = conditions.get("clientAppTypes") or []

    # Check if MFA is required
    built_in_controls = grant_controls.get("builtInControls") or []
    auth_strength = grant_controls.get("authenticationStrength") or {}
    requires_mfa = (
        "mfa" in built_in_controls
        or bool(auth_strength)
        or "authenticationStrength" in grant_controls
    )

    # Roles this policy targets (directory role IDs)
    directory_roles = (users_cond.get("includeRoles") or []) + (users_cond.get("excludeRoles") or [])
    include_users = users_cond.get("includeUsers") or []
    includes_all_users = "All" in include_users

    return CAPolicy(
        id=raw.get("id", ""),
        displayName=raw.get("displayName", ""),
        state=raw.get("state", "disabled"),
        requiresMfa=requires_mfa,
        targetRoles=directory_roles,
        targetUsers=include_users,
        includesAllUsers=includes_all_users,
    )


def build_dashboard(
    tenant_info: dict,
    active_raw: list[dict],
    eligible_raw: list[dict],
    ca_raw: list[dict],
) -> DashboardData:
    active_assignments = [a for r in active_raw if (a := _parse_assignment(r, "active")) is not None]
    eligible_assignments = [a for r in eligible_raw if (a := _parse_assignment(r, "eligible")) is not None]
    all_assignments = active_assignments + eligible_assignments

    ca_policies = [_parse_ca_policy(p) for p in ca_raw]

    # Build CA coverage map: role_def_id -> (ca_protected, mfa_required)
    role_ca: dict[str, tuple[bool, bool]] = {}

    def _mark_role(role_id: str, mfa: bool) -> None:
        prev = role_ca.get(role_id, (False, False))
        role_ca[role_id] = (True, prev[1] or mfa)

    for pol in ca_policies:
        if pol.state != "enabled":
            continue
        if pol.includesAllUsers:
            # Applies to all roles implicitly
            for assignment in all_assignments:
                _mark_role(assignment.roleDefinitionId, pol.requiresMfa)
        for role_id in pol.targetRoles:
            _mark_role(role_id, pol.requiresMfa)

    # Group by role
    roles_map: dict[str, list[RoleAssignment]] = {}
    for a in all_assignments:
        roles_map.setdefault(a.roleDefinitionId, []).append(a)

    role_summaries: list[RoleSummary] = []
    high_priv_active_count = 0
    high_priv_protected_count = 0
    unprotected_high_priv: list[str] = []

    for role_id, assignments in roles_map.items():
        role_name = assignments[0].roleName
        is_high_priv = role_id in HIGH_PRIVILEGE_ROLES
        ca_prot, mfa_req = role_ca.get(role_id, (False, False))
        active_count = sum(1 for a in assignments if a.assignmentType == "active")
        eligible_count = sum(1 for a in assignments if a.assignmentType == "eligible")

        if is_high_priv and active_count > 0:
            high_priv_active_count += active_count
            if ca_prot or mfa_req:
                high_priv_protected_count += active_count
            else:
                unprotected_high_priv.append(role_name)

        role_summaries.append(
            RoleSummary(
                roleDefinitionId=role_id,
                roleName=role_name,
                isHighPrivilege=is_high_priv,
                activeCount=active_count,
                eligibleCount=eligible_count,
                caProtected=ca_prot,
                mfaRequired=mfa_req,
                assignments=assignments,
            )
        )

    role_summaries.sort(key=lambda r: (-r.isHighPrivilege, -r.activeCount, r.roleName))

    return DashboardData(
        tenantId=tenant_info.get("id", ""),
        tenantDisplayName=tenant_info.get("displayName"),
        scannedAt=datetime.now(timezone.utc),
        totalActiveAssignments=len(active_assignments),
        totalEligibleAssignments=len(eligible_assignments),
        highPrivilegeActiveCount=high_priv_active_count,
        highPrivilegeProtectedCount=high_priv_protected_count,
        roles=role_summaries,
        unprotectedHighPrivRoles=list(set(unprotected_high_priv)),
    )
