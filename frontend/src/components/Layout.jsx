import { LogOut, Shield } from "lucide-react";

export function Layout({ user, onLogout, children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-brand-500" />
            <span className="font-bold text-white tracking-tight">Check yr Priv</span>
            <span className="hidden sm:inline text-slate-500 text-sm">— Entra Role Visualizer</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden md:block">
                {user.preferred_username || user.name}
              </span>
              <button onClick={onLogout} className="btn-ghost text-xs">
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-800 text-center text-xs text-slate-600 py-4">
        Check yr Priv — data sourced live from Microsoft Graph API
      </footer>
    </div>
  );
}
