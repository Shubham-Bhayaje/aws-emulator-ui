/**
 * src/app/acm/import/ImportCertificateClient.tsx – ACM Import Certificate Client Component.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { importCertificateAction } from "../actions";

interface TagItem {
  key: string;
  value: string;
}

export function ImportCertificateClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [certificatePem, setCertificatePem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [certificateChainPem, setCertificateChainPem] = useState("");

  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTags([...tags, { key: tagKey.trim(), value: tagVal.trim() }]);
    setTagKey("");
    setTagVal("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    setError(null);

    if (!certificatePem.trim()) {
      setError("Certificate body is required.");
      return;
    }

    if (!certificatePem.includes("BEGIN CERTIFICATE")) {
      setError("Certificate body must be a valid PEM-encoded certificate starting with -----BEGIN CERTIFICATE-----.");
      return;
    }

    if (!privateKeyPem.trim()) {
      setError("Certificate private key is required.");
      return;
    }

    if (!privateKeyPem.includes("BEGIN") || !privateKeyPem.includes("PRIVATE KEY")) {
      setError("Certificate private key must be a valid PEM-encoded private key starting with -----BEGIN PRIVATE KEY----- or -----BEGIN RSA PRIVATE KEY-----.");
      return;
    }

    startTransition(async () => {
      const res = await importCertificateAction({
        certificatePem: certificatePem.trim(),
        privateKeyPem: privateKeyPem.trim(),
        certificateChainPem: certificateChainPem.trim() ? certificateChainPem.trim() : undefined,
        tags,
      });

      if (res.success && res.certificateArn) {
        const certId = res.certificateArn.split("/").pop();
        router.push(`/acm/certificates/${certId}`);
      } else {
        setError(res.error || "Failed to import certificate.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/acm" className="text-[#0972d3] hover:underline">
            Certificates
          </Link>{" "}
          &gt; Import a certificate
        </div>
        <h1 className="text-[20px] font-bold text-[#16191f]">Import a certificate</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          You can import a certificate issued by a third-party Certificate Authority (CA) into ACM.
          You will be able to associate this certificate with integrated AWS services such as Elastic
          Load Balancing and CloudFront.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6 text-[13px]">
        {/* Certificate Body */}
        <div>
          <label className="block font-semibold text-[#16191f]">
            Certificate body <span className="text-[#d13212]">*</span>
          </label>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Paste the PEM-encoded certificate body provided by your Certificate Authority.
          </p>
          <textarea
            rows={7}
            placeholder={`-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----`}
            value={certificatePem}
            onChange={(e) => setCertificatePem(e.target.value)}
            className="mt-2 w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        {/* Certificate Private Key */}
        <div>
          <label className="block font-semibold text-[#16191f]">
            Certificate private key <span className="text-[#d13212]">*</span>
          </label>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Paste the unencrypted PEM-encoded private key that matches the certificate public key.
          </p>
          <textarea
            rows={7}
            placeholder={`-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----`}
            value={privateKeyPem}
            onChange={(e) => setPrivateKeyPem(e.target.value)}
            className="mt-2 w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        {/* Certificate Chain */}
        <div>
          <label className="block font-semibold text-[#16191f]">
            Certificate chain - optional
          </label>
          <p className="text-[12px] text-[#545b64] mt-0.5">
            Paste the intermediate and root certificates in PEM format that establish the trust chain.
          </p>
          <textarea
            rows={6}
            placeholder={`-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----`}
            value={certificateChainPem}
            onChange={(e) => setCertificateChainPem(e.target.value)}
            className="mt-2 w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        {/* Tags */}
        <div className="border-t border-[#eaeded] pt-4 space-y-3">
          <h2 className="text-[15px] font-bold text-[#16191f]">Tags - optional</h2>
          <p className="text-[12px] text-[#545b64]">
            A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
          </p>

          <div className="flex gap-2 max-w-lg">
            <input
              type="text"
              placeholder="Key"
              value={tagKey}
              onChange={(e) => setTagKey(e.target.value)}
              className="flex-1 border border-[#aab7b8] rounded px-3 py-1 focus:outline-none focus:border-[#ec7211]"
            />
            <input
              type="text"
              placeholder="Value"
              value={tagVal}
              onChange={(e) => setTagVal(e.target.value)}
              className="flex-1 border border-[#aab7b8] rounded px-3 py-1 focus:outline-none focus:border-[#ec7211]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded"
            >
              Add tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="mt-3 border border-[#eaeded] rounded max-w-lg divide-y divide-[#eaeded]">
              {tags.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white">
                  <span className="font-mono text-[12px]">
                    <strong>{t.key}</strong>: {t.value || "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-[#d13212] hover:underline text-[12px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/acm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={handleImport}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-6 rounded shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Importing..." : "Import certificate"}
          </button>
        </div>
      </div>
    </div>
  );
}
