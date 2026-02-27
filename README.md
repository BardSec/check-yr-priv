# Check yr Priv — Entra Role Assignment Visualizer

A Dockerized web app that connects to your Microsoft Entra ID tenant (via an app registration + delegated SSO) and shows you:

- **Who** holds which Entra directory roles
- Whether each assignment is **PIM-eligible** or **permanently active**
- Whether high-privilege roles are covered by a **Conditional Access / MFA policy**
- A clear **alert banner** for unprotected high-privilege active assignments

---

## Architecture

```
Browser → Nginx :80
               ├─ /auth/*  → FastAPI backend (MSAL OAuth2 + session)
               ├─ /api/*   → FastAPI backend (Microsoft Graph queries)
               └─ /        → React SPA (Vite build served by nginx)

FastAPI ─► Redis  (signed server-side session storage)
        ─► Microsoft Graph API  (role data, PIM, CA policies)
```

## Quick start

### 1. Create an Entra App Registration

1. Go to **Azure Portal → Azure Active Directory → App registrations → New registration**
2. Name it `check-yr-priv` (or similar)
3. **Redirect URI**: `Web` → `http://localhost/auth/callback`
4. After creation, go to **Certificates & secrets → New client secret** — copy the value
5. Go to **API permissions → Add a permission → Microsoft Graph → Delegated**:
   | Permission | Why |
   |---|---|
   | `User.Read` | Basic sign-in |
   | `Directory.Read.All` | Read directory objects |
   | `RoleManagement.Read.All` | Read role assignments & PIM data |
   | `PrivilegedAccess.Read.AzureAD` | Read PIM eligible schedules |
   | `Policy.Read.All` | Read Conditional Access policies |
   | `AuditLog.Read.All` | *(optional)* Sign-in / MFA evidence |
6. Click **Grant admin consent** for your tenant

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your app registration values
```

Required values in `.env`:
```
AZURE_CLIENT_ID=<Application (client) ID>
AZURE_CLIENT_SECRET=<the secret you copied>
AZURE_TENANT_ID=<Directory (tenant) ID>
AZURE_REDIRECT_URI=http://localhost/auth/callback
SECRET_KEY=<openssl rand -hex 32>
APP_BASE_URL=http://localhost
```

### 3. Run

```bash
docker compose up --build
```

Then open **http://localhost** and sign in with your M365 account.

---

## What you'll see

| Feature | Details |
|---|---|
| **Stat cards** | Active assignments, PIM-eligible, high-privilege count, protected count |
| **Alert banner** | Lists any high-privilege roles with active assignments and no CA/MFA policy |
| **Role table** | Every assigned role, expandable to show each principal |
| **Badges** | High Privilege · Active/Eligible · CA Protected · MFA Required · Permanent |
| **Coverage donut chart** | % of high-privilege active assignments covered by a CA or MFA policy |
| **Filters** | All roles / High Privilege only / Unprotected only |

## High-privilege roles flagged

Global Administrator, Privileged Role Administrator, Security Administrator, Exchange Administrator, SharePoint Administrator, User Administrator, Privileged Authentication Administrator, Hybrid Identity Administrator, Cloud Application Administrator, Application Administrator, Conditional Access Administrator, Authentication Policy Administrator, Directory Synchronization Accounts, Intune Administrator.

---

## Development

The backend is in `./backend` (Python 3.12 + FastAPI + MSAL).
The frontend is in `./frontend` (React 18 + Vite + Tailwind CSS).

```bash
# Backend only (with a local .env):
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only:
cd frontend && npm install && npm run dev
```

## Security notes

- Tokens are stored **server-side in Redis** (never sent to the browser beyond a signed session cookie)
- All Graph calls use **delegated permissions** — the app can only see what the signed-in user can see
- The session cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when `APP_BASE_URL` starts with `https`
- Nginx enforces per-IP rate limits on `/auth/` and `/api/`
- No data is persisted beyond the session TTL (8 hours)
