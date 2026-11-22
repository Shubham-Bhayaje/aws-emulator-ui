"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TransitGatewayItem, createTransitGatewayVpcAttachmentAction } from "../../transit-gateway-actions";
import { VpcItem, SubnetItem } from "../../actions";

interface Props {
  transitGateways: TransitGatewayItem[];
  vpcs: VpcItem[];
  subnets: SubnetItem[];
}

function CreateAttachmentForm({ transitGateways, vpcs, subnets }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTgwId = searchParams.get("tgwId") || (transitGateways.length > 0 ? transitGateways[0].TransitGatewayId : "");

  const [name, setName] = useState("");
  const [transitGatewayId, setTransitGatewayId] = useState(initialTgwId);
  const [attachmentType, setAttachmentType] = useState<"vpc" | "vpn" | "dxgw" | "connect" | "peering">("vpc");

  // VPC options
  const [vpcId, setVpcId] = useState(vpcs.length > 0 ? vpcs[0].VpcId : "");
  const [ipv6Support, setIpv6Support] = useState(false);
  const [applianceModeSupport, setApplianceModeSupport] = useState(false);
  const [selectedSubnetIds, setSelectedSubnetIds] = useState<Record<string, string>>({}); // az -> subnetId

  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group subnets for selected VPC by AZ
  const vpcSubnets = useMemo(() => {
    return subnets.filter((s) => s.VpcId === vpcId);
  }, [subnets, vpcId]);

  const azSubnetGroups = useMemo(() => {
    const groups: Record<string, SubnetItem[]> = {};
    for (const sub of vpcSubnets) {
      const az = sub.AvailabilityZone || "unknown-az";
      if (!groups[az]) groups[az] = [];
      groups[az].push(sub);
    }
    return groups;
  }, [vpcSubnets]);

  // Handle selecting a subnet for an AZ
  const handleSelectSubnetForAz = (az: string, subnetId: string) => {
    setSelectedSubnetIds((prev) => {
      const copy = { ...prev };
      if (copy[az] === subnetId) {
        delete copy[az];
      } else {
        copy[az] = subnetId;
      }
      return copy;
    });
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
    if (!transitGatewayId) {
      setError("Please select a transit gateway.");
      return;
    }

    if (attachmentType !== "vpc") {
      setError("Only VPC attachments are supported in this release.");
      return;
    }

    if (!vpcId) {
      setError("Please select a VPC.");
      return;
    }

    const subnetList = Object.values(selectedSubnetIds).filter(Boolean);
    if (subnetList.length === 0) {
      setError("Select at least one subnet for your VPC attachment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createTransitGatewayVpcAttachmentAction({
        transitGatewayId,
        vpcId,
        subnetIds: subnetList,
        name: name.trim() || undefined,
        ipv6Support: ipv6Support ? "enable" : "disable",
        applianceModeSupport: applianceModeSupport ? "enable" : "disable",
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.attachmentId) {
        router.push(`/vpc/transit-gateway-attachments/${res.attachmentId}`);
      } else {
        setError(res.error || "Failed to create transit gateway attachment");
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
        <Link href="/vpc/transit-gateway-attachments" className="hover:text-[#0073bb]">
          Transit gateway attachments
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create transit gateway attachment</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create transit gateway attachment</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          Attach a VPC, VPN, Direct Connect gateway, Connect, or Peering attachment to your transit gateway.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Transit gateway attachment settings
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
              placeholder="e.g. production-vpc-attachment"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Transit gateway ID */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Transit gateway ID <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The ID of the transit gateway for the attachment.
            </p>
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

          {/* Attachment type */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
              Attachment type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attachmentType"
                  value="vpc"
                  checked={attachmentType === "vpc"}
                  onChange={() => setAttachmentType("vpc")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">VPC</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="attachmentType"
                  value="vpn"
                  checked={attachmentType === "vpn"}
                  onChange={() => setAttachmentType("vpn")}
                  className="text-[#ec7211] focus:ring-[#ec7211]"
                />
                <span className="text-[13px] font-medium text-[#16191f]">VPN</span>
              </label>

              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input type="radio" name="attachmentType" disabled />
                <span className="text-[13px] text-gray-700">
                  Direct Connect gateway{" "}
                  <span className="text-[11px] text-gray-500">(Available after AWS Direct Connect is built)</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input type="radio" name="attachmentType" disabled />
                <span className="text-[13px] text-gray-700">
                  Connect <span className="text-[11px] text-gray-500">(Available after SD-WAN Connect is built)</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                <input type="radio" name="attachmentType" disabled />
                <span className="text-[13px] text-gray-700">
                  Peering Connection{" "}
                  <span className="text-[11px] text-gray-500">(Available after Inter-Region Peering is built)</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* VPN Attachment Guidance Card */}
        {attachmentType === "vpn" && (
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
              VPN attachment options
            </h2>
            <div className="p-4 bg-[#f1faff] border border-[#0073bb] rounded text-[13px] text-[#16191f] space-y-3">
              <p>
                To attach a Site-to-Site VPN connection to this transit gateway, create a VPN connection with Target gateway type set to Transit Gateway.
              </p>
              <div>
                <Link
                  href={`/vpc/vpn-connections/create${transitGatewayId ? `?tgw=${transitGatewayId}` : ""}`}
                  className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded shadow-sm"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Create Site-to-Site VPN Connection
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* VPC Attachment Details Card */}
        {attachmentType === "vpc" && (
          <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
              VPC attachment options
            </h2>

            {/* DNS Support */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="dnsSupport"
                checked={true}
                disabled
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div>
                <label htmlFor="dnsSupport" className="text-[13px] font-semibold text-[#16191f] block">
                  DNS support
                </label>
                <p className="text-[12px] text-[#545b64]">
                  Enable DNS resolution for VPCs attached to the transit gateway.
                </p>
              </div>
            </div>

            {/* IPv6 Support */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="ipv6Support"
                checked={ipv6Support}
                onChange={(e) => setIpv6Support(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div>
                <label htmlFor="ipv6Support" className="text-[13px] font-semibold text-[#16191f] block">
                  IPv6 support
                </label>
                <p className="text-[12px] text-[#545b64]">
                  Enable IPv6 support for this VPC attachment.
                </p>
              </div>
            </div>

            {/* Appliance Mode Support */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="applianceModeSupport"
                checked={applianceModeSupport}
                onChange={(e) => setApplianceModeSupport(e.target.checked)}
                className="mt-1 text-[#ec7211] focus:ring-[#ec7211]"
              />
              <div>
                <label htmlFor="applianceModeSupport" className="text-[13px] font-semibold text-[#16191f] block">
                  Appliance mode support
                </label>
                <p className="text-[12px] text-[#545b64]">
                  Enables traffic between a source and destination to be routed through the same Availability Zone for the life of a flow (stateful inspection firewalls).
                </p>
              </div>
            </div>

            {/* VPC selection */}
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                VPC ID <span className="text-red-500">*</span>
              </label>
              <p className="text-[12px] text-[#545b64] mb-2">
                Select the VPC you want to attach to your transit gateway.
              </p>
              {vpcs.length === 0 ? (
                <div className="p-3 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                  No VPCs found.{" "}
                  <Link href="/vpc/vpcs" className="text-[#0073bb] hover:underline">
                    Create a VPC
                  </Link>{" "}
                  first.
                </div>
              ) : (
                <select
                  value={vpcId}
                  onChange={(e) => {
                    setVpcId(e.target.value);
                    setSelectedSubnetIds({});
                  }}
                  required
                  className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] bg-white"
                >
                  {vpcs.map((v) => (
                    <option key={v.VpcId} value={v.VpcId}>
                      {v.Name ? `${v.Name} (${v.VpcId})` : v.VpcId} - {v.CidrBlock}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subnet selection */}
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Subnet IDs <span className="text-red-500">*</span>
              </label>
              <p className="text-[12px] text-[#545b64] mb-3">
                Select one subnet for each Availability Zone where you want the transit gateway to route traffic.
              </p>

              {Object.keys(azSubnetGroups).length === 0 ? (
                <div className="p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-[13px] text-gray-600">
                  No subnets found for this VPC. Please{" "}
                  <Link href="/vpc/subnets" className="text-[#0073bb] hover:underline">
                    create subnets
                  </Link>{" "}
                  in this VPC before attaching.
                </div>
              ) : (
                <div className="space-y-4 border border-gray-200 rounded p-4 bg-gray-50">
                  {Object.entries(azSubnetGroups).map(([az, azSubnets]) => (
                    <div key={az} className="bg-white border border-gray-200 rounded p-3">
                      <div className="text-[13px] font-bold text-gray-800 mb-2">
                        Availability Zone: <span className="font-mono text-[#0073bb]">{az}</span>
                      </div>
                      <div className="space-y-2">
                        {azSubnets.map((sub) => {
                          const isChecked = selectedSubnetIds[az] === sub.SubnetId;
                          return (
                            <label
                              key={sub.SubnetId}
                              className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-[12px] transition-colors ${
                                isChecked
                                  ? "bg-blue-50 border-[#0073bb] text-gray-900"
                                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleSelectSubnetForAz(az, sub.SubnetId)}
                                className="text-[#ec7211] focus:ring-[#ec7211]"
                              />
                              <span className="font-mono font-medium">{sub.SubnetId}</span>
                              {sub.Name && <span className="text-gray-500">({sub.Name})</span>}
                              <span className="text-gray-400">|</span>
                              <span className="font-mono text-gray-600">{sub.CidrBlock}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
            href="/vpc/transit-gateway-attachments"
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || transitGateways.length === 0}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create transit gateway attachment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateTransitGatewayAttachmentClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Loading form...</div>}>
      <CreateAttachmentForm {...props} />
    </Suspense>
  );
}
