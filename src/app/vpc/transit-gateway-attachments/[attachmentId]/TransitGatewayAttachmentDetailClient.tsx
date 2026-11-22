"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TransitGatewayAttachmentItem,
  deleteTransitGatewayAttachmentAction,
} from "../../transit-gateway-actions";

interface Props {
  attachment: TransitGatewayAttachmentItem;
  vpc?: { VpcId: string; Name?: string; CidrBlock?: string };
  subnets: { SubnetId: string; Name?: string; CidrBlock?: string; AvailabilityZone?: string }[];
}

export default function TransitGatewayAttachmentDetailClient({
  attachment,
  vpc,
  subnets,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"details" | "subnets" | "tags">("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleteLoading(true);
    setErrorMessage(null);
    try {
      const res = await deleteTransitGatewayAttachmentAction(attachment.TransitGatewayAttachmentId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/transit-gateway-attachments");
      } else {
        setErrorMessage(res.error || "Failed to delete attachment");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/transit-gateway-attachments" className="hover:text-[#0073bb]">
          Transit gateway attachments
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">{attachment.TransitGatewayAttachmentId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 border border-[#eaeded] rounded shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {attachment.Name || attachment.TransitGatewayAttachmentId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                attachment.State === "available"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : attachment.State === "pending"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {attachment.State}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {attachment.TransitGatewayAttachmentId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={attachment.State === "deleted"}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete attachment
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs rounded border bg-red-50 text-red-800 border-red-200">
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("subnets")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "subnets"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Subnets ({subnets.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tags ({attachment.Tags ? Object.keys(attachment.Tags).length : 0})
          </button>
        </nav>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">
              Attachment details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <dt className="text-gray-500">Transit gateway attachment ID</dt>
                <dd className="font-mono text-gray-900 font-medium select-all">
                  {attachment.TransitGatewayAttachmentId}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Transit gateway ID</dt>
                <dd>
                  <Link
                    href={`/vpc/transit-gateways/${attachment.TransitGatewayId}`}
                    className="text-[#0073bb] hover:underline font-mono"
                  >
                    {attachment.TransitGatewayId}
                  </Link>
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Resource type</dt>
                <dd className="text-gray-900 capitalize font-medium">{attachment.ResourceType}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Resource ID (VPC)</dt>
                <dd>
                  {attachment.ResourceId ? (
                    <Link
                      href="/vpc/vpcs"
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {attachment.ResourceId}
                      {vpc?.Name ? ` (${vpc.Name})` : ""}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">State</dt>
                <dd className="text-gray-900 font-medium capitalize">{attachment.State}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Association route table ID</dt>
                <dd>
                  {attachment.AssociationRouteTableId ? (
                    <Link
                      href={`/vpc/transit-gateway-route-tables/${attachment.AssociationRouteTableId}`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {attachment.AssociationRouteTableId}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Creation time</dt>
                <dd className="text-gray-900 font-mono" suppressHydrationWarning>
                  {attachment.CreationTime
                    ? new Date(attachment.CreationTime).toLocaleString()
                    : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Resource owner ID</dt>
                <dd className="font-mono text-gray-900">
                  {attachment.ResourceOwnerId || "000000000000"}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Transit gateway owner ID</dt>
                <dd className="font-mono text-gray-900">
                  {attachment.TransitGatewayOwnerId || "000000000000"}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subnets */}
      {activeTab === "subnets" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Associated Subnets ({subnets.length})</h3>
            <Link href="/vpc/subnets" className="text-[#0073bb] hover:underline">
              View all subnets
            </Link>
          </div>
          {subnets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No subnets attached or subnets information unavailable.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-semibold">Subnet ID</th>
                  <th className="py-2.5 px-3 font-semibold">Name</th>
                  <th className="py-2.5 px-3 font-semibold">IPv4 CIDR</th>
                  <th className="py-2.5 px-3 font-semibold">Availability Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subnets.map((sub) => (
                  <tr key={sub.SubnetId} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      <Link href="/vpc/subnets" className="hover:underline">
                        {sub.SubnetId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-gray-900">{sub.Name || "-"}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">{sub.CidrBlock || "-"}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-700">{sub.AvailabilityZone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">Tags</h3>
          </div>
          {!attachment.Tags || Object.keys(attachment.Tags).length === 0 ? (
            <div className="p-6 text-center text-gray-500">No tags assigned.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2 px-3 font-semibold">Key</th>
                  <th className="py-2 px-3 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(attachment.Tags).map(([k, v]) => (
                  <tr key={k} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-800">{k}</td>
                    <td className="py-2 px-3 text-gray-600">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete transit gateway attachment</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete attachment{" "}
              <span className="font-mono font-bold text-red-600">
                {attachment.TransitGatewayAttachmentId}
              </span>
              ? Traffic between this VPC and the transit gateway will be terminated.
            </p>

            <div className="space-y-1">
              <label className="text-xs text-gray-700 block">
                To confirm deletion, type <span className="font-bold font-mono">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText.toLowerCase() !== "delete" || deleteLoading}
                className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
