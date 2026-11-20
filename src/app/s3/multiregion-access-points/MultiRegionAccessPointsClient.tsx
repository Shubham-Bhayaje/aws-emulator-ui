/**
 * src/app/s3/multiregion-access-points/MultiRegionAccessPointsClient.tsx
 * Authentic replica of AWS S3 Multi-Region Access Points console.
 * Cloudscape enterprise standard, zero emojis, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { S3MultiRegionAccessPoint } from "../types";
import {
  createMultiRegionAccessPointAction,
  deleteMultiRegionAccessPointAction,
} from "../actions";

interface MultiRegionAccessPointsClientProps {
  bucketNames?: string[];
  initialPoints?: S3MultiRegionAccessPoint[];
}

export function MultiRegionAccessPointsClient({
  bucketNames = [],
  initialPoints = [],
}: MultiRegionAccessPointsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [points, setPoints] = useState<S3MultiRegionAccessPoint[]>(initialPoints);
  const [showModal, setShowModal] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [mrapName, setMrapName] = useState("");
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  const [blockAllPublic, setBlockAllPublic] = useState(true);

  const toggleBucket = (bucket: string) => {
    if (selectedBuckets.includes(bucket)) {
      setSelectedBuckets(selectedBuckets.filter((b) => b !== bucket));
    } else {
      setSelectedBuckets([...selectedBuckets, bucket]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrapName.trim()) {
      setError("Multi-Region Access Point name is required.");
      return;
    }
    const cleanName = mrapName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await createMultiRegionAccessPointAction({
        name: cleanName,
        buckets: selectedBuckets,
        blockAllPublic,
      });

      if (res.success && res.point) {
        setPoints((prev) => [
          ...prev.filter((p) => p.name !== res.point!.name),
          res.point!,
        ]);
        setShowModal(false);
        setMrapName("");
        setSelectedBuckets([]);
        setInfo(`Multi-Region Access Point "${res.point.name}" created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create Multi-Region Access Point.");
      }
    });
  };

  const handleDelete = (name: string) => {
    if (!confirm(`Delete Multi-Region Access Point "${name}"?`)) return;

    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await deleteMultiRegionAccessPointAction(name);
      if (res.success) {
        setPoints((prev) => prev.filter((p) => p.name !== name));
        setInfo(`Multi-Region Access Point "${name}" deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete Multi-Region Access Point.");
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setInfo("Copied to clipboard.");
    setTimeout(() => setInfo(null), 2500);
  };

  const filtered = points.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb & Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
          <Link href="/s3" className="hover:underline text-[#0972d3]">
            Amazon S3
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#16191f]">Multi-Region Access Points</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
              Multi-Region Access Points ({points.length})
            </h1>
            <p className="text-[13px] text-[#545b64] mt-1 max-w-3xl">
              Amazon S3 Multi-Region Access Points provide a single global endpoint for routing
              application traffic to the dynamic lowest-latency copy of your data across multiple AWS
              Regions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create Multi-Region Access Point
          </button>
        </div>
      </div>

      {/* Alerts */}
      {info && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{info}</span>
          <button onClick={() => setInfo(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Info Callout */}
      <div className="bg-[#f2f8fd] border-l-4 border-[#0972d3] p-4 text-[13px] text-[#16191f] space-y-1">
        <div className="font-semibold text-[#0972d3]">Global accelerated endpoints</div>
        <p className="text-[#545b64]">
          Multi-Region Access Points use AWS Global Accelerator to route client traffic over the
          private AWS network to the nearest available S3 bucket.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Find Multi-Region Access Points"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[12px]">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Alias</th>
                <th className="p-3">Status</th>
                <th className="p-3">Buckets</th>
                <th className="p-3">Created</th>
                <th className="p-3">ARN</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#545b64]">
                    No Multi-Region Access Points found in this account.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.name} className="hover:bg-[#fbfbfb]">
                    <td className="p-3 font-semibold text-[#0972d3]">{p.name}</td>
                    <td className="p-3 font-mono text-[12px]">{p.alias}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#edfbf0] text-[#1d8102]">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#545b64]">
                      {p.buckets.length > 0 ? p.buckets.join(", ") : "0 buckets"}
                    </td>
                    <td className="p-3 text-[#545b64]">{p.createdAt}</td>
                    <td className="p-3 font-mono text-[11px] text-[#545b64] max-w-[200px] truncate" title={p.arn}>
                      {p.arn}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.arn)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
                        >
                          Copy ARN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.name)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed] transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Multi-Region Access Point */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Create Multi-Region Access Point
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Multi-Region Access Points provide a single global endpoint that routes traffic to S3 buckets across multiple AWS Regions.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Multi-Region Access Point name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. global-assets-mrap"
                  value={mrapName}
                  onChange={(e) => setMrapName(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
                <p className="text-[12px] text-[#545b64] mt-1">
                  Must be unique across your AWS account and contain only lowercase letters, numbers, and hyphens.
                </p>
              </div>

              {/* Bucket Selection */}
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Add buckets
                </label>
                <p className="text-[12px] text-[#545b64] mb-2">
                  Select one or more buckets to associate with this Multi-Region Access Point.
                </p>
                {bucketNames.length === 0 ? (
                  <div className="text-[12px] text-[#545b64] p-3 bg-[#fafafa] border border-[#eaeded] rounded">
                    No buckets found in this account. You can add buckets later.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto border border-[#eaeded] rounded divide-y divide-[#eaeded]">
                    {bucketNames.map((bucket) => (
                      <label
                        key={bucket}
                        className="flex items-center gap-2.5 p-2 text-[13px] hover:bg-[#fbfbfb] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBuckets.includes(bucket)}
                          onChange={() => toggleBucket(bucket)}
                          className="text-[#0972d3] rounded"
                        />
                        <span className="font-medium text-[#16191f]">{bucket}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Block Public Access */}
              <div className="p-3 border border-[#eaeded] rounded bg-[#fafafa] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-semibold text-[#16191f]">
                  <input
                    type="checkbox"
                    checked={blockAllPublic}
                    onChange={(e) => setBlockAllPublic(e.target.checked)}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Block all public access</span>
                </label>
                <p className="text-[12px] text-[#545b64] ml-5">
                  Turning this on blocks all public access to this Multi-Region Access Point.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  Create Multi-Region Access Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
