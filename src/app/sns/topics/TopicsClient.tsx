"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopicSummary } from "../types";
import { deleteTopicAction } from "../actions";

interface TopicsClientProps {
  initialTopics: TopicSummary[];
}

export default function TopicsClient({ initialTopics }: TopicsClientProps) {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicSummary[]>(initialTopics);
  const [search, setSearch] = useState("");
  const [selectedArn, setSelectedArn] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedArn, setCopiedArn] = useState<string | null>(null);

  const selectedTopic = topics.find((t) => t.arn === selectedArn);

  const filteredTopics = topics.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.arn.toLowerCase().includes(q) ||
      (t.displayName && t.displayName.toLowerCase().includes(q))
    );
  });

  const totalTopics = topics.length;
  const standardTopics = topics.filter((t) => t.type === "Standard").length;
  const fifoTopics = topics.filter((t) => t.type === "FIFO").length;
  const totalSubscriptions = topics.reduce(
    (acc, t) => acc + t.subscriptionsConfirmed + t.subscriptionsPending,
    0
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedArn(text);
    setTimeout(() => setCopiedArn(null), 2000);
  }

  async function handleDeleteTopic() {
    if (!selectedTopic) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteTopicAction(selectedTopic.arn);
    setIsDeleting(false);

    if (res.success) {
      setTopics((prev) => prev.filter((t) => t.arn !== selectedTopic.arn));
      setSelectedArn(null);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    } else {
      setDeleteError(res.error || "Failed to delete topic");
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Topics</h1>
          <p className="text-[13px] text-[#545b64] mt-1">
            An Amazon SNS topic is a logical access point and communication channel. A topic can have multiple subscribers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sns/topics/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] transition-colors"
          >
            Create topic
          </Link>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
            Total Topics
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalTopics}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
            Standard Topics
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{standardTopics}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
            FIFO Topics
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{fifoTopics}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#545b64]">
            Total Subscriptions
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">{totalSubscriptions}</div>
        </div>
      </div>

      {/* Topics Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Filter topics by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedTopic) {
                  router.push(`/sns/topics/${encodeURIComponent(selectedTopic.arn)}`);
                }
              }}
              disabled={!selectedTopic}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              View details
            </button>

            <button
              onClick={() => {
                if (selectedTopic) {
                  router.push(`/sns/topics/${encodeURIComponent(selectedTopic.arn)}/edit`);
                }
              }}
              disabled={!selectedTopic}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Edit
            </button>

            <button
              onClick={() => {
                if (selectedTopic) {
                  router.push(`/sns/topics/${encodeURIComponent(selectedTopic.arn)}/publish`);
                }
              }}
              disabled={!selectedTopic}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Publish message
            </button>

            <button
              onClick={() => {
                setDeleteError(null);
                setDeleteConfirmText("");
                setShowDeleteModal(true);
              }}
              disabled={!selectedTopic}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d13212] rounded text-[13px] font-medium text-[#d13212] hover:bg-[#fdf3f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#f2f3f3] text-[11px] font-bold uppercase tracking-wider text-[#545b64] border-b border-[#eaeded]">
              <tr>
                <th className="w-10 px-4 py-2.5 text-center"></th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">ARN</th>
                <th className="px-4 py-2.5">Display name</th>
                <th className="px-4 py-2.5 text-right">Subscriptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-3">
                      <p className="font-semibold text-[14px]">No topics found</p>
                      <p className="text-[13px]">
                        You currently do not have any SNS topics in this Region. Create a topic to begin publishing and subscribing.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/sns/topics/create"
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          className="inline-flex items-center justify-center px-4 font-bold text-[13px] bg-[#ec7211] text-white rounded hover:bg-[#eb5f07] transition-colors"
                        >
                          Create topic
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic) => {
                  const isSelected = selectedArn === topic.arn;
                  return (
                    <tr
                      key={topic.arn}
                      onClick={() => setSelectedArn(topic.arn)}
                      className={`cursor-pointer hover:bg-[#f8f9fa] ${
                        isSelected ? "bg-[#f1faff]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedTopic"
                          checked={isSelected}
                          onChange={() => setSelectedArn(topic.arn)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        <Link
                          href={`/sns/topics/${encodeURIComponent(topic.arn)}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {topic.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            topic.type === "FIFO"
                              ? "bg-[#ede7f6] text-[#512da8] border-[#d1c4e9]"
                              : "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
                          }`}
                        >
                          {topic.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#545b64] font-mono text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[280px]" title={topic.arn}>
                            {topic.arn}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(topic.arn);
                            }}
                            className="text-[#0073bb] hover:text-[#005a9e] text-[11px] underline"
                          >
                            {copiedArn === topic.arn ? "Copied" : "Copy"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {topic.displayName || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {topic.subscriptionsConfirmed + topic.subscriptionsPending}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Count */}
        <div className="p-3 border-t border-[#eaeded] bg-[#fafafa] text-[12px] text-[#545b64]">
          Showing {filteredTopics.length} of {totalTopics} topics
        </div>
      </div>

      {/* Delete Topic Modal */}
      {showDeleteModal && selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-[18px] font-bold text-[#16191f]">
              Delete topic &ldquo;{selectedTopic.name}&rdquo;?
            </h3>

            <div className="p-3 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212] space-y-1">
              <p className="font-bold">Permanent deletion warning</p>
              <p>
                Deleting this topic is irreversible. All subscriptions attached to this topic will stop receiving published messages.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded bg-[#fdf3f1] border border-[#d13212] text-[13px] text-[#d13212]">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1.5 py-0.5 rounded font-mono font-bold text-[#16191f]">{selectedTopic.name}</code> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={selectedTopic.name}
                className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#d13212]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#d5dbdb] rounded text-[13px] font-medium text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={deleteConfirmText !== selectedTopic.name || isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] text-white rounded text-[13px] font-bold hover:bg-[#b02a0f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
