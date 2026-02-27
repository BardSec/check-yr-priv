import clsx from "clsx";

export function StatCard({ label, value, sub, color = "default", icon: Icon }) {
  const colors = {
    default: "text-slate-100",
    red: "text-red-400",
    green: "text-emerald-400",
    yellow: "text-amber-400",
    blue: "text-brand-400",
  };

  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <div className={clsx("text-3xl font-bold tabular-nums", colors[color])}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
