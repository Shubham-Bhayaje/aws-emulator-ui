"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VpcItem, createSubnetAction } from "../../actions";

interface Props {
  vpcs: VpcItem[];
}

export default function CreateSubnetClient({ vpcs }: Props) {
  const router = useRouter();

  const [selectedVpcId, setSelectedVpcId] = useState<string>(vpcs.length > 0 ? vpcs[0].VpcId : "");
  const [name, setName] = useState("");
  const [availabilityZone, setAvailabilityZone] = useState("us-east-1a");
  const [cidrBlock, setCidrBlock] = useState("10.0.1.0/24");

  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedVpc = vpcs.find((v) => v.VpcId === selectedVpcId);

  const addTag = () => setTags([...tags, { key: "", value: "" }]);
  const updateTag = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };
  const removeTag = (index: number) => setTags(tags.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVpcId) {
      setErrorMessage("Please select a VPC.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const tagMap: Record<string, string> = {};
      tags.forEach((t) => {
        if (t.key.trim() && t.value.trim()) tagMap[t.key.trim()] = t.value.trim();
      });

      const res = await createSubnetAction({
        vpcId: selectedVpcId,
        cidrBlock: cidrBlock.trim(),
        availabilityZone: availabilityZone || undefined,
        name: name.trim() || undefined,
        tags: tagMap,
      });

      if (res.success && res.subnetId) {
        router.push("/vpc/subnets");
      } else {
        setErrorMessage(res.error || "Failed to create subnet.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb & Title */}
      <div className="pb-2 border-b border-[#eaeded]">
        <div className="flex items-center gap-1.5 text-[12px] text-[#545b64] mb-1">
          <Link href="/vpc" className="hover:text-[#0073bb]">VPC</Link>
          <span>/</span>
          <Link href="/vpc/subnets" className="hover:text-[#0073bb]">Subnets</Link>
          <span>/</span>
          <span className="text-[#16191f]">Create subnet</span>
        </div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create subnet</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          Specify the VPC and IP address range for the new subnet.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VPC Selection */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">VPC</h2>
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              VPC ID <span className="text-red-500">*</span>
            </label>
            {vpcs.length === 0 ? (
              <div className="text-[13px] text-amber-700 bg-amber-50 p-3 border border-amber-200 rounded">
                No VPCs found in this Region. <Link href="/vpc/vpcs/create" className="text-[#0073bb] underline">Create a VPC first</Link>.
              </div>
            ) : (
              <select
                value={selectedVpcId}
                onChange={(e) => setSelectedVpcId(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {vpcs.map((v) => (
                  <option key={v.VpcId} value={v.VpcId}>
                    {v.VpcId} {v.Name ? `(${v.Name})` : ""} - {v.CidrBlock}
                  </option>
                ))}
              </select>
            )}
            {selectedVpc && (
              <p className="text-[11px] text-[#545b64] mt-1 font-mono">
                Associated IPv4 CIDRs: {selectedVpc.CidrBlock}
              </p>
            )}
          </div>
        </div>

        {/* Subnet Settings */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Subnet settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Subnet name
              </label>
              <input
                type="text"
                placeholder="e.g. public-subnet-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Availability Zone
              </label>
              <select
                value={availabilityZone}
                onChange={(e) => setAvailabilityZone(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                <option value="us-east-1a">us-east-1a</option>
                <option value="us-east-1b">us-east-1b</option>
                <option value="us-east-1c">us-east-1c</option>
                <option value="us-east-1d">us-east-1d</option>
                <option value="us-east-1f">us-east-1f</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                IPv4 subnet CIDR block <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cidrBlock}
                onChange={(e) => setCidrBlock(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] font-mono border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Must be a valid subnet of the parent VPC CIDR block (e.g. 10.0.1.0/24).
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags - optional</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource.
              </p>
            </div>
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add new tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-12 gap-2 text-[12px] font-semibold text-[#545b64]">
                <div className="col-span-5">Key</div>
                <div className="col-span-6">Value</div>
                <div className="col-span-1"></div>
              </div>
              {tags.map((tag, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Key"
                      value={tag.key}
                      onChange={(e) => updateTag(idx, "key", e.target.value)}
                      className="w-full px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Value"
                      value={tag.value}
                      onChange={(e) => updateTag(idx, "value", e.target.value)}
                      className="w-full px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="text-[12px] text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/vpc/subnets"
            className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] inline-flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || vpcs.length === 0}
            className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create subnet"}
          </button>
        </div>
      </form>
    </div>
  );
}
