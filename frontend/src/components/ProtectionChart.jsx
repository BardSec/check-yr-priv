import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Protected: "#10b981",
  Unprotected: "#ef4444",
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-300">{name}</p>
      <p className="text-white font-bold">{value} assignments</p>
    </div>
  );
}

export function ProtectionChart({ protected: prot, total }) {
  const unprotected = total - prot;
  const data = [
    { name: "Protected", value: prot },
    { name: "Unprotected", value: unprotected },
  ].filter((d) => d.value > 0);

  const pct = total > 0 ? Math.round((prot / total) * 100) : 0;

  return (
    <div className="card flex flex-col items-center gap-2">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
        High-Privilege Active Coverage
      </p>
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white">{pct}%</span>
          <span className="text-xs text-slate-500">protected</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[d.name] }}
            />
            <span className="text-slate-400">{d.name}: <span className="text-white font-semibold">{d.value}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
