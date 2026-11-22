"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createDirectConnectGatewayAction } from "../../dx-actions";

export default function CreateDirectConnectGatewayClient() {
  const router = useRouter();

  const [gatewayName, setGatewayName] = useState("");
  const [asn, setAsn] = useState<number>(64512);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!gatewayName.trim()) {
      setError("Direct Connect gateway name is required.");
      return;
    }

    if (!asn || asn < 1 || asn > 4294967294) {
      setError("Please provide a valid Autonomous System Number (ASN).");
      return;
    }

    setLoading(true);
    try {
      const res = await createDirectConnectGatewayAction({
        directConnectGatewayName: gatewayName.trim(),
        amazonSideAsn: Number(asn),
      });

      if (res.success) {
        router.push("/direct-connect/gateways");
        router.refresh();
      } else {
        setError(res.error || "Failed to create Direct Connect gateway");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link href="/direct-connect" className="hover:text-[#0073bb]">
          Direct Connect
        </Link>
        <span>&gt;</span>
        <Link href="/direct-connect/gateways" className="hover:text-[#0073bb]">
          Direct Connect gateways
        </Link>
        <span>&gt;</span>
        <span className="text-gray-900 font-medium">Create Direct Connect gateway</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create Direct Connect gateway</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A Direct Connect gateway is a globally available resource used to connect your VPCs or Transit Gateways in any AWS Region (except China) to a Direct Connect location.
        </p>
      </div>

      {error && (
        <div className="p-3 text-[13px] rounded border bg-red-50 text-red-800 border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gateway settings card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-5">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b pb-2">
            Direct Connect gateway settings
          </h2>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Direct Connect gateway name <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The name for the Direct Connect gateway. Names can be up to 255 characters.
            </p>
            <input
              type="text"
              required
              value={gatewayName}
              onChange={(e) => setGatewayName(e.target.value)}
              placeholder="e.g. corporate-dx-gateway"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Amazon-side ASN */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Amazon-side ASN <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The Autonomous System Number (ASN) for the Amazon side of the BGP session. The range of valid values is 64512 to 65534 for 16-bit ASNs, or 4200000000 to 4294967294 for 32-bit ASNs. Default is 64512.
            </p>
            <input
              type="number"
              required
              value={asn}
              onChange={(e) => setAsn(Number(e.target.value))}
              placeholder="64512"
              className="w-full max-w-xs border border-gray-300 rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/direct-connect/gateways"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !gatewayName.trim()}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-4 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center transition-colors shadow-sm"
          >
            {loading ? "Creating..." : "Create Direct Connect gateway"}
          </button>
        </div>
      </form>
    </div>
  );
}
