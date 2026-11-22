"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTransitGatewayAction } from "../../transit-gateway-actions";

export default function CreateTransitGatewayClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [asn, setAsn] = useState<number>(64512);
  const [autoAcceptShared, setAutoAcceptShared] = useState(false);
  const [defaultAssociation, setDefaultAssociation] = useState(true);
  const [defaultPropagation, setDefaultPropagation] = useState(true);
  const [vpnEcmpSupport, setVpnEcmpSupport] = useState(true);
  const [dnsSupport, setDnsSupport] = useState(true);
  const [multicastSupport, setMulticastSupport] = useState(false);
  const [cidrBlock, setCidrBlock] = useState("");

  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    setError(null);

    try {
      const res = await createTransitGatewayAction({
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        amazonSideAsn: Number(asn) || 64512,
        autoAcceptSharedAttachments: autoAcceptShared ? "enable" : "disable",
        defaultRouteTableAssociation: defaultAssociation ? "enable" : "disable",
        defaultRouteTablePropagation: defaultPropagation ? "enable" : "disable",
        vpnEcmpSupport: vpnEcmpSupport ? "enable" : "disable",
        dnsSupport: dnsSupport ? "enable" : "disable",
        multicastSupport: multicastSupport ? "enable" : "disable",
        transitGatewayCidrBlocks: cidrBlock.trim() ? [cidrBlock.trim()] : undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.transitGatewayId) {
        router.push(`/vpc/transit-gateways/${res.transitGatewayId}`);
      } else {
        setError(res.error || "Failed to create transit gateway");
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
        <Link href="/vpc/transit-gateways" className="hover:text-[#0073bb]">
          Transit gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create transit gateway</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create transit gateway</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A transit gateway acts as a regional virtual router for traffic flowing between your virtual private clouds (VPCs) and on-premises networks.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General settings */}
        <div className="bg-white border border-[#eaeded] rounded p-5 space-y-4 shadow-xs">
          <h2 className="text-[15px] font-bold text-[#16191f]">Transit gateway settings</h2>

          <div>
            <label className="block text-[13px] font-medium text-[#16191f] mb-1">
              Name tag
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. corp-transit-hub"
              className="w-full sm:w-96 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Creates a tag with a key of &apos;Name&apos; and a value that you specify.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#16191f] mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Regional network transit gateway hub"
              className="w-full sm:w-96 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#16191f] mb-1">
              Amazon side Autonomous System Number (ASN)
            </label>
            <input
              type="number"
              value={asn}
              onChange={(e) => setAsn(Number(e.target.value))}
              min={64512}
              max={4294967294}
              required
              className="w-full sm:w-64 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] font-mono"
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Private 16-bit ASN in the range 64512 to 65534, or 32-bit ASN in the range 4200000000 to 4294967294. Default: 64512.
            </p>
          </div>
        </div>

        {/* Section 2: Route table settings */}
        <div className="bg-white border border-[#eaeded] rounded p-5 space-y-4 shadow-xs">
          <h2 className="text-[15px] font-bold text-[#16191f]">Route table settings</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultAssociation}
                onChange={(e) => setDefaultAssociation(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Default route table association
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Automatically associate attachments with the transit gateway default route table.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultPropagation}
                onChange={(e) => setDefaultPropagation(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Default route table propagation
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Automatically propagate attachment CIDRs into the transit gateway default route table.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Routing & Cross-account options */}
        <div className="bg-white border border-[#eaeded] rounded p-5 space-y-4 shadow-xs">
          <h2 className="text-[15px] font-bold text-[#16191f]">Cross-account sharing &amp; routing options</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAcceptShared}
                onChange={(e) => setAutoAcceptShared(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Auto accept shared attachments
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Automatically accept cross-account attachments requested via AWS RAM resource shares.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={vpnEcmpSupport}
                onChange={(e) => setVpnEcmpSupport(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  VPN ECMP support
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Enable Equal-cost multi-path (ECMP) routing for VPN connections.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dnsSupport}
                onChange={(e) => setDnsSupport(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  DNS support
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Enable the transit gateway to resolve public and private DNS hostnames across attached VPCs.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={multicastSupport}
                onChange={(e) => setMulticastSupport(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Multicast support
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Enable creation of multicast domains on this transit gateway.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Transit gateway CIDR blocks */}
        <div className="bg-white border border-[#eaeded] rounded p-5 space-y-4 shadow-xs">
          <h2 className="text-[15px] font-bold text-[#16191f]">Transit gateway CIDR blocks (Optional)</h2>
          <p className="text-[12px] text-[#545b64]">
            Specify private IPv4 or IPv6 CIDR blocks for this transit gateway. You can use these blocks for Transit Gateway Connect peers.
          </p>
          <div>
            <label className="block text-[13px] font-medium text-[#16191f] mb-1">IPv4 CIDR</label>
            <input
              type="text"
              value={cidrBlock}
              onChange={(e) => setCidrBlock(e.target.value)}
              placeholder="e.g. 10.50.0.0/24"
              className="w-full sm:w-80 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211] font-mono"
            />
          </div>
        </div>

        {/* Section 5: Tags */}
        <div className="bg-white border border-[#eaeded] rounded p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#16191f]">Tags</h2>
            <button
              type="button"
              onClick={handleAddTag}
              className="text-[12px] font-medium text-[#0073bb] hover:underline"
            >
              Add new tag
            </button>
          </div>
          <div className="space-y-2">
            {tags.map((tag, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={tag.key}
                  onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                  className="w-48 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={tag.value}
                  onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                  className="w-64 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
                {tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-xs text-red-600 hover:underline px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/vpc/transit-gateways"
            className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 text-[13px] font-medium text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create transit gateway"}
          </button>
        </div>
      </form>
    </div>
  );
}
