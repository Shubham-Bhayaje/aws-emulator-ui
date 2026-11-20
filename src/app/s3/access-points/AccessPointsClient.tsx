/**
 * src/app/s3/access-points/AccessPointsClient.tsx – S3 Access Points Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { S3AccessPoint } from "../types";
import { createAccessPointAction, deleteAccessPointAction } from "../actions";

interface AccessPointsClientProps {
  bucketNames: string[];
  initialAccessPoints?: S3AccessPoint[];
}

export function AccessPointsClient({
  bucketNames,
  initialAccessPoints = [],
}: AccessPointsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [accessPoints, setAccessPoints] = useState<S3AccessPoint[]>(initialAccessPoints);
  const [showModal, setShowModal] = useState(false);
  const [apName, setApName] = useState("");
  const [targetBucket, setTargetBucket] = useState(bucketNames[0] || "");
  const [networkType, setNetworkType] = useState<"Internet" | "VPC">("Internet");
  const [vpcId, setVpcId] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apName.trim() || !targetBucket) return;

    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await createAccessPointAction({
        name: apName.trim().toLowerCase(),
        bucket: targetBucket,
        networkOrigin: networkType,
        vpcId: networkType === "VPC" ? vpcId.trim() || "vpc-default" : undefined,
      });

      if (res.success && res.accessPoint) {
        setAccessPoints((prev) => [
          ...prev.filter((p) => p.name !== res.accessPoint!.name),
          res.accessPoint!,
        ]);
        setShowModal(false);
        setApName("");
        setVpcId("");
        setInfo(`Access point "${res.accessPoint.name}" created for bucket "${targetBucket}".`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create access point.");
      }
    });
  };

  const handleDelete = (name: string) => {
    if (!confirm(`Delete access point "${name}"?`)) return;

    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await deleteAccessPointAction(name);
      if (res.success) {
        setAccessPoints((prev) => prev.filter((p) => p.name !== name));
        setInfo(`Access point "${name}" deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete access point.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
            Access Points ({accessPoints.length})
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            Amazon S3 access points are unique hostnames that clients use to access S3 buckets. Each
            access point has dedicated access policies and network controls (Internet or VPC).
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create access point
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {info && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{info}</span>
          <button onClick={() => setInfo(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Access Points Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold text-[12px]">
                <th className="py-2.5 px-4">Access point name</th>
                <th className="py-2.5 px-4">Bucket</th>
                <th className="py-2.5 px-4">Network origin</th>
                <th className="py-2.5 px-4">VPC ID</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {accessPoints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#545b64]">
                    <div className="font-semibold text-[#16191f] text-[14px] mb-1">
                      No access points found
                    </div>
                    <p className="text-[13px] max-w-md mx-auto mb-4">
                      Create an access point to configure distinct access permissions and network
                      origins for applications sharing a single bucket.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                    >
                      Create access point
                    </button>
                  </td>
                </tr>
              ) : (
                accessPoints.map((ap) => (
                  <tr key={ap.name} className="hover:bg-[#f2f8fd]">
                    <td className="py-3 px-4 font-semibold text-[#16191f]">{ap.name}</td>
                    <td className="py-3 px-4 font-mono text-[#0972d3]">
                      <Link href={`/s3/${ap.bucket}`} className="hover:underline">
                        {ap.bucket}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{ap.networkOrigin}</td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                      {ap.vpcId || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edfbf0] text-[#1d8102] border border-[#a4e2b0]">
                        {ap.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{ap.creationDate}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(ap.name)}
                        disabled={isPending}
                        className="text-[#d13212] hover:underline text-[12px] font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create access point</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Access point name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. analytics-reader-ap"
                  value={apName}
                  onChange={(e) => setApName(e.target.value.toLowerCase())}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] font-mono"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Target bucket
                </label>
                <select
                  value={targetBucket}
                  onChange={(e) => setTargetBucket(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white font-mono"
                >
                  {bucketNames.map((bn) => (
                    <option key={bn} value={bn}>
                      {bn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Network origin
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="net"
                      checked={networkType === "Internet"}
                      onChange={() => setNetworkType("Internet")}
                      className="text-[#0972d3]"
                    />
                    <span>Internet (Accessible from any public endpoint)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                    <input
                      type="radio"
                      name="net"
                      checked={networkType === "VPC"}
                      onChange={() => setNetworkType("VPC")}
                      className="text-[#0972d3]"
                    />
                    <span>Virtual Private Cloud (VPC)</span>
                  </label>
                </div>
              </div>

              {networkType === "VPC" && (
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    VPC ID
                  </label>
                  <input
                    type="text"
                    placeholder="vpc-0123456789abcdef0"
                    value={vpcId}
                    onChange={(e) => setVpcId(e.target.value)}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                  />
                </div>
              )}

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
                  disabled={isPending}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
                >
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
