/**
 * src/app/acm/pca/create/CreateCaWizardClient.tsx – Create Private CA Wizard.
 * 6-step authentic AWS console wizard matching real AWS Certificate Manager Private CA.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CertificateAuthorityType,
  KeyAlgorithm,
  SigningAlgorithm,
  S3BucketOption,
  CreateCertificateAuthorityInput,
} from "../types";
import { createCertificateAuthorityAction } from "../actions";

interface CreateCaWizardClientProps {
  availableBuckets: S3BucketOption[];
}

export function CreateCaWizardClient({ availableBuckets }: CreateCaWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [caType, setCaType] = useState<CertificateAuthorityType>("ROOT");

  // Subject DN
  const [commonName, setCommonName] = useState("");
  const [organization, setOrganization] = useState("");
  const [organizationalUnit, setOrganizationalUnit] = useState("");
  const [country, setCountry] = useState("US");
  const [stateName, setStateName] = useState("");
  const [locality, setLocality] = useState("");

  // Key Algorithm & Signing Algorithm
  const [keyAlgorithm, setKeyAlgorithm] = useState<KeyAlgorithm>("RSA_2048");
  const [signingAlgorithm, setSigningAlgorithm] = useState<SigningAlgorithm>("SHA256WITHRSA");

  // Revocation (CRL)
  const [enableCrl, setEnableCrl] = useState(false);
  const [crlExpirationDays, setCrlExpirationDays] = useState(7);
  const [crlS3Bucket, setCrlS3Bucket] = useState(availableBuckets[0]?.name || "");
  const [crlCustomCname, setCrlCustomCname] = useState("");

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: "Environment", value: "Development" },
  ]);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validation
  function validateStep(step: number): boolean {
    setErrorMsg(null);
    if (step === 2) {
      if (!commonName.trim()) {
        setErrorMsg("Common name (CN) is required.");
        return false;
      }
      if (country.trim().length !== 2) {
        setErrorMsg("Country code must be exactly 2 characters (e.g. US).");
        return false;
      }
    }
    if (step === 4 && enableCrl) {
      if (!crlS3Bucket.trim()) {
        setErrorMsg("Please select or specify an S3 bucket for CRL storage.");
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  }

  function handleBack() {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  function handleAddTag() {
    setTags([...tags, { key: "", value: "" }]);
  }

  function handleRemoveTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }

  function handleTagChange(idx: number, field: "key" | "value", val: string) {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  }

  async function handleCreateCa() {
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: CreateCertificateAuthorityInput = {
      type: caType,
      subject: {
        commonName: commonName.trim(),
        organization: organization.trim() || undefined,
        organizationalUnit: organizationalUnit.trim() || undefined,
        country: country.trim() || undefined,
        state: stateName.trim() || undefined,
        locality: locality.trim() || undefined,
      },
      keyAlgorithm,
      signingAlgorithm,
      crlConfiguration: enableCrl
        ? {
            enabled: true,
            expirationInDays: crlExpirationDays,
            customCname: crlCustomCname.trim() || undefined,
            s3BucketName: crlS3Bucket.trim() || undefined,
          }
        : undefined,
      tags: tags.filter((t) => t.key.trim().length > 0),
    };

    const res = await createCertificateAuthorityAction(payload);
    setIsSubmitting(false);

    if (res.success && res.certificateAuthorityArn) {
      router.push(`/acm/pca/${encodeURIComponent(res.certificateAuthorityArn)}`);
    } else {
      setErrorMsg(res.error || "Failed to create Certificate Authority");
    }
  }

  const steps = [
    { num: 1, label: "Select CA type" },
    { num: 2, label: "Configure subject name" },
    { num: 3, label: "Key algorithms" },
    { num: 4, label: "Configure revocation" },
    { num: 5, label: "Tags" },
    { num: 6, label: "Review and create" },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Breadcrumbs */}
      <div className="text-[12px] text-[#545b64]">
        <Link href="/acm/pca" className="text-[#0073bb] hover:underline">
          Private CAs
        </Link>{" "}
        &gt; Create private CA
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Create private CA</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          Configure a private certificate authority (CA) to establish an internal Public Key Infrastructure (PKI).
        </p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border border-[#eaeded] rounded p-4 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        {steps.map((st) => (
          <div key={st.num} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${
                currentStep === st.num
                  ? "bg-[#0972d3] text-white"
                  : currentStep > st.num
                  ? "bg-[#1d8102] text-white"
                  : "bg-[#eaeded] text-[#545b64]"
              }`}
            >
              {currentStep > st.num ? "✓" : st.num}
            </span>
            <span
              className={`text-[13px] ${
                currentStep === st.num ? "font-bold text-[#16191f]" : "text-[#545b64]"
              }`}
            >
              {st.label}
            </span>
            {st.num < 6 && <span className="text-[#aab7b8] ml-2 hidden md:inline">&gt;</span>}
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-[#fdf2f2] border border-[#d13212] p-3 rounded text-[13px] text-[#d13212]">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Select CA Type */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Step 1: Select CA type</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Choose whether to create a Root CA (self-signed top of trust chain) or a Subordinate CA (signed by a parent CA).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`border rounded-lg p-5 cursor-pointer transition-all flex flex-col justify-between ${
                caType === "ROOT"
                  ? "border-2 border-[#0972d3] bg-[#f2f8fd]"
                  : "border-[#d5dbdb] hover:border-[#aab7b8] bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[15px] text-[#16191f]">Root CA</span>
                  <input
                    type="radio"
                    name="caType"
                    checked={caType === "ROOT"}
                    onChange={() => setCaType("ROOT")}
                    className="accent-[#0972d3] h-4 w-4"
                  />
                </div>
                <p className="text-[12px] text-[#545b64] leading-relaxed">
                  The root of your internal trust hierarchy. Issues certificates for subordinate CAs and can sign its own root certificate.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#eaeded] text-[11px] font-bold text-[#0972d3]">
                Recommended for initial PKI setup
              </div>
            </label>

            <label
              className={`border rounded-lg p-5 cursor-pointer transition-all flex flex-col justify-between ${
                caType === "SUBORDINATE"
                  ? "border-2 border-[#0972d3] bg-[#f2f8fd]"
                  : "border-[#d5dbdb] hover:border-[#aab7b8] bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[15px] text-[#16191f]">Subordinate CA</span>
                  <input
                    type="radio"
                    name="caType"
                    checked={caType === "SUBORDINATE"}
                    onChange={() => setCaType("SUBORDINATE")}
                    className="accent-[#0972d3] h-4 w-4"
                  />
                </div>
                <p className="text-[12px] text-[#545b64] leading-relaxed">
                  Issues end-entity certificates or subordinate CAs under a Root CA. Must be signed by a Root or another Subordinate CA.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#eaeded] text-[11px] text-[#545b64]">
                Requires an active parent CA
              </div>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: Configure CA Subject Name */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Step 2: Configure CA subject name</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Provide the X.500 Distinguished Name (DN) attributes that identify this Certificate Authority.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">
                Common name (CN) <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. corp.internal.aws.local or Root CA Corp"
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0972d3]"
              />
              <p className="text-[11px] text-[#545b64]">The fully qualified name of the certificate authority.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-[#16191f]">Organization (O)</label>
                <input
                  type="text"
                  placeholder="e.g. Example Corp"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-[#16191f]">Organizational unit (OU)</label>
                <input
                  type="text"
                  placeholder="e.g. Security & Cloud Platform"
                  value={organizationalUnit}
                  onChange={(e) => setOrganizationalUnit(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0972d3]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-[#16191f]">
                  Country code (C) <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="US"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] uppercase focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-[#16191f]">State or province (ST)</label>
                <input
                  type="text"
                  placeholder="e.g. Washington"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0972d3]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-[#16191f]">Locality / City (L)</label>
                <input
                  type="text"
                  placeholder="e.g. Seattle"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0972d3]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Configure Key Algorithms */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Step 3: Key algorithms</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Select the private key generation algorithm and signing algorithm for this certificate authority.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">Key algorithm</label>
              <select
                value={keyAlgorithm}
                onChange={(e) => {
                  const val = e.target.value as KeyAlgorithm;
                  setKeyAlgorithm(val);
                  if (val.startsWith("EC_")) {
                    setSigningAlgorithm("SHA256WITHECDSA");
                  } else {
                    setSigningAlgorithm("SHA256WITHRSA");
                  }
                }}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#0972d3]"
              >
                <option value="RSA_2048">RSA 2048 (Default, highest compatibility)</option>
                <option value="RSA_4096">RSA 4096 (High security)</option>
                <option value="EC_prime256v1">ECDSA P-256 (Fast, modern elliptic curve)</option>
                <option value="EC_secp384r1">ECDSA P-384 (High-security elliptic curve)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-[#16191f]">Signing algorithm</label>
              <select
                value={signingAlgorithm}
                onChange={(e) => setSigningAlgorithm(e.target.value as SigningAlgorithm)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#0972d3]"
              >
                {keyAlgorithm.startsWith("RSA") ? (
                  <>
                    <option value="SHA256WITHRSA">SHA256WITHRSA (Standard)</option>
                    <option value="SHA384WITHRSA">SHA384WITHRSA</option>
                    <option value="SHA512WITHRSA">SHA512WITHRSA</option>
                  </>
                ) : (
                  <>
                    <option value="SHA256WITHECDSA">SHA256WITHECDSA (Standard)</option>
                    <option value="SHA384WITHECDSA">SHA384WITHECDSA</option>
                    <option value="SHA512WITHECDSA">SHA512WITHECDSA</option>
                  </>
                )}
              </select>
            </div>

            <div className="p-3 bg-[#f8f9fa] border border-[#eaeded] rounded text-[12px] text-[#545b64]">
              <strong>Security Note:</strong> Private keys generated by AWS Private CA are stored in FIPS 140-2 Level 3 Hardware Security Modules (HSMs) and can never be exported.
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Configure Revocation */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Step 4: Configure certificate revocation (optional)</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              A Certificate Revocation List (CRL) allows clients to verify whether a certificate has been revoked prior to expiration.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableCrl}
                onChange={(e) => setEnableCrl(e.target.checked)}
                className="accent-[#0972d3] h-4 w-4"
              />
              <span className="font-bold text-[13px] text-[#16191f]">
                Enable Certificate Revocation List (CRL)
              </span>
            </label>

            {enableCrl && (
              <div className="space-y-4 p-4 border border-[#d5dbdb] rounded bg-[#fafafa]">
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">
                    S3 bucket for CRL distribution <span className="text-[#d13212]">*</span>
                  </label>
                  {availableBuckets.length > 0 ? (
                    <select
                      value={crlS3Bucket}
                      onChange={(e) => setCrlS3Bucket(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white focus:outline-none focus:border-[#0972d3]"
                    >
                      {availableBuckets.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name} (s3://{b.name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="my-pki-crl-bucket"
                        value={crlS3Bucket}
                        onChange={(e) => setCrlS3Bucket(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#0972d3]"
                      />
                      <p className="text-[11px] text-[#545b64] mt-1">
                        No S3 buckets found. Enter an S3 bucket name or{" "}
                        <Link href="/s3" className="text-[#0073bb] hover:underline">
                          create an S3 bucket
                        </Link>.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">CRL expiration (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={crlExpirationDays}
                    onChange={(e) => setCrlExpirationDays(parseInt(e.target.value) || 7)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                  <p className="text-[11px] text-[#545b64]">Number of days before a new CRL is generated (default: 7).</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-[#16191f]">Custom CNAME (optional)</label>
                  <input
                    type="text"
                    placeholder="crl.internal.aws.local"
                    value={crlCustomCname}
                    onChange={(e) => setCrlCustomCname(e.target.value)}
                    className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: Tags */}
      {currentStep === 5 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Step 5: Tags</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Add key-value tags to categorize and manage this Certificate Authority.
            </p>
          </div>

          <div className="space-y-3 max-w-xl">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                  className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                  className="flex-1 border border-[#aab7b8] rounded px-3 py-1.5 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="text-[#d13212] hover:underline text-[12px] px-2 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-3 rounded transition-colors"
            >
              Add tag
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Review & Create */}
      {currentStep === 6 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-[18px] font-bold text-[#16191f]">Step 6: Review and create</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Review your Certificate Authority configuration before creating.
            </p>
          </div>

          <div className="border border-[#eaeded] rounded divide-y divide-[#eaeded] text-[13px]">
            <div className="p-4 grid grid-cols-3">
              <span className="font-bold text-[#545b64]">CA Type:</span>
              <span className="col-span-2 font-bold text-[#16191f]">{caType} CA</span>
            </div>
            <div className="p-4 grid grid-cols-3">
              <span className="font-bold text-[#545b64]">Common Name (CN):</span>
              <span className="col-span-2 font-bold text-[#0073bb]">{commonName}</span>
            </div>
            <div className="p-4 grid grid-cols-3">
              <span className="font-bold text-[#545b64]">Subject DN:</span>
              <span className="col-span-2 text-[#16191f]">
                {organization && `O=${organization}, `}
                {organizationalUnit && `OU=${organizationalUnit}, `}
                C={country}
                {stateName && `, ST=${stateName}`}
                {locality && `, L=${locality}`}
              </span>
            </div>
            <div className="p-4 grid grid-cols-3">
              <span className="font-bold text-[#545b64]">Key &amp; Signing:</span>
              <span className="col-span-2 text-[#16191f]">
                {keyAlgorithm} / {signingAlgorithm}
              </span>
            </div>
            <div className="p-4 grid grid-cols-3">
              <span className="font-bold text-[#545b64]">CRL Revocation:</span>
              <span className="col-span-2 text-[#16191f]">
                {enableCrl ? `Enabled (s3://${crlS3Bucket}, ${crlExpirationDays} days)` : "Disabled"}
              </span>
            </div>
            <div className="p-4 grid grid-cols-3">
              <span className="font-bold text-[#545b64]">Tags:</span>
              <span className="col-span-2 text-[#16191f]">
                {tags.filter((t) => t.key.trim().length > 0).length} tags configured
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#eaeded]">
        <div>
          <Link
            href="/acm/pca"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
          >
            Cancel
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
            >
              Previous
            </button>
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-5 rounded shadow-sm transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateCa}
              disabled={isSubmitting}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-5 rounded shadow-sm transition-colors"
            >
              {isSubmitting ? "Creating CA..." : "Create CA"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
