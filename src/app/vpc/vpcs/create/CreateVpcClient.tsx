"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createVpcAction, createVpcAndMoreAction } from "../../actions";

export default function CreateVpcClient() {
  const router = useRouter();

  const [mode, setMode] = useState<"vpc-only" | "vpc-and-more">("vpc-only");
  const [name, setName] = useState("");
  const [cidrBlock, setCidrBlock] = useState("10.0.0.0/16");
  const [tenancy, setTenancy] = useState<"default" | "dedicated">("default");

  // VPC and more settings
  const [azCount, setAzCount] = useState<number>(2);
  const [publicSubnetsCount, setPublicSubnetsCount] = useState<number>(2);
  const [privateSubnetsCount, setPrivateSubnetsCount] = useState<number>(2);

  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addTag = () => setTags([...tags, { key: "", value: "" }]);
  const updateTag = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };
  const removeTag = (index: number) => setTags(tags.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Validation
    const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]{1,2})$/;
    if (!cidrRegex.test(cidrBlock.trim())) {
      setErrorMessage("Please enter a valid IPv4 CIDR block (e.g. 10.0.0.0/16).");
      setLoading(false);
      return;
    }

    try {
      if (mode === "vpc-only") {
        const tagMap: Record<string, string> = {};
        tags.forEach((t) => {
          if (t.key.trim() && t.value.trim()) tagMap[t.key.trim()] = t.value.trim();
        });

        const res = await createVpcAction({
          name: name.trim() || undefined,
          cidrBlock: cidrBlock.trim(),
          tenancy,
          tags: tagMap,
        });

        if (res.success && res.vpcId) {
          router.push("/vpc/vpcs");
        } else {
          setErrorMessage(res.error || "Failed to create VPC.");
        }
      } else {
        // VPC and more
        const zones = ["us-east-1a", "us-east-1b", "us-east-1c"].slice(0, azCount);
        const res = await createVpcAndMoreAction({
          name: name.trim() || "demo-vpc",
          cidrBlock: cidrBlock.trim(),
          publicSubnetsCount,
          privateSubnetsCount,
          availabilityZones: zones,
        });

        if (res.success && res.vpcId) {
          router.push("/vpc/vpcs");
        } else {
          setErrorMessage(res.error || "Failed to provision VPC and resources.");
        }
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
          <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">Your VPCs</Link>
          <span>/</span>
          <span className="text-[#16191f]">Create VPC</span>
        </div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create VPC</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          A VPC is a logically isolated virtual network within your AWS account.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Mode selector */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">VPC settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 border rounded cursor-pointer transition-all flex flex-col justify-between ${
                mode === "vpc-only" ? "border-[#ec7211] bg-orange-50/20" : "border-[#d5dbdb] hover:border-gray-400"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vpcMode"
                    checked={mode === "vpc-only"}
                    onChange={() => setMode("vpc-only")}
                    className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span className="font-bold text-[14px] text-[#16191f]">VPC only</span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Creates just the VPC resource with the specified IPv4 CIDR block. You manually configure subnets and gateways later.
                </p>
              </div>
            </label>

            <label
              className={`p-4 border rounded cursor-pointer transition-all flex flex-col justify-between ${
                mode === "vpc-and-more" ? "border-[#ec7211] bg-orange-50/20" : "border-[#d5dbdb] hover:border-gray-400"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="vpcMode"
                    checked={mode === "vpc-and-more"}
                    onChange={() => setMode("vpc-and-more")}
                    className="h-4 w-4 text-[#ec7211] focus:ring-[#ec7211]"
                  />
                  <span className="font-bold text-[14px] text-[#16191f]">VPC and more</span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Visual generator that provisions subnets across Availability Zones, an Internet Gateway, and public route tables in one step.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: Name & CIDR */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">General configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Name tag
              </label>
              <input
                type="text"
                placeholder="e.g. my-production-vpc"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Creates a tag with a key of &apos;Name&apos; and a value that you specify.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                IPv4 CIDR block <span className="text-red-500">*</span>
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
                The allowed block size is between a /16 netmask (65,536 IP addresses) and /28 netmask (16 IP addresses).
              </p>
            </div>

            {mode === "vpc-only" && (
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Tenancy
                </label>
                <select
                  value={tenancy}
                  onChange={(e) => setTenancy(e.target.value as "default" | "dedicated")}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211] bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  <option value="default">Default</option>
                  <option value="dedicated">Dedicated</option>
                </select>
                <p className="text-[11px] text-[#545b64] mt-1">
                  Dedicated tenancy ensures all EC2 instances launched in this VPC run on dedicated, single-tenant hardware.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: VPC and more architecture controls */}
        {mode === "vpc-and-more" && (
          <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Subnet & Gateway Generation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Number of AZs
                </label>
                <select
                  value={azCount}
                  onChange={(e) => setAzCount(parseInt(e.target.value))}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Public subnets
                </label>
                <select
                  value={publicSubnetsCount}
                  onChange={(e) => setPublicSubnetsCount(parseInt(e.target.value))}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Private subnets
                </label>
                <select
                  value={privateSubnetsCount}
                  onChange={(e) => setPrivateSubnetsCount(parseInt(e.target.value))}
                  className="w-full px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>

            {/* Architecture Preview Box */}
            <div className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded space-y-2">
              <span className="font-bold text-[12px] text-[#16191f] block">Resources to be created:</span>
              <ul className="list-disc list-inside text-[12px] text-[#545b64] space-y-1">
                <li>1 VPC ({cidrBlock})</li>
                <li>{publicSubnetsCount} Public Subnets + {privateSubnetsCount} Private Subnets</li>
                <li>1 Internet Gateway attached to the VPC</li>
                <li>1 Public Route Table with route 0.0.0.0/0 to the Internet Gateway</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Tags */}
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
            href="/vpc/vpcs"
            className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] inline-flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create VPC"}
          </button>
        </div>
      </form>
    </div>
  );
}
