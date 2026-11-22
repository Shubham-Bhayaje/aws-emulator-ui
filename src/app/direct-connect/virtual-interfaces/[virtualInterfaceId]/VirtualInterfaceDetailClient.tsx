"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxVirtualInterfaceItem,
  deleteVirtualInterfaceAction,
} from "../../dx-actions";

interface Props {
  virtualInterface: DxVirtualInterfaceItem;
}

export default function VirtualInterfaceDetailClient({ virtualInterface: vif }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "bgp" | "routerConfig" | "tags">("details");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [vendorChoice, setVendorChoice] = useState<"cisco" | "juniper">("cisco");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await deleteVirtualInterfaceAction(vif.virtualInterfaceId);
      if (res.success) {
        router.push("/direct-connect/virtual-interfaces");
        router.refresh();
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

  const sampleCiscoConfig = `! Sample Cisco IOS Router Configuration for AWS Direct Connect
! Virtual Interface ID: ${vif.virtualInterfaceId}
! VLAN: ${vif.vlan}
! Customer ASN: ${vif.asn}
! Amazon Side ASN: ${vif.amazonSideAsn || 64512}

interface GigabitEthernet0/0/0.${vif.vlan}
 description AWS Direct Connect - ${vif.virtualInterfaceName}
 encapsulation dot1Q ${vif.vlan}
 ip address ${vif.customerAddress?.split("/")[0] || "169.254.255.2"} 255.255.255.252
 no shutdown
!
router bgp ${vif.asn}
 bgp log-neighbor-changes
 neighbor ${vif.amazonAddress?.split("/")[0] || "169.254.255.1"} remote-as ${vif.amazonSideAsn || 64512}
 neighbor ${vif.amazonAddress?.split("/")[0] || "169.254.255.1"} description AWS Direct Connect Peer
 ${vif.authKey ? `neighbor ${vif.amazonAddress?.split("/")[0] || "169.254.255.1"} password ${vif.authKey}` : "! No BGP MD5 authentication"}
 address-family ipv4
  neighbor ${vif.amazonAddress?.split("/")[0] || "169.254.255.1"} activate
  neighbor ${vif.amazonAddress?.split("/")[0] || "169.254.255.1"} soft-reconfiguration inbound
 exit-address-family
!`;

  const sampleJuniperConfig = `# Sample Juniper JunOS Configuration for AWS Direct Connect
# Virtual Interface ID: ${vif.virtualInterfaceId}
# VLAN: ${vif.vlan}

interfaces {
    ge-0/0/0 {
        unit ${vif.vlan} {
            vlan-id ${vif.vlan};
            family inet {
                address ${vif.customerAddress || "169.254.255.2/30"};
            }
        }
    }
}
protocols {
    bgp {
        group aws-direct-connect {
            type external;
            peer-as ${vif.amazonSideAsn || 64512};
            neighbor ${vif.amazonAddress?.split("/")[0] || "169.254.255.1"} {
                description "AWS Direct Connect - ${vif.virtualInterfaceName}";
                ${vif.authKey ? `authentication-key "${vif.authKey}";` : ""}
            }
        }
    }
}`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          Direct Connect
        </Link>
        <span>&gt;</span>
        <Link href="/direct-connect/virtual-interfaces" className="hover:text-[#0073bb]">
          Virtual interfaces
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">{vif.virtualInterfaceId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eaeded] pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">
            {vif.virtualInterfaceName || vif.virtualInterfaceId}
          </h1>
          <p className="text-[13px] text-[#545b64] font-mono mt-0.5">
            {vif.virtualInterfaceId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 text-[13px] font-medium text-red-600 bg-white border border-[#aab7b8] rounded hover:bg-red-50 flex items-center transition-colors"
          >
            Delete virtual interface
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
            Details
          </button>
          <button
            onClick={() => setActiveTab("bgp")}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === "bgp"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            BGP peering
          </button>
          <button
            onClick={() => setActiveTab("routerConfig")}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === "routerConfig"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Download router configuration
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-3 font-semibold transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Tags ({vif.tags?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-6 text-[13px]">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-[#545b64]">Virtual interface name</div>
              <div className="font-semibold text-[#16191f] mt-1">{vif.virtualInterfaceName}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Virtual interface ID</div>
              <div className="font-mono text-[#16191f] mt-1">{vif.virtualInterfaceId}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">State</div>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full capitalize font-medium ${
                    vif.virtualInterfaceState === "available"
                      ? "bg-green-100 text-green-800"
                      : vif.virtualInterfaceState === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {vif.virtualInterfaceState}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Type</div>
              <div className="capitalize text-[#16191f] mt-1 font-medium">{vif.virtualInterfaceType}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Connection ID</div>
              <div className="font-mono text-[#16191f] mt-1">
                {vif.connectionId ? (
                  <Link
                    href={`/direct-connect/connections/${vif.connectionId}`}
                    className="text-[#0073bb] hover:underline"
                  >
                    {vif.connectionId}
                  </Link>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">VLAN</div>
              <div className="font-mono text-[#16191f] mt-1">{vif.vlan}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Customer ASN</div>
              <div className="font-mono text-[#16191f] mt-1">{vif.asn}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Amazon-side ASN</div>
              <div className="font-mono text-[#16191f] mt-1">{vif.amazonSideAsn || 64512}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Direct Connect gateway</div>
              <div className="font-mono text-[#16191f] mt-1">
                {vif.directConnectGatewayId ? (
                  <Link
                    href={`/direct-connect/gateways/${vif.directConnectGatewayId}`}
                    className="text-[#0073bb] hover:underline"
                  >
                    {vif.directConnectGatewayId}
                  </Link>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Address family</div>
              <div className="uppercase text-[#16191f] mt-1">{vif.addressFamily || "ipv4"}</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">MTU</div>
              <div className="font-mono text-[#16191f] mt-1">{vif.mtu || 1500} bytes</div>
            </div>
            <div>
              <div className="text-xs text-[#545b64]">Jumbo frame capable</div>
              <div className="text-[#16191f] mt-1">{vif.jumboFrameCapable ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: BGP Peering */}
      {activeTab === "bgp" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-6 text-[13px]">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">BGP Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded space-y-3">
              <h3 className="font-bold text-[#16191f]">Amazon Router (Peer)</h3>
              <div>
                <div className="text-xs text-[#545b64]">Amazon peer IP</div>
                <div className="font-mono text-[#16191f] mt-0.5">{vif.amazonAddress || "169.254.255.1/30"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Amazon ASN</div>
                <div className="font-mono text-[#16191f] mt-0.5">{vif.amazonSideAsn || 64512}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">BGP status</div>
                <div className="mt-0.5">
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                    up
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded space-y-3">
              <h3 className="font-bold text-[#16191f]">Customer Router (On-Premises)</h3>
              <div>
                <div className="text-xs text-[#545b64]">Customer peer IP</div>
                <div className="font-mono text-[#16191f] mt-0.5">{vif.customerAddress || "169.254.255.2/30"}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">Customer ASN</div>
                <div className="font-mono text-[#16191f] mt-0.5">{vif.asn}</div>
              </div>
              <div>
                <div className="text-xs text-[#545b64]">MD5 authentication key</div>
                <div className="font-mono text-[#16191f] mt-0.5">
                  {vif.authKey ? "Configured (secret hidden)" : "None"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Router Config */}
      {activeTab === "routerConfig" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4 text-[13px]">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                Download router configuration
              </h2>
              <p className="text-xs text-[#545b64] mt-0.5">
                Generate configuration snippets customized for your customer gateway router hardware.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={vendorChoice}
                onChange={(e) => setVendorChoice(e.target.value as "cisco" | "juniper")}
                className="border border-gray-300 rounded px-3 py-1.5 text-xs bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
              >
                <option value="cisco">Cisco Systems (IOS / IOS-XE)</option>
                <option value="juniper">Juniper Networks (JunOS)</option>
              </select>
            </div>
          </div>

          <div className="bg-[#000716] text-[#00e676] font-mono text-xs p-4 rounded-lg overflow-x-auto whitespace-pre leading-relaxed border border-[#232f3e]">
            {vendorChoice === "cisco" ? sampleCiscoConfig : sampleJuniperConfig}
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded-xl p-6 shadow-sm space-y-4 text-[13px]">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">Tags</h2>
          {(!vif.tags || vif.tags.length === 0) ? (
            <p className="text-xs text-gray-400 italic">No tags applied to this virtual interface.</p>
          ) : (
            <table className="w-full text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-600 border-b">
                  <th className="py-2 px-3">Key</th>
                  <th className="py-2 px-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {vif.tags.map((t, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-mono text-gray-800">{t.key}</td>
                    <td className="py-2 px-3 font-mono text-gray-800">{t.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete virtual interface</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete virtual interface{" "}
              <strong className="text-black">{vif.virtualInterfaceName}</strong> (
              <span className="font-mono">{vif.virtualInterfaceId}</span>)?
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
