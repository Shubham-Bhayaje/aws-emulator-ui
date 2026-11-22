"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/dateUtils";
import {
  ResolverQueryLogConfigItem,
  ResolverQueryLogConfigAssociationItem,
  getResolverQueryLogConfigDetailAction,
  associateResolverQueryLogConfigAction,
  disassociateResolverQueryLogConfigAction,
  deleteResolverQueryLogConfigAction,
} from "../../resolver-actions";

interface Props {
  config: ResolverQueryLogConfigItem;
  initialAssociations: ResolverQueryLogConfigAssociationItem[];
  availableVpcs: Array<{ vpcId: string; name?: string; cidrBlock?: string }>;
}

export default function ResolverQueryLogDetailClient({
  config: initialConfig,
  initialAssociations,
  availableVpcs,
}: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<ResolverQueryLogConfigItem>(initialConfig);
  const [associations, setAssociations] = useState<ResolverQueryLogConfigAssociationItem[]>(initialAssociations);
  const [activeTab, setActiveTab] = useState<"overview" | "associated-vpcs" | "tags">("overview");

  const [refreshing, setRefreshing] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [assocVpcId, setAssocVpcId] = useState(availableVpcs.length > 0 ? availableVpcs[0].vpcId : "");
  const [isAssociating, setIsAssociating] = useState(false);
  const [assocError, setAssocError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshData = async () => {
    setRefreshing(true);
    const res = await getResolverQueryLogConfigDetailAction(config.id);
    if (res.success && res.config) {
      setConfig(res.config);
      setAssociations(res.associations);
    }
    setRefreshing(false);
  };

  const handleAssociateVpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocVpcId) return;
    setIsAssociating(true);
    setAssocError(null);

    const res = await associateResolverQueryLogConfigAction({
      resolverQueryLogConfigId: config.id,
      vpcId: assocVpcId,
    });

    if (res.success) {
      setShowAssociateModal(false);
      await refreshData();
    } else {
      setAssocError(res.error || "Failed to associate VPC");
    }
    setIsAssociating(false);
  };

  const handleDisassociateVpc = async (vpcId: string) => {
    if (!confirm(`Are you sure you want to stop query logging for VPC ${vpcId}?`)) return;
    const res = await disassociateResolverQueryLogConfigAction({
      resolverQueryLogConfigId: config.id,
      vpcId,
    });
    if (res.success) {
      await refreshData();
    } else {
      alert(`Error disassociating VPC: ${res.error}`);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const res = await deleteResolverQueryLogConfigAction(config.id);
    if (res.success) {
      setShowDeleteModal(false);
      router.push("/route53/resolver/query-logging");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete configuration");
      setIsDeleting(false);
    }
  };

  const destinationTypeBadge = (arn?: string) => {
    if (!arn) return null;
    if (arn.includes(":logs:")) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          CloudWatch Logs
        </span>
      );
    }
    if (arn.includes(":s3:::") || arn.startsWith("arn:aws:s3:::")) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Amazon S3
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-500 space-x-2">
        <Link href="/route53/resolver" className="hover:text-blue-600">
          Route 53 Resolver
        </Link>
        <span>&rsaquo;</span>
        <Link href="/route53/resolver/query-logging" className="hover:text-blue-600">
          Query logging configurations
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-medium font-mono">{config.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{config.name || config.id}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
              {config.status || "CREATED"}
            </span>
            {destinationTypeBadge(config.destinationArn)}
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">{config.id}</p>
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
            onClick={() => setShowAssociateModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
          >
            Associate VPC
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold rounded shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-semibold border-b-2 ${
              activeTab === "overview"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("associated-vpcs")}
            className={`pb-3 font-semibold border-b-2 flex items-center space-x-1.5 ${
              activeTab === "associated-vpcs"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Associated VPCs</span>
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {associations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-3 font-semibold border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Tags
          </button>
        </nav>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Configuration details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div>
                <dt className="text-gray-500 font-medium">Configuration ID</dt>
                <dd className="font-mono text-gray-900 mt-1 select-all">{config.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Configuration name</dt>
                <dd className="text-gray-900 mt-1">{config.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Status</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
                    {config.status || "CREATED"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Associated VPCs</dt>
                <dd className="text-gray-900 mt-1 font-semibold">{associations.length}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Share status</dt>
                <dd className="text-gray-900 mt-1">{config.shareStatus || "NOT_SHARED"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Owner account</dt>
                <dd className="font-mono text-gray-900 mt-1">{config.ownerId || "-"}</dd>
              </div>
              <div className="col-span-full">
                <dt className="text-gray-500 font-medium">Destination ARN</dt>
                <dd className="font-mono text-gray-900 text-[11px] mt-1 break-all select-all font-semibold">
                  {config.destinationArn || "-"}
                </dd>
              </div>
              <div className="col-span-full">
                <dt className="text-gray-500 font-medium">Amazon Resource Name (ARN)</dt>
                <dd className="font-mono text-gray-800 text-[11px] mt-1 break-all select-all">
                  {config.arn || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Creation time</dt>
                <dd className="text-gray-900 mt-1 font-mono" suppressHydrationWarning>
                  {formatDateTime(config.creationTime)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Associated VPCs */}
      {activeTab === "associated-vpcs" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Associated VPCs</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                DNS queries originating from these VPCs are recorded to the configured destination.
              </p>
            </div>
            <button
              onClick={() => setShowAssociateModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
            >
              Associate VPC
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Association ID</th>
                  <th className="py-2.5 px-4">VPC ID</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Creation time</th>
                  <th className="py-2.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {associations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No VPCs associated with this query logging configuration.
                    </td>
                  </tr>
                ) : (
                  associations.map((assoc) => (
                    <tr key={assoc.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono text-gray-900">{assoc.id}</td>
                      <td className="py-2.5 px-4 font-mono text-[#0073bb]">
                        <Link href={`/vpc/vpcs/${assoc.resourceId}`} className="hover:underline">
                          {assoc.resourceId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border bg-green-50 text-green-700 border-green-200">
                          {assoc.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 font-mono" suppressHydrationWarning>
                        {formatDateTime(assoc.creationTime)}
                      </td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleDisassociateVpc(assoc.resourceId)}
                          className="text-red-600 hover:text-red-800 hover:underline font-semibold"
                        >
                          Disassociate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Tags</h2>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
              <tr>
                <th className="py-2 px-3">Key</th>
                <th className="py-2 px-3">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 font-mono text-gray-700">Name</td>
                <td className="py-2 px-3 font-mono text-gray-900">{config.name || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Associate VPC Modal */}
      {showAssociateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAssociateVpc}
            className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-300 p-6 space-y-4"
          >
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Associate VPC</h3>
            </div>

            <p className="text-xs text-gray-600">
              Select a VPC to associate with query logging configuration{" "}
              <strong className="text-gray-900 font-mono">{config.name || config.id}</strong>.
            </p>

            {assocError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs">
                {assocError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  VPC <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assocVpcId}
                  onChange={(e) => setAssocVpcId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                >
                  {availableVpcs.map((vpc) => (
                    <option key={vpc.vpcId} value={vpc.vpcId}>
                      {vpc.vpcId} {vpc.name ? `(${vpc.name})` : ""} - CIDR: {vpc.cidrBlock || "-"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowAssociateModal(false);
                  setAssocError(null);
                }}
                disabled={isAssociating}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAssociating || !assocVpcId}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50"
              >
                {isAssociating ? "Associating..." : "Associate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-300 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Delete query logging configuration</h3>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to delete the configuration{" "}
              <strong className="text-gray-900 font-mono">{config.name || config.id}</strong>?
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800 space-y-1">
              <p className="font-bold">Caution:</p>
              <p>
                Deleting this configuration will stop DNS query logging for all {associations.length} associated
                VPC(s). Existing log streams and files in your destination are retained.
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
