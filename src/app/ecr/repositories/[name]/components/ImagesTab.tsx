"use client";

import { useState, useTransition } from "react";
import { EcrImageItem, batchDeleteImageAction } from "../../../actions";

interface ImagesTabProps {
  repositoryName: string;
  images: EcrImageItem[];
  onOpenPushCommands: () => void;
  onRefresh: () => void;
}

export default function ImagesTab({
  repositoryName,
  images,
  onOpenPushCommands,
  onRefresh,
}: ImagesTabProps) {
  const [selectedDigest, setSelectedDigest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedDigest, setCopiedDigest] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const selectedImage = images.find((i) => i.imageDigest === selectedDigest) || null;

  const filteredImages = images.filter((img) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (img.imageDigest.toLowerCase().includes(q)) return true;
    if (img.imageTags.some((t) => t.toLowerCase().includes(q))) return true;
    return false;
  });

  function formatSize(bytes?: number) {
    if (bytes === undefined || bytes === null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function formatDate(iso?: string) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "—";
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const h = String(d.getUTCHours()).padStart(2, "0");
      const min = String(d.getUTCMinutes()).padStart(2, "0");
      return `${y}-${m}-${day} ${h}:${min} UTC`;
    } catch {
      return "—";
    }
  }

  function copyDigest(digest: string) {
    navigator.clipboard.writeText(digest);
    setCopiedDigest(digest);
    setTimeout(() => setCopiedDigest(null), 2000);
  }

  function handleDeleteImage() {
    if (!selectedImage) return;
    setDeleteError(null);

    startDeleteTransition(async () => {
      const res = await batchDeleteImageAction(repositoryName, [
        {
          imageDigest: selectedImage.imageDigest,
          imageTag: selectedImage.imageTags[0] || undefined,
        },
      ]);

      if (res.success) {
        setShowDeleteModal(false);
        setSelectedDigest(null);
        onRefresh();
      } else {
        setDeleteError(res.error || "Failed to delete image.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Action and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find images by tag or digest"
            className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPushCommands}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            View push commands
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={!selectedImage}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#d13212] hover:bg-[#fdf3f1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Images Table / Empty State */}
      {filteredImages.length === 0 ? (
        <div className="p-12 text-center text-[#545b64] space-y-3 bg-white border border-[#d5dbdb] rounded-sm">
          <div className="text-[16px] font-bold text-[#16191f]">
            {images.length === 0
              ? "There are no images in this repository."
              : "No images match the search criteria."}
          </div>
          <p className="text-[13px] max-w-md mx-auto">
            To push images to this repository, authenticate your Docker client using AWS CLI and follow the push instructions.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenPushCommands}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] shadow-xs"
            >
              View push commands
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-bold uppercase tracking-wider">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3">Image tags</th>
                <th className="px-4 py-3">Artifact type</th>
                <th className="px-4 py-3">Vulnerabilities</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Pushed at</th>
                <th className="px-4 py-3">Image digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredImages.map((img) => {
                const isSelected = selectedDigest === img.imageDigest;
                return (
                  <tr
                    key={img.imageDigest}
                    onClick={() =>
                      setSelectedDigest(isSelected ? null : img.imageDigest)
                    }
                    className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : ""
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="selectedImage"
                        checked={isSelected}
                        onChange={() =>
                          setSelectedDigest(isSelected ? null : img.imageDigest)
                        }
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {img.imageTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {img.imageTags.map((tag) => (
                            <span
                              key={tag}
                              className="font-mono text-[11px] font-bold bg-[#f2f3f3] text-[#16191f] px-2 py-0.5 rounded-sm border border-[#d5dbdb]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#545b64] italic text-[12px]">&lt;untagged&gt;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#545b64]">
                      {img.artifactMediaType || "Image"}
                    </td>
                    <td className="px-4 py-3">
                      {img.imageScanStatus?.status === "COMPLETE" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                          Clean (0)
                        </span>
                      ) : img.imageScanStatus?.status === "IN_PROGRESS" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f8fd] text-[#0073bb]">
                          Scanning...
                        </span>
                      ) : (
                        <span className="text-[#545b64] text-[12px]">No scan findings</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#16191f]">
                      {formatSize(img.imageSizeInBytes)}
                    </td>
                    <td className="px-4 py-3 text-[#545b64]">
                      {formatDate(img.imagePushedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#545b64]">
                        <span className="truncate max-w-[140px]" title={img.imageDigest}>
                          {img.imageDigest}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyDigest(img.imageDigest);
                          }}
                          className="text-[11px] text-[#0073bb] hover:underline"
                        >
                          {copiedDigest === img.imageDigest ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Image Confirmation Dialog */}
      {showDeleteModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm shadow-xl max-w-[480px] w-full border border-[#d5dbdb] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
              <h2 className="text-[17px] font-bold text-[#16191f]">Delete image</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
              >
                x
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              {deleteError && (
                <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[12px]">
                  {deleteError}
                </div>
              )}

              <p className="text-[#16191f]">
                Are you sure you want to permanently delete this container image?
              </p>

              <div className="bg-[#f8f9fa] border border-[#eaeded] p-3 rounded-sm space-y-1 font-mono text-[12px]">
                <div>
                  <span className="text-[#545b64]">Tags:</span>{" "}
                  <span className="font-bold text-[#16191f]">
                    {selectedImage.imageTags.join(", ") || "<untagged>"}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-[#545b64]">Digest:</span>{" "}
                  <span className="text-[#16191f]">{selectedImage.imageDigest}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#eaeded] bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#d13212] text-white rounded-sm text-[13px] font-bold hover:bg-[#a8250c] disabled:opacity-50"
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
