import { Shield } from "lucide-react";

export function LoginPage({ error }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-brand-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Check yr Priv</h1>
            <p className="text-slate-400 text-sm mt-1">Entra Role Assignment Visualizer</p>
          </div>
        </div>

        {/* Card */}
        <div className="card flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Sign in to your tenant</h2>
            <p className="text-slate-400 text-sm mt-1">
              Uses delegated permissions — you only see what you have access to.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-900 px-4 py-3 text-sm text-red-300">
              {decodeURIComponent(error)}
            </div>
          )}

          <a href="/auth/login" className="btn-primary justify-center py-3 text-base">
            <MicrosoftIcon />
            Sign in with Microsoft
          </a>

          <div className="border-t border-slate-800 pt-4 text-xs text-slate-500 space-y-1.5">
            <p className="font-medium text-slate-400">Reads via Microsoft Graph API:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Directory role assignments (active & PIM-eligible)</li>
              <li>Conditional Access policies</li>
              <li>Tenant &amp; principal information</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          No data is stored. All queries are read-only.
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
