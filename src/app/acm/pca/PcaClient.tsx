/**
 * src/app/acm/pca/PcaClient.tsx – AWS Private CA Dashboard.
 * 100% backed by the live AWS emulator client (@aws-sdk/client-acm-pca).
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CertificateAuthoritySummary,
  CertificateAuthorityStatus,
  CertificateAuthorityType,
} from "./types";
import {
  listCertificateAuthoritiesAction,
  installRootCaCertificateAction,
  updateCertificateAuthorityStatusAction,
  deleteCertificateAuthorityAction,
  restoreCertificateAuthorityAction,
} from "./actions";

interface PcaClientProps {
  initialCas: CertificateAuthoritySummary[];
}

export function PcaClient({ initialCas }: PcaClientProps) {
  const router = useRouter();
  const [cas, setCas] = useState<CertificateAuthoritySummary[]>(initialCas);
  const [selectedArn, setSelectedArn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal States
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installValidityYears, setInstallValidityYears] = useState(10);
  const [isInstalling, setIsInstalling] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState(7);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  const selectedCa = useMemo(() => {
    return cas.find((c) => c.arn === selectedArn) || null;
  }, [cas, selectedArn]);

  // Metrics
  const metrics = useMemo(() => {
    const total = cas.length;
    const active = cas.filter((c) => c.status === "ACTIVE").length;
    const pending = cas.filter((c) => c.status === "PENDING_CERTIFICATE").length;
    const disabledOrDeleted = cas.filter((c) => c.status === "DISABLED" || c.status === "DELETED").length;
    return { total, active, pending, disabledOrDeleted };
  }, [cas]);

  // Filtered List
  const filteredCas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return cas.filter((ca) => {
      if (statusFilter !== "ALL" && ca.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && ca.type !== typeFilter) return false;
      if (!q) return true;

      const matchName = ca.commonName.toLowerCase().includes(q);
      const matchArn = ca.arn.toLowerCase().includes(q);
      const matchOrg = (ca.organization || "").toLowerCase().includes(q);
      return matchName || matchArn || matchOrg;
    });
  }, [cas, searchQuery, statusFilter, typeFilter]);

  async function handleRefresh() {
    setIsLoading(true);
    const res = await listCertificateAuthoritiesAction();
    setIsLoading(false);
    if (res.success) {
      setCas(res.certificateAuthorities);
    } else {
      setNotification({ type: "error", message: res.error || "Failed to refresh CAs" });
    }
  }

  // Install Root CA Certificate
  async function handleInstallRootCa() {
    if (!selectedCa) return;
    setIsInstalling(true);
    setNotification(null);

    const res = await installRootCaCertificateAction(
      selectedCa.arn,
      installValidityYears,
      (selectedCa.signingAlgorithm as any) || "SHA256WITHRSA"
    );

    setIsInstalling(false);
    setShowInstallModal(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: `Root CA certificate installed successfully. CA is now ACTIVE.`,
      });
      handleRefresh();
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to install CA certificate",
      });
    }
  }

  // Toggle Active / Disabled
  async function handleToggleStatus() {
    if (!selectedCa) return;
    setIsUpdatingStatus(true);
    setNotification(null);

    const newStatus = selectedCa.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const res = await updateCertificateAuthorityStatusAction(selectedCa.arn, newStatus);

    setIsUpdatingStatus(false);
    setShowStatusModal(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: `Certificate Authority is now ${newStatus}.`,
      });
      handleRefresh();
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to update CA status",
      });
    }
  }

  // Delete CA
  async function handleDeleteCa() {
    if (!selectedCa) return;
    setIsDeleting(true);
    setNotification(null);

    const res = await deleteCertificateAuthorityAction(selectedCa.arn, retentionDays);
    setIsDeleting(false);
    setShowDeleteModal(false);
    setConfirmDeleteText("");

    if (res.success) {
      setNotification({
        type: "success",
        message: `Certificate Authority scheduled for deletion (Retention: ${retentionDays} days).`,
      });
      handleRefresh();
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to delete CA",
      });
    }
  }

  // Restore CA
  async function handleRestoreCa() {
    if (!selectedCa) return;
    setIsRestoring(true);
    setNotification(null);

    const res = await restoreCertificateAuthorityAction(selectedCa.arn);
    setIsRestoring(false);
    setShowRestoreModal(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: `Certificate Authority restored successfully. Status is now DISABLED.`,
      });
      handleRefresh();
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to restore CA",
      });
    }
  }

  function getStatusBadge(status: CertificateAuthorityStatus) {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1d8102]"></span>
            Active
          </span>
        );
      case "PENDING_CERTIFICATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#fff8e1] text-[#b7791f] border border-[#f6e05e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b7791f]"></span>
            Pending certificate
          </span>
        );
      case "DISABLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#545b64]"></span>
            Disabled
          </span>
        );
      case "DELETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#fdf2f2] text-[#d13212] border border-[#f8b4b4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d13212]"></span>
            Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
            {status}
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Breadcrumbs */}
      <div className="text-[12px] text-[#545b64]">
        AWS Management Console &gt; Certificate Manager &gt; Private CAs
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Private certificate authorities</h1>
          <p className="text-[14px] text-[#545b64] mt-1">
            Create and manage private certificate authorities (CAs) to issue internal SSL/TLS certificates for VPCs, microservices, and connected devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/acm/pca/create"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Create CA
          </Link>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">Total CAs</div>
          <div className="text-[28px] font-bold text-[#16191f] mt-1">{metrics.total}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">Active CAs</div>
          <div className="text-[28px] font-bold text-[#1d8102] mt-1">{metrics.active}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">Pending Certificate</div>
          <div className="text-[28px] font-bold text-[#b7791f] mt-1">{metrics.pending}</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4">
          <div className="text-[12px] font-bold text-[#545b64] uppercase tracking-wide">Disabled / Deleted</div>
          <div className="text-[28px] font-bold text-[#545b64] mt-1">{metrics.disabledOrDeleted}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-xs overflow-hidden">
        {/* Table Filter & Action Bar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <input
              type="text"
              placeholder="Search by CA name, ARN, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] w-full max-w-sm focus:outline-none focus:border-[#0073bb]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white text-[#16191f] focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_CERTIFICATE">Pending certificate</option>
              <option value="DISABLED">Disabled</option>
              <option value="DELETED">Deleted</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white text-[#16191f] focus:outline-none focus:border-[#0073bb]"
            >
              <option value="ALL">All types</option>
              <option value="ROOT">Root</option>
              <option value="SUBORDINATE">Subordinate</option>
            </select>
          </div>

          {/* Action Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={!selectedCa}
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded transition-colors ${
                selectedCa
                  ? "bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3]"
                  : "bg-[#f2f3f3] border border-[#d5dbdb] text-[#8d9ba8] cursor-not-allowed"
              }`}
            >
              Actions
              <svg className="ml-1.5 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showActionsDropdown && selectedCa && (
              <div
                className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded shadow-lg z-20 py-1"
                onMouseLeave={() => setShowActionsDropdown(false)}
              >
                <Link
                  href={`/acm/pca/${encodeURIComponent(selectedCa.arn)}`}
                  className="block px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  onClick={() => setShowActionsDropdown(false)}
                >
                  View details
                </Link>

                {selectedCa.status === "PENDING_CERTIFICATE" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowInstallModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#0073bb] font-semibold hover:bg-[#f2f3f3]"
                  >
                    Install CA certificate
                  </button>
                )}

                {selectedCa.status === "ACTIVE" && (
                  <Link
                    href={`/acm/pca/${encodeURIComponent(selectedCa.arn)}?tab=issue`}
                    className="block px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                    onClick={() => setShowActionsDropdown(false)}
                  >
                    Issue certificate
                  </Link>
                )}

                {(selectedCa.status === "ACTIVE" || selectedCa.status === "DISABLED") && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowStatusModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#16191f] hover:bg-[#f2f3f3]"
                  >
                    {selectedCa.status === "ACTIVE" ? "Disable CA" : "Enable CA"}
                  </button>
                )}

                {selectedCa.status !== "DELETED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#d13212] hover:bg-[#fdf2f2]"
                  >
                    Delete CA
                  </button>
                )}

                {selectedCa.status === "DELETED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowRestoreModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#1d8102] hover:bg-[#f2f8f0]"
                  >
                    Restore CA
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-bold">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3">CA Common Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Key Algorithm</th>
                <th className="py-2.5 px-3">Organization</th>
                <th className="py-2.5 px-3">Created At</th>
                <th className="py-2.5 px-3">Expires At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredCas.map((ca) => {
                const isSelected = selectedArn === ca.arn;
                return (
                  <tr
                    key={ca.arn}
                    onClick={() => setSelectedArn(ca.arn)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedArn(ca.arn)}
                        className="cursor-pointer text-[#0073bb] focus:ring-[#0073bb]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/acm/pca/${encodeURIComponent(ca.arn)}`}
                        className="font-bold text-[#0073bb] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ca.commonName}
                      </Link>
                      <div className="text-[11px] text-[#545b64] font-mono truncate max-w-xs">{ca.arn}</div>
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(ca.status)}</td>
                    <td className="py-3 px-3 font-medium">{ca.type}</td>
                    <td className="py-3 px-3 text-[#545b64] font-mono">{ca.keyAlgorithm || "-"}</td>
                    <td className="py-3 px-3 text-[#545b64]">{ca.organization || "-"}</td>
                    <td className="py-3 px-3 text-[#545b64] whitespace-nowrap">{ca.createdAt || "-"}</td>
                    <td className="py-3 px-3 text-[#545b64] whitespace-nowrap">{ca.notAfter || "-"}</td>
                  </tr>
                );
              })}

              {filteredCas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#545b64]">
                    <div className="font-bold text-[14px] text-[#16191f]">No certificate authorities found</div>
                    <p className="text-[13px] text-[#545b64] mt-1">
                      {cas.length === 0
                        ? "You do not have any private certificate authorities in this region. Get started by creating your first CA."
                        : "No CAs matched your search and filter criteria."}
                    </p>
                    {cas.length === 0 && (
                      <Link
                        href="/acm/pca/create"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        className="mt-4 inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
                      >
                        Create CA
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#f8f9fa] border-t border-[#eaeded] text-[12px] text-[#545b64] flex items-center justify-between">
          <span>
            Showing <strong>{filteredCas.length}</strong> of {cas.length} certificate authorities
          </span>
          <span>Region: us-east-1 (Local Emulator)</span>
        </div>
      </div>

      {/* MODAL 1: Install Root CA Certificate */}
      {showInstallModal && selectedCa && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Install Root CA certificate</h2>
            <p className="text-[13px] text-[#545b64]">
              Install a self-signed Root CA certificate to activate <strong>{selectedCa.commonName}</strong>. Once installed, this CA will become ACTIVE and can issue subordinate or end-entity certificates.
            </p>

            <div className="bg-[#f2f8fd] border border-[#0073bb] p-3 rounded text-[12px] text-[#16191f]">
              <div className="font-bold text-[#0073bb] mb-1">Self-Signed Root Certificate Configuration</div>
              <div>Template: <code>arn:aws:acm-pca:::template/RootCACertificate/V1</code></div>
              <div>Signing Algorithm: <code>{selectedCa.signingAlgorithm || "SHA256WITHRSA"}</code></div>
            </div>

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
              <p className="text-[11px] text-[#545b64]">Default is 10 years (3650 days).</p>
            </div>

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
                onClick={handleInstallRootCa}
                disabled={isInstalling}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 text-[13px] font-bold bg-[#ec7211] hover:bg-[#eb5f07] text-white rounded transition-colors"
              >
                {isInstalling ? "Installing & Activating..." : "Install and activate CA"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Toggle Status (Disable / Enable) */}
      {showStatusModal && selectedCa && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              {selectedCa.status === "ACTIVE" ? "Disable CA" : "Enable CA"}
            </h2>
            <p className="text-[13px] text-[#545b64]">
              {selectedCa.status === "ACTIVE"
                ? `Are you sure you want to disable ${selectedCa.commonName}? A disabled CA cannot issue new certificates or respond to certificate validation requests.`
                : `Are you sure you want to enable ${selectedCa.commonName}? The CA will become ACTIVE and resume issuing certificates.`}
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
                className={`px-4 text-[13px] font-bold rounded transition-colors text-white ${
                  selectedCa.status === "ACTIVE"
                    ? "bg-[#d13212] hover:bg-[#af270b]"
                    : "bg-[#1d8102] hover:bg-[#166601]"
                }`}
              >
                {isUpdatingStatus ? "Updating..." : selectedCa.status === "ACTIVE" ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete CA */}
      {showDeleteModal && selectedCa && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#d13212]">Delete private CA</h2>
            <p className="text-[13px] text-[#545b64]">
              Deleting <strong>{selectedCa.commonName}</strong> puts it in a DELETED state. You can restore the CA at any time before the retention period expires.
            </p>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[#16191f]">
                Permanent deletion restoration period (days): <strong>{retentionDays}</strong>
              </label>
              <input
                type="range"
                min={7}
                max={30}
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
                className="w-full accent-[#0073bb]"
              />
              <div className="flex justify-between text-[11px] text-[#545b64]">
                <span>7 days (minimum)</span>
                <span>30 days (maximum)</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">
                To confirm deletion, type <code>delete</code> in the box below:
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
      {showRestoreModal && selectedCa && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Restore private CA</h2>
            <p className="text-[13px] text-[#545b64]">
              Restore <strong>{selectedCa.commonName}</strong> back from the DELETED state. The CA will be restored to the DISABLED state, after which you can re-enable it.
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
    </div>
  );
}
