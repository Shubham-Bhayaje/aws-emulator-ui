"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createResolverEndpointAction } from "../../resolver-actions";

interface Props {
  vpcs: Array<{ vpcId: string; name?: string; cidrBlock?: string }>;
  subnets: Array<{ subnetId: string; vpcId: string; availabilityZone?: string; cidrBlock?: string; name?: string }>;
  securityGroups: Array<{ groupId: string; groupName: string; vpcId?: string; description?: string }>;
}

interface IpConfig {
  subnetId: string;
  ipMode: "auto" | "custom";
  ipAddress: string;
}

export default function CreateResolverEndpointClient({
  vpcs,
  subnets,
  securityGroups,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDirection = (searchParams.get("direction")?.toUpperCase() === "OUTBOUND" ? "OUTBOUND" : "INBOUND") as "INBOUND" | "OUTBOUND";

  const [direction, setDirection] = useState<"INBOUND" | "OUTBOUND">(initialDirection);
  const [name, setName] = useState("");
  const [selectedVpcId, setSelectedVpcId] = useState(vpcs.length > 0 ? vpcs[0].vpcId : "");
  const [selectedSgIds, setSelectedSgIds] = useState<string[]>(
    securityGroups.length > 0 ? [securityGroups[0].groupId] : []
  );
  const [protocols, setProtocols] = useState<string[]>(["Do53"]);

  // Filter subnets for the selected VPC
  const vpcSubnets = useMemo(() => {
    return subnets.filter((s) => s.vpcId === selectedVpcId);
  }, [subnets, selectedVpcId]);

  // Initial two IP addresses
  const [ipConfigs, setIpConfigs] = useState<IpConfig[]>([
    {
      subnetId: vpcSubnets.length > 0 ? vpcSubnets[0].subnetId : "",
      ipMode: "auto",
      ipAddress: "",
    },
    {
      subnetId: vpcSubnets.length > 1 ? vpcSubnets[1].subnetId : (vpcSubnets[0]?.subnetId || ""),
      ipMode: "auto",
      ipAddress: "",
    },
  ]);

  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update IP subnets if VPC changes
  const handleVpcChange = (newVpcId: string) => {
    setSelectedVpcId(newVpcId);
    const newVpcSubnets = subnets.filter((s) => s.vpcId === newVpcId);
    setIpConfigs([
      {
        subnetId: newVpcSubnets.length > 0 ? newVpcSubnets[0].subnetId : "",
        ipMode: "auto",
        ipAddress: "",
      },
      {
        subnetId: newVpcSubnets.length > 1 ? newVpcSubnets[1].subnetId : (newVpcSubnets[0]?.subnetId || ""),
        ipMode: "auto",
        ipAddress: "",
      },
    ]);
  };

  const handleAddIp = () => {
    setIpConfigs([
      ...ipConfigs,
      {
        subnetId: vpcSubnets.length > 0 ? vpcSubnets[0].subnetId : "",
        ipMode: "auto",
        ipAddress: "",
      },
    ]);
  };

  const handleRemoveIp = (idx: number) => {
    if (ipConfigs.length <= 2) return;
    setIpConfigs(ipConfigs.filter((_, i) => i !== idx));
  };

  const handleIpChange = (idx: number, field: keyof IpConfig, val: string) => {
    const updated = [...ipConfigs];
    updated[idx] = { ...updated[idx], [field]: val };
    setIpConfigs(updated);
  };

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

    if (!selectedVpcId) {
      setError("Please select a VPC.");
      return;
    }

    if (selectedSgIds.length === 0) {
      setError("Please select at least one security group.");
      return;
    }

    if (ipConfigs.length < 2) {
      setError("At least two IP addresses in different Availability Zones are required for high availability.");
      return;
    }

    // Check that subnets are specified
    for (let i = 0; i < ipConfigs.length; i++) {
      if (!ipConfigs[i].subnetId) {
        setError(`Please select a subnet for IP address #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await createResolverEndpointAction({
        name: name.trim() || undefined,
        direction,
        securityGroupIds: selectedSgIds,
        ipAddresses: ipConfigs.map((cfg) => ({
          subnetId: cfg.subnetId,
          ip: cfg.ipMode === "custom" && cfg.ipAddress.trim() ? cfg.ipAddress.trim() : undefined,
        })),
        protocols,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success) {
        router.push("/route53/resolver/endpoints");
        router.refresh();
      } else {
        setError(res.error || "Failed to create resolver endpoint");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/route53/resolver" className="hover:text-[#0073bb]">
          Resolver
        </Link>
        <span>&gt;</span>
        <Link href="/route53/resolver/endpoints" className="hover:text-[#0073bb]">
          Resolver endpoints
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">Create {direction.toLowerCase()} endpoint</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">
          Create {direction.toLowerCase()} endpoint
        </h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          {direction === "INBOUND"
            ? "DNS resolvers on your network can forward DNS queries to Route 53 Resolver via this inbound endpoint."
            : "Route 53 Resolver conditionally forwards queries from your VPC to resolvers on your network via this outbound endpoint."}
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Direction Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Endpoint direction
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`p-4 border rounded cursor-pointer transition-colors block ${
                direction === "INBOUND"
                  ? "border-[#ec7211] bg-[#fffaf5] ring-1 ring-[#ec7211]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="direction"
                  value="INBOUND"
                  checked={direction === "INBOUND"}
                  onChange={() => setDirection("INBOUND")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold text-[13px] text-[#16191f]">Inbound</span>
              </div>
              <p className="text-xs text-[#545b64] mt-2 pl-5">
                DNS resolvers on your network forward DNS queries to Route 53 Resolver.
              </p>
            </label>

            <label
              className={`p-4 border rounded cursor-pointer transition-colors block ${
                direction === "OUTBOUND"
                  ? "border-[#ec7211] bg-[#fffaf5] ring-1 ring-[#ec7211]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="direction"
                  value="OUTBOUND"
                  checked={direction === "OUTBOUND"}
                  onChange={() => setDirection("OUTBOUND")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="font-bold text-[13px] text-[#16191f]">Outbound</span>
              </div>
              <p className="text-xs text-[#545b64] mt-2 pl-5">
                Route 53 Resolver conditionally forwards queries to resolvers on your on-premises network.
              </p>
            </label>
          </div>
        </div>

        {/* General Settings Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            General settings
          </h2>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Endpoint name <span className="text-gray-400 font-normal">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              A friendly name to identify the resolver endpoint.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. corporate-inbound-endpoint"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* VPC */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              VPC in the Region <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The VPC that you want to create the resolver endpoint in.
            </p>
            {vpcs.length === 0 ? (
              <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                No VPCs found.{" "}
                <Link href="/vpc/create" className="text-[#0073bb] hover:underline">
                  Create a VPC
                </Link>{" "}
                first.
              </div>
            ) : (
              <select
                value={selectedVpcId}
                onChange={(e) => handleVpcChange(e.target.value)}
                className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
              >
                {vpcs.map((v) => (
                  <option key={v.vpcId} value={v.vpcId}>
                    {v.name ? `${v.name} (${v.vpcId})` : v.vpcId} - {v.cidrBlock}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Security Groups */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Security group for this endpoint <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              Security groups control the UDP and TCP port 53 traffic allowed to/from the endpoint.
            </p>
            {securityGroups.length === 0 ? (
              <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                No security groups found.
              </div>
            ) : (
              <select
                multiple
                value={selectedSgIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions, (option) => option.value);
                  setSelectedSgIds(opts);
                }}
                className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211] min-h-[90px]"
              >
                {securityGroups.map((sg) => (
                  <option key={sg.groupId} value={sg.groupId}>
                    {sg.groupName} ({sg.groupId})
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-gray-400 mt-1">Hold Ctrl (Windows) to select multiple security groups.</p>
          </div>

          {/* Protocols */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Protocols
            </label>
            <div className="flex items-center gap-4 text-[13px] text-gray-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protocols.includes("Do53")}
                  onChange={(e) => {
                    if (e.target.checked) setProtocols([...protocols, "Do53"]);
                    else if (protocols.length > 1) setProtocols(protocols.filter((p) => p !== "Do53"));
                  }}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>Do53 (Standard DNS on UDP/TCP port 53)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protocols.includes("DoH")}
                  onChange={(e) => {
                    if (e.target.checked) setProtocols([...protocols, "DoH"]);
                    else setProtocols(protocols.filter((p) => p !== "DoH"));
                  }}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span>DoH (DNS-over-HTTPS on TCP port 443)</span>
              </label>
            </div>
          </div>
        </div>

        {/* IP Addresses Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">
                IP addresses
              </h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Route 53 Resolver requires at least two IP addresses across different Availability Zones for high availability.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddIp}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 text-[12px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              Add another IP address
            </button>
          </div>

          <div className="space-y-6">
            {ipConfigs.map((cfg, idx) => (
              <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[#16191f]">
                    IP address #{idx + 1}
                  </span>
                  {ipConfigs.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIp(idx)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="px-3 text-[12px] font-medium text-red-600 bg-white border border-gray-300 rounded hover:bg-red-50 flex items-center justify-center"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Subnet selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subnet <span className="text-red-500">*</span>
                  </label>
                  {vpcSubnets.length === 0 ? (
                    <p className="text-xs text-red-500">No subnets found in selected VPC.</p>
                  ) : (
                    <select
                      value={cfg.subnetId}
                      onChange={(e) => handleIpChange(idx, "subnetId", e.target.value)}
                      className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-[#ec7211]"
                    >
                      {vpcSubnets.map((sub) => (
                        <option key={sub.subnetId} value={sub.subnetId}>
                          {sub.name ? `${sub.name} (${sub.subnetId})` : sub.subnetId} | {sub.availabilityZone || "AZ"} | {sub.cidrBlock}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* IP mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    IP address assignment
                  </label>
                  <div className="flex items-center gap-6 text-xs text-gray-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`ipMode-${idx}`}
                        checked={cfg.ipMode === "auto"}
                        onChange={() => handleIpChange(idx, "ipMode", "auto")}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                      <span>Use an IP address that is selected automatically</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`ipMode-${idx}`}
                        checked={cfg.ipMode === "custom"}
                        onChange={() => handleIpChange(idx, "ipMode", "custom")}
                        className="text-[#ec7211] focus:ring-[#ec7211]"
                      />
                      <span>Use an IP address that you specify</span>
                    </label>
                  </div>

                  {cfg.ipMode === "custom" && (
                    <input
                      type="text"
                      value={cfg.ipAddress}
                      onChange={(e) => handleIpChange(idx, "ipAddress", e.target.value)}
                      placeholder="e.g. 10.0.1.10"
                      className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#ec7211] bg-white mt-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
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
            href="/route53/resolver/endpoints"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || vpcs.length === 0}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center transition-colors shadow-sm"
          >
            {loading ? "Creating..." : `Create ${direction.toLowerCase()} endpoint`}
          </button>
        </div>
      </form>
    </div>
  );
}
