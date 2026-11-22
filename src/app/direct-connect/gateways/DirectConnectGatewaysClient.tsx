"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxGatewayItem,
  listDirectConnectGatewaysAction,
  deleteDirectConnectGatewayAction,
} from "../dx-actions";

interface Props {
  initialGateways: DxGatewayItem[];
}

export default function DirectConnectGatewaysClient({ initialGateways }: Props) {
  const router = useRouter();
  const [gateways, setGateways] = useState<DxGatewayItem[]>(initialGateways);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialGateways.length > 0 ? initialGateways[0].directConnectGatewayId : null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const selectedGw = gateways.find((g) => g.directConnectGatewayId === selectedId);

  const filteredGateways = gateways.filter((g) => {
    const q = searchTerm.toLowerCase();
    return (
      g.directConnectGatewayId.toLowerCase().includes(q) ||
      g.directConnectGatewayName.toLowerCase().includes(q) ||
      String(g.amazonSideAsn || "").includes(q) ||
      g.directConnectGatewayState.toLowerCase().includes(q)
    );
  });

  const handleRefresh = async () => {
    const res = await listDirectConnectGatewaysAction();
    if (res.success) {
      setGateways(res.gateways);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await deleteDirectConnectGatewayAction(selectedId);
      if (res.success) {
        setGateways((prev) => prev.filter((g) => g.directConnectGatewayId !== selectedId));
        setMessage({
          type: "success",
          text: `Direct Connect gateway ${selectedId} was successfully deleted.`,
        });
        setSelectedId(null);
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
      } else {
        if (res.error?.includes("NotImplemented")) {
          setMessage({
            type: "info",
            text: `Notice: DeleteDirectConnectGateway is scaffolded in this emulator. In AWS production, gateway ${selectedId} would be deleted. (${res.error})`,
          });
          setIsDeleteModalOpen(false);
          setDeleteConfirmText("");
        } else {
          setMessage({
            type: "error",
            text: res.error || "Failed to delete Direct Connect gateway",
          });
        }
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
        <span className="text-gray-900 font-medium">Direct Connect gateways</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Direct Connect gateways</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            A Direct Connect gateway is a globally available resource used to connect your virtual private clouds (VPCs) and transit gateways across multiple AWS Regions to your Direct Connect connection.
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
            {actionMenuOpen && selectedGw && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-20 text-[13px]">
                <Link
                  href={`/direct-connect/gateways/${selectedGw.directConnectGatewayId}`}
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
            href="/direct-connect/gateways/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-sm"
          >
            Create Direct Connect gateway
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

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search Direct Connect gateways..."
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
        <button
          onClick={handleRefresh}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {/* Gateways Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden text-[13px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f2f3f3] text-[#545b64] text-xs uppercase tracking-wider border-b border-[#eaeded]">
              <th className="py-2.5 px-4 w-10"></th>
              <th className="py-2.5 px-4 font-semibold">Name</th>
              <th className="py-2.5 px-4 font-semibold">Gateway ID</th>
              <th className="py-2.5 px-4 font-semibold">State</th>
              <th className="py-2.5 px-4 font-semibold">Amazon side ASN</th>
              <th className="py-2.5 px-4 font-semibold">Owner account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeded]">
            {filteredGateways.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  <p className="font-semibold text-gray-700">No Direct Connect gateways found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a Direct Connect gateway to connect your VPCs or Transit Gateways to your connection.
                  </p>
                </td>
              </tr>
            ) : (
              filteredGateways.map((gw) => {
                const isSelected = gw.directConnectGatewayId === selectedId;
                return (
                  <tr
                    key={gw.directConnectGatewayId}
                    onClick={() => setSelectedId(gw.directConnectGatewayId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f1faff]" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="radio"
                        name="selectedGateway"
                        checked={isSelected}
                        onChange={() => setSelectedId(gw.directConnectGatewayId)}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#16191f]">
                      <Link
                        href={`/direct-connect/gateways/${gw.directConnectGatewayId}`}
                        className="text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {gw.directConnectGatewayName || "-"}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      {gw.directConnectGatewayId}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize font-medium ${
                          gw.directConnectGatewayState === "available"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {gw.directConnectGatewayState}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#16191f]">
                      {gw.amazonSideAsn}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-600 text-xs">
                      {gw.ownerAccount || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Gateway Detail Drawer */}
      {selectedGw && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4 text-[13px] space-y-3">
          <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
            <span className="font-bold text-[#16191f]">
              Direct Connect gateway: <span className="text-[#0073bb] font-mono">{selectedGw.directConnectGatewayId}</span>
            </span>
            <Link
              href={`/direct-connect/gateways/${selectedGw.directConnectGatewayId}`}
              className="text-[#0073bb] hover:underline text-xs font-medium"
            >
              View details &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-[#545b64]">Name</div>
              <div className="font-medium text-[#16191f] mt-0.5">{selectedGw.directConnectGatewayName}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">State</div>
              <div className="capitalize text-[#16191f] mt-0.5">{selectedGw.directConnectGatewayState}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Amazon side ASN</div>
              <div className="font-mono text-[#16191f] mt-0.5">{selectedGw.amazonSideAsn}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Owner account</div>
              <div className="font-mono text-[#16191f] mt-0.5">{selectedGw.ownerAccount || "-"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Gateway Modal */}
      {isDeleteModalOpen && selectedGw && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete Direct Connect gateway</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete Direct Connect gateway{" "}
              <strong className="text-black">{selectedGw.directConnectGatewayName}</strong> (
              <span className="font-mono">{selectedGw.directConnectGatewayId}</span>)? Associated virtual interfaces must be detached or deleted first.
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
                {isDeleting ? "Deleting..." : "Delete gateway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
