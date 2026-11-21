/**
 * src/app/acm/certificates/[certificateId]/CertificateDetailClient.tsx – Certificate Details Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACMCertificateDetail, HostedZoneItem } from "../../types";
import {
  deleteCertificateAction,
  addTagsAction,
  removeTagsAction,
  updateCertificateOptionsAction,
  resendValidationEmailAction,
  createRoute53RecordsAction,
} from "../../actions";

interface CertificateDetailClientProps {
  certificate: ACMCertificateDetail;
  hostedZones: HostedZoneItem[];
}

export function CertificateDetailClient({
  certificate,
  hostedZones,
}: CertificateDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Status/Alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoute53Modal, setShowRoute53Modal] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(
    hostedZones.length > 0 ? hostedZones[0].id : ""
  );

  const [showManageTagsModal, setShowManageTagsModal] = useState(false);
  const [tagsList, setTagsList] = useState<Array<{ key: string; value: string }>>(
    certificate.tags || []
  );
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagVal, setNewTagVal] = useState("");

  // Copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasDnsPending = certificate.domainValidationOptions.some(
    (d) => d.validationMethod === "DNS" && d.resourceRecord?.name
  );

  const hasEmailPending = certificate.domainValidationOptions.some(
    (d) => d.validationMethod === "EMAIL"
  );

  // Delete Action
  const handleDeleteConfirm = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await deleteCertificateAction(certificate.certificateArn);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/acm");
      } else {
        setError(res.error || "Failed to delete certificate.");
      }
    });
  };

  // Route 53 Records Action
  const handleCreateRoute53Records = () => {
    if (!selectedZoneId) {
      setError("Please select a Route 53 hosted zone.");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createRoute53RecordsAction(certificate.certificateArn, selectedZoneId);
      if (res.success) {
        setShowRoute53Modal(false);
        setSuccess(`Successfully created ${res.count || 1} DNS validation record(s) in Route 53.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create Route 53 records.");
      }
    });
  };

  // Resend Validation Email Action
  const handleResendEmail = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await resendValidationEmailAction(
        certificate.certificateArn,
        certificate.domainName,
        certificate.domainName
      );
      if (res.success) {
        setSuccess("Validation email resent successfully.");
        router.refresh();
      } else {
        setError(res.error || "Failed to resend validation email.");
      }
    });
  };

  // Transparency Logging Toggle
  const handleToggleLogging = () => {
    const current =
      certificate.options?.certificateTransparencyLoggingPreference === "ENABLED";
    const nextPref = current ? "DISABLED" : "ENABLED";
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateCertificateOptionsAction(certificate.certificateArn, nextPref);
      if (res.success) {
        setSuccess(`Certificate transparency logging updated to ${nextPref}.`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update certificate transparency logging.");
      }
    });
  };

  // Save Tags
  const handleSaveTags = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const currentKeys = (certificate.tags || []).map((t) => t.key);
      const newKeys = tagsList.map((t) => t.key);
      const removedKeys = currentKeys.filter((k) => !newKeys.includes(k));

      if (removedKeys.length > 0) {
        await removeTagsAction(certificate.certificateArn, removedKeys);
      }

      const formattedTags = tagsList.map((t) => ({
        Key: t.key,
        Value: t.value,
      }));

      if (formattedTags.length > 0) {
        const addRes = await addTagsAction(certificate.certificateArn, formattedTags);
        if (!addRes.success) {
          setError(addRes.error || "Failed to update tags.");
          return;
        }
      }

      setShowManageTagsModal(false);
      setSuccess("Tags updated successfully.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/acm" className="text-[#0972d3] hover:underline">
            Certificates
          </Link>{" "}
          &gt; {certificate.domainName}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-[#16191f]">
              {certificate.domainName}
            </h1>
            <span
              className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                certificate.status === "ISSUED"
                  ? "bg-[#f2f8f0] text-[#1d8102]"
                  : certificate.status === "PENDING_VALIDATION"
                  ? "bg-[#fff7e6] text-[#b35900]"
                  : "bg-[#fdf3f1] text-[#d13212]"
              }`}
            >
              {certificate.status === "PENDING_VALIDATION"
                ? "Pending validation"
                : certificate.status === "ISSUED"
                ? "Issued"
                : certificate.status}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#f2f3f3] text-[#545b64] border border-[#eaeded]">
              {certificate.type === "AMAZON_ISSUED"
                ? "Amazon-issued"
                : certificate.type === "IMPORTED"
                ? "Imported"
                : "Private"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasDnsPending && (
              <button
                onClick={() => setShowRoute53Modal(true)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
              >
                Create records in Route 53
              </button>
            )}

            {hasEmailPending && (
              <button
                disabled={isPending}
                onClick={handleResendEmail}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors disabled:opacity-50"
              >
                Resend validation email
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#d13212] text-[#d13212] hover:bg-[#fdf3f1] px-3 rounded transition-colors"
            >
              Delete
            </button>
          </div>
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

      {/* Validation Notice Banner */}
      {certificate.status === "PENDING_VALIDATION" && (
        <div className="bg-[#fff7e6] border border-[#ffcc80] rounded p-4 text-[13px] text-[#804000] flex items-start justify-between">
          <div>
            <div className="font-bold mb-1">Validation in progress</div>
            <div>
              Before AWS Certificate Manager issues this certificate, you must prove that you control
              the requested domains. Add the CNAME records listed below to your DNS configuration.
            </div>
          </div>
          {hasDnsPending && (
            <button
              onClick={() => setShowRoute53Modal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded bg-white border border-[#b35900] text-[#b35900] hover:bg-[#fff2d6]"
            >
              Create records in Route 53
            </button>
          )}
        </div>
      )}

      {/* SECTION 1: Overview */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Certificate overview
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
          <div>
            <dt className="text-[#545b64] mb-1">Domain name</dt>
            <dd className="font-semibold text-[#16191f]">{certificate.domainName}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Certificate ARN</dt>
            <dd className="font-mono text-[#16191f] break-all select-all flex items-center gap-2">
              <span className="truncate">{certificate.certificateArn}</span>
              <button
                onClick={() => copyToClipboard(certificate.certificateArn, "arn")}
                className="text-[#0972d3] text-[11px] hover:underline whitespace-nowrap"
              >
                {copiedField === "arn" ? "Copied" : "Copy"}
              </button>
            </dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Status</dt>
            <dd>
              <span
                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                  certificate.status === "ISSUED"
                    ? "bg-[#f2f8f0] text-[#1d8102]"
                    : certificate.status === "PENDING_VALIDATION"
                    ? "bg-[#fff7e6] text-[#b35900]"
                    : "bg-[#fdf3f1] text-[#d13212]"
                }`}
              >
                {certificate.status === "PENDING_VALIDATION"
                  ? "Pending validation"
                  : certificate.status === "ISSUED"
                  ? "Issued"
                  : certificate.status}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Type</dt>
            <dd className="text-[#16191f]">
              {certificate.type === "AMAZON_ISSUED"
                ? "Amazon-issued"
                : certificate.type === "IMPORTED"
                ? "Imported"
                : "Private"}
            </dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Key algorithm</dt>
            <dd className="font-mono text-[#16191f]">{certificate.keyAlgorithm}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Signature algorithm</dt>
            <dd className="font-mono text-[#16191f]">{certificate.signatureAlgorithm || "—"}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">In use?</dt>
            <dd className="text-[#16191f]">{certificate.inUse ? "Yes" : "No"}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Renewal eligibility</dt>
            <dd className="text-[#16191f]">
              {certificate.renewalEligibility === "ELIGIBLE" ? "Eligible" : "Ineligible"}
            </dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Issuer</dt>
            <dd className="text-[#16191f]">{certificate.issuer || "Amazon"}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Created at</dt>
            <dd className="text-[#16191f]">{certificate.createdAt || "—"}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Not before</dt>
            <dd className="text-[#16191f]">{certificate.notBefore || "—"}</dd>
          </div>

          <div>
            <dt className="text-[#545b64] mb-1">Not after (Expires)</dt>
            <dd className="text-[#16191f]">{certificate.notAfter || "—"}</dd>
          </div>

          {certificate.serial && (
            <div className="md:col-span-2">
              <dt className="text-[#545b64] mb-1">Serial number</dt>
              <dd className="font-mono text-[12px] text-[#16191f] break-all">{certificate.serial}</dd>
            </div>
          )}

          {certificate.failureReason && (
            <div className="md:col-span-2">
              <dt className="text-[#d13212] mb-1">Failure reason</dt>
              <dd className="text-[#d13212] font-semibold">{certificate.failureReason}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* SECTION 2: Domains & Validation Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Domains ({certificate.domainValidationOptions.length})
            </h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Domain names and their corresponding DNS or email validation records.
            </p>
          </div>

          {hasDnsPending && (
            <button
              onClick={() => setShowRoute53Modal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] bg-white text-[#16191f] hover:bg-[#f2f3f3] shadow-sm"
            >
              Create records in Route 53
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Domain name</th>
                <th className="py-2.5 px-4">Validation method</th>
                <th className="py-2.5 px-4">Validation status</th>
                <th className="py-2.5 px-4">CNAME name</th>
                <th className="py-2.5 px-4">CNAME value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {certificate.domainValidationOptions.map((d, index) => (
                <tr key={index} className="hover:bg-[#f2f8fd]">
                  <td className="py-3 px-4 font-semibold text-[#16191f]">{d.domainName}</td>
                  <td className="py-3 px-4 text-[#545b64]">{d.validationMethod || "DNS"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                        d.validationStatus === "SUCCESS"
                          ? "bg-[#f2f8f0] text-[#1d8102]"
                          : d.validationStatus === "PENDING_VALIDATION"
                          ? "bg-[#fff7e6] text-[#b35900]"
                          : "bg-[#fdf3f1] text-[#d13212]"
                      }`}
                    >
                      {d.validationStatus === "PENDING_VALIDATION"
                        ? "Pending validation"
                        : d.validationStatus || "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#16191f]">
                    {d.resourceRecord?.name ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{d.resourceRecord.name}</span>
                        <button
                          onClick={() => copyToClipboard(d.resourceRecord!.name, `cname-name-${index}`)}
                          className="text-[#0972d3] text-[11px] hover:underline"
                        >
                          {copiedField === `cname-name-${index}` ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#16191f]">
                    {d.resourceRecord?.value ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[240px]">{d.resourceRecord.value}</span>
                        <button
                          onClick={() =>
                            copyToClipboard(d.resourceRecord!.value, `cname-val-${index}`)
                          }
                          className="text-[#0972d3] text-[11px] hover:underline"
                        >
                          {copiedField === `cname-val-${index}` ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Certificate Transparency Logging */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
          <h2 className="text-[16px] font-bold text-[#16191f]">Certificate transparency logging</h2>
          {certificate.type === "AMAZON_ISSUED" && certificate.status === "ISSUED" && (
            <button
              onClick={handleToggleLogging}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] bg-white text-[#16191f] hover:bg-[#f2f3f3]"
            >
              Toggle logging
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <div className="text-[#545b64]">Logging preference:</div>
          <span className="font-semibold text-[#16191f]">
            {certificate.options?.certificateTransparencyLoggingPreference || "ENABLED"}
          </span>
        </div>
      </div>

      {/* SECTION 4: Certificate PEM Export / View */}
      {(certificate.certificatePem || certificate.certificateChainPem) && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Certificate body &amp; chain
          </h2>

          {certificate.certificatePem && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#545b64]">
                <span>Certificate body (PEM)</span>
                <button
                  onClick={() => copyToClipboard(certificate.certificatePem!, "certPem")}
                  className="text-[#0972d3] hover:underline"
                >
                  {copiedField === "certPem" ? "Copied" : "Copy certificate"}
                </button>
              </div>
              <pre className="font-mono text-[11px] p-3 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto max-h-48 text-[#16191f]">
                {certificate.certificatePem}
              </pre>
            </div>
          )}

          {certificate.certificateChainPem && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#545b64]">
                <span>Certificate chain (PEM)</span>
                <button
                  onClick={() => copyToClipboard(certificate.certificateChainPem!, "chainPem")}
                  className="text-[#0972d3] hover:underline"
                >
                  {copiedField === "chainPem" ? "Copied" : "Copy chain"}
                </button>
              </div>
              <pre className="font-mono text-[11px] p-3 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto max-h-48 text-[#16191f]">
                {certificate.certificateChainPem}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: Tags */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Tags ({certificate.tags?.length || 0})
          </h2>
          <button
            onClick={() => {
              setTagsList(certificate.tags || []);
              setShowManageTagsModal(true);
            }}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] bg-white text-[#16191f] hover:bg-[#f2f3f3]"
          >
            Manage tags
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Key</th>
                <th className="py-2.5 px-4">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {!certificate.tags || certificate.tags.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-[#545b64]">
                    No tags associated with this certificate.
                  </td>
                </tr>
              ) : (
                certificate.tags.map((t, i) => (
                  <tr key={i} className="hover:bg-[#f2f8fd]">
                    <td className="py-2.5 px-4 font-medium text-[#16191f]">{t.key}</td>
                    <td className="py-2.5 px-4 text-[#545b64]">{t.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Delete Certificate */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#d13212]">Delete certificate</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-[#545b64] font-bold text-lg">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                Deleting this certificate is permanent and cannot be undone. Are you sure you want to delete
                certificate <strong className="text-[#16191f]">{certificate.domainName}</strong>?
              </p>
              <div className="bg-[#fdf3f1] border border-[#d13212] p-3 rounded text-[#d13212]">
                Any services configured to use this certificate will fail to establish secure connections.
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

      {/* MODAL: Create Records in Route 53 */}
      {showRoute53Modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl w-full max-w-lg border border-[#eaeded] overflow-hidden">
            <div className="bg-[#f8f9fa] border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#16191f]">Create records in Route 53</h2>
              <button
                onClick={() => setShowRoute53Modal(false)}
                className="text-[#545b64] font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <p className="text-[#545b64]">
                ACM can create the required CNAME validation records directly in an Amazon Route 53 hosted
                zone in this account.
              </p>

              <div>
                <label className="block font-semibold text-[#16191f] mb-1">
                  Route 53 Hosted Zone
                </label>
                {hostedZones.length === 0 ? (
                  <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded text-[#545b64]">
                    No Route 53 hosted zones found in this account. Create a hosted zone in Route 53 first.
                  </div>
                ) : (
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211] bg-white text-[13px]"
                  >
                    {hostedZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="border border-[#eaeded] rounded p-3 bg-[#fafafa] space-y-2">
                <div className="font-semibold text-[12px] text-[#16191f]">Records to be created:</div>
                {certificate.domainValidationOptions
                  .filter((d) => d.resourceRecord?.name)
                  .map((d, i) => (
                    <div key={i} className="text-[11px] font-mono break-all text-[#545b64]">
                      <strong>{d.resourceRecord!.type}</strong>: {d.resourceRecord!.name} -&gt;{" "}
                      {d.resourceRecord!.value}
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-[#f8f9fa] border-t border-[#eaeded] px-6 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRoute53Modal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded"
              >
                Cancel
              </button>
              <button
                disabled={isPending || hostedZones.length === 0 || !selectedZoneId}
                onClick={handleCreateRoute53Records}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm disabled:opacity-50"
              >
                {isPending ? "Creating records..." : "Create records"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage Tags */}
      {showManageTagsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-[18px] font-bold text-[#16191f]">Manage tags</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newTagVal}
                  onChange={(e) => setNewTagVal(e.target.value)}
                  className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTagKey.trim()) return;
                    setTagsList([...tagsList, { key: newTagKey.trim(), value: newTagVal.trim() }]);
                    setNewTagKey("");
                    setNewTagVal("");
                  }}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] bg-white text-[#16191f] hover:bg-[#f2f3f3]"
                >
                  Add tag
                </button>
              </div>

              <div className="border border-[#eaeded] rounded max-h-48 overflow-y-auto divide-y divide-[#eaeded]">
                {tagsList.length === 0 ? (
                  <div className="p-4 text-center text-[#545b64] text-[12px]">No tags configured.</div>
                ) : (
                  tagsList.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 text-[12px]">
                      <span className="font-mono">
                        <strong>{t.key}</strong>: {t.value || "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTagsList(tagsList.filter((_, i) => i !== idx))}
                        className="text-[#d13212] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowManageTagsModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] bg-white text-[#16191f] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSaveTags}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
