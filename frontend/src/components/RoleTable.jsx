import { useState } from "react";
import { ChevronDown, ChevronRight, Search, Users } from "lucide-react";
import { AssignmentTypeBadge, CABadge, HighPrivBadge, MFABadge, PermanentBadge } from "./Badges";
import clsx from "clsx";

function AssignmentRow({ a }) {
  return (
    <tr className="border-t border-slate-800/60 text-xs hover:bg-slate-800/30">
      <td className="py-2 pl-10 pr-3">
        <div className="font-medium text-slate-200">{a.principalName}</div>
        {a.principalUpn && <div className="text-slate-500">{a.principalUpn}</div>}
      </td>
      <td className="py-2 px-3 text-slate-400">{a.principalType}</td>
      <td className="py-2 px-3">
        <AssignmentTypeBadge type={a.assignmentType} />
      </td>
      <td className="py-2 px-3">
        <PermanentBadge permanent={a.isPermanent} />
        {!a.isPermanent && a.endDateTime && (
          <span className="text-slate-500">
            until {new Date(a.endDateTime).toLocaleDateString()}
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-slate-500">{a.memberType || "Direct"}</td>
    </tr>
  );
}

function RoleRow({ role }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className={clsx(
          "cursor-pointer hover:bg-slate-800/50 transition-colors",
          role.isHighPrivilege && "bg-red-950/10 hover:bg-red-950/20",
        )}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="py-3 pl-4 pr-3">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <span className="font-medium text-sm text-slate-100">{role.roleName}</span>
            {role.isHighPrivilege && <HighPrivBadge />}
          </div>
        </td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-1 text-sm text-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-blue-400 font-semibold">{role.activeCount}</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-semibold">{role.eligibleCount}</span>
            <span className="text-slate-600 text-xs">active/eligible</span>
          </div>
        </td>
        <td className="py-3 px-3">
          <CABadge protected={role.caProtected} />
        </td>
        <td className="py-3 px-3">
          <MFABadge required={role.mfaRequired} />
        </td>
      </tr>
      {expanded && role.assignments.map((a) => (
        <AssignmentRow key={a.id} a={a} />
      ))}
    </>
  );
}

export function RoleTable({ roles }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | highpriv | unprotected

  const filtered = roles.filter((r) => {
    const matchSearch = r.roleName.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "highpriv") return r.isHighPrivilege;
    if (filter === "unprotected") return r.isHighPrivilege && !r.caProtected && !r.mfaRequired;
    return true;
  });

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-slate-800">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1">
          {[
            { key: "all", label: "All" },
            { key: "highpriv", label: "High Privilege" },
            { key: "unprotected", label: "Unprotected" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === key
                  ? "bg-brand-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 pl-4 pr-3">Role</th>
              <th className="py-3 px-3">Assignments</th>
              <th className="py-3 px-3">CA Policy</th>
              <th className="py-3 px-3">MFA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                  No roles match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((role) => <RoleRow key={role.roleDefinitionId} role={role} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
