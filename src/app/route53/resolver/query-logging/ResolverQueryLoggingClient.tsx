"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/dateUtils";
import {
  ResolverQueryLogConfigItem,
  listResolverQueryLogConfigsAction,
  deleteResolverQueryLogConfigAction,
} from "../resolver-actions";

interface Props {
  initialConfigs: ResolverQueryLogConfigItem[];
}

export default function ResolverQueryLoggingClient({ initialConfigs }: Props) {
  const router = useRouter();
  const [configs, setConfigs] = useState<ResolverQueryLogConfigItem[]>(initialConfigs);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  const refreshData = async () => {
    setRefreshing(true);
    const res = await listResolverQueryLogConfigsAction();
    if (res.success) {
      setConfigs(res.configs);
    }
    setRefreshing(false);
  };

  const filteredConfigs = configs.filter((c) => {
    return (
      (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      (c.destinationArn?.toLowerCase() || "").includes(search.toLowerCase())
    );
  });

  const handleDelete = async () => {
    if (!selectedConfig) return;
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteResolverQueryLogConfigAction(selectedConfig.id);
    if (res.success) {
      setShowDeleteModal(false);
      setSelectedConfigId(null);
      await refreshData();
    } else {
      setDeleteError(res.error || "Failed to delete query log config");
    }
    setIsDeleting(false);
  };

  const destinationTypeBadge = (arn?: string) => {
    if (!arn) return null;
    if (arn.includes(":logs:")) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          CloudWatch Logs
        </span>
      );
    }
    if (arn.includes(":s3:::") || arn.startsWith("arn:aws:s3:::")) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Amazon S3
        </span>
      );
    }
    if (arn.includes(":firehose:")) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Firehose
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Query logging configurations</h1>
          <p className="text-xs text-gray-500 mt-1">
            Resolver query logging lets you log DNS queries originating from your VPCs to Amazon
            CloudWatch Logs or Amazon S3.
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
            disabled={!selectedConfig}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
          >
            Delete
          </button>
          <Link
            href="/route53/resolver/query-logging/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold rounded shadow-sm"
          >
            Configure query logging
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
            placeholder="Search by name, ID, or destination..."
            className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="text-gray-500 font-medium">
          Showing {filteredConfigs.length} of {configs.length} configuration(s)
        </div>
      </div>

      {/* Configurations Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Configuration ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Destination type</th>
                <th className="py-2.5 px-3">Destination ARN</th>
                <th className="py-2.5 px-3">Associated VPCs</th>
                <th className="py-2.5 px-3">Creation time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No query logging configurations found.
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((c) => {
                  const isSelected = selectedConfigId === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedConfigId(isSelected ? null : c.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedConfig"
                          checked={isSelected}
                          onChange={() => setSelectedConfigId(c.id)}
                          className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{c.name || "-"}</td>
                      <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                        <Link
                          href={`/route53/resolver/query-logging/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {c.id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">
                          {c.status || "CREATED"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{destinationTypeBadge(c.destinationArn)}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-600 text-[11px] max-w-xs truncate" title={c.destinationArn}>
                        {c.destinationArn || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 font-semibold">{c.associationCount ?? 0}</td>
                      <td className="py-2.5 px-3 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(c.creationTime)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Config Bottom Drawer */}
      {selectedConfig && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-bold text-gray-800">
                Configuration: <span className="font-mono text-[#0073bb]">{selectedConfig.name || selectedConfig.id}</span>
              </span>
              <Link
                href={`/route53/resolver/query-logging/${selectedConfig.id}`}
                className="text-[#0073bb] hover:underline font-medium"
              >
                View details &rsaquo;
              </Link>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-gray-500 font-medium">Configuration ID</dt>
              <dd className="font-mono text-gray-900 mt-0.5">{selectedConfig.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Status</dt>
              <dd className="text-gray-900 mt-0.5 font-semibold">{selectedConfig.status || "CREATED"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Associated VPCs</dt>
              <dd className="text-gray-900 mt-0.5 font-semibold">{selectedConfig.associationCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Destination</dt>
              <dd className="font-mono text-gray-900 mt-0.5 text-[11px] truncate" title={selectedConfig.destinationArn}>
                {selectedConfig.destinationArn}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-300 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Delete query logging configuration</h3>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to delete the configuration{" "}
              <strong className="text-gray-900 font-mono">{selectedConfig.name || selectedConfig.id}</strong>?
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800 space-y-1">
              <p className="font-bold">Caution:</p>
              <p>
                Deleting this configuration will stop DNS query logging for all associated VPCs. Existing
                logs in your destination will be preserved.
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
                {isDeleting ? "Deleting..." : "Delete configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
