/**
 * src/app/acm/CertificatesClient.tsx – ACM Certificates List Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACMCertificateSummary } from "./types";
import { deleteCertificateAction } from "./actions";

interface CertificatesClientProps {
  initialCertificates: ACMCertificateSummary[];
}

export function CertificatesClient({ initialCertificates }: CertificatesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedArn, setSelectedArn] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  // Modals & Feedback
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCert = initialCertificates.find((c) => c.certificateArn === selectedArn);

  // Filter logic
  const filteredCertificates = initialCertificates.filter((c) => {
    const term = search.toLowerCase();
    const domainMatch = c.domainName.toLowerCase().includes(term);
    const idMatch = c.certificateId.toLowerCase().includes(term);
    const arnMatch = c.certificateArn.toLowerCase().includes(term);
    const sansMatch = (c.subjectAlternativeNameSummaries || []).some((s) =>
      s.toLowerCase().includes(term)
    );
    const matchesSearch = !search || domainMatch || idMatch || arnMatch || sansMatch;

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesType = typeFilter === "ALL" || c.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const issuedCount = initialCertificates.filter((c) => c.status === "ISSUED").length;
  const pendingCount = initialCertificates.filter((c) => c.status === "PENDING_VALIDATION").length;
  const failedCount = initialCertificates.filter(
    (c) => c.status === "FAILED" || c.status === "EXPIRED" || c.status === "REVOKED"
  ).length;

  const handleDeleteConfirm = () => {
    if (!selectedArn) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteCertificateAction(selectedArn);
      if (res.success) {
        setShowDeleteModal(false);
        setSelectedArn(null);
        setSuccess(`Certificate ${selectedCert?.domainName || selectedArn} deleted.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete certificate.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">
            Certificates ({initialCertificates.length})
          </h1>
          <p className="text-[13px] text-[#545b64] mt-1 max-w-4xl">
            AWS Certificate Manager (ACM) makes it easy to provision, manage, and deploy public and
            private SSL/TLS certificates for use with AWS services and your internal connected resources.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Total Certificates
          </div>
          <div className="text-[24px] font-bold text-[#16191f] mt-1">
            {initialCertificates.length}
          </div>
          <div className="text-[12px] text-[#545b64] mt-1">Managed in this AWS Region</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Issued
          </div>
          <div className="text-[24px] font-bold text-[#1d8102] mt-1">{issuedCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Active and valid for HTTPS</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Pending Validation
          </div>
          <div className="text-[24px] font-bold text-[#ec7211] mt-1">{pendingCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Awaiting DNS or email verification</div>
        </div>
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
          <div className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
            Failed / Expired
          </div>
          <div className="text-[24px] font-bold text-[#d13212] mt-1">{failedCount}</div>
          <div className="text-[12px] text-[#545b64] mt-1">Require renewal or re-request</div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Filter by domain or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] bg-white focus:outline-none focus:border-[#ec7211]"
            >
              <option value="ALL">All statuses</option>
              <option value="ISSUED">Issued</option>
              <option value="PENDING_VALIDATION">Pending validation</option>
              <option value="FAILED">Failed</option>
              <option value="EXPIRED">Expired</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] bg-white focus:outline-none focus:border-[#ec7211]"
            >
              <option value="ALL">All types</option>
              <option value="AMAZON_ISSUED">Amazon-issued</option>
              <option value="IMPORTED">Imported</option>
              <option value="PRIVATE">Private</option>
            </select>

            <button
              onClick={() => router.refresh()}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Refresh
            </button>

            {selectedCert && (
              <span className="text-[12px] text-[#545b64] bg-[#f2f3f3] px-2.5 py-1 rounded border border-[#eaeded]">
                Selected: <span className="font-bold text-[#16191f]">{selectedCert.domainName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Actions dropdown */}
            <div className="relative">
              <button
                disabled={!selectedCert}
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actions
                <span className="ml-1 text-[10px]">▼</span>
              </button>

              {actionMenuOpen && selectedCert && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white border border-[#eaeded] rounded shadow-lg py-1 z-30 text-[13px]"
                  onMouseLeave={() => setActionMenuOpen(false)}
                >
                  <Link
                    href={`/acm/certificates/${selectedCert.certificateId}`}
                    className="block w-full text-left px-4 py-2 hover:bg-[#f2f8fc] text-[#16191f]"
                  >
                    View details
                  </Link>

                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#fdf3f1] text-[#d13212]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Import a certificate */}
            <Link
              href="/acm/import"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Import a certificate
            </Link>

            {/* Request a certificate */}
            <Link
              href="/acm/request"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Request a certificate
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] font-semibold text-[#545b64] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-[40px]"></th>
                <th className="py-2.5 px-4">Domain name</th>
                <th className="py-2.5 px-4">Certificate ID</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">In use?</th>
                <th className="py-2.5 px-4">Renewal eligibility</th>
                <th className="py-2.5 px-4">Key algorithm</th>
                <th className="py-2.5 px-4">Created at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredCertificates.map((c) => {
                const isSelected = selectedArn === c.certificateArn;

                return (
                  <tr
                    key={c.certificateArn}
                    onClick={() => setSelectedArn(isSelected ? null : c.certificateArn)}
                    className={`hover:bg-[#f2f8fc] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#ebf4fa]" : ""
                    }`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="selectedCert"
                        checked={isSelected}
                        onChange={() => setSelectedArn(isSelected ? null : c.certificateArn)}
                        className="text-[#ec7211] focus:ring-0"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      <Link
                        href={`/acm/certificates/${c.certificateId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#0972d3] hover:underline"
                      >
                        {c.domainName}
                      </Link>
                      {c.subjectAlternativeNameSummaries &&
                        c.subjectAlternativeNameSummaries.length > 1 && (
                          <div className="text-[11px] text-[#545b64] font-normal mt-0.5">
                            +{c.subjectAlternativeNameSummaries.length - 1} additional names
                          </div>
                        )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px]">
                      <Link
                        href={`/acm/certificates/${c.certificateId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#545b64] hover:text-[#16191f] hover:underline"
                      >
                        {c.certificateId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                          c.status === "ISSUED"
                            ? "bg-[#f2f8f0] text-[#1d8102]"
                            : c.status === "PENDING_VALIDATION"
                            ? "bg-[#fff7e6] text-[#b35900]"
                            : "bg-[#fdf3f1] text-[#d13212]"
                        }`}
                      >
                        {c.status === "PENDING_VALIDATION"
                          ? "Pending validation"
                          : c.status === "ISSUED"
                          ? "Issued"
                          : c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">
                      {c.type === "AMAZON_ISSUED"
                        ? "Amazon-issued"
                        : c.type === "IMPORTED"
                        ? "Imported"
                        : "Private"}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{c.inUse ? "Yes" : "No"}</td>
                    <td className="py-3 px-4 text-[#545b64]">
                      {c.renewalEligibility === "ELIGIBLE" ? "Eligible" : "Ineligible"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-[#545b64]">
                      {c.keyAlgorithm}
                    </td>
                    <td className="py-3 px-4 text-[#545b64]">{c.createdAt || "-"}</td>
                  </tr>
                );
              })}
              {filteredCertificates.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#545b64]">
                    No certificates found in this Region. Choose &quot;Request a certificate&quot; or
                    &quot;Import a certificate&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Delete Certificate */}
      {showDeleteModal && selectedCert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Delete certificate</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#545b64] font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Deleting this certificate is permanent and cannot be undone. Are you sure you want to delete
                certificate <strong className="text-[#16191f]">{selectedCert.domainName}</strong> (
                <span className="font-mono">{selectedCert.certificateId}</span>)?
              </p>
              <div className="bg-[#fdf3f1] border border-[#d13212] p-3 rounded text-[#d13212]">
                Any services configured to use this certificate will fail to establish secure TLS/SSL
                connections once it is deleted.
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={handleDeleteConfirm}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#d13212] hover:bg-[#b02a0f] text-white px-4 rounded shadow-sm disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
