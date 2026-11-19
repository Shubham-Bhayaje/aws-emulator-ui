/**
 * src/app/s3/BucketActions.tsx – S3 Buckets table and actions client component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBucket, emptyBucket } from "./actions";
import type { S3BucketSummary } from "./types";

interface BucketActionsProps {
  buckets: S3BucketSummary[];
}

export function BucketActions({ buckets }: BucketActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [emptyConfirmInput, setEmptyConfirmInput] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState<string | null>(null);

  const filteredBuckets = buckets.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filteredBuckets.length && filteredBuckets.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredBuckets.map((b) => b.name)));
    }
  };

  const handleCopyArn = () => {
    if (selected.size !== 1) return;
    const name = Array.from(selected)[0];
    const arn = `arn:aws:s3:::${name}`;
    navigator.clipboard.writeText(arn);
    setCopiedArn(arn);
    setTimeout(() => setCopiedArn(null), 2000);
  };

  const handleDelete = () => {
    if (selected.size !== 1) return;
    const bucketToDelete = Array.from(selected)[0];
    if (deleteConfirmInput !== bucketToDelete) {
      setError(`Please enter the bucket name "${bucketToDelete}" to confirm deletion.`);
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteBucket(bucketToDelete);
      if (res.success) {
        setSuccess(`Bucket "${bucketToDelete}" was successfully deleted.`);
        setShowDeleteModal(false);
        setDeleteConfirmInput("");
        setSelected(new Set());
        router.refresh();
      } else {
        setError(res.error || "Failed to delete bucket. The bucket must be empty first.");
      }
    });
  };

  const handleEmpty = () => {
    if (selected.size !== 1) return;
    const bucketToEmpty = Array.from(selected)[0];
    if (emptyConfirmInput !== "permanently delete") {
      setError('Please type "permanently delete" to confirm.');
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await emptyBucket(bucketToEmpty);
      if (res.success) {
        setSuccess(`All objects in bucket "${bucketToEmpty}" were permanently deleted.`);
        setShowEmptyModal(false);
        setEmptyConfirmInput("");
        router.refresh();
      } else {
        setError(res.error || "Failed to empty bucket.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="bg-[#edfbf0] border-l-4 border-[#1d8102] p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="underline text-[12px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
          {/* Search box */}
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <input
              type="text"
              placeholder="Find bucket by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white placeholder-[#879596]"
            />
          </div>

          {/* Action Buttons with 32px height standard */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyArn}
              disabled={selected.size !== 1}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copiedArn ? "Copied ARN" : "Copy ARN"}
            </button>

            <button
              onClick={() => {
                setEmptyConfirmInput("");
                setShowEmptyModal(true);
              }}
              disabled={selected.size !== 1 || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Empty
            </button>

            <button
              onClick={() => {
                setDeleteConfirmInput("");
                setShowDeleteModal(true);
              }}
              disabled={selected.size !== 1 || isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete
            </button>

            <Link
              href="/s3/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
            >
              Create bucket
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredBuckets.length > 0 && selected.size === filteredBuckets.length
                    }
                    onChange={toggleAll}
                    className="accent-[#0972d3] rounded"
                  />
                </th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">AWS Region</th>
                <th className="py-2.5 px-4">Access</th>
                <th className="py-2.5 px-4">Creation date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredBuckets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#545b64]">
                    <div className="font-semibold text-[#16191f] text-[14px] mb-1">
                      No buckets found
                    </div>
                    <p className="text-[13px] max-w-md mx-auto mb-4">
                      Buckets are containers for data stored in S3. Choose Create bucket to get
                      started.
                    </p>
                    <Link
                      href="/s3/create"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
                    >
                      Create bucket
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredBuckets.map((b) => (
                  <tr key={b.name} className="hover:bg-[#f2f8fd] transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(b.name)}
                        onChange={() => toggleSelect(b.name)}
                        className="accent-[#0972d3] rounded"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0972d3]">
                      <Link href={`/s3/${encodeURIComponent(b.name)}`} className="hover:underline">
                        {b.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{b.region}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          b.access.includes("not public")
                            ? "bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]"
                            : "bg-[#fbeeed] text-[#d13212] border border-[#f5b8ad]"
                        }`}
                      >
                        {b.access}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{b.created}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Delete Bucket */}
      {showDeleteModal && selected.size === 1 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete bucket: {Array.from(selected)[0]}
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Deleting a bucket is permanent. The bucket name will become available again after
              deletion. Buckets must be completely empty before they can be deleted.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                To confirm deletion, enter the name of the bucket in the field below:
              </label>
              <input
                type="text"
                placeholder={Array.from(selected)[0]}
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || deleteConfirmInput !== Array.from(selected)[0]}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#b02a0f] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Deleting..." : "Delete bucket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Empty Bucket */}
      {showEmptyModal && selected.size === 1 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Empty bucket: {Array.from(selected)[0]}
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Emptying a bucket will permanently delete all objects and object versions in the
              bucket. This action cannot be undone.
            </p>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                To confirm emptying, type <span className="font-bold text-[#d13212]">permanently delete</span> below:
              </label>
              <input
                type="text"
                placeholder="permanently delete"
                value={emptyConfirmInput}
                onChange={(e) => setEmptyConfirmInput(e.target.value)}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowEmptyModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmpty}
                disabled={isPending || emptyConfirmInput !== "permanently delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#b02a0f] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Emptying..." : "Empty bucket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
