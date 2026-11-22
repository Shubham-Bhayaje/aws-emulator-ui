"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCustomerGatewayAction } from "../../vpn-actions";

export default function CreateCustomerGatewayClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [bgpAsn, setBgpAsn] = useState<number>(65000);
  const [ipAddress, setIpAddress] = useState("");
  const [certificateArn, setCertificateArn] = useState("");
  const [deviceName, setDeviceName] = useState("");

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
    if (!ipAddress.trim()) {
      setError("Please specify a public IP address for your customer gateway.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createCustomerGatewayAction({
        ipAddress: ipAddress.trim(),
        bgpAsn: Number(bgpAsn) || 65000,
        name: name.trim() || undefined,
        certificateArn: certificateArn.trim() || undefined,
        deviceName: deviceName.trim() || undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.customerGatewayId) {
        router.push(`/vpc/customer-gateways/${res.customerGatewayId}`);
      } else {
        setError(res.error || "Failed to create customer gateway");
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
        <Link href="/vpc/customer-gateways" className="hover:text-[#0073bb]">
          Customer gateways
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create customer gateway</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create customer gateway</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A customer gateway provides information to AWS about your customer gateway device or software application.
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
            Customer gateway settings
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
              placeholder="e.g. corporate-hq-router"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* BGP ASN */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              BGP ASN <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              For dynamic routing, specify your on-premises router&apos;s Border Gateway Protocol (BGP) Autonomous System Number (ASN). Default is 65000.
            </p>
            <input
              type="number"
              min={1}
              max={4294967294}
              value={bgpAsn}
              onChange={(e) => setBgpAsn(Number(e.target.value))}
              required
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* IP address */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              IP address <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The internet-routable static IP address for the customer gateway&apos;s external interface.
            </p>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              required
              placeholder="e.g. 203.0.113.12"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Certificate ARN */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Certificate ARN <span className="text-gray-400 font-normal">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The Amazon Resource Name (ARN) of the customer gateway certificate if you are using private certificate authentication.
            </p>
            <input
              type="text"
              value={certificateArn}
              onChange={(e) => setCertificateArn(e.target.value)}
              placeholder="arn:aws:acm:us-east-1:000000000000:certificate/..."
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Device name */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Device <span className="text-gray-400 font-normal">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              A name for the customer gateway device (e.g., Cisco ISR, Juniper SRX, FortiGate).
            </p>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. Cisco ISR 4331"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
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
            href="/vpc/customer-gateways"
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
            {loading ? "Creating..." : "Create customer gateway"}
          </button>
        </div>
      </form>
    </div>
  );
}
