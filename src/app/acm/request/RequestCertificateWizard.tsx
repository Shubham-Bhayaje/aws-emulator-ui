/**
 * src/app/acm/request/RequestCertificateWizard.tsx – ACM Request Certificate Multi-step Wizard.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestCertificateAction } from "../actions";

interface TagItem {
  key: string;
  value: string;
}

export function RequestCertificateWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Certificate Type
  const [certType, setCertType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Step 2: Public Certificate details
  const [domainName, setDomainName] = useState("");
  const [sans, setSans] = useState<string[]>([]);
  const [validationMethod, setValidationMethod] = useState<"DNS" | "EMAIL">("DNS");
  const [keyAlgorithm, setKeyAlgorithm] = useState<
    "RSA_2048" | "RSA_3072" | "RSA_4096" | "ECDSA_P256" | "ECDSA_P384" | "ECDSA_P521"
  >("RSA_2048");
  const [transparencyLogging, setTransparencyLogging] = useState(true);

  // Tags
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKey, setTagKey] = useState("");
  const [tagVal, setTagVal] = useState("");

  const [error, setError] = useState<string | null>(null);

  // SAN Handlers
  const handleAddSan = () => {
    if (sans.length < 10) {
      setSans([...sans, ""]);
    }
  };

  const handleUpdateSan = (index: number, val: string) => {
    const updated = [...sans];
    updated[index] = val;
    setSans(updated);
  };

  const handleRemoveSan = (index: number) => {
    setSans(sans.filter((_, i) => i !== index));
  };

  // Tag Handlers
  const handleAddTag = () => {
    if (!tagKey.trim()) return;
    setTags([...tags, { key: tagKey.trim(), value: tagVal.trim() }]);
    setTagKey("");
    setTagVal("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setError(null);
    if (certType === "PRIVATE") {
      setError(
        "Requesting a private certificate requires an active AWS Private CA. To request a public certificate, choose 'Request a public certificate'."
      );
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    setError(null);

    const trimmedDomain = domainName.trim();
    if (!trimmedDomain) {
      setError("Fully qualified domain name is required.");
      return;
    }

    const filteredSans = sans.map((s) => s.trim()).filter(Boolean);

    startTransition(async () => {
      const res = await requestCertificateAction({
        domainName: trimmedDomain,
        subjectAlternativeNames: filteredSans.length > 0 ? filteredSans : undefined,
        validationMethod,
        keyAlgorithm,
        options: {
          certificateTransparencyLoggingPreference: transparencyLogging ? "ENABLED" : "DISABLED",
        },
        tags,
      });

      if (res.success && res.certificateArn) {
        const certId = res.certificateArn.split("/").pop();
        router.push(`/acm/certificates/${certId}`);
      } else {
        setError(res.error || "Failed to request certificate.");
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
          &gt; Request a certificate
        </div>
        <h1 className="text-[20px] font-bold text-[#16191f]">Request a certificate</h1>
      </div>

      {/* Stepper */}
      <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                step === 1
                  ? "bg-[#ec7211] text-white"
                  : "bg-[#1d8102] text-white"
              }`}
            >
              {step > 1 ? "✓" : "1"}
            </div>
            <span
              className={`text-[13px] ${
                step === 1 ? "font-bold text-[#16191f]" : "text-[#545b64]"
              }`}
            >
              Choose certificate type
            </span>
          </div>

          <div className="w-12 h-0.5 bg-[#eaeded]" />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                step === 2
                  ? "bg-[#ec7211] text-white"
                  : "bg-[#eaeded] text-[#545b64]"
              }`}
            >
              2
            </div>
            <span
              className={`text-[13px] ${
                step === 2 ? "font-bold text-[#16191f]" : "text-[#545b64]"
              }`}
            >
              Request public certificate
            </span>
          </div>
        </div>
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

      {/* STEP 1: Choose Certificate Type */}
      {step === 1 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Certificate type</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Choose the type of certificate to request. Public certificates are issued by ACM for
              internet-facing domains.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="certType"
                checked={certType === "PUBLIC"}
                onChange={() => setCertType("PUBLIC")}
                className="mt-1 text-[#ec7211] focus:ring-0"
              />
              <div>
                <div className="font-semibold text-[13px] text-[#16191f]">
                  Request a public certificate
                </div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Use a public certificate to identify your website and secure network communications
                  over TLS/SSL. Public certificates issued by ACM are trusted by most modern browsers
                  and applications.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
              <input
                type="radio"
                name="certType"
                checked={certType === "PRIVATE"}
                onChange={() => setCertType("PRIVATE")}
                className="mt-1 text-[#ec7211] focus:ring-0"
              />
              <div>
                <div className="font-semibold text-[13px] text-[#16191f]">
                  Request a private certificate
                </div>
                <div className="text-[12px] text-[#545b64] mt-0.5">
                  Use a private certificate to identify private resources in your organization. Requires
                  an active AWS Private CA.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
            <Link
              href="/acm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleNext}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Request Public Certificate */}
      {step === 2 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6 text-[13px]">
          {/* Domain Names */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-[#16191f]">
                Fully qualified domain name (FQDN) <span className="text-[#d13212]">*</span>
              </label>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Enter the primary fully qualified domain name to secure, such as <code>example.com</code>{" "}
                or <code>*.example.com</code>.
              </p>
              <input
                type="text"
                placeholder="example.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="mt-2 w-full max-w-lg border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
              />
            </div>

            {/* SANs */}
            {sans.map((san, index) => (
              <div key={index} className="flex items-center gap-2 max-w-lg">
                <input
                  type="text"
                  placeholder={`Alternative domain (e.g. www.example.com)`}
                  value={san}
                  onChange={(e) => handleUpdateSan(index, e.target.value)}
                  className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSan(index)}
                  className="text-[#d13212] hover:underline text-[12px] px-2 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={handleAddSan}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
              >
                Add another name to this certificate
              </button>
            </div>
          </div>

          {/* Validation Method */}
          <div className="border-t border-[#eaeded] pt-4 space-y-3">
            <h2 className="text-[15px] font-bold text-[#16191f]">Select validation method</h2>
            <p className="text-[12px] text-[#545b64]">
              Before AWS Certificate Manager issues a certificate, it validates that you control the domain names.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="valMethod"
                  checked={validationMethod === "DNS"}
                  onChange={() => setValidationMethod("DNS")}
                  className="mt-1 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">
                    DNS validation - recommended
                  </div>
                  <div className="text-[12px] text-[#545b64]">
                    ACM generates CNAME records to add to your DNS configuration. ACM validates ownership automatically.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="valMethod"
                  checked={validationMethod === "EMAIL"}
                  onChange={() => setValidationMethod("EMAIL")}
                  className="mt-1 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">Email validation</div>
                  <div className="text-[12px] text-[#545b64]">
                    ACM sends validation emails to the registered WHOIS contacts and 5 common domain administrative addresses.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Key Algorithm */}
          <div className="border-t border-[#eaeded] pt-4 space-y-2">
            <h2 className="text-[15px] font-bold text-[#16191f]">Key algorithm</h2>
            <p className="text-[12px] text-[#545b64]">
              Choose the cryptographic algorithm and key length for the certificate.
            </p>

            <select
              value={keyAlgorithm}
              onChange={(e) => setKeyAlgorithm(e.target.value as any)}
              className="w-full max-w-md border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] bg-white focus:outline-none focus:border-[#ec7211]"
            >
              <option value="RSA_2048">RSA 2048 (Universal compatibility - recommended)</option>
              <option value="RSA_3072">RSA 3072</option>
              <option value="RSA_4096">RSA 4096</option>
              <option value="ECDSA_P256">ECDSA P-256 (Fast, modern)</option>
              <option value="ECDSA_P384">ECDSA P-384</option>
              <option value="ECDSA_P521">ECDSA P-521</option>
            </select>
          </div>

          {/* Certificate Transparency Logging */}
          <div className="border-t border-[#eaeded] pt-4 space-y-2">
            <h2 className="text-[15px] font-bold text-[#16191f]">Certificate transparency logging</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={transparencyLogging}
                onChange={(e) => setTransparencyLogging(e.target.checked)}
                className="text-[#ec7211] focus:ring-0"
              />
              <span className="text-[#16191f]">
                Log certificate to a public certificate transparency log (recommended)
              </span>
            </label>
            <p className="text-[12px] text-[#545b64]">
              Certificate transparency logging helps prevent domain spoofing and malicious issuance.
            </p>
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
                placeholder="Key (e.g. Environment)"
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1 focus:outline-none focus:border-[#ec7211]"
              />
              <input
                type="text"
                placeholder="Value (e.g. Production)"
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
              onClick={() => setStep(1)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-6 rounded shadow-sm transition-colors disabled:opacity-50"
            >
              {isPending ? "Requesting..." : "Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
