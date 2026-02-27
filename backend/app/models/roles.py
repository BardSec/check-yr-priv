from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


HIGH_PRIVILEGE_ROLES = {
    "62e90394-69f5-4237-9190-012177145e10",  # Global Administrator
    "e8611ab8-c189-46e8-94e1-60213ab1f814",  # Privileged Role Administrator
    "194ae4cb-b126-40b2-bd5b-6091b380977d",  # Security Administrator
    "29232cdf-9323-42fd-ade2-1d097af3e4de",  # Exchange Administrator
    "f28a1f50-f6e7-4571-818b-6a12f2af6b6c",  # SharePoint Administrator
    "fe930be7-5e62-47db-91af-98c3a49a38b1",  # User Administrator
    "7be44c8a-adaf-4e2a-84d6-ab2649e08a13",  # Privileged Authentication Administrator
    "8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2",  # Hybrid Identity Administrator
    "158c047a-c907-4556-b7ef-446551a6b5f7",  # Cloud Application Administrator
    "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3",  # Application Administrator
    "b1be1c3e-b65d-4f19-8427-f6fa0d97feb9",  # Conditional Access Administrator
    "0526716b-113d-4c15-b2c8-68e3c22b9f80",  # Authentication Policy Administrator
    "d29b2b05-8046-44ba-8758-1e26182fcf32",  # Directory Synchronization Accounts
    "3a2c62db-5318-420d-8d74-23affee5d9d5",  # Intune Administrator
    "be2f45a1-457d-42af-a067-6ec1fa63bc45",  # External Identity Provider Administrator
}


class Principal(BaseModel):
    id: str
    displayName: str
    userPrincipalName: Optional[str] = None
    principalType: str  # User | Group | ServicePrincipal


class RoleDefinition(BaseModel):
    id: str
    displayName: str
    description: Optional[str] = None
    isHighPrivilege: bool = False


class RoleAssignment(BaseModel):
    id: str
    roleDefinitionId: str
    roleName: str
    principalId: str
    principalName: str
    principalUpn: Optional[str] = None
    principalType: str
    assignmentType: str  # "active" | "eligible"
    memberType: Optional[str] = None  # "Direct" | "Group" | "Inherited"
    startDateTime: Optional[datetime] = None
    endDateTime: Optional[datetime] = None
    isHighPrivilege: bool = False
    isPermanent: bool = False


class CAPolicy(BaseModel):
    id: str
    displayName: str
    state: str  # "enabled" | "disabled" | "enabledForReportingButNotEnforced"
    requiresMfa: bool
    targetRoles: list[str] = []
    targetUsers: list[str] = []
    includesAllUsers: bool = False


class RoleSummary(BaseModel):
    roleDefinitionId: str
    roleName: str
    isHighPrivilege: bool
    activeCount: int
    eligibleCount: int
    caProtected: bool
    mfaRequired: bool
    assignments: list[RoleAssignment]


class DashboardData(BaseModel):
    tenantId: str
    tenantDisplayName: Optional[str] = None
    scannedAt: datetime
    totalActiveAssignments: int
    totalEligibleAssignments: int
    highPrivilegeActiveCount: int
    highPrivilegeProtectedCount: int
    roles: list[RoleSummary]
    unprotectedHighPrivRoles: list[str]
