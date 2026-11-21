"use client";

import { useState, useTransition } from "react";
import {
  putLifecyclePolicyAction,
  deleteLifecyclePolicyAction,
} from "../../../actions";

interface LifecyclePolicyTabProps {
  repositoryName: string;
  initialLifecyclePolicyText?: string;
  onRefresh: () => void;
}

interface LifecycleRule {
  rulePriority: number;
  description?: string;
  selection: {
    tagStatus: "tagged" | "untagged" | "any";
    tagPatternList?: string[];
    tagPrefixList?: string[];
    countType: "sinceImagePushed" | "imageCountMoreThan";
    countUnit?: "days";
    countNumber: number;
  };
  action: {
    type: "expire";
  };
}

export default function LifecyclePolicyTab({
  repositoryName,
  initialLifecyclePolicyText,
  onRefresh,
}: LifecyclePolicyTabProps) {
  const [lifecycleText, setLifecycleText] = useState(initialLifecyclePolicyText || "");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(initialLifecyclePolicyText || "");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  let parsedRules: LifecycleRule[] = [];
  try {
    if (lifecycleText) {
      const parsed = JSON.parse(lifecycleText);
      parsedRules = parsed.rules || [];
    }
  } catch {
    parsedRules = [];
  }

  const samplePolicy = JSON.stringify(
    {
      rules: [
        {
          rulePriority: 1,
          description: "Expire untagged images older than 14 days",
          selection: {
            tagStatus: "untagged",
            countType: "sinceImagePushed",
            countUnit: "days",
            countNumber: 14,
          },
          action: {
            type: "expire",
          },
        },
      ],
    },
    null,
    2
  );

  function handleSave() {
    setJsonError(null);
    try {
      JSON.parse(editText);
    } catch (e: unknown) {
      setJsonError("Invalid JSON syntax: " + (e instanceof Error ? e.message : String(e)));
      return;
    }

    startTransition(async () => {
      const res = await putLifecyclePolicyAction(repositoryName, editText);
      if (res.success) {
        setLifecycleText(editText);
        setShowEditModal(false);
        onRefresh();
      } else {
        setJsonError(res.error || "Failed to update lifecycle policy.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete the lifecycle policy? Images will no longer expire automatically.")) {
      return;
    }
    setActionError(null);

    startTransition(async () => {
      const res = await deleteLifecyclePolicyAction(repositoryName);
      if (res.success) {
        setLifecycleText("");
        onRefresh();
      } else {
        setActionError(res.error || "Failed to delete lifecycle policy.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[13px]">
          {actionError}
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#16191f]">
            Lifecycle policy
          </h3>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Lifecycle policies automate the cleanup of your container images by expiring them based on age or image count.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lifecycleText && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#d13212] hover:bg-[#fdf3f1] transition-colors"
            >
              Delete policy
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditText(lifecycleText || samplePolicy);
              setShowEditModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            {lifecycleText ? "Edit policy JSON" : "Create rule"}
          </button>
        </div>
      </div>

      {/* Rule Cards / Empty State */}
      {!lifecycleText || parsedRules.length === 0 ? (
        <div className="p-12 text-center text-[#545b64] space-y-3 bg-white border border-[#d5dbdb] rounded-sm">
          <div className="text-[16px] font-bold text-[#16191f]">
            No lifecycle policy configured
          </div>
          <p className="text-[13px] max-w-md mx-auto">
            Without a lifecycle policy, images in this repository will remain indefinitely and incur standard storage charges.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setEditText(samplePolicy);
                setShowEditModal(true);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] shadow-xs"
            >
              Create lifecycle rule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#fafafa] border-b border-[#eaeded] font-bold text-[13px] text-[#16191f] flex items-center justify-between">
              <span>Configured Rules ({parsedRules.length})</span>
              <span className="text-[11px] text-[#137333] font-semibold bg-[#e6f4ea] px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="divide-y divide-[#eaeded]">
              {parsedRules.map((rule) => (
                <div key={rule.rulePriority} className="p-4 space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#f2f3f3] text-[#16191f] font-mono text-[11px] font-bold rounded">
                        Priority {rule.rulePriority}
                      </span>
                      <span className="font-bold text-[#16191f]">
                        {rule.description || "Lifecycle cleanup rule"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#fdf3f1] text-[#d13212] font-semibold text-[11px] rounded uppercase">
                      Action: {rule.action.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[12px] bg-[#f8f9fa] p-3 rounded-sm border border-[#eaeded]">
                    <div>
                      <span className="text-[#545b64] block text-[11px] uppercase font-bold">
                        Tag status
                      </span>
                      <span className="font-mono font-semibold text-[#16191f]">
                        {rule.selection.tagStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#545b64] block text-[11px] uppercase font-bold">
                        Match criteria
                      </span>
                      <span className="font-mono text-[#16191f]">
                        {rule.selection.countType === "sinceImagePushed"
                          ? `Older than ${rule.selection.countNumber} ${rule.selection.countUnit || "days"}`
                          : `Keep at most ${rule.selection.countNumber} images`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#545b64] block text-[11px] uppercase font-bold">
                        Target action
                      </span>
                      <span className="font-semibold text-[#d13212]">
                        Expire / Delete image
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
            <div className="text-[11px] font-bold text-[#545b64] uppercase mb-1">
              Raw Policy Document
            </div>
            <pre className="font-mono text-[11px] text-[#545b64] p-3 bg-[#fafafa] border border-[#eaeded] rounded-sm overflow-x-auto">
              {lifecycleText}
            </pre>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-[700px] w-full border border-[#d5dbdb] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
              <h2 className="text-[17px] font-bold text-[#16191f]">
                Edit lifecycle policy JSON
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
              >
                x
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
              {jsonError && (
                <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[12px]">
                  {jsonError}
                </div>
              )}

              <p className="text-[#545b64]">
                Define an Amazon ECR lifecycle policy rules document. Rules are evaluated in priority order.
              </p>

              <div>
                <label className="block text-[12px] font-bold text-[#545b64] uppercase mb-1">
                  Lifecycle Rules JSON
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={14}
                  className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded-sm focus:outline-none focus:border-[#ec7211] bg-[#fafafa]"
                />
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
                onClick={handleSave}
                disabled={isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save policy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
