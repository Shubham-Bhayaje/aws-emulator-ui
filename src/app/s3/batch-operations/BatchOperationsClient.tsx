/**
 * src/app/s3/batch-operations/BatchOperationsClient.tsx
 * Authentic replica of AWS S3 Batch Operations console.
 * Cloudscape enterprise standard, zero emojis, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { S3BatchJob } from "../types";
import {
  createBatchJobAction,
  cancelBatchJobAction,
  deleteBatchJobAction,
} from "../actions";

interface BatchOperationsClientProps {
  initialJobs?: S3BatchJob[];
}

export function BatchOperationsClient({ initialJobs = [] }: BatchOperationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<S3BatchJob[]>(initialJobs);
  const [showModal, setShowModal] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState("");
  const [operation, setOperation] = useState("S3:Copy");
  const [priority, setPriority] = useState(10);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await createBatchJobAction({
        description: description.trim(),
        operation,
        priority: Number(priority) || 10,
      });

      if (res.success && res.job) {
        setJobs([res.job, ...jobs]);
        setShowModal(false);
        setDescription("");
        setInfo(`Batch job "${res.job.id}" created successfully.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create batch job.");
      }
    });
  };

  const handleCancelJob = (id: string) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await cancelBatchJobAction(id);
      if (res.success) {
        setJobs(
          jobs.map((j) => (j.id === id ? { ...j, status: "Cancelled" as const } : j))
        );
        setInfo(`Batch job "${id}" has been cancelled.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to cancel batch job.");
      }
    });
  };

  const handleDeleteJob = (id: string) => {
    if (!confirm(`Delete Batch job "${id}"?`)) return;

    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await deleteBatchJobAction(id);
      if (res.success) {
        setJobs(jobs.filter((j) => j.id !== id));
        setInfo(`Batch job "${id}" deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete batch job.");
      }
    });
  };

  const filtered = jobs.filter(
    (j) =>
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase())
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
          <span className="font-semibold text-[#16191f]">Batch Operations</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">
              Batch Operations jobs ({jobs.length})
            </h1>
            <p className="text-[13px] text-[#545b64] mt-1 max-w-3xl">
              Perform large-scale batch operations on Amazon S3 objects, such as copying objects,
              replacing object tags, modifying access control lists (ACLs), restoring objects from
              Glacier, or invoking AWS Lambda functions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
          >
            Create job
          </button>
        </div>
      </div>

      {/* Alert */}
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

      {/* Info Callout */}
      <div className="bg-[#f2f8fd] border-l-4 border-[#0972d3] p-4 text-[13px] text-[#16191f] space-y-1">
        <div className="font-semibold text-[#0972d3]">High-throughput automated jobs</div>
        <p className="text-[#545b64]">
          S3 Batch Operations can process millions or billions of objects in parallel using S3
          Inventory reports or CSV manifests as inputs.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] bg-[#fafafa]">
          <div className="max-w-md">
            <input
              type="text"
              placeholder="Filter jobs by ID or description"
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
                <th className="p-3">Job ID</th>
                <th className="p-3">Description</th>
                <th className="p-3">Operation</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Created</th>
                <th className="p-3">Completed</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#545b64]">
                    No Batch Operations jobs found in this account.
                  </td>
                </tr>
              ) : (
                filtered.map((j) => (
                  <tr key={j.id} className="hover:bg-[#fbfbfb]">
                    <td className="p-3 font-mono text-[12px] font-semibold text-[#0972d3]">{j.id}</td>
                    <td className="p-3 text-[#16191f]">{j.description}</td>
                    <td className="p-3 font-mono text-[12px] text-[#545b64]">{j.operation}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          j.status === "Active"
                            ? "bg-[#edfbf0] text-[#1d8102]"
                            : j.status === "Complete"
                            ? "bg-[#f2f8fd] text-[#0972d3]"
                            : "bg-[#f2f3f3] text-[#545b64]"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#545b64]">{j.priority}</td>
                    <td className="p-3 text-[#545b64]">{j.creationTime}</td>
                    <td className="p-3 text-[#545b64]">{j.completionTime || "—"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {j.status === "Active" && (
                          <button
                            type="button"
                            onClick={() => handleCancelJob(j.id)}
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd]"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(j.id)}
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[12px] px-3 rounded border border-[#d13212] bg-white text-[#d13212] hover:bg-[#fbeeed]"
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

      {/* MODAL: Create Batch Job */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-[18px] font-bold text-[#16191f]">Create Batch Operations job</h3>
            <p className="text-[13px] text-[#545b64]">
              Configure a large-scale automated job to perform actions across S3 objects.
            </p>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Operation
                </label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded bg-white"
                >
                  <option value="S3:Copy">Copy object (S3:Copy)</option>
                  <option value="S3:PutObjectTagging">Replace object tags (S3:PutObjectTagging)</option>
                  <option value="S3:PutObjectAcl">Replace access control lists (S3:PutObjectAcl)</option>
                  <option value="S3:RestoreObject">Restore objects from Glacier (S3:RestoreObject)</option>
                  <option value="Lambda:InvokeFunction">Invoke AWS Lambda function (Lambda:InvokeFunction)</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Copy audit logs to archive bucket"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Priority (1–10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-28 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded bg-white"
                />
                <p className="text-[12px] text-[#545b64] mt-1">
                  Higher priority numbers are processed first.
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
                  Create job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
