"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/dateUtils";
import {
  ResolverRuleItem,
  listResolverRulesAction,
  deleteResolverRuleAction,
} from "../resolver-actions";

interface Props {
  initialRules: ResolverRuleItem[];
}

export default function ResolverRulesClient({ initialRules }: Props) {
  const router = useRouter();
  const [rules, setRules] = useState<ResolverRuleItem[]>(initialRules);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "FORWARD" | "SYSTEM">("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedRule = rules.find((r) => r.id === selectedRuleId);

  const refreshData = async () => {
    setRefreshing(true);
    const res = await listResolverRulesAction();
    if (res.success) {
      setRules(res.rules);
    }
    setRefreshing(false);
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      (r.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.domainName?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || r.ruleType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async () => {
    if (!selectedRule) return;
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteResolverRuleAction(selectedRule.id);
    if (res.success) {
      setShowDeleteModal(false);
      setSelectedRuleId(null);
      await refreshData();
    } else {
      setDeleteError(res.error || "Failed to delete rule");
    }
    setIsDeleting(false);
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case "COMPLETE":
      case "OPERATIONAL":
        return "bg-green-50 text-green-700 border-green-200";
      case "UPDATING":
      case "CREATING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      case "DELETING":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rules</h1>
          <p className="text-xs text-gray-500 mt-1">
            Resolver rules control how DNS queries are forwarded from your VPCs to target IP addresses
            or internal resolvers.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={!selectedRule || selectedRule.ruleType === "SYSTEM"}
            title={selectedRule?.ruleType === "SYSTEM" ? "System rules cannot be deleted" : undefined}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
          >
            Delete
          </button>
          <Link
            href="/route53/resolver/rules/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold rounded shadow-sm"
          >
            Create rule
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or domain..."
            className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
            <span className="text-gray-500 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "ALL" | "FORWARD" | "SYSTEM")}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All types</option>
              <option value="FORWARD">Forward</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>
        <div className="text-gray-500 font-medium">
          Showing {filteredRules.length} of {rules.length} rule(s)
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Rule name</th>
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Rule type</th>
                <th className="py-2.5 px-3">Domain name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Outbound endpoint ID</th>
                <th className="py-2.5 px-3">Associated VPCs</th>
                <th className="py-2.5 px-3">Target IPs</th>
                <th className="py-2.5 px-3">Creation time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    No rules found.
                  </td>
                </tr>
              ) : (
                filteredRules.map((r) => {
                  const isSelected = selectedRuleId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRuleId(isSelected ? null : r.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedRule"
                          checked={isSelected}
                          onChange={() => setSelectedRuleId(r.id)}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {r.name || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                        <Link
                          href={`/route53/resolver/rules/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {r.id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${
                            r.ruleType === "FORWARD"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          }`}
                        >
                          {r.ruleType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-800">{r.domainName || "."}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${statusBadge(
                            r.status
                          )}`}
                        >
                          {r.status || "COMPLETE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">
                        {r.resolverEndpointId ? (
                          <Link
                            href={`/route53/resolver/endpoints/${r.resolverEndpointId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#0073bb] hover:underline"
                          >
                            {r.resolverEndpointId}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">{r.associationCount ?? 0}</td>
                      <td className="py-2.5 px-3 text-gray-700">{r.targetIps?.length ?? 0}</td>
                      <td className="py-2.5 px-3 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(r.creationTime)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Rule Bottom Drawer */}
      {selectedRule && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-gray-800">
                Rule: <span className="font-mono text-[#0073bb]">{selectedRule.name || selectedRule.id}</span>
              </span>
              <Link
                href={`/route53/resolver/rules/${selectedRule.id}`}
                className="text-[#0073bb] hover:underline font-medium"
              >
                View details &rsaquo;
              </Link>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-gray-500 font-medium">Rule ID</dt>
              <dd className="font-mono text-gray-900 mt-0.5">{selectedRule.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Domain name</dt>
              <dd className="font-mono text-gray-900 mt-0.5">{selectedRule.domainName}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Rule type</dt>
              <dd className="text-gray-900 mt-0.5 font-semibold">{selectedRule.ruleType}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Outbound endpoint</dt>
              <dd className="font-mono text-gray-900 mt-0.5">
                {selectedRule.resolverEndpointId ? (
                  <Link
                    href={`/route53/resolver/endpoints/${selectedRule.resolverEndpointId}`}
                    className="text-[#0073bb] hover:underline"
                  >
                    {selectedRule.resolverEndpointId}
                  </Link>
                ) : (
                  "-"
                )}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Delete Rule Confirmation Modal */}
      {showDeleteModal && selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-300 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Delete rule</h3>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to delete the resolver rule{" "}
              <strong className="text-gray-900 font-mono">{selectedRule.name || selectedRule.id}</strong>?
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800 space-y-1">
              <p className="font-bold">Caution:</p>
              <p>
                Deleting this rule will remove conditional forwarding for domain{" "}
                <span className="font-mono font-semibold">{selectedRule.domainName}</span> across all associated VPCs.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
