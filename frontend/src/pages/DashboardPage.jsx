import { Download, RefreshCw, ShieldAlert, ShieldCheck, Users, Zap } from "lucide-react";
import { AlertBanner } from "../components/AlertBanner";
import { Layout } from "../components/Layout";
import { ProtectionChart } from "../components/ProtectionChart";
import { RoleTable } from "../components/RoleTable";
import { StatCard } from "../components/StatCard";
import { useDashboard } from "../hooks/useDashboard";

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );
}

function ErrorView({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <ShieldAlert className="w-12 h-12 text-red-400" />
      <div>
        <p className="text-red-300 font-semibold">Failed to load data</p>
        <p className="text-slate-500 text-sm mt-1">{message}</p>
      </div>
      <button onClick={onRetry} className="btn-primary">
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

function exportCsv(data) {
  const headers = [
    "Role Name",
    "High Privilege",
    "CA Policy Protected",
    "MFA Required",
    "Principal Name",
    "Principal UPN",
    "Principal Type",
    "Assignment Type",
    "Permanent",
    "Member Type",
    "Start Date (UTC)",
    "End Date (UTC)",
  ];

  const escape = (v) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = data.roles.flatMap((role) =>
    role.assignments.map((a) => [
      role.roleName,
      role.isHighPrivilege ? "Yes" : "No",
      role.caProtected ? "Yes" : "No",
      role.mfaRequired ? "Yes" : "No",
      a.principalName,
      a.principalUpn ?? "",
      a.principalType,
      a.assignmentType,
      a.isPermanent ? "Yes" : "No",
      a.memberType ?? "Direct",
      a.startDateTime ? new Date(a.startDateTime).toISOString() : "",
      a.endDateTime ? new Date(a.endDateTime).toISOString() : "",
    ])
  );

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `entra-roles-${data.tenantId}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function DashboardPage({ user, onLogout }) {
  const { data, loading, error, refresh } = useDashboard();

  return (
    <Layout user={user} onLogout={onLogout}>
      {loading && <Spinner />}
      {error && <ErrorView message={error} onRetry={refresh} />}
      {data && !loading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">
                {data.tenantDisplayName || "Tenant"} — Role Assignments
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Scanned {new Date(data.scannedAt).toLocaleString()} · Tenant{" "}
                <span className="font-mono text-slate-500 text-xs">{data.tenantId}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportCsv(data)} className="btn-ghost text-xs">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button onClick={refresh} className="btn-ghost text-xs">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Alert */}
          <AlertBanner roles={data.unprotectedHighPrivRoles} />

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Assignments"
              value={data.totalActiveAssignments}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Eligible (PIM)"
              value={data.totalEligibleAssignments}
              icon={Zap}
              color="yellow"
            />
            <StatCard
              label="High-Priv Active"
              value={data.highPrivilegeActiveCount}
              icon={ShieldAlert}
              color={data.highPrivilegeActiveCount > 0 ? "red" : "default"}
            />
            <StatCard
              label="High-Priv Protected"
              value={data.highPrivilegeProtectedCount}
              sub={`of ${data.highPrivilegeActiveCount} total`}
              icon={ShieldCheck}
              color="green"
            />
          </div>

          {/* Chart + table */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
            <RoleTable roles={data.roles} />
            {data.highPrivilegeActiveCount > 0 && (
              <ProtectionChart
                protected={data.highPrivilegeProtectedCount}
                total={data.highPrivilegeActiveCount}
              />
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
