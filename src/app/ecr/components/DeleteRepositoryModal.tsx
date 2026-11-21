"use client";

import { useState, useTransition } from "react";
import { deleteRepositoryAction, EcrRepositoryItem } from "../actions";

interface DeleteRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  repository: EcrRepositoryItem | null;
  onDeleted: () => void;
}

export default function DeleteRepositoryModal({
  isOpen,
  onClose,
  repository,
  onDeleted,
}: DeleteRepositoryModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [force, setForce] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (!isOpen || !repository) return null;

  const isConfirmed = confirmText.trim().toLowerCase() === "delete";

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!repository || !isConfirmed) return;
    setError(null);

    startDeleteTransition(async () => {
      const res = await deleteRepositoryAction(repository.repositoryName, force);
      if (res.success) {
        onDeleted();
        onClose();
      } else {
        setError(res.error || "Failed to delete repository.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-sm shadow-xl max-w-[520px] w-full border border-[#d5dbdb] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
          <h2 className="text-[17px] font-bold text-[#16191f]">
            Delete repository
          </h2>
          <button
            onClick={onClose}
            className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
          >
            x
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDelete}>
          <div className="p-6 space-y-4 text-[13px]">
            {error && (
              <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[12px]">
                {error}
              </div>
            )}

            <div className="p-3.5 bg-[#fdf3f1] border-l-4 border-l-[#d13212] rounded-xs text-[#16191f] space-y-1">
              <div className="font-bold">Permanent deletion warning</div>
              <p className="text-[12px] text-[#545b64]">
                Are you sure you want to delete repository{" "}
                <span className="font-bold text-[#16191f] font-mono">
                  {repository.repositoryName}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="mt-0.5 accent-[#d13212]"
              />
              <span className="text-[12px] text-[#545b64]">
                Force delete this repository and all images contained within it.
              </span>
            </label>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[12px] font-bold text-[#16191f]">
                To confirm deletion, type <span className="font-mono text-[#d13212]">delete</span> in the field below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#eaeded] bg-[#fafafa]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#a8250c] transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
