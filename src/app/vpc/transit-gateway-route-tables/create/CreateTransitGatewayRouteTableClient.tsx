"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TransitGatewayItem,
  createTransitGatewayRouteTableAction,
} from "../../transit-gateway-actions";

interface Props {
  transitGateways: TransitGatewayItem[];
}

function CreateRouteTableForm({ transitGateways }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTgwId = searchParams.get("tgwId") || (transitGateways.length > 0 ? transitGateways[0].TransitGatewayId : "");

  const [name, setName] = useState("");
  const [transitGatewayId, setTransitGatewayId] = useState(initialTgwId);
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
    if (!transitGatewayId) {
      setError("Please select a transit gateway.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createTransitGatewayRouteTableAction({
        transitGatewayId,
        name: name.trim() || undefined,
        tags: tags.filter((t) => t.key.trim()),
      });

      if (res.success && res.routeTableId) {
        router.push(`/vpc/transit-gateway-route-tables/${res.routeTableId}`);
      } else {
        setError(res.error || "Failed to create transit gateway route table");
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
        <Link href="/vpc/transit-gateway-route-tables" className="hover:text-[#0073bb]">
          Transit gateway route tables
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-medium">Create transit gateway route table</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create transit gateway route table</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          A transit gateway route table determines where network traffic from an attachment is directed.
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
            Transit gateway route table settings
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
              placeholder="e.g. production-tgw-rtb"
              className="w-full max-w-lg border border-gray-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Transit gateway ID */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              Transit gateway ID <span className="text-red-500">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The ID of the transit gateway with which to associate this route table.
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
            href="/vpc/transit-gateway-route-tables"
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
            {loading ? "Creating..." : "Create transit gateway route table"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateTransitGatewayRouteTableClient(props: Props) {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Loading form...</div>}>
      <CreateRouteTableForm {...props} />
    </Suspense>
  );
}
