"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CustomerGatewayItem,
  VirtualPrivateGatewayItem,
  createVpnConnectionAction,
} from "../../vpn-actions";
import { TransitGatewayItem } from "../../transit-gateway-actions";

interface Props {
  customerGateways: CustomerGatewayItem[];
  virtualPrivateGateways: VirtualPrivateGatewayItem[];
  transitGateways: TransitGatewayItem[];
}

function CreateVpnForm({ customerGateways, virtualPrivateGateways, transitGateways }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedCgwId = searchParams.get("cgwId") || searchParams.get("cgw") || (customerGateways.length > 0 ? customerGateways[0].CustomerGatewayId : "");
  const preselectedVgwId = searchParams.get("vgwId") || searchParams.get("vgw") || (virtualPrivateGateways.length > 0 ? virtualPrivateGateways[0].VpnGatewayId : "");
  const preselectedTgwId = searchParams.get("tgwId") || searchParams.get("tgw") || (transitGateways.length > 0 ? transitGateways[0].TransitGatewayId : "");

  const initialTargetType = searchParams.get("tgwId") || searchParams.get("tgw") ? "tgw" : "vgw";

  const [name, setName] = useState("");
  const [targetGatewayType, setTargetGatewayType] = useState<"vgw" | "tgw">(initialTargetType);
  const [vpnGatewayId, setVpnGatewayId] = useState(preselectedVgwId);
  const [transitGatewayId, setTransitGatewayId] = useState(preselectedTgwId);

  // Customer Gateway Mode
  const [cgwMode, setCgwMode] = useState<"existing" | "new">(customerGateways.length > 0 ? "existing" : "new");
  const [customerGatewayId, setCustomerGatewayId] = useState(preselectedCgwId);

  // New Customer Gateway fields
  const [newCgwIp, setNewCgwIp] = useState("");
  const [newCgwBgpAsn, setNewCgwBgpAsn] = useState<number>(65000);
  const [newCgwCertificateArn, setNewCgwCertificateArn] = useState("");
  const [newCgwDevice, setNewCgwDevice] = useState("");

  // Routing
  const [routingOption, setRoutingOption] = useState<"dynamic" | "static">("dynamic");
  const [staticRoutes, setStaticRoutes] = useState<string[]>([""]);

  // Tunnel Options
  const [showTunnelOptions, setShowTunnelOptions] = useState(false);
  const [t1InsideCidr, setT1InsideCidr] = useState("");
  const [t1Psk, setT1Psk] = useState("");
  const [t2InsideCidr, setT2InsideCidr] = useState("");
  const [t2Psk, setT2Psk] = useState("");

  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddStaticRoute = () => {
    setStaticRoutes([...staticRoutes, ""]);
  };

  const handleRemoveStaticRoute = (index: number) => {
    setStaticRoutes(staticRoutes.filter((_, i) => i !== index));
  };

  const handleStaticRouteChange = (index: number, val: string) => {
    const updated = [...staticRoutes];
    updated[index] = val;
    setStaticRoutes(updated);
  };

  const handleAddTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetGatewayType === "vgw" && !vpnGatewayId) {
      setError("Please select a virtual private gateway.");
      return;
    }
    if (targetGatewayType === "tgw" && !transitGatewayId) {
      setError("Please select a transit gateway.");
      return;
    }

    if (cgwMode === "existing" && !customerGatewayId) {
      setError("Please select an existing customer gateway.");
      return;
    }

    if (cgwMode === "new" && !newCgwIp.trim()) {
      setError("Please specify the IP address for the new customer gateway.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createVpnConnectionAction({
        targetGatewayType,
        vpnGatewayId: targetGatewayType === "vgw" ? vpnGatewayId : undefined,
        transitGatewayId: targetGatewayType === "tgw" ? transitGatewayId : undefined,
        customerGatewayId: cgwMode === "existing" ? customerGatewayId : undefined,
        newCustomerGateway:
          cgwMode === "new"
            ? {
                ipAddress: newCgwIp.trim(),
                bgpAsn: Number(newCgwBgpAsn) || 65000,
                certificateArn: newCgwCertificateArn.trim() || undefined,
                deviceName: newCgwDevice.trim() || undefined,
              }
            : undefined,
        routingOption,
        staticRoutes: routingOption === "static" ? staticRoutes.filter((r) => r.trim()) : undefined,
        tunnel1Options:
          t1InsideCidr || t1Psk
            ? { insideCidr: t1InsideCidr.trim() || undefined, preSharedKey: t1Psk.trim() || undefined }
            : undefined,
        tunnel2Options:
          t2InsideCidr || t2Psk
            ? { insideCidr: t2InsideCidr.trim() || undefined, preSharedKey: t2Psk.trim() || undefined }
            : undefined,
        name: name.trim() || undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.vpnConnectionId) {
        router.push(`/vpc/vpn-connections/${res.vpnConnectionId}`);
      } else {
        setError(res.error || "Failed to create VPN connection");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/vpn-connections" className="hover:text-[#0073bb]">
          Site-to-Site VPN connections
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create VPN connection</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create VPN connection</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          An AWS Site-to-Site VPN connection connects your on-premises network or branch office to your Amazon VPC or Transit Gateway.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            VPN connection settings
          </h2>

          {/* Name tag */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Name tag <span className="text-gray-400 font-normal">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              Creates a tag with a key of &apos;Name&apos; and a value that you specify.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. corp-hq-vpn"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Target Gateway Type */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
              Target gateway type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetGatewayType"
                  value="vgw"
                  checked={targetGatewayType === "vgw"}
                  onChange={() => setTargetGatewayType("vgw")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">
                  Virtual private gateway
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetGatewayType"
                  value="tgw"
                  checked={targetGatewayType === "tgw"}
                  onChange={() => setTargetGatewayType("tgw")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">
                  Transit gateway
                </span>
              </label>
            </div>
          </div>

          {/* Virtual Private Gateway Dropdown */}
          {targetGatewayType === "vgw" && (
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Virtual private gateway <span className="text-red-500">*</span>
              </label>
              {virtualPrivateGateways.length === 0 ? (
                <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                  No virtual private gateways found.{" "}
                  <Link href="/vpc/virtual-private-gateways/create" className="text-[#0073bb] hover:underline">
                    Create a virtual private gateway
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  value={vpnGatewayId}
                  onChange={(e) => setVpnGatewayId(e.target.value)}
                  required
                  className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="" disabled>
                    Select a virtual private gateway
                  </option>
                  {virtualPrivateGateways.map((vgw) => (
                    <option key={vgw.VpnGatewayId} value={vgw.VpnGatewayId}>
                      {vgw.Name ? `${vgw.Name} (${vgw.VpnGatewayId})` : vgw.VpnGatewayId}
                      {vgw.AttachedVpcId ? ` [Attached to ${vgw.AttachedVpcId}]` : " [Detached]"}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Transit Gateway Dropdown */}
          {targetGatewayType === "tgw" && (
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Transit gateway <span className="text-red-500">*</span>
              </label>
              {transitGateways.length === 0 ? (
                <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                  No transit gateways found.{" "}
                  <Link href="/vpc/transit-gateways/create" className="text-[#0073bb] hover:underline">
                    Create a transit gateway
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  value={transitGatewayId}
                  onChange={(e) => setTransitGatewayId(e.target.value)}
                  required
                  className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="" disabled>
                    Select a transit gateway
                  </option>
                  {transitGateways.map((tgw) => (
                    <option key={tgw.TransitGatewayId} value={tgw.TransitGatewayId}>
                      {tgw.Name ? `${tgw.Name} (${tgw.TransitGatewayId})` : tgw.TransitGatewayId}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Customer Gateway Selection */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Customer gateway
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cgwMode"
                value="existing"
                checked={cgwMode === "existing"}
                onChange={() => setCgwMode("existing")}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] font-medium text-[#16191f]">
                Existing customer gateway
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cgwMode"
                value="new"
                checked={cgwMode === "new"}
                onChange={() => setCgwMode("new")}
                className="text-[#ec7211] focus:ring-[#ec7211]"
              />
              <span className="text-[13px] font-medium text-[#16191f]">
                Create new customer gateway
              </span>
            </label>
          </div>

          {cgwMode === "existing" ? (
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Customer gateway ID <span className="text-red-500">*</span>
              </label>
              {customerGateways.length === 0 ? (
                <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                  No customer gateways found. Switch to &apos;Create new customer gateway&apos; above or{" "}
                  <Link href="/vpc/customer-gateways/create" className="text-[#0073bb] hover:underline">
                    create one here
                  </Link>.
                </div>
              ) : (
                <select
                  value={customerGatewayId}
                  onChange={(e) => setCustomerGatewayId(e.target.value)}
                  required
                  className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  <option value="" disabled>
                    Select a customer gateway
                  </option>
                  {customerGateways.map((cgw) => (
                    <option key={cgw.CustomerGatewayId} value={cgw.CustomerGatewayId}>
                      {cgw.Name ? `${cgw.Name} (${cgw.CustomerGatewayId})` : cgw.CustomerGatewayId} - {cgw.IpAddress} (ASN {cgw.BgpAsn})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  IP address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 203.0.113.12"
                  value={newCgwIp}
                  onChange={(e) => setNewCgwIp(e.target.value)}
                  required={cgwMode === "new"}
                  className="w-full max-w-md border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] bg-white"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  BGP ASN <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={4294967294}
                  value={newCgwBgpAsn}
                  onChange={(e) => setNewCgwBgpAsn(Number(e.target.value))}
                  required={cgwMode === "new"}
                  className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] bg-white"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Certificate ARN <span className="text-gray-400 font-normal">- optional</span>
                </label>
                <input
                  type="text"
                  placeholder="arn:aws:acm:..."
                  value={newCgwCertificateArn}
                  onChange={(e) => setNewCgwCertificateArn(e.target.value)}
                  className="w-full max-w-md border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] bg-white"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Device <span className="text-gray-400 font-normal">- optional</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cisco ISR"
                  value={newCgwDevice}
                  onChange={(e) => setNewCgwDevice(e.target.value)}
                  className="w-full max-w-md border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Routing Options */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Routing options
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="routingOption"
                value="dynamic"
                checked={routingOption === "dynamic"}
                onChange={() => setRoutingOption("dynamic")}
                className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f] block">
                  Dynamic (requires BGP)
                </span>
                <span className="text-[12px] text-[#545b64]">
                  Routes are advertised dynamically using Border Gateway Protocol (BGP).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="routingOption"
                value="static"
                checked={routingOption === "static"}
                onChange={() => setRoutingOption("static")}
                className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f] block">
                  Static
                </span>
                <span className="text-[12px] text-[#545b64]">
                  Routes must be configured manually for traffic directed through the VPN connection.
                </span>
              </div>
            </label>
          </div>

          {routingOption === "static" && (
            <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[13px] font-semibold text-[#16191f] block">
                    Static IP prefixes
                  </label>
                  <p className="text-[12px] text-[#545b64]">
                    Enter the CIDR blocks of your on-premises network.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStaticRoute}
                  className="px-3 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add IP prefix
                </button>
              </div>

              <div className="space-y-2">
                {staticRoutes.map((route, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 192.168.0.0/16"
                      value={route}
                      onChange={(e) => handleStaticRouteChange(idx, e.target.value)}
                      className="w-full max-w-sm border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] bg-white"
                    />
                    {staticRoutes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStaticRoute(idx)}
                        className="px-3 text-[12px] font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tunnel Options (Optional) */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tunnel options</h2>
              <p className="text-[12px] text-[#545b64]">
                Customize inside CIDR blocks and pre-shared keys for Tunnel 1 and Tunnel 2. AWS configures defaults automatically if omitted.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTunnelOptions(!showTunnelOptions)}
              className="text-xs text-[#0073bb] hover:underline font-medium"
            >
              {showTunnelOptions ? "Hide tunnel options" : "Show tunnel options"}
            </button>
          </div>

          {showTunnelOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t">
              {/* Tunnel 1 */}
              <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-3">
                <h3 className="text-[14px] font-bold text-gray-800">Tunnel 1 Options</h3>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                    Inside IPv4 CIDR
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 169.254.10.0/30"
                    value={t1InsideCidr}
                    onChange={(e) => setT1InsideCidr(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] font-mono bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">Must be a /30 from 169.254.0.0/16.</p>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                    Pre-shared key (PSK)
                  </label>
                  <input
                    type="password"
                    placeholder="8 to 64 characters"
                    value={t1Psk}
                    onChange={(e) => setT1Psk(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] font-mono bg-white"
                  />
                </div>
              </div>

              {/* Tunnel 2 */}
              <div className="border border-gray-200 rounded p-4 bg-gray-50 space-y-3">
                <h3 className="text-[14px] font-bold text-gray-800">Tunnel 2 Options</h3>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                    Inside IPv4 CIDR
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 169.254.11.0/30"
                    value={t2InsideCidr}
                    onChange={(e) => setT2InsideCidr(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] font-mono bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">Must be a /30 from 169.254.0.0/16.</p>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-700 block mb-1">
                    Pre-shared key (PSK)
                  </label>
                  <input
                    type="password"
                    placeholder="8 to 64 characters"
                    value={t2Psk}
                    onChange={(e) => setT2Psk(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-[12px] font-mono bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource. Each tag has a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add new tag
            </button>
          </div>

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
                {tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="px-3 text-[12px] font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/vpc/vpn-connections"
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create VPN connection"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateVpnConnectionClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Loading form...</div>}>
      <CreateVpnForm {...props} />
    </Suspense>
  );
}
