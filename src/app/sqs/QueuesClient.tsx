"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QueueSummary } from "./types";
import { deleteQueuesAction, purgeQueuesAction } from "./actions";

interface QueuesClientProps {
  initialQueues: QueueSummary[];
}

export default function QueuesClient({ initialQueues }: QueuesClientProps) {
  const router = useRouter();
  const [queues, setQueues] = useState<QueueSummary[]>(initialQueues);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [purgeConfirmInput, setPurgeConfirmInput] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredQueues = useMemo(() => {
    if (!searchQuery.trim()) return queues;
    const q = searchQuery.toLowerCase();
    return queues.filter((queue) => queue.name.toLowerCase().includes(q));
  }, [queues, searchQuery]);

  const selectedQueues = useMemo(() => {
    return queues.filter((q) => selectedUrls.has(q.url));
  }, [queues, selectedUrls]);

  const totalQueues = queues.length;
  const totalMessagesAvailable = queues.reduce(
    (acc, q) => acc + (q.messagesAvailable || 0),
    0
  );
  const totalMessagesInFlight = queues.reduce(
    (acc, q) => acc + (q.messagesInFlight || 0),
    0
  );

  function toggleSelectAll() {
    if (selectedUrls.size === filteredQueues.length && filteredQueues.length > 0) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredQueues.map((q) => q.url)));
    }
  }

  function toggleSelect(url: string) {
    const next = new Set(selectedUrls);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelectedUrls(next);
  }

  async function handlePurgeConfirm() {
    if (purgeConfirmInput.toLowerCase() !== "purge") return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const urlsToPurge = Array.from(selectedUrls);
    const res = await purgeQueuesAction(urlsToPurge);
    setIsProcessing(false);

    if (res.success) {
      setSuccessMessage(`Successfully purged messages from ${urlsToPurge.length} queue(s).`);
      setPurgeModalOpen(false);
      setPurgeConfirmInput("");
      setQueues((prev) =>
        prev.map((q) =>
          selectedUrls.has(q.url)
            ? { ...q, messagesAvailable: 0, messagesInFlight: 0, messagesDelayed: 0 }
            : q
        )
      );
      setSelectedUrls(new Set());
    } else {
      setErrorMessage(res.error || "Failed to purge queue(s).");
    }
  }

  async function handleDeleteConfirm() {
    if (deleteConfirmInput.toLowerCase() !== "delete") return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const urlsToDelete = Array.from(selectedUrls);
    const res = await deleteQueuesAction(urlsToDelete);
    setIsProcessing(false);

    if (res.success) {
      setSuccessMessage(`Successfully deleted ${urlsToDelete.length} queue(s).`);
      setDeleteModalOpen(false);
      setDeleteConfirmInput("");
      setQueues((prev) => prev.filter((q) => !selectedUrls.has(q.url)));
      setSelectedUrls(new Set());
    } else {
      setErrorMessage(res.error || "Failed to delete queue(s).");
    }
  }

  const singleSelectedQueue = selectedQueues.length === 1 ? selectedQueues[0] : null;

  return (
    <div className="space-y-6">
      {/* Page Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Queues</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Amazon SQS queues let you send, store, and receive messages between software components
            at any volume.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sqs/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create queue
          </Link>
        </div>
      </div>

      {/* Status Banners */}
      {successMessage && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[#1d8102] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#d13212] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Total Queues
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalQueues}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Messages Available
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {totalMessagesAvailable.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Messages in Flight
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {totalMessagesInFlight.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Filter queues"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[12px] text-[#545b64] hover:text-[#16191f] underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons (Strict 32px standard) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (singleSelectedQueue) {
                  router.push(
                    `/sqs/${encodeURIComponent(singleSelectedQueue.name)}?tab=send-receive`
                  );
                }
              }}
              disabled={!singleSelectedQueue}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border transition-colors ${
                singleSelectedQueue
                  ? "border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              Send and receive messages
            </button>

            <button
              onClick={() => {
                if (singleSelectedQueue) {
                  router.push(`/sqs/${encodeURIComponent(singleSelectedQueue.name)}/edit`);
                }
              }}
              disabled={!singleSelectedQueue}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border transition-colors ${
                singleSelectedQueue
                  ? "border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              Edit
            </button>

            <button
              onClick={() => {
                setPurgeConfirmInput("");
                setPurgeModalOpen(true);
              }}
              disabled={selectedUrls.size === 0}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedUrls.size > 0
                  ? "border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa]"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              Purge
            </button>

            <button
              onClick={() => {
                setDeleteConfirmInput("");
                setDeleteModalOpen(true);
              }}
              disabled={selectedUrls.size === 0}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border transition-colors ${
                selectedUrls.size > 0
                  ? "border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2]"
                  : "border-[#d5dbdb] text-[#aab7b8] bg-[#f2f3f3] cursor-not-allowed"
              }`}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Queues Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <th className="py-2.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredQueues.length > 0 &&
                      selectedUrls.size === filteredQueues.length
                    }
                    onChange={toggleSelectAll}
                    className="accent-[#ec7211] rounded"
                  />
                </th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4 text-right">Messages available</th>
                <th className="py-2.5 px-4 text-right">Messages in flight</th>
                <th className="py-2.5 px-4 text-right">Messages delayed</th>
                <th className="py-2.5 px-4">Encryption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="text-[16px] font-bold text-[#16191f]">No queues found</div>
                      <p className="text-[13px] text-[#545b64] leading-relaxed">
                        You do not have any Amazon SQS queues in this Region. Create a queue to
                        start sending and processing asynchronous messages.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/sqs/create"
                          style={{
                            height: "32px",
                            minHeight: "32px",
                            maxHeight: "32px",
                            whiteSpace: "nowrap",
                          }}
                          className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                        >
                          Create queue
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((queue) => {
                  const isSelected = selectedUrls.has(queue.url);
                  return (
                    <tr
                      key={queue.url}
                      onClick={() => toggleSelect(queue.url)}
                      className={`cursor-pointer hover:bg-[#f2f8f8] transition-colors ${
                        isSelected ? "bg-[#f2f8f8]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(queue.url)}
                          className="accent-[#ec7211] rounded"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#0073bb] hover:underline">
                        <Link
                          href={`/sqs/${encodeURIComponent(queue.name)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {queue.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            queue.type === "FIFO"
                              ? "bg-[#e9f3f4] text-[#0073bb] border-[#0073bb]/30"
                              : "bg-[#f2f3f3] text-[#545b64] border-[#d5dbdb]"
                          }`}
                        >
                          {queue.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">{queue.created}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                        {queue.messagesAvailable.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                        {queue.messagesInFlight.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                        {queue.messagesDelayed.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-[#545b64]">
                        {queue.serverSideEncryption || "None"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#fafafa] border-t border-[#eaeded] text-[12px] text-[#545b64] flex items-center justify-between">
          <span>Showing {filteredQueues.length} of {queues.length} queues</span>
          {selectedUrls.size > 0 && (
            <span className="font-semibold text-[#16191f]">{selectedUrls.size} queue(s) selected</span>
          )}
        </div>
      </div>

      {/* Purge Queue Confirmation Modal */}
      {purgeModalOpen && selectedQueues.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Purge queue(s)</h2>
              <button
                onClick={() => setPurgeModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Purging deletes all messages in the selected queue(s) without deleting the queue
              itself. This action is irreversible.
            </p>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] space-y-1">
              <div className="font-semibold text-[#16191f]">
                Queues to purge ({selectedQueues.length}):
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[#545b64] max-h-32 overflow-y-auto">
                {selectedQueues.map((q) => (
                  <li key={q.url}>{q.name}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                To confirm purging all messages, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono font-normal text-[#16191f]">purge</code> below:
              </label>
              <input
                type="text"
                placeholder="purge"
                value={purgeConfirmInput}
                onChange={(e) => setPurgeConfirmInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setPurgeModalOpen(false)}
                disabled={isProcessing}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeConfirm}
                disabled={isProcessing || purgeConfirmInput.toLowerCase() !== "purge"}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                  purgeConfirmInput.toLowerCase() === "purge" && !isProcessing
                    ? "bg-[#ec7211] hover:bg-[#eb5f07]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isProcessing ? "Purging..." : "Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Queue Confirmation Modal */}
      {deleteModalOpen && selectedQueues.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Delete queue(s)</h2>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Deleting a queue permanently removes the queue and all messages inside it. This action
              cannot be undone.
            </p>

            <div className="bg-[#fdf3f2] border-l-4 border-[#d13212] p-3 text-[12px] text-[#545b64] space-y-1">
              <div className="font-bold text-[#d13212]">
                Queues to delete ({selectedQueues.length}):
              </div>
              <ul className="list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                {selectedQueues.map((q) => (
                  <li key={q.url}>{q.name}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono font-normal text-[#16191f]">delete</code> below:
              </label>
              <input
                type="text"
                placeholder="delete"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isProcessing}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isProcessing || deleteConfirmInput.toLowerCase() !== "delete"}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                  deleteConfirmInput.toLowerCase() === "delete" && !isProcessing
                    ? "bg-[#d13212] hover:bg-[#a82a0f]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isProcessing ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
