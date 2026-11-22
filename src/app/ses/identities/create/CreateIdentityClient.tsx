"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createEmailIdentityAction,
  createDomainIdentityAction,
} from "../../actions";

export default function CreateIdentityClient() {
  const router = useRouter();
  const [identityType, setIdentityType] = useState<"EmailAddress" | "Domain">("EmailAddress");
  const [identityValue, setIdentityValue] = useState("");

  // Domain-specific settings
  const [dkimEnabled, setDkimEnabled] = useState(true);
  const [useCustomMailFrom, setUseCustomMailFrom] = useState(false);
  const [mailFromSubdomain, setMailFromSubdomain] = useState("mail");
  const [behaviorOnMXFailure, setBehaviorOnMXFailure] = useState<"UseDefaultValue" | "RejectMessage">(
    "UseDefaultValue"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullMailFromDomain =
    identityType === "Domain" && identityValue.trim() && mailFromSubdomain.trim()
      ? `${mailFromSubdomain.trim()}.${identityValue.trim()}`
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = identityValue.trim();
    if (!val) {
      setError(
        identityType === "EmailAddress"
          ? "Please provide an email address."
          : "Please provide a domain name."
      );
      return;
    }

    setLoading(true);

    if (identityType === "EmailAddress") {
      const res = await createEmailIdentityAction(val);
      setLoading(false);
      if (res.success) {
        router.push(`/ses/identities/${encodeURIComponent(val)}`);
      } else {
        setError(res.error || "Failed to create email identity.");
      }
    } else {
      const res = await createDomainIdentityAction({
        domain: val,
        dkimEnabled,
        mailFromDomain: useCustomMailFrom ? fullMailFromDomain : undefined,
        behaviorOnMXFailure,
      });
      setLoading(false);
      if (res.success) {
        router.push(`/ses/identities/${encodeURIComponent(val)}`);
      } else {
        setError(res.error || "Failed to create domain identity.");
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/ses/identities" className="hover:underline">
            Verified identities
          </Link>{" "}
          &gt; <span>Create identity</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create identity</h1>
        <p className="text-[13px] text-[#545b64]">
          Verify an email address or domain to authorize sending emails through Amazon Simple Email Service.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity Details Card */}
        <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
          <h2 className="text-[15px] font-bold text-[#16191f]">Identity details</h2>

          {/* Identity Type Radios */}
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-[#16191f]">
              Identity type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 border rounded-md cursor-pointer flex flex-col transition-colors ${
                  identityType === "EmailAddress"
                    ? "border-[#ec7211] bg-[#fdfaf7] ring-1 ring-[#ec7211]"
                    : "border-[#d5dbdb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-[13px] text-[#16191f]">
                  <input
                    type="radio"
                    name="identityType"
                    checked={identityType === "EmailAddress"}
                    onChange={() => setIdentityType("EmailAddress")}
                    className="accent-[#ec7211]"
                  />
                  <span>Email address</span>
                </div>
                <span className="text-[12px] text-[#545b64] mt-1 ml-5">
                  Verify an individual email address (e.g. sender@example.com).
                </span>
              </label>

              <label
                className={`p-3.5 border rounded-md cursor-pointer flex flex-col transition-colors ${
                  identityType === "Domain"
                    ? "border-[#ec7211] bg-[#fdfaf7] ring-1 ring-[#ec7211]"
                    : "border-[#d5dbdb] hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-[13px] text-[#16191f]">
                  <input
                    type="radio"
                    name="identityType"
                    checked={identityType === "Domain"}
                    onChange={() => setIdentityType("Domain")}
                    className="accent-[#ec7211]"
                  />
                  <span>Domain</span>
                </div>
                <span className="text-[12px] text-[#545b64] mt-1 ml-5">
                  Verify an entire domain to authorize any email address at this domain.
                </span>
              </label>
            </div>
          </div>

          {/* Identity Input */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
              {identityType === "EmailAddress" ? "Email address" : "Domain"}{" "}
              <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              value={identityValue}
              onChange={(e) => setIdentityValue(e.target.value)}
              placeholder={
                identityType === "EmailAddress"
                  ? "e.g. notifications@company.com"
                  : "e.g. company.com"
              }
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
              required
            />
            <p className="text-[11px] text-[#545b64] mt-1">
              {identityType === "EmailAddress"
                ? "A verification email will be generated. In the emulator, it is immediately registered."
                : "You will be provided with DNS CNAME records to publish in your DNS registrar."}
            </p>
          </div>
        </div>

        {/* Domain-specific Settings (DKIM & MAIL FROM) */}
        {identityType === "Domain" && (
          <>
            {/* Easy DKIM Card */}
            <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
              <h2 className="text-[15px] font-bold text-[#16191f]">Easy DKIM</h2>
              <p className="text-[12px] text-[#545b64]">
                DomainKeys Identified Mail (DKIM) authenticates your emails by adding a cryptographic signature to email headers.
              </p>

              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="checkbox"
                  checked={dkimEnabled}
                  onChange={(e) => setDkimEnabled(e.target.checked)}
                  className="accent-[#ec7211] w-4 h-4"
                />
                <span className="font-semibold text-[#16191f]">
                  Generate DKIM signatures (Easy DKIM)
                </span>
              </label>

              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded text-[12px] space-y-1">
                <span className="font-semibold text-[#16191f]">DKIM key length:</span>
                <div className="text-[#545b64]">
                  RSA 2048-bit (recommended for modern email clients and spam filter compliance).
                </div>
              </div>
            </div>

            {/* Custom MAIL FROM Domain Card */}
            <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-[#16191f]">
                    Custom MAIL FROM domain (optional)
                  </h2>
                  <p className="text-[12px] text-[#545b64]">
                    Align the SPF envelope MAIL FROM domain with your sending domain to meet DMARC alignment standards.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="checkbox"
                  checked={useCustomMailFrom}
                  onChange={(e) => setUseCustomMailFrom(e.target.checked)}
                  className="accent-[#ec7211] w-4 h-4"
                />
                <span className="font-semibold text-[#16191f]">
                  Use a custom MAIL FROM domain
                </span>
              </label>

              {useCustomMailFrom && (
                <div className="pl-6 space-y-4 border-l-2 border-l-[#ec7211] mt-2">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                      MAIL FROM domain prefix
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mailFromSubdomain}
                        onChange={(e) => setMailFromSubdomain(e.target.value)}
                        placeholder="mail"
                        className="w-48 px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
                      />
                      <span className="text-[13px] font-mono text-[#545b64]">
                        .{identityValue.trim() || "example.com"}
                      </span>
                    </div>
                    {fullMailFromDomain && (
                      <p className="text-[11px] text-[#0972d3] font-mono mt-1">
                        Effective MAIL FROM: {fullMailFromDomain}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                      Behavior on MX failure
                    </label>
                    <div className="space-y-1.5 text-[13px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mxFailure"
                          checked={behaviorOnMXFailure === "UseDefaultValue"}
                          onChange={() => setBehaviorOnMXFailure("UseDefaultValue")}
                          className="accent-[#ec7211]"
                        />
                        <span>Use default MAIL FROM domain (amazonses.com)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mxFailure"
                          checked={behaviorOnMXFailure === "RejectMessage"}
                          onChange={() => setBehaviorOnMXFailure("RejectMessage")}
                          className="accent-[#ec7211]"
                        />
                        <span>Reject message</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Navigation */}
        <div className="p-4 bg-white border border-[#eaeded] rounded-md flex items-center justify-end gap-3 shadow-sm">
          <Link
            href="/ses/identities"
            className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded] flex items-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 rounded transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create identity"}
          </button>
        </div>
      </form>
    </div>
  );
}
