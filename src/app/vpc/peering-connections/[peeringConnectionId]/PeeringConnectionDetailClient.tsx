"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PeeringConnectionItem,
  VpcItem,
  acceptPeeringConnectionAction,
  rejectPeeringConnectionAction,
  deletePeeringConnectionAction,
} from "../../actions";

interface Props {
  peeringConnection: PeeringConnectionItem;
  requesterVpc?: VpcItem;
  accepterVpc?: VpcItem;
}

export default function PeeringConnectionDetailClient({
  peeringConnection: initialPc,
  requesterVpc,
  accepterVpc,
}: Props) {
  const router = useRouter();

  const [pc, setPc] = useState<PeeringConnectionItem>(initialPc);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await acceptPeeringConnectionAction(pc.VpcPeeringConnectionId);
      if (res.success) {
        setPc({ ...pc, Status: "active" });
        setMessage({ type: "success", text: "VPC peering connection request accepted successfully." });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to accept peering connection" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await rejectPeeringConnectionAction(pc.VpcPeeringConnectionId);
      if (res.success) {
        setPc({ ...pc, Status: "rejected" });
        setMessage({ type: "success", text: "VPC peering connection request rejected." });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to reject peering connection" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await deletePeeringConnectionAction(pc.VpcPeeringConnectionId);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/peering-connections");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete peering connection" });
      }
    } finally {
      setLoading(false);
    }
  };

  const isPending = pc.Status === "pending-acceptance";

  return (
    <div className="space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/peering-connections" className="hover:text-[#0073bb]">
          Peering connections
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{pc.VpcPeeringConnectionId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">
              {pc.Tags?.Name || pc.VpcPeeringConnectionId}
            </h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                pc.Status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : pc.Status === "pending-acceptance"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {pc.Status}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{pc.VpcPeeringConnectionId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/peering-connections"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all Peering connections
          </Link>

          {isPending && (
            <button
              onClick={handleAccept}
              disabled={loading}
              className="px-3 text-[13px] font-medium text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] transition-colors flex items-center justify-center"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Accept request
            </button>
          )}

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
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-20 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                {isPending && (
                  <>
                    <button
                      onClick={handleAccept}
                      className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f8fd] flex items-center gap-2"
                    >
                      Accept request
                    </button>
                    <button
                      onClick={handleReject}
                      className="w-full text-left px-4 py-2 text-[13px] text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                    >
                      Reject request
                    </button>
                    <div className="border-t border-[#eaeded] my-1" />
                  </>
                )}
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Delete peering connection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(pc.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5">
            <h3 className="text-[15px] font-bold text-[#16191f] mb-4">Peering connection details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] font-medium">Peering connection ID</dt>
                <dd className="mt-1 font-mono text-[#16191f] font-semibold">{pc.VpcPeeringConnectionId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Status</dt>
                <dd className="mt-1 font-semibold text-[#16191f]">{pc.Status}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Status reason</dt>
                <dd className="mt-1 text-[#545b64]">-</dd>
              </div>
            </div>
          </div>

          {/* VPC info side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#eaeded] rounded p-5">
              <h4 className="text-[14px] font-bold text-[#16191f] mb-3">Requester VPC</h4>
              <div className="space-y-3 text-[13px]">
                <div>
                  <span className="text-[#545b64] font-medium">VPC ID: </span>
                  <Link
                    href={`/vpc/vpcs/${pc.RequesterVpcId}`}
                    className="text-[#0073bb] hover:underline font-mono ml-1"
                  >
                    {requesterVpc?.Name ? `${requesterVpc.Name} (${pc.RequesterVpcId})` : pc.RequesterVpcId}
                  </Link>
                </div>
                <div>
                  <span className="text-[#545b64] font-medium">IPv4 CIDR: </span>
                  <span className="font-mono text-[#16191f] ml-1">{pc.RequesterCidr || requesterVpc?.CidrBlock || "-"}</span>
                </div>
                <div>
                  <span className="text-[#545b64] font-medium">Region: </span>
                  <span className="text-[#16191f] ml-1">us-east-1</span>
                </div>
                <div>
                  <span className="text-[#545b64] font-medium">Owner account: </span>
                  <span className="font-mono text-[#16191f] ml-1">{requesterVpc?.OwnerId || "000000000000"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#eaeded] rounded p-5">
              <h4 className="text-[14px] font-bold text-[#16191f] mb-3">Accepter VPC</h4>
              <div className="space-y-3 text-[13px]">
                <div>
                  <span className="text-[#545b64] font-medium">VPC ID: </span>
                  <Link
                    href={`/vpc/vpcs/${pc.AccepterVpcId}`}
                    className="text-[#0073bb] hover:underline font-mono ml-1"
                  >
                    {accepterVpc?.Name ? `${accepterVpc.Name} (${pc.AccepterVpcId})` : pc.AccepterVpcId}
                  </Link>
                </div>
                <div>
                  <span className="text-[#545b64] font-medium">IPv4 CIDR: </span>
                  <span className="font-mono text-[#16191f] ml-1">{pc.AccepterCidr || accepterVpc?.CidrBlock || "-"}</span>
                </div>
                <div>
                  <span className="text-[#545b64] font-medium">Region: </span>
                  <span className="text-[#16191f] ml-1">us-east-1</span>
                </div>
                <div>
                  <span className="text-[#545b64] font-medium">Owner account: </span>
                  <span className="font-mono text-[#16191f] ml-1">{accepterVpc?.OwnerId || "000000000000"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
          </div>
          {pc.Tags && Object.keys(pc.Tags).length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(pc.Tags).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{k}</td>
                    <td className="px-4 py-2 text-[#16191f]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No tags associated with this peering connection.</div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete VPC peering connection?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete peering connection{" "}
              <span className="font-mono font-semibold text-[#16191f]">{pc.VpcPeeringConnectionId}</span>?
            </p>
            <p className="text-[12px] text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
              This action cannot be undone. Traffic between the VPCs will stop routing.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#16191f]">
                To confirm deletion, type <span className="font-mono font-bold">delete</span>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirmText("");
                }}
                disabled={loading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleteConfirmText !== "delete"}
                className="px-4 text-[13px] font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
