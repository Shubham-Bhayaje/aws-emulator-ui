/**
 * BucketActions – Client component for bucket selection, delete, empty.
 * Renders the table with checkboxes and action buttons.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBucket, emptyBucket } from "./actions";

type Bucket = { name: string; created: string };

export function BucketActions({ buckets }: { buckets: Bucket[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleSelect(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === buckets.length) setSelected(new Set());
    else setSelected(new Set(buckets.map((b) => b.name)));
  }

  async function handleDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} bucket(s)? Buckets must be empty.`)) return;
    setLoading(true);
    setError(null);
    for (const name of selected) {
      const result = await deleteBucket(name);
      if (result?.error) {
        setError(`Failed to delete "${name}": ${result.error}`);
        setLoading(false);
        return;
      }
    }
    setSelected(new Set());
    setLoading(false);
    router.refresh();
  }

  async function handleEmpty() {
    if (selected.size === 0) return;
    if (!confirm(`Empty ${selected.size} bucket(s)? All objects will be deleted.`)) return;
    setLoading(true);
    setError(null);
    for (const name of selected) {
      const result = await emptyBucket(name);
      if (result?.error) {
        setError(`Failed to empty "${name}": ${result.error}`);
        setLoading(false);
        return;
      }
    }
    setSelected(new Set());
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-3 text-[13px] text-[#d13212] flex items-center gap-2">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
        {/* Table toolbar */}
        <div className="px-4 py-2.5 border-b border-[#eaeded] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[14px] font-bold text-[#16191f]">
              Buckets ({buckets.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEmpty}
              disabled={selected.size === 0 || loading}
              className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Empty
            </button>
            <button
              onClick={handleDelete}
              disabled={selected.size === 0 || loading}
              className="px-3 py-[4px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete
            </button>
            <Link
              href="/s3/create"
              className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] inline-block"
            >
              Create bucket
            </Link>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#eaeded] text-left text-[#545b64]">
              <th className="py-2 px-4 w-8 font-medium">
                <input
                  type="checkbox"
                  checked={buckets.length > 0 && selected.size === buckets.length}
                  onChange={toggleAll}
                  className="accent-[#0073bb]"
                />
              </th>
              <th className="py-2 px-4 font-medium">Name</th>
              <th className="py-2 px-4 font-medium">AWS Region</th>
              <th className="py-2 px-4 font-medium">Creation date</th>
            </tr>
          </thead>
          <tbody>
            {buckets.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#545b64]">
                  No buckets found. Choose <strong>Create bucket</strong> to get started.
                </td>
              </tr>
            ) : (
              buckets.map((b) => (
                <tr key={b.name} className="border-b border-[#eaeded] hover:bg-[#f2f8fd]">
                  <td className="py-2 px-4">
                    <input
                      type="checkbox"
                      checked={selected.has(b.name)}
                      onChange={() => toggleSelect(b.name)}
                      className="accent-[#0073bb]"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <Link
                      href={`/s3/${b.name}`}
                      className="text-[#0073bb] hover:text-[#ec7211] hover:underline"
                    >
                      {b.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 text-[#545b64]">us-east-1</td>
                  <td className="py-2 px-4 text-[#545b64]">{b.created}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
