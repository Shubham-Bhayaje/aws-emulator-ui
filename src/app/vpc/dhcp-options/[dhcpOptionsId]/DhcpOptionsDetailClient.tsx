"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DhcpOptionsItem,
  VpcItem,
  associateDhcpOptionsAction,
  deleteDhcpOptionsAction,
} from "../../actions";

interface Props {
  dhcpOptions: DhcpOptionsItem;
  associatedVpcs: VpcItem[];
  allVpcs: VpcItem[];
}

export default function DhcpOptionsDetailClient({
  dhcpOptions: initialDhcp,
  associatedVpcs: initialAssocVpcs,
  allVpcs,
}: Props) {
  const router = useRouter();

  const [dhcp] = useState<DhcpOptionsItem>(initialDhcp);
  const [associatedVpcs, setAssociatedVpcs] = useState<VpcItem[]>(initialAssocVpcs);
  const [activeTab, setActiveTab] = useState<"details" | "vpcs" | "tags">("details");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Associate modal
  const [isAssociateOpen, setIsAssociateOpen] = useState(false);
  const [selectedVpcId, setSelectedVpcId] = useState(allVpcs[0]?.VpcId || "");
  const [assocLoading, setAssocLoading] = useState(false);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAssociate = async () => {
    if (!selectedVpcId) return;
    setAssocLoading(true);
    setMessage(null);
    try {
      const res = await associateDhcpOptionsAction(dhcp.DhcpOptionsId, selectedVpcId);
      if (res.success) {
        setIsAssociateOpen(false);
        const newlyAssoc = allVpcs.find((v) => v.VpcId === selectedVpcId);
        if (newlyAssoc && !associatedVpcs.some((v) => v.VpcId === selectedVpcId)) {
          setAssociatedVpcs([...associatedVpcs, newlyAssoc]);
        }
        setMessage({ type: "success", text: `Successfully associated DHCP option set with VPC ${selectedVpcId}.` });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to associate DHCP options" });
      }
    } finally {
      setAssocLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteDhcpOptionsAction(dhcp.DhcpOptionsId);
      if (res.success) {
        setIsDeleteOpen(false);
        router.push("/vpc/dhcp-options");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete DHCP options" });
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
        <Link href="/vpc/dhcp-options" className="hover:text-[#0073bb]">
          DHCP option sets
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{dhcp.DhcpOptionsId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">
              {dhcp.Tags?.Name || dhcp.DhcpOptionsId}
            </h1>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{dhcp.DhcpOptionsId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/dhcp-options"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all DHCP option sets
          </Link>

          <button
            onClick={() => setIsAssociateOpen(true)}
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Associate with VPC
          </button>

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
                <button
                  onClick={() => setIsAssociateOpen(true)}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f8fd] flex items-center gap-2"
                >
                  Associate with VPC
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Delete DHCP options set
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
            onClick={() => setActiveTab("vpcs")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "vpcs"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Associated VPCs ({associatedVpcs.length})
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(dhcp.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5">
            <h3 className="text-[15px] font-bold text-[#16191f] mb-4">DHCP options summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] font-medium">DHCP options set ID</dt>
                <dd className="mt-1 font-mono text-[#16191f] font-semibold">{dhcp.DhcpOptionsId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Domain name</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{dhcp.DomainName || "-"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Domain name servers</dt>
                <dd className="mt-1 font-mono text-[#16191f]">
                  {dhcp.DomainNameServers?.join(", ") || "AmazonProvidedDNS"}
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">NTP servers</dt>
                <dd className="mt-1 font-mono text-[#16191f]">
                  {dhcp.NtpServers && dhcp.NtpServers.length > 0 ? dhcp.NtpServers.join(", ") : "-"}
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">NetBIOS node type</dt>
                <dd className="mt-1 text-[#545b64]">-</dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Associated VPCs */}
      {activeTab === "vpcs" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded] flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-[#16191f]">Associated VPCs</h3>
            <button
              onClick={() => setIsAssociateOpen(true)}
              className="px-3 text-[12px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "28px" }}
            >
              Associate VPC
            </button>
          </div>
          {associatedVpcs.length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">VPC ID</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">IPv4 CIDR</th>
                  <th className="px-4 py-2 text-left font-medium">Default VPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {associatedVpcs.map((vpc) => (
                  <tr key={vpc.VpcId} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2">
                      <Link
                        href={`/vpc/vpcs/${vpc.VpcId}`}
                        className="text-[#0073bb] hover:underline font-mono"
                      >
                        {vpc.VpcId}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-[#16191f]">{vpc.Name || "-"}</td>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{vpc.CidrBlock}</td>
                    <td className="px-4 py-2 text-[#16191f]">{vpc.IsDefault ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No VPCs are currently using this DHCP option set.</div>
          )}
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
          </div>
          {dhcp.Tags && Object.keys(dhcp.Tags).length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(dhcp.Tags).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{k}</td>
                    <td className="px-4 py-2 text-[#16191f]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No tags associated with this DHCP option set.</div>
          )}
        </div>
      )}

      {/* Associate Modal */}
      {isAssociateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Associate with VPC</h3>
            <p className="text-[13px] text-[#545b64]">
              Select the VPC you want to associate with DHCP option set{" "}
              <span className="font-mono font-semibold text-[#16191f]">{dhcp.DhcpOptionsId}</span>:
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#16191f]">VPC</label>
              <select
                value={selectedVpcId}
                onChange={(e) => setSelectedVpcId(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
              >
                {allVpcs.map((v) => (
                  <option key={v.VpcId} value={v.VpcId}>
                    {v.Name ? `${v.Name} (${v.VpcId})` : v.VpcId} - {v.CidrBlock}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAssociateOpen(false)}
                disabled={assocLoading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssociate}
                disabled={assocLoading || !selectedVpcId}
                className="px-4 text-[13px] font-medium text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {assocLoading ? "Associating..." : "Associate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Delete DHCP options set?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete DHCP option set{" "}
              <span className="font-mono font-semibold text-[#16191f]">{dhcp.DhcpOptionsId}</span>?
            </p>
            {associatedVpcs.length > 0 && (
              <p className="text-[12px] text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                This DHCP option set is currently associated with {associatedVpcs.length} VPC(s). You must associate another option set with those VPCs first.
              </p>
            )}
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
                disabled={deleteLoading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmText !== "delete"}
                className="px-4 text-[13px] font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
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
