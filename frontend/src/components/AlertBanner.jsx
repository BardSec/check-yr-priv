import { AlertTriangle } from "lucide-react";

export function AlertBanner({ roles }) {
  if (!roles || roles.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-300 font-semibold text-sm">
          {roles.length} high-privilege role{roles.length !== 1 ? "s" : ""} with active assignments are NOT protected by any CA/MFA policy
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {roles.map((r) => (
            <span key={r} className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full border border-red-800">
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
