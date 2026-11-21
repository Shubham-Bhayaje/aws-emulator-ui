"use client";

import { useState, useTransition } from "react";
import {
  setRepositoryPolicyAction,
  deleteRepositoryPolicyAction,
} from "../../../actions";

interface PermissionsTabProps {
  repositoryName: string;
  initialPolicyText?: string;
  onRefresh: () => void;
}

export default function PermissionsTab({
  repositoryName,
  initialPolicyText,
  onRefresh,
}: PermissionsTabProps) {
  const [policyText, setPolicyText] = useState(initialPolicyText || "");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(initialPolicyText || "");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const samplePolicy = JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AllowPull",
          Effect: "Allow",
          Principal: "*",
          Action: [
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            "ecr:BatchCheckLayerAvailability",
          ],
        },
      ],
    },
    null,
    2
  );

  function handleSavePolicy() {
    setJsonError(null);
    try {
      JSON.parse(editText);
    } catch (e: unknown) {
      setJsonError("Invalid JSON syntax: " + (e instanceof Error ? e.message : String(e)));
      return;
    }

    startTransition(async () => {
      const res = await setRepositoryPolicyAction(repositoryName, editText);
      if (res.success) {
        setPolicyText(editText);
        setShowEditModal(false);
        onRefresh();
      } else {
        setJsonError(res.error || "Failed to update repository policy.");
      }
    });
  }

  function handleClearPolicy() {
    if (!confirm("Are you sure you want to delete the repository policy? Access will revert to default account permissions.")) {
      return;
    }
    setActionError(null);

    startTransition(async () => {
      const res = await deleteRepositoryPolicyAction(repositoryName);
      if (res.success) {
        setPolicyText("");
        onRefresh();
      } else {
        setActionError(res.error || "Failed to delete repository policy.");
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
            Repository permissions (Resource-based policy)
          </h3>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Resource-based policies allow you to grant other AWS accounts or IAM users access to pull or push images to this repository.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {policyText && (
            <button
              type="button"
              onClick={handleClearPolicy}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#d13212] hover:bg-[#fdf3f1] transition-colors"
            >
              Clear policy
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditText(policyText || samplePolicy);
              setShowEditModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            {policyText ? "Edit policy JSON" : "Add permission statement"}
          </button>
        </div>
      </div>

      {/* Policy Content / Empty State */}
      {!policyText ? (
        <div className="p-12 text-center text-[#545b64] space-y-3 bg-white border border-[#d5dbdb] rounded-sm">
          <div className="text-[16px] font-bold text-[#16191f]">
            No repository policy configured
          </div>
          <p className="text-[13px] max-w-md mx-auto">
            By default, only users and roles within your AWS account with appropriate IAM permissions can access this repository.
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
              Create policy JSON
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs overflow-hidden">
          <div className="px-4 py-2 bg-[#f8f9fa] border-b border-[#eaeded] flex items-center justify-between text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
            <span>JSON Policy Document</span>
            <span className="font-mono text-[#0073bb]">Status: Active</span>
          </div>
          <pre className="p-4 font-mono text-[12px] text-[#16191f] overflow-x-auto bg-[#ffffff]">
            {policyText}
          </pre>
        </div>
      )}

      {/* Edit Policy Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-[700px] w-full border border-[#d5dbdb] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
              <h2 className="text-[17px] font-bold text-[#16191f]">
                Edit repository permissions policy
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
                Define an IAM JSON policy document controlling cross-account access and pull/push actions for this repository.
              </p>

              <div>
                <label className="block text-[12px] font-bold text-[#545b64] uppercase mb-1">
                  Policy Document (JSON)
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
                onClick={handleSavePolicy}
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
