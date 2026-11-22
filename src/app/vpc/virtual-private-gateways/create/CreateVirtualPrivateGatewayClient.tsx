"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createVirtualPrivateGatewayAction } from "../../vpn-actions";

export default function CreateVirtualPrivateGatewayClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [asnType, setAsnType] = useState<"default" | "custom">("default");
  const [customAsn, setCustomAsn] = useState<number>(64512);

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

    const amazonSideAsn = asnType === "default" ? 64512 : Number(customAsn) || 64512;

    try {
      const res = await createVirtualPrivateGatewayAction({
        amazonSideAsn,
        name: name.trim() || undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.vpnGatewayId) {
        router.push(`/vpc/virtual-private-gateways/${res.vpnGatewayId}`);
      } else {
        setError(res.error || "Failed to create virtual private gateway");
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
        <Link href="/vpc/virtual-private-gateways" className="hover:text-[#0073bb]">
          Virtual private gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create virtual private gateway</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create virtual private gateway</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A virtual private gateway is the VPN concentrator on the Amazon side of the VPN connection.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Settings Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Virtual private gateway settings
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
              placeholder="e.g. corporate-hq-vgw"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Autonomous System Number (ASN) */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-2">
              Autonomous System Number (ASN)
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="asnType"
                  value="default"
                  checked={asnType === "default"}
                  onChange={() => setAsnType("default")}
                  className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <div>
                  <span className="text-[13px] font-medium text-[#16191f] block">
                    Amazon default ASN
                  </span>
                  <span className="text-[12px] text-[#545b64]">
                    Use the default Amazon-side ASN (64512).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="asnType"
                  value="custom"
                  checked={asnType === "custom"}
                  onChange={() => setAsnType("custom")}
                  className="mt-0.5 text-[#ec7211] focus:ring-[#ec7211]"
                />
                <div>
                  <span className="text-[13px] font-medium text-[#16191f] block">
                    Custom ASN
                  </span>
                  <span className="text-[12px] text-[#545b64]">
                    Specify a custom private ASN for your virtual private gateway.
                  </span>
                  {asnType === "custom" && (
                    <div className="mt-2">
                      <input
                        type="number"
                        min={64512}
                        max={4294967294}
                        value={customAsn}
                        onChange={(e) => setCustomAsn(Number(e.target.value))}
                        className="w-48 border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
                      />
                      <p className="text-[11px] text-[#545b64] mt-1">
                        Must be between 64512 and 65534, or 4200000000 and 4294967294.
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
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
            href="/vpc/virtual-private-gateways"
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
            {loading ? "Creating..." : "Create virtual private gateway"}
          </button>
        </div>
      </form>
    </div>
  );
}
