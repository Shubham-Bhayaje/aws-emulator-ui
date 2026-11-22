"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxGatewayItem,
  DxVirtualInterfaceItem,
  deleteDirectConnectGatewayAction,
} from "../../dx-actions";

interface Props {
  gateway: DxGatewayItem;
  virtualInterfaces: DxVirtualInterfaceItem[];
}

export default function DirectConnectGatewayDetailClient({
  gateway,
  virtualInterfaces,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "vifs" | "associations">("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await deleteDirectConnectGatewayAction(gateway.directConnectGatewayId);
      if (res.success) {
        router.push("/direct-connect/gateways");
        router.refresh();
      } else {
        if (res.error?.includes("NotImplemented")) {
          setMessage({
            type: "info",
            text: `Notice: DeleteDirectConnectGateway is scaffolded in this emulator. In AWS production, gateway ${gateway.directConnectGatewayId} would be deleted. (${res.error})`,
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
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          Direct Connect
        </Link>
        <span>&gt;</span>
        <Link href="/direct-connect/gateways" className="hover:text-[#0073bb]">
          Direct Connect gateways
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">{gateway.directConnectGatewayId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">
            {gateway.directConnectGatewayName || gateway.directConnectGatewayId}
          </h1>
          <p className="text-[13px] text-[#545b64] font-mono mt-0.5">
            {gateway.directConnectGatewayId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 text-[13px] font-medium text-red-600 bg-white border border-[#aab7b8] rounded hover:bg-red-50 flex items-center transition-colors"
          >
            Delete gateway
          </button>
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

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-6 text-[13px]">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Gateway details
          </button>
          <button
            onClick={() => setActiveTab("vifs")}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === "vifs"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Virtual interfaces ({virtualInterfaces.length})
          </button>
          <button
            onClick={() => setActiveTab("associations")}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === "associations"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Gateway associations
          </button>
        </nav>
      </div>

      {/* Tab Content: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-6 text-[13px]">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-[#545b64]">Direct Connect gateway name</div>
              <div className="font-semibold text-[#16191f] mt-1">{gateway.directConnectGatewayName}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Direct Connect gateway ID</div>
              <div className="font-mono text-[#16191f] mt-1">{gateway.directConnectGatewayId}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">State</div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize font-medium ${
                    gateway.directConnectGatewayState === "available"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {gateway.directConnectGatewayState}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Amazon-side ASN</div>
              <div className="font-mono text-[#16191f] mt-1">{gateway.amazonSideAsn}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Owner account</div>
              <div className="font-mono text-[#16191f] mt-1">{gateway.ownerAccount || "-"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Virtual Interfaces */}
      {activeTab === "vifs" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden text-[13px]">
          <div className="p-4 border-b border-[#eaeded] flex items-center justify-between">
            <h3 className="font-bold text-[#16191f]">Associated virtual interfaces</h3>
            <Link
              href="/direct-connect/virtual-interfaces/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[12px] font-medium text-[#ec7211] border border-[#ec7211] rounded hover:bg-[#fff9f5] flex items-center transition-colors"
            >
              Create virtual interface
            </Link>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f3f3] text-[#545b64] text-xs uppercase tracking-wider border-b border-[#eaeded]">
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Interface ID</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">State</th>
                <th className="py-2.5 px-4 font-semibold">VLAN</th>
                <th className="py-2.5 px-4 font-semibold">Customer ASN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {virtualInterfaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <p className="font-semibold text-gray-700">No virtual interfaces associated with this gateway</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create a private virtual interface and attach it to this Direct Connect gateway.
                    </p>
                  </td>
                </tr>
              ) : (
                virtualInterfaces.map((v) => (
                  <tr key={v.virtualInterfaceId} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#16191f]">
                      <Link
                        href={`/direct-connect/virtual-interfaces/${v.virtualInterfaceId}`}
                        className="text-[#0073bb] hover:underline"
                      >
                        {v.virtualInterfaceName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[12px] text-gray-600">
                      {v.virtualInterfaceId}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-gray-700">
                      {v.virtualInterfaceType}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize font-medium ${
                          v.virtualInterfaceState === "available"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {v.virtualInterfaceState}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {v.vlan}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">
                      {v.asn}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Associations */}
      {activeTab === "associations" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4 text-[13px]">
          <h3 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Gateway associations (VPC / Transit Gateway)
          </h3>
          <p className="text-[#545b64]">
            A Direct Connect gateway allows multiple Virtual Private Clouds (via Virtual Private Gateways) or Transit Gateways across multiple AWS Regions to share this dedicated connection.
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded text-xs space-y-2 text-gray-700">
            <div className="font-semibold text-gray-900">Multi-Account & Multi-Region Hub Architecture:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Attach a Virtual Private Gateway (VGW) in any region to connect directly to a private VPC.</li>
              <li>Attach an AWS Transit Gateway to interconnect hundreds of VPCs and on-premises networks across multiple AWS accounts.</li>
              <li>Direct Connect gateway automatically advertises your VPC CIDR prefixes back to your on-premises routers via BGP.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete Direct Connect gateway</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete Direct Connect gateway{" "}
              <strong className="text-black">{gateway.directConnectGatewayName}</strong> (
              <span className="font-mono">{gateway.directConnectGatewayId}</span>)?
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
