"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxConnectionItem,
  DxVirtualInterfaceItem,
  deleteConnectionAction,
  generateLoaCfaAction,
} from "../../dx-actions";

interface Props {
  connection: DxConnectionItem;
  initialVirtualInterfaces: DxVirtualInterfaceItem[];
}

export default function ConnectionDetailClient({
  connection,
  initialVirtualInterfaces,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"details" | "vifs" | "loa" | "tags">("details");
  const [virtualInterfaces, setVirtualInterfaces] = useState<DxVirtualInterfaceItem[]>(initialVirtualInterfaces);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal: Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // LOA-CFA download
  const [loaLoading, setLoaLoading] = useState(false);

  const isAvailable = connection.connectionState === "available";
  const isRequested = connection.connectionState === "requested" || connection.connectionState === "ordering" || connection.connectionState === "pending";
  const isDeleting = connection.connectionState === "deleting";

  const handleDownloadLoa = async () => {
    setLoaLoading(true);
    setMessage(null);
    try {
      const res = await generateLoaCfaAction(connection.connectionId);
      if (res.success) {
        const blob = new Blob([res.documentContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = res.documentTitle;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "success", text: "Successfully downloaded Letter of Authorization (LOA-CFA)." });
      } else {
        setMessage({ type: "error", text: res.error || "Failed to generate LOA-CFA" });
      }
    } finally {
      setLoaLoading(false);
    }
  };

  const handleDeleteConnection = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await deleteConnectionAction(connection.connectionId);
      if (res.success) {
        router.push("/direct-connect/connections");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to delete connection" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          AWS Direct Connect
        </Link>
        <span>&gt;</span>
        <Link href="/direct-connect/connections" className="hover:text-[#0073bb]">
          Connections
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{connection.connectionId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f] font-mono">
              {connection.connectionId}
            </h1>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                isAvailable
                  ? "bg-green-100 text-green-800"
                  : isRequested
                  ? "bg-blue-100 text-blue-800"
                  : isDeleting
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {connection.connectionState || "requested"}
            </span>
          </div>
          {connection.connectionName && (
            <p className="text-[13px] text-[#545b64] mt-0.5">{connection.connectionName}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLoa}
            disabled={loaLoading}
            className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loaLoading ? "Generating..." : "Download LOA-CFA"}
          </button>

          <Link
            href={`/direct-connect/virtual-interfaces/create?connectionId=${connection.connectionId}`}
            className="px-3 text-xs font-semibold text-white bg-[#0073bb] hover:bg-[#005a9e] rounded shadow-sm transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create virtual interface
          </Link>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 text-xs font-semibold text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete connection
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-3 rounded border text-[13px] flex items-center justify-between ${
            message.type === "success"
              ? "bg-[#f2fcf5] border-[#037f0c] text-[#037f0c]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 font-bold ml-4">
            x
          </button>
        </div>
      )}

      {/* Overview Quick Stats */}
      <div className="bg-white border border-[#eaeded] rounded-xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
        <div>
          <div className="text-xs text-[#545b64] font-medium">Location</div>
          <div className="text-[#16191f] font-semibold mt-1">{connection.location}</div>
        </div>
        <div>
          <div className="text-xs text-[#545b64] font-medium">Port Speed</div>
          <div className="font-mono text-[#16191f] font-semibold mt-1">{connection.bandwidth}</div>
        </div>
        <div>
          <div className="text-xs text-[#545b64] font-medium">AWS Device ID</div>
          <div className="font-mono text-[12px] text-gray-700 mt-1">{connection.awsDeviceV2 || connection.awsDevice || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-[#545b64] font-medium">MACsec Capable</div>
          <div className="text-[#16191f] mt-1 font-medium">{connection.macSecCapable ? "Yes" : "No"}</div>
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
            onClick={() => setActiveTab("vifs")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "vifs"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Virtual interfaces ({virtualInterfaces.length})
          </button>
          <button
            onClick={() => setActiveTab("loa")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "loa"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Letter of Authorization (LOA-CFA)
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211] font-semibold"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({connection.tags ? connection.tags.length : 0})
          </button>
        </div>
      </div>

      {/* Tab 1: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-[15px] font-bold text-[#16191f]">Connection details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
            <div>
              <div className="text-xs text-[#545b64]">Connection ID</div>
              <div className="font-mono text-[#16191f] mt-0.5">{connection.connectionId}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Connection name</div>
              <div className="text-[#16191f] mt-0.5">{connection.connectionName || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Location</div>
              <div className="text-[#16191f] mt-0.5">{connection.location}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Port speed</div>
              <div className="font-mono text-[#16191f] mt-0.5">{connection.bandwidth}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">AWS Device ID</div>
              <div className="font-mono text-[12px] text-gray-800 mt-0.5">{connection.awsDeviceV2 || connection.awsDevice || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">AWS Logical Device</div>
              <div className="font-mono text-[12px] text-gray-800 mt-0.5">{connection.awsLogicalDeviceId || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Jumbo frames</div>
              <div className="text-[#16191f] mt-0.5">{connection.jumboFrameCapable ? "Supported (9001 MTU)" : "Standard (1500 MTU)"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Region</div>
              <div className="font-mono text-[#16191f] mt-0.5">{connection.region || "us-east-1"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">MACsec Capable</div>
              <div className="text-[#16191f] mt-0.5">{connection.macSecCapable ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Logical Redundancy</div>
              <div className="text-[#16191f] mt-0.5 capitalize">{connection.hasLogicalRedundancy || "no"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Virtual Interfaces */}
      {activeTab === "vifs" && (
        <div className="bg-white border border-[#eaeded] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Virtual interfaces</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                VLAN-tagged virtual interfaces provisioned over this physical connection.
              </p>
            </div>
            <Link
              href={`/direct-connect/virtual-interfaces/create?connectionId=${connection.connectionId}`}
              className="px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#0073bb] rounded hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create virtual interface
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Name</th>
                  <th className="py-2.5 px-6">Virtual interface ID</th>
                  <th className="py-2.5 px-6">Type</th>
                  <th className="py-2.5 px-6">VLAN</th>
                  <th className="py-2.5 px-6">Customer BGP ASN</th>
                  <th className="py-2.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {virtualInterfaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No virtual interfaces found on this connection.
                    </td>
                  </tr>
                ) : (
                  virtualInterfaces.map((v) => (
                    <tr key={v.virtualInterfaceId} className="hover:bg-gray-50">
                      <td className="py-2.5 px-6 font-medium text-[#16191f]">
                        {v.virtualInterfaceName || "-"}
                      </td>
                      <td className="py-2.5 px-6 font-mono font-medium text-[#0073bb]">
                        <Link href={`/direct-connect/virtual-interfaces/${v.virtualInterfaceId}`} className="hover:underline">
                          {v.virtualInterfaceId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-6 capitalize text-gray-700">{v.virtualInterfaceType}</td>
                      <td className="py-2.5 px-6 font-mono text-[#16191f]">{v.vlan}</td>
                      <td className="py-2.5 px-6 font-mono text-gray-700">{v.asn}</td>
                      <td className="py-2.5 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-800">
                          {v.virtualInterfaceState || "available"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: LOA-CFA */}
      {activeTab === "loa" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">Letter of Authorization and Connecting Facility Assignment (LOA-CFA)</h3>
              <p className="text-xs text-[#545b64] mt-0.5">
                Authorizes the facility operator to cross-connect customer equipment to the assigned AWS port.
              </p>
            </div>
            <button
              onClick={handleDownloadLoa}
              disabled={loaLoading}
              className="px-3 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {loaLoading ? "Generating..." : "Download LOA-CFA"}
            </button>
          </div>

          <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre">
{`================================================================================
LETTER OF AUTHORIZATION AND CONNECTING FACILITY ASSIGNMENT (LOA-CFA)
Amazon Web Services - AWS Direct Connect
================================================================================

Connection ID:           ${connection.connectionId}
Connection Name:         ${connection.connectionName || connection.connectionId}
Port Speed / Bandwidth:  ${connection.bandwidth}
Facility Location:       ${connection.location}
AWS Region:              ${connection.region || "us-east-1"}

CONNECTING FACILITY ASSIGNMENT (CFA):
AWS Patch Panel / Demarc:  PP-AWS-DC2-RACK-04.B
AWS Port / Jack:           Port 24 (Single-Mode Fiber 1310nm LC)
AWS Device ID:             ${connection.awsDeviceV2 || connection.awsDevice || "EqDC2-109a02tymf4mx"}
AWS Logical Device:        ${connection.awsLogicalDeviceId || "EqDC2-2zzwswf2nob7w"}
Media Type:                1000BASE-LX / 10GBASE-LR Single Mode Duplex LC`}
          </div>
        </div>
      )}

      {/* Tab 4: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
          {(!connection.tags || connection.tags.length === 0) ? (
            <p className="text-xs text-gray-500">No tags assigned to this connection.</p>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-medium">
                  <th className="py-2.5 px-6">Key</th>
                  <th className="py-2.5 px-6">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {connection.tags.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 px-6 font-mono text-[#16191f]">{t.key}</td>
                    <td className="py-2.5 px-6 font-mono text-gray-700">{t.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal: Delete Connection */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete connection</h3>
            <p className="text-xs text-[#545b64]">
              Are you sure you want to delete connection{" "}
              <strong className="text-black font-mono">{connection.connectionId}</strong>?
            </p>
            <div>
              <label className="text-xs font-semibold text-[#16191f] block mb-1">
                Type <strong>delete</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full text-xs border border-[#aab7b8] rounded p-2"
                style={{ height: "32px" }}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
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
                onClick={handleDeleteConnection}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded transition-colors shadow-sm ${
                  deleteConfirmText === "delete" && !deleteLoading
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
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
