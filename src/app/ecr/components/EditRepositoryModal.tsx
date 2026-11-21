"use client";

import { useState, useTransition } from "react";
import { updateRepositorySettingsAction, EcrRepositoryItem } from "../actions";

interface EditRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: EcrRepositoryItem | null;
  onUpdated: () => void;
}

export default function EditRepositoryModal({
  isOpen,
  onClose,
  repository,
  onUpdated,
}: EditRepositoryModalProps) {
  const [tagMutability, setTagMutability] = useState<"MUTABLE" | "IMMUTABLE">(
    repository?.imageTagMutability || "MUTABLE"
  );
  const [scanOnPush, setScanOnPush] = useState<boolean>(
    repository?.imageScanningConfiguration?.scanOnPush ?? false
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !repository) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repository) return;
    setError(null);

    startTransition(async () => {
      const res = await updateRepositorySettingsAction(
        repository.repositoryName,
        tagMutability,
        scanOnPush
      );
      if (res.success) {
        onUpdated();
        onClose();
      } else {
        setError(res.error || "Failed to update repository settings.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-sm shadow-xl max-w-[560px] w-full border border-[#d5dbdb] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
          <h2 className="text-[17px] font-bold text-[#16191f]">
            Edit repository settings
          </h2>
          <button
            onClick={onClose}
            className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
          >
            x
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 text-[13px]">
            {error && (
              <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[12px]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                Repository name
              </label>
              <div className="font-mono text-[13px] text-[#16191f] font-bold bg-[#f2f3f3] px-3 py-1.5 rounded-sm">
                {repository.repositoryName}
              </div>
            </div>

            {/* Tag Immutability */}
            <div className="space-y-2">
              <label className="block font-bold text-[#16191f]">
                Tag immutability
              </label>
              <p className="text-[12px] text-[#545b64]">
                Enable tag immutability to prevent image tags from being overwritten by subsequent image pushes using the same tag.
              </p>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tagMutability"
                    value="MUTABLE"
                    checked={tagMutability === "MUTABLE"}
                    onChange={() => setTagMutability("MUTABLE")}
                    className="accent-[#ec7211]"
                  />
                  <span>Mutable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tagMutability"
                    value="IMMUTABLE"
                    checked={tagMutability === "IMMUTABLE"}
                    onChange={() => setTagMutability("IMMUTABLE")}
                    className="accent-[#ec7211]"
                  />
                  <span>Immutable</span>
                </label>
              </div>
            </div>

            {/* Image Scan on push */}
            <div className="space-y-2 pt-2 border-t border-[#eaeded]">
              <label className="block font-bold text-[#16191f]">
                Scan on push
              </label>
              <p className="text-[12px] text-[#545b64]">
                When enabled, an image vulnerability scan starts automatically after each image push.
              </p>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scanOnPush"
                    value="enabled"
                    checked={scanOnPush === true}
                    onChange={() => setScanOnPush(true)}
                    className="accent-[#ec7211]"
                  />
                  <span>Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scanOnPush"
                    value="disabled"
                    checked={scanOnPush === false}
                    onChange={() => setScanOnPush(false)}
                    className="accent-[#ec7211]"
                  />
                  <span>Disabled</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#eaeded] bg-[#fafafa]">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] transition-colors shadow-xs disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
