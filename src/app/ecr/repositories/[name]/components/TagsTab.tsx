"use client";

import { useState, useTransition } from "react";
import { tagResourceAction, untagResourceAction } from "../../../actions";

interface TagsTabProps {
  resourceArn: string;
  initialTags: { Key: string; Value: string }[];
  onRefresh: () => void;
}

export default function TagsTab({
  resourceArn,
  initialTags,
  onRefresh,
}: TagsTabProps) {
  const [tags, setTags] = useState(initialTags);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTags, setEditTags] = useState<{ Key: string; Value: string }[]>(initialTags);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddRow() {
    setEditTags([...editTags, { Key: "", Value: "" }]);
  }

  function handleRemoveRow(idx: number) {
    setEditTags(editTags.filter((_, i) => i !== idx));
  }

  function handleUpdateRow(idx: number, field: "Key" | "Value", val: string) {
    const next = [...editTags];
    next[idx][field] = val;
    setEditTags(next);
  }

  function handleSaveTags() {
    setError(null);
    startTransition(async () => {
      // Find deleted keys
      const currentKeys = new Set(editTags.map((t) => t.Key.trim()).filter(Boolean));
      const removedKeys = tags
        .map((t) => t.Key)
        .filter((k) => !currentKeys.has(k));

      // Remove deleted keys
      if (removedKeys.length > 0) {
        await untagResourceAction(resourceArn, removedKeys);
      }

      // Add/update valid tags
      const validTags = editTags.filter((t) => t.Key.trim() !== "");
      if (validTags.length > 0) {
        const res = await tagResourceAction(resourceArn, validTags);
        if (!res.success) {
          setError(res.error || "Failed to update tags.");
          return;
        }
      }

      setTags(validTags);
      setShowEditModal(false);
      onRefresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[13px]">
          {error}
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#16191f]">Tags</h3>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Tags are metadata assigned to your repository for cost tracking and organizational grouping.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditTags(tags.length > 0 ? tags : [{ Key: "", Value: "" }]);
            setShowEditModal(true);
          }}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
        >
          Manage tags
        </button>
      </div>

      {/* Tags Table / Empty State */}
      {tags.length === 0 ? (
        <div className="p-8 text-center text-[#545b64] bg-white border border-[#d5dbdb] rounded-sm text-[13px]">
          No tags are currently assigned to this repository. Click "Manage tags" to add labels.
        </div>
      ) : (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {tags.map((t) => (
                <tr key={t.Key}>
                  <td className="px-4 py-2.5 font-medium text-[#16191f] font-mono">{t.Key}</td>
                  <td className="px-4 py-2.5 text-[#545b64] font-mono">{t.Value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manage Tags Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-[600px] w-full border border-[#d5dbdb] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
              <h2 className="text-[17px] font-bold text-[#16191f]">Manage tags</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
              >
                x
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
              <div className="flex items-center justify-between">
                <p className="text-[#545b64]">Add, edit, or remove key-value tags.</p>
                <button
                  type="button"
                  onClick={handleAddRow}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[12px] font-semibold text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Add new tag
                </button>
              </div>

              <div className="space-y-2">
                {editTags.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={t.Key}
                      onChange={(e) => handleUpdateRow(idx, "Key", e.target.value)}
                      placeholder="Key"
                      className="w-1/2 px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
                    />
                    <input
                      type="text"
                      value={t.Value}
                      onChange={(e) => handleUpdateRow(idx, "Value", e.target.value)}
                      placeholder="Value"
                      className="w-1/2 px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-[#d13212] hover:text-[#a8250c] text-[12px] font-bold px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#eaeded] bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTags}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save tags"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
