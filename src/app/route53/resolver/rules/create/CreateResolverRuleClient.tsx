"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResolverEndpointItem, createResolverRuleAction } from "../../resolver-actions";

interface Props {
  vpcs: Array<{ vpcId: string; name?: string; cidrBlock?: string }>;
  outboundEndpoints: ResolverEndpointItem[];
}

export default function CreateResolverRuleClient({ vpcs, outboundEndpoints }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<"FORWARD" | "SYSTEM">("FORWARD");
  const [domainName, setDomainName] = useState("");
  const [resolverEndpointId, setResolverEndpointId] = useState(
    outboundEndpoints.length > 0 ? outboundEndpoints[0].id : ""
  );
  const [targetIps, setTargetIps] = useState<Array<{ ip: string; port: number }>>([
    { ip: "", port: 53 },
  ]);
  const [vpcIdToAssociate, setVpcIdToAssociate] = useState<string>("");
  const [tags, setTags] = useState<Array<{ key: string; value: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTargetIp = () => {
    setTargetIps([...targetIps, { ip: "", port: 53 }]);
  };

  const handleRemoveTargetIp = (index: number) => {
    if (targetIps.length <= 1) return;
    setTargetIps(targetIps.filter((_, i) => i !== index));
  };

  const handleTargetIpChange = (index: number, field: "ip" | "port", val: string | number) => {
    const next = [...targetIps];
    if (field === "ip") {
      next[index].ip = String(val);
    } else {
      next[index].port = Number(val) || 53;
    }
    setTargetIps(next);
  };

  const handleAddTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "key" | "value", val: string) => {
    const next = [...tags];
    next[index][field] = val;
    setTags(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!domainName.trim()) {
      setError("Domain name is required.");
      return;
    }

    if (ruleType === "FORWARD") {
      if (!resolverEndpointId) {
        setError("An outbound resolver endpoint is required for FORWARD rules.");
        return;
      }

      const validIps = targetIps.filter((t) => t.ip.trim().length > 0);
      if (validIps.length === 0) {
        setError("At least one target IP address is required for FORWARD rules.");
        return;
      }
    }

    setLoading(true);

    const res = await createResolverRuleAction({
      name: name.trim() || undefined,
      ruleType,
      domainName: domainName.trim(),
      resolverEndpointId: ruleType === "FORWARD" ? resolverEndpointId : undefined,
      targetIps: ruleType === "FORWARD" ? targetIps.filter((t) => t.ip.trim()) : undefined,
      vpcIdToAssociate: vpcIdToAssociate || undefined,
      tags: tags.filter((t) => t.key.trim().length > 0),
    });

    if (res.success && res.ruleId) {
      router.push(`/route53/resolver/rules/${res.ruleId}`);
      router.refresh();
    } else {
      setError(res.error || "Failed to create rule");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center text-xs text-gray-500 space-x-2">
        <Link href="/route53/resolver" className="hover:text-blue-600">
          Route 53 Resolver
        </Link>
        <span>&rsaquo;</span>
        <Link href="/route53/resolver/rules" className="hover:text-blue-600">
          Rules
        </Link>
        <span>&rsaquo;</span>
        <span className="text-gray-900 font-medium">Create rule</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create rule</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure a Resolver rule to specify how DNS queries for a domain name are routed.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">
          <p className="font-bold">Error creating rule</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Section 1: Rule Details */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Rule details
        </h2>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Rule name - <span className="font-normal text-gray-500">optional</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-conditional-forwarding-rule"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">Rule type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <label
              className={`flex items-start p-3 border rounded cursor-pointer transition-colors ${
                ruleType === "FORWARD"
                  ? "border-[#ec7211] bg-orange-50/20"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="ruleType"
                checked={ruleType === "FORWARD"}
                onChange={() => setRuleType("FORWARD")}
                className="mt-0.5 h-3.5 w-3.5 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div className="ml-2.5">
                <span className="font-bold text-gray-900 block">Forward</span>
                <span className="text-gray-500 mt-0.5 block">
                  Resolver forwards DNS queries for the specified domain name to target IP addresses on your
                  network through an outbound resolver endpoint.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start p-3 border rounded cursor-pointer transition-colors ${
                ruleType === "SYSTEM"
                  ? "border-[#ec7211] bg-orange-50/20"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="ruleType"
                checked={ruleType === "SYSTEM"}
                onChange={() => setRuleType("SYSTEM")}
                className="mt-0.5 h-3.5 w-3.5 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div className="ml-2.5">
                <span className="font-bold text-gray-900 block">System</span>
                <span className="text-gray-500 mt-0.5 block">
                  Resolver resolves queries for the specified domain name by using the default behavior of the
                  Resolver in your VPC.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Domain name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={domainName}
            onChange={(e) => setDomainName(e.target.value)}
            placeholder="corp.example.com"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Specify the fully qualified domain name (FQDN). Route 53 Resolver appends a trailing dot if omitted.
          </p>
        </div>
      </div>

      {/* Section 2: Outbound Endpoint (FORWARD only) */}
      {ruleType === "FORWARD" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Outbound resolver endpoint
          </h2>

          {outboundEndpoints.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-xs text-yellow-800 space-y-2">
              <p className="font-bold">No outbound resolver endpoints found in this Region.</p>
              <p>
                To forward DNS queries to target IP addresses on your on-premises network, you must create
                an outbound resolver endpoint first.
              </p>
              <div>
                <Link
                  href="/route53/resolver/endpoints/create"
                  target="_blank"
                  className="text-[#0073bb] font-semibold hover:underline inline-flex items-center space-x-1"
                >
                  <span>Create an outbound resolver endpoint &rsaquo;</span>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Outbound endpoint <span className="text-red-500">*</span>
              </label>
              <select
                value={resolverEndpointId}
                onChange={(e) => setResolverEndpointId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
              >
                {outboundEndpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.name ? `${ep.name} (${ep.id})` : ep.id} - VPC: {ep.hostVpcId || "-"}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Select the outbound endpoint whose IP addresses will forward DNS queries for this rule.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section 3: Target IP Addresses (FORWARD only) */}
      {ruleType === "FORWARD" && (
        <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Target IP addresses</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Specify the IP addresses of the DNS resolvers on your on-premises network.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTargetIp}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
            >
              Add target IP
            </button>
          </div>

          <div className="space-y-3">
            {targetIps.map((target, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-xs">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    IPv4 address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={target.ip}
                    onChange={(e) => handleTargetIpChange(idx, "ip", e.target.value)}
                    placeholder="192.168.1.10"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Port</label>
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={target.port}
                    onChange={(e) => handleTargetIpChange(idx, "port", e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                  />
                </div>
                {targetIps.length > 1 && (
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemoveTargetIp(idx)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="px-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: VPC Association */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          VPCs that use this rule - <span className="font-normal text-gray-500">optional</span>
        </h2>
        <p className="text-xs text-gray-500">
          Associate a VPC now so queries originating from that VPC are evaluated against this rule. You can also associate additional VPCs later.
        </p>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">VPC</label>
          <select
            value={vpcIdToAssociate}
            onChange={(e) => setVpcIdToAssociate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
          >
            <option value="">Do not associate a VPC now</option>
            {vpcs.map((vpc) => (
              <option key={vpc.vpcId} value={vpc.vpcId}>
                {vpc.vpcId} {vpc.name ? `(${vpc.name})` : ""} - CIDR: {vpc.cidrBlock || "-"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 5: Tags */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Tags - optional</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              A tag is a label that you assign to an AWS resource.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
          >
            Add tag
          </button>
        </div>

        {tags.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No tags added.</p>
        ) : (
          <div className="space-y-2">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs">
                <input
                  type="text"
                  placeholder="Key"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#ec7211]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <Link
          href="/route53/resolver/rules"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="inline-flex items-center px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded shadow-sm"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="px-5 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold rounded shadow-sm disabled:opacity-50"
        >
          {loading ? "Creating rule..." : "Submit"}
        </button>
      </div>
    </form>
  );
}
