"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EcrRepositoryItem } from "../actions";
import PushCommandsModal from "../components/PushCommandsModal";
import EditRepositoryModal from "../components/EditRepositoryModal";
import DeleteRepositoryModal from "../components/DeleteRepositoryModal";

interface RepositoriesClientProps {
  initialRepositories: EcrRepositoryItem[];
  initialError?: string;
}

export default function RepositoriesClient({
  initialRepositories,
  initialError,
}: RepositoriesClientProps) {
  const router = useRouter();
  const [repositories, setRepositories] = useState<EcrRepositoryItem[]>(initialRepositories);
  const [selectedRepoName, setSelectedRepoName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  // Modals state
  const [showPushModal, setShowPushModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  const selectedRepo =
    repositories.find((r) => r.repositoryName === selectedRepoName) || null;

  // Filtered repositories
  const filteredRepos = repositories.filter((r) =>
    r.repositoryName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Computed metrics
  const totalCount = repositories.length;
  const immutableCount = repositories.filter((r) => r.imageTagMutability === "IMMUTABLE").length;
  const scanOnPushCount = repositories.filter(
    (r) => r.imageScanningConfiguration?.scanOnPush
  ).length;
  const kmsCount = repositories.filter(
    (r) => r.encryptionConfiguration?.encryptionType === "KMS"
  ).length;

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedUri(text);
    setTimeout(() => setCopiedUri(null), 2000);
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#0073bb]">
          Console Home
        </Link>
        <span>/</span>
        <span className="text-[#16191f]">Amazon ECR</span>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">Private repositories</span>
      </div>

      {initialError && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[13px]">
          {initialError}
        </div>
      )}

      {/* Title & Description */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">
          Private repositories
        </h1>
        <p className="text-[13px] text-[#545b64]">
          Repositories contain your Docker images, Open Container Initiative (OCI) images, and OCI compatible artifacts.
        </p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
            Total repositories
          </div>
          <div className="text-[24px] font-bold text-[#16191f]">{totalCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Across this Region</div>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
            Immutable tags
          </div>
          <div className="text-[24px] font-bold text-[#16191f]">{immutableCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Protected from overwrite</div>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
            Scan on push
          </div>
          <div className="text-[24px] font-bold text-[#16191f]">{scanOnPushCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Vulnerability auto-scan</div>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
            KMS encrypted
          </div>
          <div className="text-[24px] font-bold text-[#16191f]">{kmsCount}</div>
          <div className="text-[11px] text-[#545b64] mt-0.5">Customer-managed keys</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        {/* Actions & Search Bar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find repositories by name"
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPushModal(true)}
              disabled={!selectedRepo}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View push commands
            </button>

            {/* Actions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                disabled={!selectedRepo}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Actions</span>
                <span className="text-[10px]">▼</span>
              </button>

              {showActionsDropdown && selectedRepo && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#d5dbdb] rounded-sm shadow-md py-1 z-20 text-[13px]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowEditModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f2f8fd] text-[#16191f]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#fdf3f1] text-[#d13212] border-t border-[#eaeded]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/ecr/repositories/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] transition-colors shadow-xs flex items-center"
            >
              Create repository
            </Link>
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredRepos.length === 0 ? (
          <div className="p-12 text-center text-[#545b64] space-y-3">
            <div className="text-[16px] font-bold text-[#16191f]">
              {repositories.length === 0
                ? "You don't have any Amazon ECR repositories in this Region."
                : "No repositories match the search criteria."}
            </div>
            <p className="text-[13px] max-w-md mx-auto">
              Amazon ECR repositories hold your Docker and OCI images for secure, reliable deployment across AWS container services.
            </p>
            {repositories.length === 0 && (
              <div className="pt-2">
                <Link
                  href="/ecr/repositories/create"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] shadow-xs"
                >
                  Create repository
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-bold uppercase tracking-wider">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-4 py-3">Repository name</th>
                  <th className="px-4 py-3">URI</th>
                  <th className="px-4 py-3">Images</th>
                  <th className="px-4 py-3">Tag immutability</th>
                  <th className="px-4 py-3">Scan on push</th>
                  <th className="px-4 py-3">Encryption</th>
                  <th className="px-4 py-3">Created at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredRepos.map((repo) => {
                  const isSelected = selectedRepoName === repo.repositoryName;
                  return (
                    <tr
                      key={repo.repositoryName}
                      onClick={() =>
                        setSelectedRepoName(isSelected ? null : repo.repositoryName)
                      }
                      className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedRepo"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedRepoName(isSelected ? null : repo.repositoryName)
                          }
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/ecr/repositories/${encodeURIComponent(repo.repositoryName)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-[#0073bb] hover:underline"
                        >
                          {repo.repositoryName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#545b64]">
                          <span className="truncate max-w-[220px]" title={repo.repositoryUri}>
                            {repo.repositoryUri}
                          </span>
                          {repo.repositoryUri && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(repo.repositoryUri || "");
                              }}
                              className="text-[11px] text-[#0073bb] hover:underline ml-1"
                            >
                              {copiedUri === repo.repositoryUri ? "Copied" : "Copy"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#16191f]">
                        {repo.imageCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {repo.imageTagMutability === "IMMUTABLE" ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                            Immutable
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64]">
                            Mutable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {repo.imageScanningConfiguration?.scanOnPush ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                            Enabled
                          </span>
                        ) : (
                          <span className="text-[#545b64]">Disabled</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {repo.encryptionConfiguration?.encryptionType === "KMS" ? (
                          <span className="font-semibold text-[#0073bb]">AWS KMS</span>
                        ) : (
                          <span className="text-[#545b64]">AES-256</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#545b64]">
                        {formatDate(repo.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Push Commands Modal */}
      {selectedRepo && (
        <PushCommandsModal
          isOpen={showPushModal}
          onClose={() => setShowPushModal(false)}
          repositoryName={selectedRepo.repositoryName}
          repositoryUri={selectedRepo.repositoryUri || selectedRepo.repositoryName}
        />
      )}

      {/* Edit Repository Modal */}
      {selectedRepo && (
        <EditRepositoryModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          repository={selectedRepo}
          onUpdated={() => {
            router.refresh();
          }}
        />
      )}

      {/* Delete Repository Modal */}
      {selectedRepo && (
        <DeleteRepositoryModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          repository={selectedRepo}
          onDeleted={() => {
            setSelectedRepoName(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
