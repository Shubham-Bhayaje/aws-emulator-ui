"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  InternetGatewayItem,
  VpcItem,
  attachInternetGatewayAction,
  detachInternetGatewayAction,
  deleteInternetGatewayAction,
} from "../../actions";

interface Props {
  internetGateway: InternetGatewayItem;
  vpcs: VpcItem[];
  attachedVpc?: VpcItem;
}

export default function InternetGatewayDetailClient({
  internetGateway: initialIgw,
  vpcs,
  attachedVpc: initialAttachedVpc,
}: Props) {
  const router = useRouter();

  const [igw, setIgw] = useState<InternetGatewayItem>(initialIgw);
  const [attachedVpc, setAttachedVpc] = useState<VpcItem | undefined>(initialAttachedVpc);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Modals
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [selectedVpcToAttach, setSelectedVpcToAttach] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");

  const [isDetachOpen, setIsDetachOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVpcToAttach) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await attachInternetGatewayAction(igw.InternetGatewayId, selectedVpcToAttach);
      if (res.success) {
        const targetVpc = vpcs.find((v) => v.VpcId === selectedVpcToAttach);
        setIgw((prev) => ({ ...prev, State: "attached", VpcId: selectedVpcToAttach }));
        setAttachedVpc(targetVpc);
        setIsAttachOpen(false);
        setMessage({ type: "success", text: `Successfully attached ${igw.InternetGatewayId} to ${selectedVpcToAttach}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to attach Internet Gateway" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetach = async () => {
    if (!igw.VpcId) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await detachInternetGatewayAction(igw.InternetGatewayId, igw.VpcId);
      if (res.success) {
        setIgw((prev) => ({ ...prev, State: "detached", VpcId: undefined }));
        setAttachedVpc(undefined);
        setIsDetachOpen(false);
        setMessage({ type: "success", text: `Successfully detached ${igw.InternetGatewayId}` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to detach Internet Gateway" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteInternetGatewayAction(igw.InternetGatewayId);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/internet-gateways");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete Internet Gateway" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/internet-gateways" className="hover:text-[#0073bb]">
          Internet gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{igw.InternetGatewayId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{igw.Name || igw.InternetGatewayId}</h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                igw.State === "attached"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {igw.State}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{igw.InternetGatewayId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/internet-gateways"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all internet gateways
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isActionsOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-30 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                {igw.State === "attached" ? (
                  <button
                    onClick={() => setIsDetachOpen(true)}
                    className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Detach from VPC
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAttachOpen(true)}
                    className="w-full text-left px-4 py-2 text-xs text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    Attach to VPC
                  </button>
                )}
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  disabled={igw.State === "attached"}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete internet gateway
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-3 rounded border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="font-bold ml-2 text-gray-500 hover:text-black"
          >
            ×
          </button>
        </div>
      )}

      {/* Overview Metrics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Internet Gateway ID</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5 truncate">
            {igw.InternetGatewayId}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">State</div>
          <div className="text-[13px] font-semibold text-emerald-700 mt-0.5">{igw.State}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Attached VPC ID</div>
          <div className="text-[13px] font-mono text-[#0073bb] font-semibold mt-0.5 truncate">
            {igw.VpcId ? (
              <Link href={`/vpc/vpcs/${igw.VpcId}`} className="hover:underline">
                {igw.VpcId}
              </Link>
            ) : (
              <span className="text-[#545b64]">-</span>
            )}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Owner</div>
          <div className="text-[13px] font-mono text-[#16191f] mt-0.5">000000000000</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 text-[13px]">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(igw.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
            <div>
              <span className="text-[#545b64] block mb-1">Internet gateway ID</span>
              <span className="font-mono font-semibold text-[#16191f]">{igw.InternetGatewayId}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">State</span>
              <span className="text-emerald-700 font-semibold">{igw.State}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Attached VPC</span>
              {igw.VpcId ? (
                <Link href={`/vpc/vpcs/${igw.VpcId}`} className="font-mono text-[#0073bb] hover:underline font-semibold">
                  {igw.VpcId} {attachedVpc?.Name ? `(${attachedVpc.Name})` : ""}
                </Link>
              ) : (
                <span className="text-[#545b64]">-</span>
              )}
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Name</span>
              <span className="text-[#16191f]">{igw.Name || "-"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Owner</span>
              <span className="font-mono text-[#16191f]">000000000000</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Key-value tags assigned to this internet gateway.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Key</th>
                <th className="py-2.5 px-6">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {Object.entries(igw.Tags || {}).map(([k, v]) => (
                <tr key={k} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">{k}</td>
                  <td className="py-2.5 px-6 font-mono text-[#545b64]">{v}</td>
                </tr>
              ))}
              {Object.keys(igw.Tags || {}).length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-xs text-[#545b64]">
                    No tags associated with this internet gateway.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Attach to VPC Modal */}
      {isAttachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Attach to VPC</h3>
            <form onSubmit={handleAttach} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#16191f] block mb-1">
                  VPC ID
                </label>
                <select
                  value={selectedVpcToAttach}
                  onChange={(e) => setSelectedVpcToAttach(e.target.value)}
                  className="w-full text-xs border border-[#aab7b8] rounded p-2 bg-white"
                  style={{ height: "32px" }}
                >
                  {vpcs.map((v) => (
                    <option key={v.VpcId} value={v.VpcId}>
                      {v.VpcId} {v.Name ? `(${v.Name})` : ""} - {v.CidrBlock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsAttachOpen(false)}
                  className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedVpcToAttach}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {actionLoading ? "Attaching..." : "Attach internet gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detach Modal */}
      {isDetachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Detach from VPC</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to detach internet gateway <span className="font-mono font-semibold">{igw.InternetGatewayId}</span> from VPC <span className="font-mono font-semibold">{igw.VpcId}</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsDetachOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDetach}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {actionLoading ? "Detaching..." : "Detach internet gateway"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete internet gateway</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete internet gateway <span className="font-mono font-semibold text-red-600">{igw.InternetGatewayId}</span>? To confirm, type <span className="font-mono font-bold">delete</span> below.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full text-xs border border-[#aab7b8] rounded p-2"
              style={{ height: "32px" }}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-1.5 text-xs font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-gray-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "delete" || deleteLoading}
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
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
