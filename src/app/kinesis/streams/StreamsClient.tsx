"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StreamSummaryItem } from "../types";
import { deleteStreamAction } from "../actions";

interface StreamsClientProps {
  initialStreams: StreamSummaryItem[];
  totalShards: number;
  onDemandCount: number;
  encryptedCount: number;
  initialError?: string;
}

export default function StreamsClient({
  initialStreams,
  totalShards,
  onDemandCount,
  encryptedCount,
  initialError,
}: StreamsClientProps) {
  const router = useRouter();
  const [streams, setStreams] = useState<StreamSummaryItem[]>(initialStreams);
  const [selectedStreamName, setSelectedStreamName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Actions menu
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  // Lambda notice modal
  const [showLambdaModal, setShowLambdaModal] = useState(false);

  const filteredStreams = streams.filter((s) =>
    s.StreamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStream = streams.find((s) => s.StreamName === selectedStreamName);

  function handleDeleteStream() {
    if (!selectedStreamName || deleteInputText.trim().toLowerCase() !== "delete") return;
    setError(null);
    startDeleteTransition(async () => {
      const res = await deleteStreamAction(selectedStreamName);
      if (res.success) {
        setStreams(streams.filter((s) => s.StreamName !== selectedStreamName));
        setSuccessBanner(`Data stream '${selectedStreamName}' successfully deleted.`);
        setSelectedStreamName(null);
        setShowDeleteModal(false);
        setDeleteInputText("");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete data stream.");
      }
    });
  }

  function formatRetention(hours: number): string {
    const days = Math.floor(hours / 24);
    if (days >= 1 && hours % 24 === 0) {
      return `${hours} hours (${days} day${days > 1 ? "s" : ""})`;
    }
    return `${hours} hours`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#edf7ed] text-[#1d8102]">
            Active
          </span>
        );
      case "CREATING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#ebf5fb] text-[#0073bb]">
            Creating
          </span>
        );
      case "DELETING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fdf2f2] text-[#d13212]">
            Deleting
          </span>
        );
      case "UPDATING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef9e7] text-[#b7791f]">
            Updating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64]">
            {status}
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Notifications */}
      {successBanner && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] text-[#1d8102] p-4 rounded text-[13px] flex items-center justify-between">
          <div>{successBanner}</div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[12px] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] text-[#d13212] p-4 rounded text-[13px] flex items-center justify-between">
          <div>{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Data streams</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Amazon Kinesis Data Streams is a massively scalable and durable real-time data streaming service that captures gigabytes of data per second.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              disabled={!selectedStreamName}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border transition-colors ${
                selectedStreamName
                  ? "bg-white text-[#16191f] border-[#d5dbdb] hover:bg-[#fafafa]"
                  : "bg-[#f2f3f3] text-[#9ba2ab] border-[#eaeded] cursor-not-allowed"
              }`}
            >
              Actions
              <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showActionsDropdown && selectedStreamName && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-[#eaeded] rounded shadow-lg z-20 py-1 text-[13px]">
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setShowLambdaModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#16191f]"
                >
                  Process with AWS Lambda
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => {
                    setShowActionsDropdown(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f2f3f3] text-[#d13212]"
                >
                  Delete data stream
                </button>
              </div>
            )}
          </div>

          {/* Create Data Stream Button */}
          <Link
            href="/kinesis/streams/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
          >
            Create data stream
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Total Data Streams
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {streams.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Across this Region</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Open Shards
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {totalShards}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Provisioned stream capacity</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            On-Demand Streams
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {onDemandCount}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">Auto-scaling streams</div>
        </div>

        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">
            Encrypted Streams
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {encryptedCount}
          </div>
          <div className="text-[12px] text-[#545b64] mt-0.5">KMS encryption at rest</div>
        </div>
      </div>

      {/* Streams Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Table Search & Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Find data streams by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              className="w-full pl-3 pr-8 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#0073bb]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-xs text-[#545b64] hover:text-[#16191f]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.refresh()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              title="Refresh streams list"
            >
              <svg className="w-4 h-4 text-[#545b64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <span className="text-[12px] text-[#545b64]">
              Showing {filteredStreams.length} of {streams.length} data streams
            </span>
          </div>
        </div>

        {/* Table */}
        {filteredStreams.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">No data streams found</h3>
            <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
              You don&apos;t have any Amazon Kinesis data streams in this Region. To get started, create a data stream.
            </p>
            <div className="pt-2">
              <Link
                href="/kinesis/streams/create"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                Create data stream
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#16191f]">
              <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3">Data stream name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Capacity mode</th>
                  <th className="px-4 py-3">Open shards</th>
                  <th className="px-4 py-3">Retention period</th>
                  <th className="px-4 py-3">Encryption</th>
                  <th className="px-4 py-3">Creation time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredStreams.map((s) => {
                  const isSelected = selectedStreamName === s.StreamName;
                  return (
                    <tr
                      key={s.StreamName}
                      onClick={() => setSelectedStreamName(s.StreamName)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f1faff]" : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="radio"
                          name="selectedStream"
                          checked={isSelected}
                          onChange={() => setSelectedStreamName(s.StreamName)}
                          className="text-[#0073bb] focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/kinesis/streams/${encodeURIComponent(s.StreamName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-[#0073bb] hover:underline"
                        >
                          {s.StreamName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(s.StreamStatus)}</td>
                      <td className="px-4 py-3 font-medium">
                        {s.StreamMode === "ON_DEMAND" ? "On-demand" : "Provisioned"}
                      </td>
                      <td className="px-4 py-3">
                        {s.StreamMode === "ON_DEMAND" ? "—" : s.OpenShardCount}
                      </td>
                      <td className="px-4 py-3">{formatRetention(s.RetentionPeriodHours)}</td>
                      <td className="px-4 py-3">
                        {s.EncryptionType === "KMS" ? (
                          <span className="font-medium text-[#16191f]">AWS KMS</span>
                        ) : (
                          <span className="text-[#545b64]">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {s.StreamCreationTimestamp
                          ? new Date(s.StreamCreationTimestamp).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Data Stream Modal */}
      {showDeleteModal && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete data stream: {selectedStream.StreamName}?
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Deleting this data stream cannot be undone. All active shards and unread records in this stream will be permanently removed.
            </p>
            <div className="bg-[#fdf2f2] border border-[#d13212] p-3 rounded text-[12px] text-[#d13212]">
              To confirm deletion, type <strong className="font-bold">delete</strong> in the field below.
            </div>
            <div>
              <input
                type="text"
                placeholder="delete"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-3 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStream}
                disabled={isDeleting || deleteInputText.trim().toLowerCase() !== "delete"}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white ${
                  deleteInputText.trim().toLowerCase() === "delete" && !isDeleting
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#d13212]/50 cursor-not-allowed"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lambda Integration Modal */}
      {showLambdaModal && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Process with AWS Lambda
            </h3>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              AWS Lambda can automatically poll your data stream shards and invoke an execution handler function for batches of newly ingested records.
            </p>
            <div className="p-3 bg-[#f2f3f3] border border-[#eaeded] rounded space-y-1 text-[13px]">
              <div>
                <span className="text-[#545b64]">Target Stream ARN:</span>
                <div className="font-mono text-[12px] text-[#16191f] break-all">
                  {selectedStream.StreamARN}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLambdaModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-white text-[#16191f] border border-[#d5dbdb] hover:bg-[#fafafa]"
              >
                Close
              </button>
              <Link
                href="/lambda"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
              >
                Go to AWS Lambda
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
