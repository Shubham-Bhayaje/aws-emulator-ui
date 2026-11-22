"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VpcItem,
  createHttpNamespaceAction,
  createPrivateDnsNamespaceAction,
  createPublicDnsNamespaceAction,
} from "../../actions";

interface Props {
  vpcs: VpcItem[];
}

export default function CreateNamespaceClient({ vpcs }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [namespaceType, setNamespaceType] = useState<"HTTP" | "DNS_PRIVATE" | "DNS_PUBLIC">("DNS_PRIVATE");
  const [selectedVpcId, setSelectedVpcId] = useState<string>(vpcs[0]?.VpcId || "");

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    if (tags.length < 50) {
      setTags([...tags, { key: "", value: "" }]);
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const updateTag = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Namespace name is required.");
      return;
    }

    if (namespaceType === "DNS_PRIVATE" && !selectedVpcId) {
      setError("A VPC must be selected for a private DNS namespace.");
      return;
    }

    setLoading(true);
    setError(null);

    const tagMap: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagMap[t.key.trim()] = t.value.trim();
      }
    }

    try {
      let res;
      if (namespaceType === "HTTP") {
        res = await createHttpNamespaceAction({
          name: name.trim(),
          description: description.trim() || undefined,
          tags: Object.keys(tagMap).length > 0 ? tagMap : undefined,
        });
      } else if (namespaceType === "DNS_PRIVATE") {
        res = await createPrivateDnsNamespaceAction({
          name: name.trim(),
          vpcId: selectedVpcId,
          description: description.trim() || undefined,
          tags: Object.keys(tagMap).length > 0 ? tagMap : undefined,
        });
      } else {
        res = await createPublicDnsNamespaceAction({
          name: name.trim(),
          description: description.trim() || undefined,
          tags: Object.keys(tagMap).length > 0 ? tagMap : undefined,
        });
      }

      if (res.success) {
        router.push("/cloudmap/namespaces");
        router.refresh();
      } else {
        setError(res.error || "Failed to create namespace.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/cloudmap" className="hover:underline">
          AWS Cloud Map
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/cloudmap/namespaces" className="hover:underline">
          Namespaces
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Create namespace</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-[#eaeded]">
        <h1 className="text-[24px] font-bold text-[#16191f]">Create namespace</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          A namespace specifies the domain name for your service instances. You can discover instances using API calls or DNS queries.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Namespace Configuration */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f]">Namespace configuration</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Namespace name <span className="text-red-600">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              For DNS namespaces, specify a valid domain name, such as <code className="text-[#16191f] font-mono">example.com</code> or <code className="text-[#16191f] font-mono">corp.internal</code>.
              For HTTP namespaces, specify an alphanumeric string up to 1024 characters.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. backend.app.local"
              required
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[11px] font-normal text-[#545b64]">- optional</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Service discovery namespace for microservices"
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>
        </div>

        {/* Step 2: Instance Discovery Type */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Instance discovery</h2>
          <p className="text-[12px] text-[#545b64]">
            Select how you want applications and microservices to discover instances registered in this namespace.
          </p>

          <div className="space-y-3 pt-2">
            {/* Private DNS */}
            <label
              className={`block p-4 border rounded cursor-pointer transition-colors ${
                namespaceType === "DNS_PRIVATE"
                  ? "border-[#ec7211] bg-orange-50/20"
                  : "border-[#d5dbdb] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="namespaceType"
                  value="DNS_PRIVATE"
                  checked={namespaceType === "DNS_PRIVATE"}
                  onChange={() => setNamespaceType("DNS_PRIVATE")}
                  className="mt-1 accent-[#ec7211]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">
                    API calls and DNS queries in VPCs (Private DNS namespace)
                  </div>
                  <p className="text-[12px] text-[#545b64] mt-0.5">
                    Instances can be discovered by DNS queries within specified VPCs and by using the AWS Cloud Map API. Automatically provisions an Amazon Route 53 private hosted zone.
                  </p>
                </div>
              </div>
            </label>

            {/* Public DNS */}
            <label
              className={`block p-4 border rounded cursor-pointer transition-colors ${
                namespaceType === "DNS_PUBLIC"
                  ? "border-[#ec7211] bg-orange-50/20"
                  : "border-[#d5dbdb] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="namespaceType"
                  value="DNS_PUBLIC"
                  checked={namespaceType === "DNS_PUBLIC"}
                  onChange={() => setNamespaceType("DNS_PUBLIC")}
                  className="mt-1 accent-[#ec7211]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">
                    API calls and public DNS queries (Public DNS namespace)
                  </div>
                  <p className="text-[12px] text-[#545b64] mt-0.5">
                    Instances can be discovered by public DNS queries from anywhere on the internet and by using the AWS Cloud Map API. Automatically provisions an Amazon Route 53 public hosted zone.
                  </p>
                </div>
              </div>
            </label>

            {/* HTTP */}
            <label
              className={`block p-4 border rounded cursor-pointer transition-colors ${
                namespaceType === "HTTP"
                  ? "border-[#ec7211] bg-orange-50/20"
                  : "border-[#d5dbdb] hover:bg-[#fafafa]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="namespaceType"
                  value="HTTP"
                  checked={namespaceType === "HTTP"}
                  onChange={() => setNamespaceType("HTTP")}
                  className="mt-1 accent-[#ec7211]"
                />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">
                    API calls (HTTP namespace)
                  </div>
                  <p className="text-[12px] text-[#545b64] mt-0.5">
                    Instances can only be discovered by using the DiscoverInstances API operation. Route 53 DNS records are not created.
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* VPC selector when Private DNS is selected */}
          {namespaceType === "DNS_PRIVATE" && (
            <div className="mt-4 pt-4 border-t border-[#eaeded] space-y-2">
              <label className="block text-[13px] font-bold text-[#16191f]">
                VPC <span className="text-red-600">*</span>
              </label>
              <p className="text-[12px] text-[#545b64]">
                Select the Amazon VPC to associate with this private DNS namespace.
              </p>
              {vpcs.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                  No VPCs found in this Region. A VPC is required to create a private DNS namespace.
                </div>
              ) : (
                <select
                  value={selectedVpcId}
                  onChange={(e) => setSelectedVpcId(e.target.value)}
                  className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                >
                  {vpcs.map((vpc) => (
                    <option key={vpc.VpcId} value={vpc.VpcId}>
                      {vpc.VpcId} {vpc.CidrBlock ? `(${vpc.CidrBlock})` : ""} {vpc.IsDefault ? "- Default" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags - optional</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/cloudmap/namespaces"
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
            {loading ? "Creating..." : "Create namespace"}
          </button>
        </div>
      </form>
    </div>
  );
}
