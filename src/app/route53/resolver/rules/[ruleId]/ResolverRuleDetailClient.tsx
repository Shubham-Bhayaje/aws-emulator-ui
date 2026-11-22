"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/dateUtils";
import {
  ResolverRuleItem,
  ResolverRuleAssociationItem,
  getResolverRuleDetailAction,
  associateResolverRuleAction,
  disassociateResolverRuleAction,
  deleteResolverRuleAction,
} from "../../resolver-actions";

interface Props {
  rule: ResolverRuleItem;
  initialAssociations: ResolverRuleAssociationItem[];
  availableVpcs: Array<{ vpcId: string; name?: string; cidrBlock?: string }>;
}

export default function ResolverRuleDetailClient({
  rule: initialRule,
  initialAssociations,
  availableVpcs,
}: Props) {
  const router = useRouter();
  const [rule, setRule] = useState<ResolverRuleItem>(initialRule);
  const [associations, setAssociations] = useState<ResolverRuleAssociationItem[]>(initialAssociations);
  const [activeTab, setActiveTab] = useState<"overview" | "associated-vpcs" | "target-ips" | "tags">("overview");

  const [refreshing, setRefreshing] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [assocVpcId, setAssocVpcId] = useState(availableVpcs.length > 0 ? availableVpcs[0].vpcId : "");
  const [assocName, setAssocName] = useState("");
  const [isAssociating, setIsAssociating] = useState(false);
  const [assocError, setAssocError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshData = async () => {
    setRefreshing(true);
    const res = await getResolverRuleDetailAction(rule.id);
    if (res.success && res.rule) {
      setRule(res.rule);
      setAssociations(res.associations);
    }
    setRefreshing(false);
  };

  const handleAssociateVpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assocVpcId) return;
    setIsAssociating(true);
    setAssocError(null);

    const res = await associateResolverRuleAction({
      resolverRuleId: rule.id,
      vpcId: assocVpcId,
      name: assocName.trim() || undefined,
    });

    if (res.success) {
      setShowAssociateModal(false);
      setAssocName("");
      await refreshData();
    } else {
      setAssocError(res.error || "Failed to associate VPC");
    }
    setIsAssociating(false);
  };

  const handleDisassociateVpc = async (vpcId: string) => {
    if (!confirm(`Are you sure you want to disassociate VPC ${vpcId} from this rule?`)) return;
    const res = await disassociateResolverRuleAction({
      resolverRuleId: rule.id,
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
    const res = await deleteResolverRuleAction(rule.id);
    if (res.success) {
      setShowDeleteModal(false);
      router.push("/route53/resolver/rules");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete rule");
      setIsDeleting(false);
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case "COMPLETE":
      case "OPERATIONAL":
        return "bg-green-50 text-green-700 border-green-200";
      case "CREATING":
      case "UPDATING":
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-500 space-x-2">
        <Link href="/route53/resolver" className="hover:text-blue-600">
          Route 53 Resolver
        </Link>
        <span>&rsaquo;</span>
        <Link href="/route53/resolver/rules" className="hover:text-blue-600">
          Rules
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-medium font-mono">{rule.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{rule.name || rule.id}</h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(
                rule.status
              )}`}
            >
              {rule.status || "COMPLETE"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {rule.ruleType}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">{rule.id}</p>
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
            disabled={rule.ruleType === "SYSTEM"}
            title={rule.ruleType === "SYSTEM" ? "System rules cannot be deleted" : undefined}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold rounded shadow-sm disabled:opacity-50"
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
          {rule.ruleType === "FORWARD" && (
            <button
              onClick={() => setActiveTab("target-ips")}
              className={`pb-3 font-semibold border-b-2 flex items-center space-x-1.5 ${
                activeTab === "target-ips"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Target IP addresses</span>
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px]">
                {rule.targetIps?.length ?? 0}
              </span>
            </button>
          )}
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
            <h2 className="text-sm font-bold text-gray-900 mb-4">Rule details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div>
                <dt className="text-gray-500 font-medium">Rule ID</dt>
                <dd className="font-mono text-gray-900 mt-1 select-all">{rule.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Rule name</dt>
                <dd className="text-gray-900 mt-1">{rule.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Domain name</dt>
                <dd className="font-mono text-gray-900 mt-1 font-bold">{rule.domainName}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Rule type</dt>
                <dd className="text-gray-900 mt-1 font-semibold">{rule.ruleType}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(
                      rule.status
                    )}`}
                  >
                    {rule.status || "COMPLETE"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Status message</dt>
                <dd className="text-gray-900 mt-1">{rule.statusMessage || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Outbound resolver endpoint</dt>
                <dd className="text-gray-900 mt-1">
                  {rule.resolverEndpointId ? (
                    <Link
                      href={`/route53/resolver/endpoints/${rule.resolverEndpointId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {rule.resolverEndpointId}
                    </Link>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Share status</dt>
                <dd className="text-gray-900 mt-1">{rule.shareStatus || "NOT_SHARED"}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Owner account</dt>
                <dd className="font-mono text-gray-900 mt-1">{rule.ownerId || "-"}</dd>
              </div>
              <div className="col-span-full">
                <dt className="text-gray-500 font-medium">Amazon Resource Name (ARN)</dt>
                <dd className="font-mono text-gray-800 text-[11px] mt-1 break-all select-all">
                  {rule.arn || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Creation time</dt>
                <dd className="text-gray-900 mt-1 font-mono" suppressHydrationWarning>
                  {formatDateTime(rule.creationTime)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Last modified time</dt>
                <dd className="text-gray-900 mt-1 font-mono" suppressHydrationWarning>
                  {formatDateTime(rule.modificationTime)}
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
                VPCs associated with this rule use it to route queries for domain {rule.domainName}.
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
                  <th className="py-2.5 px-4">Association name</th>
                  <th className="py-2.5 px-4">VPC ID</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {associations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No VPCs associated with this rule.
                    </td>
                  </tr>
                ) : (
                  associations.map((assoc) => (
                    <tr key={assoc.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono text-gray-900">{assoc.id}</td>
                      <td className="py-2.5 px-4 text-gray-900">{assoc.name || "-"}</td>
                      <td className="py-2.5 px-4 font-mono text-[#0073bb]">
                        <Link href={`/vpc/vpcs/${assoc.vpcId}`} className="hover:underline">
                          {assoc.vpcId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border ${statusColor(
                            assoc.status
                          )}`}
                        >
                          {assoc.status || "COMPLETE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleDisassociateVpc(assoc.vpcId)}
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

      {/* Tab: Target IP addresses */}
      {activeTab === "target-ips" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900">Target IP addresses</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Queries for {rule.domainName} will be forwarded to these target resolvers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] text-gray-600 border-b border-gray-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">IPv4 address</th>
                  <th className="py-2.5 px-4">Port</th>
                  <th className="py-2.5 px-4">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!rule.targetIps || rule.targetIps.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">
                      No target IP addresses defined for this rule.
                    </td>
                  </tr>
                ) : (
                  rule.targetIps.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{t.ip}</td>
                      <td className="py-2.5 px-4 font-mono text-gray-700">{t.port || 53}</td>
                      <td className="py-2.5 px-4 text-gray-700">{t.protocol || "Do53"}</td>
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
                <td className="py-2 px-3 font-mono text-gray-900">{rule.name || "-"}</td>
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
              Select a VPC to associate with rule{" "}
              <strong className="text-gray-900 font-mono">{rule.name || rule.id}</strong>.
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

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Association name - <span className="font-normal text-gray-500">optional</span>
                </label>
                <input
                  type="text"
                  value={assocName}
                  onChange={(e) => setAssocName(e.target.value)}
                  placeholder="my-vpc-association"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                />
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

      {/* Delete Rule Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-300 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Delete rule</h3>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to delete the resolver rule{" "}
              <strong className="text-gray-900 font-mono">{rule.name || rule.id}</strong>?
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-xs text-yellow-800 space-y-1">
              <p className="font-bold">Caution:</p>
              <p>
                Deleting this rule will remove conditional forwarding for domain{" "}
                <span className="font-mono font-semibold">{rule.domainName}</span> across all associated VPCs.
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
