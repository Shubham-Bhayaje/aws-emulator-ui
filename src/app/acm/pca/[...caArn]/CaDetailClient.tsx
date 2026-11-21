/**
 * src/app/acm/pca/[...caArn]/CaDetailClient.tsx – Certificate Authority Details Client Component.
 * Features tabs for Details, CSR, CA Certificate, Issue Certificate, Policy, and Tags.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CertificateAuthorityDetail,
  CertificateAuthorityStatus,
  SigningAlgorithm,
  RevocationReason,
} from "../types";
import {
  describeCertificateAuthorityAction,
  installRootCaCertificateAction,
  importCaCertificateAction,
  issueCertificateAction,
  revokeCertificateAction,
  updateCertificateAuthorityStatusAction,
  deleteCertificateAuthorityAction,
  restoreCertificateAuthorityAction,
  putPolicyAction,
  deletePolicyAction,
  tagCertificateAuthorityAction,
  untagCertificateAuthorityAction,
} from "../actions";

interface CaDetailClientProps {
  initialCa: CertificateAuthorityDetail;
  initialTab?: string;
}

export function CaDetailClient({ initialCa, initialTab = "details" }: CaDetailClientProps) {
  const router = useRouter();
  const [ca, setCa] = useState<CertificateAuthorityDetail>(initialCa);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Install Modal
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installMode, setInstallMode] = useState<"SELF_SIGNED" | "EXTERNAL">("SELF_SIGNED");
  const [installValidityYears, setInstallValidityYears] = useState(10);
  const [externalCertPem, setExternalCertPem] = useState("");
  const [externalChainPem, setExternalChainPem] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState(7);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore Modal
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Revoke Modal
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeSerial, setRevokeSerial] = useState("");
  const [revokeReason, setRevokeReason] = useState<RevocationReason>("KEY_COMPROMISE");
  const [isRevoking, setIsRevoking] = useState(false);

  // Issue Certificate Form State
  const [issueTemplate, setIssueTemplate] = useState("arn:aws:acm-pca:::template/EndEntityCertificate/V1");
  const [issueValidityDays, setIssueValidityDays] = useState(90);
  const [issueSigningAlg, setIssueSigningAlg] = useState<SigningAlgorithm>(
    (ca.signingAlgorithm as any) || "SHA256WITHRSA"
  );
  const [issueCsr, setIssueCsr] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedCertResult, setIssuedCertResult] = useState<{
    arn: string;
    certPem?: string;
    chainPem?: string;
  } | null>(null);

  // Policy Editor State
  const [policyDoc, setPolicyDoc] = useState(ca.policy || "");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Tag Management State
  const [tags, setTags] = useState<{ key: string; value: string }[]>(ca.tags || []);
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagVal, setNewTagVal] = useState("");
  const [isSavingTags, setIsSavingTags] = useState(false);

  async function handleRefresh() {
    const res = await describeCertificateAuthorityAction(ca.arn);
    if (res.success && res.certificateAuthority) {
      setCa(res.certificateAuthority);
      setPolicyDoc(res.certificateAuthority.policy || "");
      setTags(res.certificateAuthority.tags || []);
    }
  }

  // Copy helper
  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setNotification({ type: "success", message: `Copied ${label} to clipboard.` });
  }

  // Download helper
  function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Install Root CA Certificate
  async function handleInstallCertificate() {
    setIsInstalling(true);
    setNotification(null);

    if (installMode === "SELF_SIGNED") {
      const res = await installRootCaCertificateAction(
        ca.arn,
        installValidityYears,
        (ca.signingAlgorithm as any) || "SHA256WITHRSA"
      );
      setIsInstalling(false);
      setShowInstallModal(false);

      if (res.success) {
        setNotification({
          type: "success",
          message: "Root CA certificate installed successfully. The CA is now ACTIVE.",
        });
        handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to install CA certificate" });
      }
    } else {
      const res = await importCaCertificateAction(ca.arn, externalCertPem, externalChainPem);
      setIsInstalling(false);
      setShowInstallModal(false);

      if (res.success) {
        setNotification({
          type: "success",
          message: "Custom CA certificate imported successfully. The CA is now ACTIVE.",
        });
        handleRefresh();
      } else {
        setNotification({ type: "error", message: res.error || "Failed to import CA certificate" });
      }
    }
  }

  // Toggle Active / Disabled
  async function handleToggleStatus() {
    setIsUpdatingStatus(true);
    setNotification(null);

    const nextStatus = ca.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const res = await updateCertificateAuthorityStatusAction(ca.arn, nextStatus);
    setIsUpdatingStatus(false);
    setShowStatusModal(false);

    if (res.success) {
      setNotification({ type: "success", message: `Certificate Authority status updated to ${nextStatus}.` });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to update CA status" });
    }
  }

  // Delete CA
  async function handleDeleteCa() {
    setIsDeleting(true);
    setNotification(null);

    const res = await deleteCertificateAuthorityAction(ca.arn, retentionDays);
    setIsDeleting(false);
    setShowDeleteModal(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: `Certificate Authority scheduled for deletion with ${retentionDays} days retention.`,
      });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to delete CA" });
    }
  }

  // Restore CA
  async function handleRestoreCa() {
    setIsRestoring(true);
    setNotification(null);

    const res = await restoreCertificateAuthorityAction(ca.arn);
    setIsRestoring(false);
    setShowRestoreModal(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: "Certificate Authority restored successfully. Status is now DISABLED.",
      });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to restore CA" });
    }
  }

  // Issue Certificate
  async function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!issueCsr.trim()) {
      setNotification({ type: "error", message: "CSR is required to issue a certificate." });
      return;
    }

    setIsIssuing(true);
    setNotification(null);
    setIssuedCertResult(null);

    const res = await issueCertificateAction({
      certificateAuthorityArn: ca.arn,
      csr: issueCsr.trim(),
      templateArn: issueTemplate,
      validityDays: issueValidityDays,
      signingAlgorithm: issueSigningAlg,
    });

    setIsIssuing(false);

    if (res.success && res.certificateArn) {
      setIssuedCertResult({
        arn: res.certificateArn,
        certPem: res.certificatePem,
        chainPem: res.certificateChainPem,
      });
      setNotification({
        type: "success",
        message: "Certificate issued successfully.",
      });
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to issue certificate",
      });
    }
  }

  // Revoke Certificate
  async function handleRevokeCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!revokeSerial.trim()) {
      setNotification({ type: "error", message: "Certificate serial number is required." });
      return;
    }

    setIsRevoking(true);
    setNotification(null);

    const res = await revokeCertificateAction(ca.arn, revokeSerial.trim(), revokeReason);
    setIsRevoking(false);
    setShowRevokeModal(false);
    setRevokeSerial("");

    if (res.success) {
      setNotification({
        type: "success",
        message: `Certificate serial ${revokeSerial} has been revoked (${revokeReason}).`,
      });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to revoke certificate" });
    }
  }

  // Save Policy
  async function handleSavePolicy() {
    setIsSavingPolicy(true);
    setNotification(null);

    const res = await putPolicyAction(ca.arn, policyDoc);
    setIsSavingPolicy(false);

    if (res.success) {
      setNotification({ type: "success", message: "Resource-based policy saved successfully." });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to save policy" });
    }
  }

  // Delete Policy
  async function handleDeletePolicy() {
    setIsSavingPolicy(true);
    setNotification(null);

    const res = await deletePolicyAction(ca.arn);
    setIsSavingPolicy(false);
    setPolicyDoc("");

    if (res.success) {
      setNotification({ type: "success", message: "Resource-based policy deleted." });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to delete policy" });
    }
  }

  // Add Tag
  async function handleAddTag() {
    if (!newTagKey.trim()) return;
    setIsSavingTags(true);
    setNotification(null);

    const res = await tagCertificateAuthorityAction(ca.arn, [
      { key: newTagKey.trim(), value: newTagVal.trim() },
    ]);
    setIsSavingTags(false);
    setNewTagKey("");
    setNewTagVal("");

    if (res.success) {
      setNotification({ type: "success", message: "Tag added successfully." });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to add tag" });
    }
  }

  // Remove Tag
  async function handleRemoveTag(key: string) {
    setIsSavingTags(true);
    setNotification(null);

    const res = await untagCertificateAuthorityAction(ca.arn, [key]);
    setIsSavingTags(false);

    if (res.success) {
      setNotification({ type: "success", message: `Tag "${key}" removed.` });
      handleRefresh();
    } else {
      setNotification({ type: "error", message: res.error || "Failed to remove tag" });
    }
  }

  function getStatusBadge(status: CertificateAuthorityStatus) {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]">
            <span className="w-2 h-2 rounded-full bg-[#1d8102]"></span>
            Active
          </span>
        );
      case "PENDING_CERTIFICATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fff8e1] text-[#b7791f] border border-[#f6e05e]">
            <span className="w-2 h-2 rounded-full bg-[#b7791f]"></span>
            Pending certificate
          </span>
        );
      case "DISABLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            <span className="w-2 h-2 rounded-full bg-[#545b64]"></span>
            Disabled
          </span>
        );
      case "DELETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fdf2f2] text-[#d13212] border border-[#f8b4b4]">
            <span className="w-2 h-2 rounded-full bg-[#d13212]"></span>
            Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            {status}
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Breadcrumbs */}
      <div className="text-[12px] text-[#545b64]">
        <Link href="/acm/pca" className="text-[#0073bb] hover:underline">
          Private CAs
        </Link>{" "}
        &gt; {ca.commonName}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#16191f]">{ca.commonName}</h1>
            {getStatusBadge(ca.status)}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
              {ca.type} CA
            </span>
          </div>
          <div className="text-[12px] text-[#545b64] font-mono select-all">{ca.arn}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ca.status === "PENDING_CERTIFICATE" && (
            <button
              type="button"
              onClick={() => setShowInstallModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Install CA certificate
            </button>
          )}

          {ca.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => setActiveTab("issue")}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Issue certificate
            </button>
          )}

          {(ca.status === "ACTIVE" || ca.status === "DISABLED") && (
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              {ca.status === "ACTIVE" ? "Disable CA" : "Enable CA"}
            </button>
          )}

          {ca.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => setShowRevokeModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3.5 rounded transition-colors"
            >
              Revoke certificate
            </button>
          )}

          {ca.status !== "DELETED" ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2] px-3.5 rounded transition-colors"
            >
              Delete CA
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowRestoreModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#1d8102] text-[#1d8102] hover:bg-[#f2f8f0] px-3.5 rounded transition-colors"
            >
              Restore CA
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3 rounded border text-[13px] flex items-center justify-between ${
            notification.type === "success"
              ? "bg-[#f2f8f0] border-[#1d8102] text-[#1d8102]"
              : "bg-[#fdf2f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[12px] underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Certificate Action Banner */}
      {ca.status === "PENDING_CERTIFICATE" && (
        <div className="bg-[#fff8e1] border-l-4 border-l-[#b7791f] border border-[#f6e05e] p-4 rounded flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-[14px] text-[#b7791f]">Action Required: Install CA certificate</div>
            <p className="text-[13px] text-[#744210] mt-0.5">
              This CA cannot issue certificates until you install its CA certificate. For Root CAs, you can install a self-signed root certificate directly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors shrink-0"
          >
            Install CA certificate
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-[#eaeded]">
        <nav className="flex space-x-6">
          {[
            { id: "details", label: "Details" },
            { id: "csr", label: "Certificate Signing Request (CSR)" },
            { id: "cert", label: "CA Certificate" },
            { id: "issue", label: "Issue Certificate" },
            { id: "policy", label: "Permissions & Policy" },
            { id: "tags", label: `Tags (${tags.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-[14px] font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#0073bb] text-[#0073bb]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">General configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">CA ARN</div>
                <div className="font-mono text-[#16191f] mt-1 break-all">{ca.arn}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">CA Type</div>
                <div className="text-[#16191f] mt-1 font-bold">{ca.type} CA</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Status</div>
                <div className="mt-1">{getStatusBadge(ca.status)}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Owner Account</div>
                <div className="font-mono text-[#16191f] mt-1">{ca.ownerAccount || "000000000000"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Created At</div>
                <div className="text-[#16191f] mt-1">{ca.createdAt || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Last State Change</div>
                <div className="text-[#16191f] mt-1">{ca.lastStateChangeAt || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Valid From (Not before)</div>
                <div className="text-[#16191f] mt-1">{ca.notBefore || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Valid To (Not after)</div>
                <div className="text-[#16191f] mt-1">{ca.notAfter || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Serial Number</div>
                <div className="font-mono text-[#16191f] mt-1">{ca.serial || "-"}</div>
              </div>
            </div>
          </div>

          {/* Subject Distinguished Name Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Subject Distinguished Name (DN)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Common Name (CN)</div>
                <div className="text-[#0073bb] font-bold mt-1">{ca.commonName}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Organization (O)</div>
                <div className="text-[#16191f] mt-1">{ca.organization || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Organizational Unit (OU)</div>
                <div className="text-[#16191f] mt-1">{ca.organizationalUnit || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Country (C)</div>
                <div className="text-[#16191f] mt-1">{ca.country || "US"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">State or Province (ST)</div>
                <div className="text-[#16191f] mt-1">{ca.state || "-"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Locality (L)</div>
                <div className="text-[#16191f] mt-1">{ca.locality || "-"}</div>
              </div>
            </div>
          </div>

          {/* Cryptographic & Revocation Card */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f]">Cryptographic &amp; Revocation configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Key Algorithm</div>
                <div className="font-mono text-[#16191f] mt-1">{ca.keyAlgorithm || "RSA_2048"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Signing Algorithm</div>
                <div className="font-mono text-[#16191f] mt-1">{ca.signingAlgorithm || "SHA256WITHRSA"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">Key Storage Standard</div>
                <div className="text-[#16191f] mt-1">{ca.keyStorageSecurityStandard || "FIPS_140_2_LEVEL_3_OR_HIGHER"}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-bold">CRL Status</div>
                <div className="text-[#16191f] mt-1">
                  {ca.revocationConfiguration?.crlConfiguration?.enabled ? (
                    <span className="text-[#1d8102] font-bold">Enabled</span>
                  ) : (
                    <span className="text-[#545b64]">Disabled</span>
                  )}
                </div>
              </div>
              {ca.revocationConfiguration?.crlConfiguration?.enabled && (
                <>
                  <div>
                    <div className="text-[12px] text-[#545b64] font-bold">CRL S3 Bucket</div>
                    <div className="font-mono text-[#0073bb] mt-1">
                      s3://{ca.revocationConfiguration.crlConfiguration.s3BucketName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-[#545b64] font-bold">CRL Expiration Days</div>
                    <div className="text-[#16191f] mt-1">
                      {ca.revocationConfiguration.crlConfiguration.expirationInDays || 7} days
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CSR */}
      {activeTab === "csr" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Certificate Signing Request (CSR)</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                The PEM-encoded CSR for this Certificate Authority generated during CA creation.
              </p>
            </div>
            {ca.csr && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(ca.csr!, "CSR")}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
                >
                  Copy CSR
                </button>
                <button
                  type="button"
                  onClick={() => downloadText(ca.csr!, `${ca.id}.csr`)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
                >
                  Download (.csr)
                </button>
              </div>
            )}
          </div>

          {ca.csr ? (
            <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto whitespace-pre">
              {ca.csr}
            </pre>
          ) : (
            <div className="py-8 text-center text-[#545b64]">CSR is not available for this CA.</div>
          )}
        </div>
      )}

      {/* TAB 3: CA Certificate */}
      {activeTab === "cert" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">CA Certificate</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                The installed X.509 certificate and chain that establishes this CA&apos;s identity.
              </p>
            </div>
            {ca.certificate && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(ca.certificate!, "CA Certificate")}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
                >
                  Copy Certificate
                </button>
                <button
                  type="button"
                  onClick={() => downloadText(ca.certificate!, `${ca.id}.crt`)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-3 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
                >
                  Download (.crt)
                </button>
              </div>
            )}
          </div>

          {ca.certificate ? (
            <div className="space-y-4">
              <div>
                <div className="text-[12px] font-bold text-[#545b64] mb-1">Certificate Body (PEM)</div>
                <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto whitespace-pre">
                  {ca.certificate}
                </pre>
              </div>

              {ca.certificateChain && (
                <div>
                  <div className="text-[12px] font-bold text-[#545b64] mb-1">Certificate Chain (PEM)</div>
                  <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto whitespace-pre">
                    {ca.certificateChain}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-[#545b64]">
              No certificate installed yet.{" "}
              {ca.status === "PENDING_CERTIFICATE" && (
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  className="text-[#0073bb] underline ml-1 font-semibold"
                >
                  Install certificate now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Issue Certificate */}
      {activeTab === "issue" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Issue certificate from this CA</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Issue an end-entity or subordinate CA certificate signed by <strong>{ca.commonName}</strong>.
            </p>
          </div>

          {ca.status !== "ACTIVE" ? (
            <div className="p-4 bg-[#fff8e1] border border-[#f6e05e] rounded text-[13px] text-[#744210]">
              This CA is currently <strong>{ca.status}</strong>. Only ACTIVE certificate authorities can issue new certificates.
            </div>
          ) : (
            <form onSubmit={handleIssueCertificate} className="space-y-4 max-w-2xl">
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-[#16191f]">Certificate template</label>
                <select
                  value={issueTemplate}
                  onChange={(e) => setIssueTemplate(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#0073bb]"
                >
                  <option value="arn:aws:acm-pca:::template/EndEntityCertificate/V1">
                    EndEntityCertificate/V1 (TLS servers and clients)
                  </option>
                  <option value="arn:aws:acm-pca:::template/EndEntityClientAuthCertificate/V1">
                    EndEntityClientAuthCertificate/V1 (Client mTLS authentication)
                  </option>
                  <option value="arn:aws:acm-pca:::template/EndEntityServerAuthCertificate/V1">
                    EndEntityServerAuthCertificate/V1 (Web servers)
                  </option>
                  <option value="arn:aws:acm-pca:::template/SubordinateCACertificate_PathLen0/V1">
                    SubordinateCACertificate_PathLen0/V1 (Subordinate CA, pathlen=0)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">Validity period (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={1095}
                    value={issueValidityDays}
                    onChange={(e) => setIssueValidityDays(parseInt(e.target.value) || 90)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                  <p className="text-[11px] text-[#545b64]">e.g. 90 days or 365 days.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">Signing algorithm</label>
                  <select
                    value={issueSigningAlg}
                    onChange={(e) => setIssueSigningAlg(e.target.value as SigningAlgorithm)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white"
                  >
                    <option value="SHA256WITHRSA">SHA256WITHRSA</option>
                    <option value="SHA384WITHRSA">SHA384WITHRSA</option>
                    <option value="SHA512WITHRSA">SHA512WITHRSA</option>
                    <option value="SHA256WITHECDSA">SHA256WITHECDSA</option>
                    <option value="SHA384WITHECDSA">SHA384WITHECDSA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-[#16191f]">
                    Certificate Signing Request (CSR) <span className="text-[#d13212]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      // Sample CSR generator for easy hands-on testing
                      setIssueCsr(
                        "-----BEGIN CERTIFICATE REQUEST-----\n" +
                        "MIICuDCCAaACAQAwczEZMBcGA1UEAwwQYXBwLmV4YW1wbGUuY29tMQswCQYDVQQG\n" +
                        "EwJVUzEPMA0GA1UECAwGVGV4YXMxDzANBgNVBAcMBkF1c3RpbjEUMBIGA1UECgwL\n" +
                        "Q2xvdWQgQ29ycDENMAsGA1UECwwET3BzMTIwMAYDVQQDEylhcHAuaW50ZXJuYWwu\n" +
                        "ZXhhbXBsZS5sb2NhbDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ5G\n" +
                        "4uB5cQY6mXyWvJ9QvP8kR9d2mO7n8/K3jP9E5yL1w1k9z7v3s8m7z6v1m4/N2z0\n" +
                        "-----END CERTIFICATE REQUEST-----"
                      );
                    }}
                    className="text-[11px] text-[#0073bb] hover:underline"
                  >
                    Paste sample CSR
                  </button>
                </div>
                <textarea
                  rows={6}
                  placeholder="Paste PEM-encoded CSR here..."
                  value={issueCsr}
                  onChange={(e) => setIssueCsr(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded p-2.5 font-mono text-[12px] focus:outline-none focus:border-[#0073bb]"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isIssuing}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-5 rounded shadow-sm transition-colors"
                >
                  {isIssuing ? "Issuing certificate..." : "Issue certificate"}
                </button>
              </div>

              {/* Issued Certificate Result */}
              {issuedCertResult && (
                <div className="mt-6 p-4 bg-[#f2f8f0] border border-[#a2dca0] rounded space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#1d8102]">
                      Certificate Issued Successfully
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadText(issuedCertResult.certPem || "", "certificate.crt")}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="px-3 text-[12px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded"
                    >
                      Download (.crt)
                    </button>
                  </div>
                  <div className="text-[12px] font-mono break-all text-[#16191f]">
                    ARN: {issuedCertResult.arn}
                  </div>
                  {issuedCertResult.certPem && (
                    <pre className="p-3 bg-white border border-[#a2dca0] rounded font-mono text-[11px] overflow-x-auto whitespace-pre">
                      {issuedCertResult.certPem}
                    </pre>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* TAB 5: Permissions & Policy */}
      {activeTab === "policy" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Resource-based policy</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Attach an IAM policy to this Private CA to delegate certificate issuance permissions to other AWS accounts or principals.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl">
            <textarea
              rows={12}
              placeholder='{ "Version": "2012-10-17", "Statement": [...] }'
              value={policyDoc}
              onChange={(e) => setPolicyDoc(e.target.value)}
              className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[12px] focus:outline-none focus:border-[#0073bb]"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={isSavingPolicy}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
              >
                {isSavingPolicy ? "Saving..." : "Save policy"}
              </button>

              {ca.policy && (
                <button
                  type="button"
                  onClick={handleDeletePolicy}
                  disabled={isSavingPolicy}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2] px-3.5 rounded transition-colors"
                >
                  Delete policy
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                Tags are key-value pairs applied to this Certificate Authority.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Key"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
              />
              <input
                type="text"
                placeholder="Value"
                value={newTagVal}
                onChange={(e) => setNewTagVal(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={isSavingTags || !newTagKey.trim()}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-3.5 text-[13px] font-bold bg-[#ec7211] hover:bg-[#eb5f07] text-white rounded transition-colors"
              >
                Add tag
              </button>
            </div>

            <table className="w-full text-left border-collapse text-[13px] border border-[#eaeded]">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-bold">
                  <th className="py-2 px-3">Key</th>
                  <th className="py-2 px-3">Value</th>
                  <th className="py-2 px-3 w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {tags.map((t) => (
                  <tr key={t.key}>
                    <td className="py-2.5 px-3 font-medium text-[#16191f]">{t.key}</td>
                    <td className="py-2.5 px-3 text-[#545b64]">{t.value}</td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t.key)}
                        disabled={isSavingTags}
                        className="text-[#d13212] hover:underline text-[12px] font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {tags.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[#545b64]">
                      No tags configured for this CA.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Install CA Certificate */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Install CA certificate</h2>
            <p className="text-[13px] text-[#545b64]">
              Install an X.509 certificate to activate <strong>{ca.commonName}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#16191f]">Installation method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInstallMode("SELF_SIGNED")}
                  className={`p-2.5 text-[12px] font-bold rounded border text-center transition-colors ${
                    installMode === "SELF_SIGNED"
                      ? "border-[#0972d3] bg-[#f2f8fd] text-[#0972d3]"
                      : "border-[#d5dbdb] bg-white text-[#545b64]"
                  }`}
                >
                  Self-signed Root CA
                </button>
                <button
                  type="button"
                  onClick={() => setInstallMode("EXTERNAL")}
                  className={`p-2.5 text-[12px] font-bold rounded border text-center transition-colors ${
                    installMode === "EXTERNAL"
                      ? "border-[#0972d3] bg-[#f2f8fd] text-[#0972d3]"
                      : "border-[#d5dbdb] bg-white text-[#545b64]"
                  }`}
                >
                  External Signed Certificate
                </button>
              </div>
            </div>

            {installMode === "SELF_SIGNED" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">Validity period (years)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={installValidityYears}
                    onChange={(e) => setInstallValidityYears(parseInt(e.target.value) || 10)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                  <p className="text-[11px] text-[#545b64]">Standard root validity is 10 years.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">Certificate PEM</label>
                  <textarea
                    rows={4}
                    placeholder="-----BEGIN CERTIFICATE-----..."
                    value={externalCertPem}
                    onChange={(e) => setExternalCertPem(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded p-2 text-[11px] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">Certificate chain PEM (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="-----BEGIN CERTIFICATE-----..."
                    value={externalChainPem}
                    onChange={(e) => setExternalChainPem(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded p-2 text-[11px] font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                disabled={isInstalling}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInstallCertificate}
                disabled={isInstalling}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-[#ec7211] hover:bg-[#eb5f07] text-white rounded transition-colors"
              >
                {isInstalling ? "Installing..." : "Install and activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Toggle Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              {ca.status === "ACTIVE" ? "Disable CA" : "Enable CA"}
            </h2>
            <p className="text-[13px] text-[#545b64]">
              {ca.status === "ACTIVE"
                ? `Disabling ${ca.commonName} prevents it from issuing new certificates.`
                : `Enabling ${ca.commonName} will return it to ACTIVE state.`}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold text-white rounded transition-colors ${
                  ca.status === "ACTIVE" ? "bg-[#d13212] hover:bg-[#af270b]" : "bg-[#1d8102] hover:bg-[#166601]"
                }`}
              >
                {isUpdatingStatus ? "Updating..." : ca.status === "ACTIVE" ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete CA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#d13212]">Delete private CA</h2>
            <p className="text-[13px] text-[#545b64]">
              Deleting <strong>{ca.commonName}</strong> puts it in a DELETED state.
            </p>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#16191f]">
                Permanent deletion retention period (days): <strong>{retentionDays}</strong>
              </label>
              <input
                type="range"
                min={7}
                max={30}
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
                className="w-full accent-[#0073bb]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">
                To confirm deletion, type <code>delete</code>:
              </label>
              <input
                type="text"
                placeholder="delete"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmDeleteText("");
                }}
                disabled={isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCa}
                disabled={confirmDeleteText.trim().toLowerCase() !== "delete" || isDeleting}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className={`px-4 text-[13px] font-bold rounded transition-colors text-white ${
                  confirmDeleteText.trim().toLowerCase() === "delete" && !isDeleting
                    ? "bg-[#d13212] hover:bg-[#af270b]"
                    : "bg-[#d5dbdb] text-[#8d9ba8] cursor-not-allowed"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Restore CA */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Restore private CA</h2>
            <p className="text-[13px] text-[#545b64]">
              Restore <strong>{ca.commonName}</strong> back from DELETED state.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                disabled={isRestoring}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreCa}
                disabled={isRestoring}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-[#1d8102] hover:bg-[#166601] text-white rounded transition-colors"
              >
                {isRestoring ? "Restoring..." : "Restore CA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Revoke Certificate */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleRevokeCertificate} className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#d13212]">Revoke issued certificate</h2>
            <p className="text-[13px] text-[#545b64]">
              Revoke an end-entity certificate issued by <strong>{ca.commonName}</strong>. The certificate will be added to the CRL.
            </p>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">
                Certificate serial number (hex) <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 4195effafc9852e6 or serial from cert"
                value={revokeSerial}
                onChange={(e) => setRevokeSerial(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">Revocation reason</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value as RevocationReason)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white"
              >
                <option value="KEY_COMPROMISE">Key Compromise</option>
                <option value="CA_COMPROMISE">CA Compromise</option>
                <option value="AFFILIATION_CHANGED">Affiliation Changed</option>
                <option value="SUPERSEDED">Superseded</option>
                <option value="CESSATION_OF_OPERATION">Cessation of Operation</option>
                <option value="UNSPECIFIED">Unspecified</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                disabled={isRevoking}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRevoking}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-[#d13212] hover:bg-[#af270b] text-white rounded transition-colors"
              >
                {isRevoking ? "Revoking..." : "Revoke certificate"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
