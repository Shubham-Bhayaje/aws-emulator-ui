"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NatGatewayItem,
  VpcItem,
  SubnetItem,
  deleteNatGatewayAction,
} from "../../actions";

interface Props {
  natGateway: NatGatewayItem;
  vpc?: VpcItem;
  subnet?: SubnetItem;
}

export default function NatGatewayDetailClient({
  natGateway: initialNat,
  vpc,
  subnet,
}: Props) {
  const router = useRouter();

  const [nat, setNat] = useState<NatGatewayItem>(initialNat);
  const [activeTab, setActiveTab] = useState<"details" | "elasticips" | "tags">("details");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteNatGatewayAction(nat.NatGatewayId);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/nat-gateways");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete NAT Gateway" });
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
        <Link href="/vpc/nat-gateways" className="hover:text-[#0073bb]">
          NAT gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{nat.NatGatewayId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{nat.Name || nat.NatGatewayId}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {nat.State}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{nat.NatGatewayId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/nat-gateways"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all NAT gateways
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
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete NAT gateway
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">NAT Gateway ID</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5 truncate">
            {nat.NatGatewayId}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">State</div>
          <div className="text-[13px] font-semibold text-emerald-700 mt-0.5">{nat.State}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Primary Public IP</div>
          <div className="text-[13px] font-mono text-[#16191f] font-semibold mt-0.5 truncate">
            {nat.PublicIp || "-"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Primary Private IP</div>
          <div className="text-[13px] font-mono text-[#16191f] mt-0.5 truncate">
            {nat.PrivateIp || "-"}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">Subnet</div>
          <div className="text-[13px] font-mono text-[#0073bb] font-semibold mt-0.5 truncate">
            {nat.SubnetId ? (
              <Link href={`/vpc/subnets/${nat.SubnetId}`} className="hover:underline">
                {nat.SubnetId}
              </Link>
            ) : (
              "-"
            )}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-3">
          <div className="text-[11px] font-medium text-[#545b64] uppercase tracking-wider">VPC</div>
          <div className="text-[13px] font-mono text-[#0073bb] font-semibold mt-0.5 truncate">
            {nat.VpcId ? (
              <Link href={`/vpc/vpcs/${nat.VpcId}`} className="hover:underline">
                {nat.VpcId}
              </Link>
            ) : (
              "-"
            )}
          </div>
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
            onClick={() => setActiveTab("elasticips")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "elasticips"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Elastic IP addresses
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(nat.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8 text-[13px]">
            <div>
              <span className="text-[#545b64] block mb-1">NAT gateway ID</span>
              <span className="font-mono font-semibold text-[#16191f]">{nat.NatGatewayId}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">State</span>
              <span className="text-emerald-700 font-semibold">{nat.State}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Connectivity type</span>
              <span className="text-[#16191f] capitalize">{nat.ConnectivityType || "public"}</span>
            </div>

            <div>
              <span className="text-[#545b64] block mb-1">Subnet</span>
              {nat.SubnetId ? (
                <Link href={`/vpc/subnets/${nat.SubnetId}`} className="font-mono text-[#0073bb] hover:underline font-semibold">
                  {nat.SubnetId} {subnet?.Name ? `(${subnet.Name})` : ""}
                </Link>
              ) : (
                <span className="text-[#545b64]">-</span>
              )}
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">VPC</span>
              {nat.VpcId ? (
                <Link href={`/vpc/vpcs/${nat.VpcId}`} className="font-mono text-[#0073bb] hover:underline font-semibold">
                  {nat.VpcId} {vpc?.Name ? `(${vpc.Name})` : ""}
                </Link>
              ) : (
                <span className="text-[#545b64]">-</span>
              )}
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Created time</span>
              <span className="text-[#16191f]">{nat.CreateTime ? new Date(nat.CreateTime).toLocaleString() : "-"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Elastic IPs */}
      {activeTab === "elasticips" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Elastic IP addresses</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Public Elastic IP addresses associated with this NAT gateway.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Allocation ID</th>
                <th className="py-2.5 px-6">Public IP</th>
                <th className="py-2.5 px-6">Network Interface ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {nat.AllocationId ? (
                <tr className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-mono text-[#0073bb]">
                    <Link href={`/vpc/elastic-ips/${nat.AllocationId}`} className="hover:underline font-semibold">
                      {nat.AllocationId}
                    </Link>
                  </td>
                  <td className="py-2.5 px-6 font-mono text-[#16191f] font-semibold">{nat.PublicIp || "-"}</td>
                  <td className="py-2.5 px-6 font-mono text-[#545b64]">{nat.NetworkInterfaceId || "-"}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-[#545b64]">
                    No Elastic IP assigned (Private NAT Gateway).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#eaeded]">
            <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
            <p className="text-xs text-[#545b64] mt-0.5">Key-value tags assigned to this NAT gateway.</p>
          </div>
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                <th className="py-2.5 px-6">Key</th>
                <th className="py-2.5 px-6">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {Object.entries(nat.Tags || {}).map(([k, v]) => (
                <tr key={k} className="hover:bg-[#fafafa]">
                  <td className="py-2.5 px-6 font-mono text-[#16191f]">{k}</td>
                  <td className="py-2.5 px-6 font-mono text-[#545b64]">{v}</td>
                </tr>
              ))}
              {Object.keys(nat.Tags || {}).length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-xs text-[#545b64]">
                    No tags associated with this NAT gateway.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete NAT gateway</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete NAT gateway <span className="font-mono font-semibold text-red-600">{nat.NatGatewayId}</span>? To confirm, type <span className="font-mono font-bold">delete</span> below.
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
