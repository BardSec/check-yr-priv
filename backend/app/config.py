from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    azure_client_id: str
    azure_client_secret: str
    azure_tenant_id: str
    azure_redirect_uri: str = "http://localhost/auth/callback"
    app_base_url: str = "http://localhost"
    secret_key: str
    redis_url: str = "redis://redis:6379/0"

    # Microsoft Graph + OIDC endpoints
    @property
    def authority(self) -> str:
        return f"https://login.microsoftonline.com/{self.azure_tenant_id}"

    @property
    def graph_base(self) -> str:
        return "https://graph.microsoft.com/v1.0"

    scopes: list[str] = [
        "User.Read",
        "Directory.Read.All",
        "RoleManagement.Read.All",
        "PrivilegedAccess.Read.AzureAD",
        "Policy.Read.All",
        "AuditLog.Read.All",
    ]

    class Config:
        env_file = ".env"


settings = Settings()
