"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RAMPermission } from "../types";
import { fetchPermissionDetail } from "../actions";

interface PermissionsLibraryClientProps {
  initialPermissions: RAMPermission[];
}

export default function PermissionsLibraryClient({
  initialPermissions,
}: PermissionsLibraryClientProps) {
  const router = useRouter();
  const [permissions] = useState<RAMPermission[]>(initialPermissions);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [activePerm, setActivePerm] = useState<RAMPermission | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  const uniqueTypes = Array.from(new Set(permissions.map((p) => p.resourceType))).filter(Boolean);

  const filtered = permissions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.resourceType.toLowerCase().includes(search.toLowerCase()) ||
      p.arn.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || p.resourceType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenPermDetail = async (perm: RAMPermission) => {
    setActivePerm(perm);
    setPolicyLoading(true);
    try {
      const res = await fetchPermissionDetail(perm.arn);
      if (res.success && res.data) {
        setActivePerm(res.data);
      }
    } catch {
      // ignore
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#16191f]">Permissions library</h1>
          <p className="text-sm text-[#545b64] mt-1">
            AWS RAM managed permissions define the actions that principals can perform on shared resources.
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-3 rounded-[2px] transition-colors flex items-center justify-center self-start sm:self-auto"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          title="Refresh"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Find permissions by name or ARN"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 pl-8 border border-[#aab7b8] rounded-[2px] focus:outline-none focus:border-[#0073bb]"
              />
              <svg
                className="absolute left-2.5 top-2.5 text-[#545b64]"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All resource types ({permissions.length})</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t} ({permissions.filter((p) => p.resourceType === t).length})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-[#545b64]">
            {filtered.length} {filtered.length === 1 ? "permission" : "permissions"}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3">Permission Name</th>
                <th className="p-3">Resource Type</th>
                <th className="p-3">Version</th>
                <th className="p-3">Default</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#545b64]">
                    No permissions match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((perm) => (
                  <tr key={perm.arn} className="hover:bg-[#f9f9f9]">
                    <td className="p-3 font-semibold text-[#16191f]">{perm.name}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs bg-[#f2f3f3] px-2 py-0.5 rounded text-[#545b64]">
                        {perm.resourceType}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-[#545b64]">v{perm.version}</td>
                    <td className="p-3 text-xs">
                      {perm.isResourceTypeDefault ? (
                        <span className="text-[#1d8102] font-semibold">Yes</span>
                      ) : (
                        "No"
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102]">
                        {perm.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenPermDetail(perm)}
                        className="text-xs text-[#0073bb] hover:underline font-bold"
                      >
                        View policy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Detail Drawer/Modal */}
      {activePerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <div>
                <h3 className="text-base font-bold text-[#16191f]">{activePerm.name}</h3>
                <span className="font-mono text-[11px] text-[#545b64]">{activePerm.arn}</span>
              </div>
              <button
                onClick={() => setActivePerm(null)}
                className="text-gray-500 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs bg-[#fafafa] p-3 rounded border border-[#eaeded]">
              <div>
                <span className="text-[#545b64] block">Resource type</span>
                <span className="font-mono font-semibold text-[#16191f]">{activePerm.resourceType}</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Version</span>
                <span className="font-semibold text-[#16191f]">v{activePerm.version}</span>
              </div>
              <div>
                <span className="text-[#545b64] block">Default version</span>
                <span className="font-semibold text-[#16191f]">
                  {activePerm.isResourceTypeDefault ? "Yes" : "No"}
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#16191f] mb-1">Policy statement:</h4>
              {policyLoading ? (
                <div className="p-6 text-center text-xs text-[#545b64]">Loading policy...</div>
              ) : (
                <pre className="bg-[#f9f9f9] border border-[#eaeded] rounded p-3 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {activePerm.permission ||
                    JSON.stringify(
                      {
                        Version: "2012-10-17",
                        Statement: [
                          {
                            Effect: "Allow",
                            Action: [`${activePerm.resourceType.split(":")[0]}:*`],
                            Resource: "*",
                          },
                        ],
                      },
                      null,
                      2
                    )}
                </pre>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setActivePerm(null)}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
