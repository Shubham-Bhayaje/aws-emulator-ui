"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EcrRepositoryItem,
  EcrImageItem,
} from "../../actions";
import PushCommandsModal from "../../components/PushCommandsModal";
import EditRepositoryModal from "../../components/EditRepositoryModal";
import DeleteRepositoryModal from "../../components/DeleteRepositoryModal";
import ImagesTab from "./components/ImagesTab";
import PermissionsTab from "./components/PermissionsTab";
import LifecyclePolicyTab from "./components/LifecyclePolicyTab";
import TagsTab from "./components/TagsTab";

interface RepositoryDetailClientProps {
  repository: EcrRepositoryItem;
  images: EcrImageItem[];
  policyText?: string;
  lifecyclePolicyText?: string;
  tags: { Key: string; Value: string }[];
}

export default function RepositoryDetailClient({
  repository,
  images,
  policyText,
  lifecyclePolicyText,
  tags,
}: RepositoryDetailClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"images" | "permissions" | "lifecycle" | "tags">("images");
  const [showPushModal, setShowPushModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
        <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
          Amazon ECR
        </Link>
        <span>/</span>
        <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
          Private repositories
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">{repository.repositoryName}</span>
      </div>

      {/* Title & Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f] mb-1">
            {repository.repositoryName}
          </h1>
          <p className="text-[13px] text-[#545b64]">
            Private container image repository in Amazon Elastic Container Registry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPushModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            View push commands
          </button>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#d13212] hover:bg-[#fdf3f1] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Repository Summary Card */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">
              Repository URI
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[12px] text-[#16191f]">
              <span className="truncate max-w-[260px]" title={repository.repositoryUri}>
                {repository.repositoryUri || repository.repositoryName}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyText(repository.repositoryUri || repository.repositoryName, "uri")
                }
                className="text-[11px] text-[#0073bb] hover:underline"
              >
                {copiedKey === "uri" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">
              Repository ARN
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[12px] text-[#545b64]">
              <span className="truncate max-w-[260px]" title={repository.repositoryArn}>
                {repository.repositoryArn || "—"}
              </span>
              {repository.repositoryArn && (
                <button
                  type="button"
                  onClick={() => copyText(repository.repositoryArn || "", "arn")}
                  className="text-[11px] text-[#0073bb] hover:underline"
                >
                  {copiedKey === "arn" ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">
              Tag immutability
            </span>
            {repository.imageTagMutability === "IMMUTABLE" ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                Immutable
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64]">
                Mutable
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">
              Image scan on push
            </span>
            {repository.imageScanningConfiguration?.scanOnPush ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                Enabled
              </span>
            ) : (
              <span className="text-[#545b64]">Disabled</span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">
              Encryption
            </span>
            {repository.encryptionConfiguration?.encryptionType === "KMS" ? (
              <span className="font-semibold text-[#0073bb]">
                AWS KMS ({repository.encryptionConfiguration.kmsKey || "Default"})
              </span>
            ) : (
              <span className="text-[#16191f]">AES-256 (AWS managed)</span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">
              Created at
            </span>
            <span className="text-[#545b64]">{formatDate(repository.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#eaeded] flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("images")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "images"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Images ({images.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("permissions")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "permissions"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Permissions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lifecycle")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "lifecycle"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Lifecycle policy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tags")}
          className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
            activeTab === "tags"
              ? "border-[#ec7211] text-[#ec7211]"
              : "border-transparent text-[#545b64] hover:text-[#16191f]"
          }`}
        >
          Tags ({tags.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "images" && (
        <ImagesTab
          repositoryName={repository.repositoryName}
          images={images}
          onOpenPushCommands={() => setShowPushModal(true)}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "permissions" && (
        <PermissionsTab
          repositoryName={repository.repositoryName}
          initialPolicyText={policyText}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "lifecycle" && (
        <LifecyclePolicyTab
          repositoryName={repository.repositoryName}
          initialLifecyclePolicyText={lifecyclePolicyText}
          onRefresh={() => router.refresh()}
        />
      )}

      {activeTab === "tags" && (
        <TagsTab
          resourceArn={repository.repositoryArn || ""}
          initialTags={tags}
          onRefresh={() => router.refresh()}
        />
      )}

      {/* Push Commands Modal */}
      <PushCommandsModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        repositoryName={repository.repositoryName}
        repositoryUri={repository.repositoryUri || repository.repositoryName}
      />

      {/* Edit Modal */}
      <EditRepositoryModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        repository={repository}
        onUpdated={() => router.refresh()}
      />

      {/* Delete Modal */}
      <DeleteRepositoryModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        repository={repository}
        onDeleted={() => {
          router.push("/ecr/repositories");
          router.refresh();
        }}
      />
    </div>
  );
}
