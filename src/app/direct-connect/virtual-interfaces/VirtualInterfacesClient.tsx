"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxVirtualInterfaceItem,
  listVirtualInterfacesAction,
  deleteVirtualInterfaceAction,
} from "../dx-actions";

interface Props {
  initialVirtualInterfaces: DxVirtualInterfaceItem[];
}

export default function VirtualInterfacesClient({ initialVirtualInterfaces }: Props) {
  const router = useRouter();
  const [vifs, setVifs] = useState<DxVirtualInterfaceItem[]>(initialVirtualInterfaces);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialVirtualInterfaces.length > 0 ? initialVirtualInterfaces[0].virtualInterfaceId : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const selectedVif = vifs.find((v) => v.virtualInterfaceId === selectedId);

  const filteredVifs = vifs.filter((v) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      v.virtualInterfaceId.toLowerCase().includes(q) ||
      (v.virtualInterfaceName || "").toLowerCase().includes(q) ||
      (v.connectionId || "").toLowerCase().includes(q) ||
      (v.virtualInterfaceState || "").toLowerCase().includes(q) ||
      String(v.vlan || "").includes(q);

    const matchesType =
      typeFilter === "ALL" || (v.virtualInterfaceType || "").toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  const handleRefresh = async () => {
    const res = await listVirtualInterfacesAction();
    if (res.success) {
      setVifs(res.virtualInterfaces);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await deleteVirtualInterfaceAction(selectedId);
      if (res.success) {
        setVifs((prev) =>
          prev.map((v) =>
            v.virtualInterfaceId === selectedId ? { ...v, virtualInterfaceState: "deleting" } : v
          )
        );
        setMessage({
          type: "success",
          text: `Virtual interface ${selectedId} is deleting.`,
        });
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to delete virtual interface",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          Direct Connect
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">Virtual interfaces</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Virtual interfaces</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            To begin using your AWS Direct Connect connection, you must create a virtual interface (VIF). Private virtual interfaces connect to VPCs, transit virtual interfaces connect to Transit Gateways, and public virtual interfaces connect to public AWS services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              disabled={!selectedId}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Actions
              <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {actionMenuOpen && selectedVif && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-20 text-[13px]">
                <Link
                  href={`/direct-connect/virtual-interfaces/${selectedVif.virtualInterfaceId}`}
                  className="block px-4 py-1.5 text-gray-700 hover:bg-gray-100"
                  onClick={() => setActionMenuOpen(false)}
                >
                  View details
                </Link>
                <button
                  onClick={() => {
                    setActionMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-1.5 text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <Link
            href="/direct-connect/virtual-interfaces/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-sm"
          >
            Create virtual interface
          </Link>
        </div>
      </div>

      {/* Notification banner */}
      {message && (
        <div
          className={`p-3 text-[13px] rounded border flex items-center justify-between ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : message.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 text-sm ml-2">
            x
          </button>
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search virtual interfaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-[#ec7211]"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-700 focus:outline-none focus:border-[#ec7211]"
          >
            <option value="ALL">All types</option>
            <option value="private">Private</option>
            <option value="transit">Transit</option>
            <option value="public">Public</option>
          </select>
        </div>
        <button
          onClick={handleRefresh}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden text-[13px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f3f3] text-[#545b64] text-xs uppercase tracking-wider border-b border-[#eaeded]">
              <th className="py-2.5 px-4 w-10"></th>
              <th className="py-2.5 px-4 font-semibold">Name</th>
              <th className="py-2.5 px-4 font-semibold">Interface ID</th>
              <th className="py-2.5 px-4 font-semibold">Type</th>
              <th className="py-2.5 px-4 font-semibold">State</th>
              <th className="py-2.5 px-4 font-semibold">Connection ID</th>
              <th className="py-2.5 px-4 font-semibold">VLAN</th>
              <th className="py-2.5 px-4 font-semibold">Customer ASN</th>
              <th className="py-2.5 px-4 font-semibold">Direct Connect gateway</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredVifs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  <p className="font-semibold text-gray-700">No virtual interfaces found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a private, transit, or public virtual interface to establish BGP peering.
                  </p>
                </td>
              </tr>
            ) : (
              filteredVifs.map((v) => {
                const isSelected = v.virtualInterfaceId === selectedId;
                return (
                  <tr
                    key={v.virtualInterfaceId}
                    onClick={() => setSelectedId(v.virtualInterfaceId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f1faff]" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="radio"
                        name="selectedVif"
                        checked={isSelected}
                        onChange={() => setSelectedId(v.virtualInterfaceId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#16191f]">
                      <Link
                        href={`/direct-connect/virtual-interfaces/${v.virtualInterfaceId}`}
                        className="text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {v.virtualInterfaceName || "-"}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      {v.virtualInterfaceId}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-gray-700 font-medium">
                      {v.virtualInterfaceType}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize font-medium ${
                          v.virtualInterfaceState === "available"
                            ? "bg-green-100 text-green-800"
                            : v.virtualInterfaceState === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {v.virtualInterfaceState}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      <Link
                        href={`/direct-connect/connections/${v.connectionId}`}
                        className="text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {v.connectionId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {v.vlan}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {v.asn}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      {v.directConnectGatewayId ? (
                        <Link
                          href={`/direct-connect/gateways/${v.directConnectGatewayId}`}
                          className="text-[#0073bb] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {v.directConnectGatewayId}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected VIF Bottom Drawer */}
      {selectedVif && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4 text-[13px] space-y-3">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <span className="font-bold text-[#16191f]">
              Virtual interface: <span className="text-[#0073bb] font-mono">{selectedVif.virtualInterfaceId}</span>
            </span>
            <Link
              href={`/direct-connect/virtual-interfaces/${selectedVif.virtualInterfaceId}`}
              className="text-[#0073bb] hover:underline text-xs font-medium"
            >
              View details &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-[#545b64]">Type</div>
              <div className="capitalize font-medium text-[#16191f] mt-0.5">{selectedVif.virtualInterfaceType}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">State</div>
              <div className="capitalize text-[#16191f] mt-0.5">{selectedVif.virtualInterfaceState}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Amazon router IP</div>
              <div className="font-mono text-[#16191f] mt-0.5">{selectedVif.amazonAddress || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Customer router IP</div>
              <div className="font-mono text-[#16191f] mt-0.5">{selectedVif.customerAddress || "-"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete VIF Modal */}
      {isDeleteModalOpen && selectedVif && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete virtual interface</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete virtual interface{" "}
              <strong className="text-black">{selectedVif.virtualInterfaceName}</strong> (
              <span className="font-mono">{selectedVif.virtualInterfaceId}</span>)? BGP sessions and network traffic on this VLAN will terminate.
            </p>
            <div>
              <label className="block text-xs text-[#545b64] mb-1">
                To confirm deletion, type <strong className="text-[#16191f]">delete</strong> in the field below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== "delete" || isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center"
              >
                {isDeleting ? "Deleting..." : "Delete virtual interface"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
