"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DxConnectionItem,
  DxGatewayItem,
  createVirtualInterfaceAction,
} from "../../dx-actions";

interface Props {
  connections: DxConnectionItem[];
  directConnectGateways: DxGatewayItem[];
  vpnGateways: Array<{ VpnGatewayId: string; Name?: string }>;
}

export default function CreateVirtualInterfaceClient({
  connections,
  directConnectGateways,
  vpnGateways,
}: Props) {
  const router = useRouter();

  const [vifType, setVifType] = useState<"private" | "transit" | "public">("private");
  const [vifName, setVifName] = useState("");
  const [connectionId, setConnectionId] = useState(
    connections.length > 0 ? connections[0].connectionId : ""
  );
  const [gatewayType, setGatewayType] = useState<"dxgw" | "vgw">("dxgw");
  const [directConnectGatewayId, setDirectConnectGatewayId] = useState(
    directConnectGateways.length > 0 ? directConnectGateways[0].directConnectGatewayId : ""
  );
  const [vpnGatewayId, setVpnGatewayId] = useState(
    vpnGateways.length > 0 ? vpnGateways[0].VpnGatewayId : ""
  );
  const [vlan, setVlan] = useState<number>(100);
  const [asn, setAsn] = useState<number>(65000);
  const [authKey, setAuthKey] = useState("");
  const [amazonAddress, setAmazonAddress] = useState("169.254.255.1/30");
  const [customerAddress, setCustomerAddress] = useState("169.254.255.2/30");

  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => setTags([...tags, { key: "", value: "" }]);
  const handleRemoveTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));
  const handleTagChange = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vifName.trim()) {
      setError("Virtual interface name is required.");
      return;
    }
    if (!connectionId) {
      setError("Please select a Direct Connect connection.");
      return;
    }
    if (!vlan || vlan < 1 || vlan > 4094) {
      setError("VLAN tag must be an integer between 1 and 4094.");
      return;
    }
    if (!asn || asn < 1 || asn > 4294967294) {
      setError("Please specify a valid BGP Autonomous System Number (ASN).");
      return;
    }

    setLoading(true);
    try {
      const res = await createVirtualInterfaceAction({
        type: vifType,
        connectionId,
        name: vifName.trim(),
        vlan: Number(vlan),
        asn: Number(asn),
        authKey: authKey.trim() || undefined,
        amazonAddress: amazonAddress.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        directConnectGatewayId:
          vifType === "private"
            ? gatewayType === "dxgw"
              ? directConnectGatewayId || undefined
              : undefined
            : vifType === "transit"
            ? directConnectGatewayId || undefined
            : undefined,
        vpnGatewayId:
          vifType === "private" && gatewayType === "vgw"
            ? vpnGatewayId || undefined
            : undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success) {
        router.push("/direct-connect/virtual-interfaces");
        router.refresh();
      } else {
        setError(res.error || "Failed to create virtual interface");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
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
        <span className="text-gray-900 font-medium">Create virtual interface</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create virtual interface</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A virtual interface (VIF) enables access to AWS services over your Direct Connect connection.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Virtual interface type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              className={`p-4 border rounded cursor-pointer transition-colors block ${
                vifType === "private"
                  ? "border-[#ec7211] bg-[#fffaf5] ring-1 ring-[#ec7211]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vifType"
                  value="private"
                  checked={vifType === "private"}
                  onChange={() => setVifType("private")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold text-[13px] text-[#16191f]">Private</span>
              </div>
              <p className="text-xs text-[#545b64] mt-2 pl-5">
                Connects to a single VPC (via Virtual Private Gateway) or multiple VPCs (via Direct Connect gateway).
              </p>
            </label>

            <label
              className={`p-4 border rounded cursor-pointer transition-colors block ${
                vifType === "transit"
                  ? "border-[#ec7211] bg-[#fffaf5] ring-1 ring-[#ec7211]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vifType"
                  value="transit"
                  checked={vifType === "transit"}
                  onChange={() => setVifType("transit")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold text-[13px] text-[#16191f]">Transit</span>
              </div>
              <p className="text-xs text-[#545b64] mt-2 pl-5">
                Connects to an AWS Transit Gateway through a Direct Connect gateway. Supports multi-VPC hub routing.
              </p>
            </label>

            <label
              className={`p-4 border rounded cursor-pointer transition-colors block ${
                vifType === "public"
                  ? "border-[#ec7211] bg-[#fffaf5] ring-1 ring-[#ec7211]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vifType"
                  value="public"
                  checked={vifType === "public"}
                  onChange={() => setVifType("public")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold text-[13px] text-[#16191f]">Public</span>
              </div>
              <p className="text-xs text-[#545b64] mt-2 pl-5">
                Connects to public AWS services (such as Amazon S3 or DynamoDB) using public IPv4/IPv6 addresses.
              </p>
            </label>
          </div>
        </div>

        {/* Configuration settings card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Virtual interface settings
          </h2>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Virtual interface name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vifName}
              onChange={(e) => setVifName(e.target.value)}
              placeholder="e.g. corporate-private-vif"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Connection selection */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Connection <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The Direct Connect connection to which the virtual interface is provisioned.
            </p>
            {connections.length === 0 ? (
              <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                No Direct Connect connections found.{" "}
                <Link href="/direct-connect/connections/create" className="text-[#0073bb] hover:underline">
                  Create a connection
                </Link>{" "}
                first.
              </div>
            ) : (
              <select
                value={connectionId}
                onChange={(e) => setConnectionId(e.target.value)}
                className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
              >
                {connections.map((c) => (
                  <option key={c.connectionId} value={c.connectionId}>
                    {c.connectionName} ({c.connectionId}) - {c.bandwidth} - {c.location}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Gateway Association (for Private or Transit VIF) */}
          {vifType === "private" && (
            <div className="pt-2 border-t border-gray-200 space-y-3">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                Connection to
              </label>
              <div className="flex items-center gap-6 text-[13px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gwType"
                    checked={gatewayType === "dxgw"}
                    onChange={() => setGatewayType("dxgw")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>Direct Connect gateway</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gwType"
                    checked={gatewayType === "vgw"}
                    onChange={() => setGatewayType("vgw")}
                    className="text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span>Virtual Private Gateway (VGW)</span>
                </label>
              </div>

              {gatewayType === "dxgw" ? (
                <div>
                  <label className="block text-xs text-[#545b64] mb-1">
                    Direct Connect gateway
                  </label>
                  {directConnectGateways.length === 0 ? (
                    <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                      No Direct Connect gateways found.{" "}
                      <Link href="/direct-connect/gateways/create" className="text-[#0073bb] hover:underline">
                        Create a Direct Connect gateway
                      </Link>{" "}
                      first.
                    </div>
                  ) : (
                    <select
                      value={directConnectGatewayId}
                      onChange={(e) => setDirectConnectGatewayId(e.target.value)}
                      className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
                    >
                      {directConnectGateways.map((g) => (
                        <option key={g.directConnectGatewayId} value={g.directConnectGatewayId}>
                          {g.directConnectGatewayName} ({g.directConnectGatewayId}) - ASN {g.amazonSideAsn}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[#545b64] mb-1">
                    Virtual Private Gateway
                  </label>
                  {vpnGateways.length === 0 ? (
                    <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                      No Virtual Private Gateways (VGW) found in this region. Create one in VPC first.
                    </div>
                  ) : (
                    <select
                      value={vpnGatewayId}
                      onChange={(e) => setVpnGatewayId(e.target.value)}
                      className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
                    >
                      {vpnGateways.map((v) => (
                        <option key={v.VpnGatewayId} value={v.VpnGatewayId}>
                          {v.Name ? `${v.Name} (${v.VpnGatewayId})` : v.VpnGatewayId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {vifType === "transit" && (
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                Direct Connect gateway <span className="text-red-500">*</span>
              </label>
              {directConnectGateways.length === 0 ? (
                <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                  Transit virtual interfaces require a Direct Connect gateway.{" "}
                  <Link href="/direct-connect/gateways/create" className="text-[#0073bb] hover:underline">
                    Create a Direct Connect gateway
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  value={directConnectGatewayId}
                  onChange={(e) => setDirectConnectGatewayId(e.target.value)}
                  className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
                >
                  {directConnectGateways.map((g) => (
                    <option key={g.directConnectGatewayId} value={g.directConnectGatewayId}>
                      {g.directConnectGatewayName} ({g.directConnectGatewayId})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* VLAN */}
          <div className="pt-2 border-t border-gray-200">
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              VLAN tag <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              Valid VLAN IDs are 1 to 4094. Every virtual interface on the same physical connection must have a unique VLAN tag.
            </p>
            <input
              type="number"
              required
              min={1}
              max={4094}
              value={vlan}
              onChange={(e) => setVlan(Number(e.target.value))}
              placeholder="100"
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* BGP Configuration */}
          <div className="pt-2 border-t border-gray-200 space-y-4">
            <h3 className="text-[14px] font-bold text-[#16191f]">BGP configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Customer BGP ASN <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={asn}
                  onChange={(e) => setAsn(Number(e.target.value))}
                  placeholder="65000"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  BGP authentication key <span className="text-gray-400 font-normal">- optional</span>
                </label>
                <input
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="BGP MD5 auth secret"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Amazon router peer IP <span className="text-gray-400 font-normal">- optional</span>
                </label>
                <input
                  type="text"
                  value={amazonAddress}
                  onChange={(e) => setAmazonAddress(e.target.value)}
                  placeholder="169.254.255.1/30"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Customer router peer IP <span className="text-gray-400 font-normal">- optional</span>
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="169.254.255.2/30"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="text-[16px] font-bold text-[#16191f]">Tags</h3>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              Add new tag
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No tags added.</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={tag.key}
                    onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                    className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={tag.value}
                    onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                    className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="px-3 text-[12px] font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 flex items-center justify-center"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/direct-connect/virtual-interfaces"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || connections.length === 0 || !vifName.trim()}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center transition-colors shadow-sm"
          >
            {loading ? "Creating..." : "Create virtual interface"}
          </button>
        </div>
      </form>
    </div>
  );
}
