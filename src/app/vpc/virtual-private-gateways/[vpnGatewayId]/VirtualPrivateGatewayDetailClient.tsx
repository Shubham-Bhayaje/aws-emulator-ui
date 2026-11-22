"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VirtualPrivateGatewayItem,
  attachVirtualPrivateGatewayAction,
  detachVirtualPrivateGatewayAction,
  deleteVirtualPrivateGatewayAction,
  getVirtualPrivateGatewayDetailAction,
} from "../../vpn-actions";

interface Props {
  virtualPrivateGateway: VirtualPrivateGatewayItem;
  vpcs: { VpcId: string; Name?: string; CidrBlock?: string }[];
}

export default function VirtualPrivateGatewayDetailClient({
  virtualPrivateGateway: initialVgw,
  vpcs,
}: Props) {
  const router = useRouter();

  const [vgw, setVgw] = useState<VirtualPrivateGatewayItem>(initialVgw);
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "tags">("details");

  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachVpcId, setAttachVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");
  const [attachLoading, setAttachLoading] = useState(false);

  const [isDetachModalOpen, setIsDetachModalOpen] = useState(false);
  const [detachLoading, setDetachLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refreshDetails = async () => {
    const res = await getVirtualPrivateGatewayDetailAction(vgw.VpnGatewayId);
    if (res.success && res.virtualPrivateGateway) {
      setVgw(res.virtualPrivateGateway);
    }
  };

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachVpcId) return;
    setAttachLoading(true);
    setMessage(null);
    try {
      const res = await attachVirtualPrivateGatewayAction(vgw.VpnGatewayId, attachVpcId);
      if (res.success) {
        setIsAttachModalOpen(false);
        setMessage({ type: "success", text: `Attached to VPC ${attachVpcId}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to attach to VPC" });
      }
    } finally {
      setAttachLoading(false);
    }
  };

  const handleDetach = async () => {
    if (!vgw.AttachedVpcId) return;
    setDetachLoading(true);
    setMessage(null);
    try {
      const res = await detachVirtualPrivateGatewayAction(vgw.VpnGatewayId, vgw.AttachedVpcId);
      if (res.success) {
        setIsDetachModalOpen(false);
        setMessage({ type: "success", text: `Detached from VPC ${vgw.AttachedVpcId}` });
        await refreshDetails();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to detach from VPC" });
      }
    } finally {
      setDetachLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteVirtualPrivateGatewayAction(vgw.VpnGatewayId);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/vpc/virtual-private-gateways");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete virtual private gateway" });
      }
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
        <Link href="/vpc/virtual-private-gateways" className="hover:text-[#0073bb]">
          Virtual private gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">{vgw.VpnGatewayId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 border border-[#eaeded] rounded shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {vgw.Name || vgw.VpnGatewayId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                vgw.State === "available"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {vgw.State}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {vgw.VpnGatewayId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {vgw.AttachedVpcId ? (
            <button
              onClick={() => setIsDetachModalOpen(true)}
              className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Detach from VPC
            </button>
          ) : (
            <button
              onClick={() => setIsAttachModalOpen(true)}
              className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Attach to VPC
            </button>
          )}

          <button
            onClick={() => {
              setDeleteConfirmText("");
              setIsDeleteModalOpen(true);
            }}
            disabled={Boolean(vgw.AttachedVpcId)}
            title={vgw.AttachedVpcId ? "Detach from VPC before deleting" : ""}
            className="px-3 text-xs font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete virtual private gateway
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 text-xs rounded border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
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
            onClick={() => setActiveTab("attachments")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "attachments"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            VPC attachments ({vgw.VpcAttachments.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tags ({vgw.Tags ? Object.keys(vgw.Tags).length : 0})
          </button>
        </nav>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-gray-200 rounded p-6 shadow-sm space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">
              Virtual private gateway details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
              <div>
                <dt className="text-gray-500">Virtual private gateway ID</dt>
                <dd className="font-mono text-gray-900 font-medium select-all">
                  {vgw.VpnGatewayId}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">State</dt>
                <dd className="text-gray-900 capitalize font-medium">{vgw.State}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Autonomous System Number (ASN)</dt>
                <dd className="font-mono text-gray-900 font-medium">{vgw.AmazonSideAsn}</dd>
              </div>

              <div>
                <dt className="text-gray-500">Attached VPC ID</dt>
                <dd className="font-mono text-[#0073bb]">
                  {vgw.AttachedVpcId ? (
                    <Link href="/vpc/vpcs" className="hover:underline">
                      {vgw.AttachedVpcId}
                    </Link>
                  ) : (
                    <span className="text-gray-400 font-normal">detached</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="text-gray-900">{vgw.Type}</dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: VPC Attachments */}
      {activeTab === "attachments" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Attached VPCs ({vgw.VpcAttachments.length})</h3>
            {!vgw.AttachedVpcId && (
              <button
                onClick={() => setIsAttachModalOpen(true)}
                className="px-3 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Attach to VPC
              </button>
            )}
          </div>
          {vgw.VpcAttachments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              This virtual private gateway is not currently attached to any VPC.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-semibold">VPC ID</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vgw.VpcAttachments.map((att) => (
                  <tr key={att.VpcId} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                      <Link href="/vpc/vpcs" className="hover:underline">
                        {att.VpcId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                        {att.State}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setIsDetachModalOpen(true)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Detach
                      </button>
                    </td>
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
          {!vgw.Tags || Object.keys(vgw.Tags).length === 0 ? (
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
                {Object.entries(vgw.Tags).map(([k, v]) => (
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

      {/* Attach Modal */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Attach to VPC</h3>
            <p className="text-xs text-gray-600">
              Attach virtual private gateway <span className="font-mono font-medium">{vgw.VpnGatewayId}</span> to a VPC.
            </p>

            <form onSubmit={handleAttach} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  VPC <span className="text-red-500">*</span>
                </label>
                {vpcs.length === 0 ? (
                  <div className="p-3 border border-dashed rounded text-xs text-gray-600 bg-gray-50">
                    No VPCs available.
                  </div>
                ) : (
                  <select
                    value={attachVpcId}
                    onChange={(e) => setAttachVpcId(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ec7211] bg-white"
                  >
                    {vpcs.map((v) => (
                      <option key={v.VpcId} value={v.VpcId}>
                        {v.Name ? `${v.Name} (${v.VpcId})` : v.VpcId} - {v.CidrBlock}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttachModalOpen(false)}
                  className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attachLoading || !attachVpcId}
                  className="px-4 text-xs font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {attachLoading ? "Attaching..." : "Attach to VPC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detach Modal */}
      {isDetachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Detach from VPC</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to detach virtual private gateway{" "}
              <span className="font-mono font-medium">{vgw.VpnGatewayId}</span> from VPC{" "}
              <span className="font-mono font-bold text-red-600">{vgw.AttachedVpcId}</span>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDetachModalOpen(false)}
                className="px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDetach}
                disabled={detachLoading}
                className="px-4 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {detachLoading ? "Detaching..." : "Detach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete virtual private gateway</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to delete virtual private gateway{" "}
              <span className="font-mono font-bold text-red-600">{vgw.VpnGatewayId}</span>?
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
