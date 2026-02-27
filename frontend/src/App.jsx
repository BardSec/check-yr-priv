import { useSearchParams } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import { Shield } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <Shield className="w-10 h-10 text-brand-500 animate-pulse" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  const { loading, authenticated, user, logout } = useAuth();
  const [params] = useSearchParams();
  const error = params.get("error");

  if (loading) return <LoadingScreen />;
  if (!authenticated) return <LoginPage error={error} />;
  return <DashboardPage user={user} onLogout={logout} />;
}
