"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ElasticIpItem,
  VpcItem,
  releaseElasticIpAction,
} from "../../actions";

interface Props {
  elasticIp: ElasticIpItem;
  vpcs: VpcItem[];
}

export default function ElasticIpDetailClient({
  elasticIp: initialEip,
}: Props) {
  const router = useRouter();

  const [eip] = useState<ElasticIpItem>(initialEip);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Actions dropdown
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // Release modal
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [releaseLoading, setDeleteLoading] = useState(false);

  const handleRelease = async () => {
    setDeleteLoading(true);
    setMessage(null);
    try {
      const res = await releaseElasticIpAction(eip.AllocationId);
      if (res.success) {
        setIsReleaseOpen(false);
        router.push("/vpc/elastic-ips");
      } else {
        setMessage({ type: "error", text: res.error || "Failed to release Elastic IP address" });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const isAssociated = Boolean(eip.AssociationId || eip.InstanceId || eip.NetworkInterfaceId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-2 text-[12px] text-[#545b64]">
        <Link href="/vpc/vpcs" className="hover:text-[#0073bb]">
          Virtual Private Cloud
        </Link>
        <span>&gt;</span>
        <Link href="/vpc/elastic-ips" className="hover:text-[#0073bb]">
          Elastic IP addresses
        </Link>
        <span>&gt;</span>
        <span className="text-[#16191f] font-mono font-medium">{eip.AllocationId}</span>
      </div>

      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{eip.PublicIp}</h1>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                isAssociated
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {isAssociated ? "Associated" : "Allocated"}
            </span>
          </div>
          <p className="text-[13px] text-[#545b64] mt-1 font-mono">{eip.AllocationId}</p>
        </div>

        <div className="flex items-center gap-2 relative">
          <Link
            href="/vpc/elastic-ips"
            className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            View all Elastic IPs
          </Link>

          <div className="relative">
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-3 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] transition-colors flex items-center gap-1.5"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              <span>Actions</span>
              <span className="text-[10px]">▼</span>
            </button>

            {isActionsOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-20 py-1"
                onClick={() => setIsActionsOpen(false)}
              >
                <button
                  onClick={() => setIsReleaseOpen(true)}
                  className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Release Elastic IP address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-[13px] border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#eaeded]">
        <div className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "details"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("tags")}
            className={`pb-2.5 text-[14px] font-medium transition-colors border-b-2 ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Tags ({Object.keys(eip.Tags || {}).length})
          </button>
        </div>
      </div>

      {/* Tab: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-5">
            <h3 className="text-[15px] font-bold text-[#16191f] mb-4">Elastic IP summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <dt className="text-[#545b64] font-medium">Public IPv4 address</dt>
                <dd className="mt-1 font-mono text-[#16191f] font-semibold">{eip.PublicIp}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Allocation ID</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{eip.AllocationId}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Domain</dt>
                <dd className="mt-1 text-[#16191f]">{eip.Domain || "vpc"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Associated instance ID</dt>
                <dd className="mt-1">
                  {eip.InstanceId ? (
                    <Link
                      href={`/ec2/instances`}
                      className="text-[#0073bb] hover:underline font-mono"
                    >
                      {eip.InstanceId}
                    </Link>
                  ) : (
                    <span className="text-[#545b64]">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Association ID</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{eip.AssociationId || "-"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Network interface ID</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{eip.NetworkInterfaceId || "-"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Private IPv4 address</dt>
                <dd className="mt-1 font-mono text-[#16191f]">{eip.PrivateIpAddress || "-"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Network border group</dt>
                <dd className="mt-1 text-[#16191f]">{eip.NetworkBorderGroup || "us-east-1"}</dd>
              </div>

              <div>
                <dt className="text-[#545b64] font-medium">Reverse DNS record</dt>
                <dd className="mt-1 text-[#545b64]">-</dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded overflow-hidden">
          <div className="p-4 border-b border-[#eaeded]">
            <h3 className="text-[14px] font-bold text-[#16191f]">Tags</h3>
          </div>
          {eip.Tags && Object.keys(eip.Tags).length > 0 ? (
            <table className="min-w-full text-[13px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Key</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {Object.entries(eip.Tags).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-4 py-2 font-mono text-[#16191f]">{k}</td>
                    <td className="px-4 py-2 text-[#16191f]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-[13px] text-[#545b64]">No tags associated with this Elastic IP.</div>
          )}
        </div>
      )}

      {/* Release Confirmation Modal */}
      {isReleaseOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Release Elastic IP address?</h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to release Elastic IP address{" "}
              <span className="font-mono font-semibold text-[#16191f]">{eip.PublicIp}</span> (
              <span className="font-mono text-[#16191f]">{eip.AllocationId}</span>)?
            </p>
            <p className="text-[12px] text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
              When you release an Elastic IP address, it is released to the AWS IP pool and you may not be able to allocate it again.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReleaseOpen(false)}
                disabled={releaseLoading}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRelease}
                disabled={releaseLoading}
                className="px-4 text-[13px] font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              >
                {releaseLoading ? "Releasing..." : "Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
