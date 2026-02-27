import { Lock, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import clsx from "clsx";

export function HighPrivBadge() {
  return (
    <span className="badge bg-red-950 text-red-400 border border-red-900">
      <ShieldAlert className="w-3 h-3" />
      High Privilege
    </span>
  );
}

export function AssignmentTypeBadge({ type }) {
  const isActive = type === "active";
  return (
    <span className={clsx("badge", isActive
      ? "bg-blue-950 text-blue-300 border border-blue-900"
      : "bg-amber-950 text-amber-300 border border-amber-900")}>
      <Zap className="w-3 h-3" />
      {isActive ? "Active" : "Eligible"}
    </span>
  );
}

export function CABadge({ protected: prot }) {
  if (prot) {
    return (
      <span className="badge bg-emerald-950 text-emerald-400 border border-emerald-900">
        <ShieldCheck className="w-3 h-3" />
        CA Protected
      </span>
    );
  }
  return (
    <span className="badge bg-slate-800 text-slate-500 border border-slate-700">
      No CA Policy
    </span>
  );
}

export function MFABadge({ required }) {
  if (required) {
    return (
      <span className="badge bg-emerald-950 text-emerald-400 border border-emerald-900">
        <Lock className="w-3 h-3" />
        MFA Required
      </span>
    );
  }
  return (
    <span className="badge bg-slate-800 text-slate-500 border border-slate-700">
      No MFA Policy
    </span>
  );
}

export function PermanentBadge({ permanent }) {
  if (!permanent) return null;
  return (
    <span className="badge bg-orange-950 text-orange-400 border border-orange-900">
      Permanent
    </span>
  );
}
