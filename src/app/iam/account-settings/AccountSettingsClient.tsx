/**
 * src/app/iam/account-settings/AccountSettingsClient.tsx – IAM Account Settings & Alias.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAccountAliasAction,
  deleteAccountAliasAction,
  assignRootMFAAction,
  removeRootMFAAction,
} from "../actions";

interface Props {
  accountId: string;
  aliases: string[];
  summary: Record<string, number>;
  initialRootMFAEnabled?: boolean;
  initialRootSerialNumber?: string;
}

export function AccountSettingsClient({
  accountId,
  aliases = [],
  summary = {},
  initialRootMFAEnabled = false,
  initialRootSerialNumber = "",
}: Props) {
  const [currentAliases, setCurrentAliases] = useState<string[]>(aliases);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [aliasInput, setAliasInput] = useState(aliases[0] || "");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Root MFA State
  const [rootMFAEnabled, setRootMFAEnabled] = useState(initialRootMFAEnabled);
  const [rootSerialNumber, setRootSerialNumber] = useState(initialRootSerialNumber);
  const [showRootMfaModal, setShowRootMfaModal] = useState(false);
  const [rootBase32Seed, setRootBase32Seed] = useState("");
  const [rootSample1, setRootSample1] = useState("");
  const [rootSample2, setRootSample2] = useState("");

  const activeAlias = currentAliases[0] || null;
  const signInUrl = `https://${activeAlias || accountId}.signin.aws.amazon.com/console`;

  function handleSaveAlias(e: React.FormEvent) {
    e.preventDefault();
    const clean = aliasInput.trim().toLowerCase();
    if (!clean) return;

    startTransition(async () => {
      const res = await createAccountAliasAction(clean);
      if (res.success) {
        setShowAliasModal(false);
        setCurrentAliases([clean]);
        setFeedback(`Account alias "${clean}" created successfully.`);
        router.refresh();
      } else {
        setFeedback(`Failed to update alias: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeleteAlias() {
    if (!activeAlias) return;
    startTransition(async () => {
      const res = await deleteAccountAliasAction(activeAlias);
      if (res.success) {
        setCurrentAliases([]);
        setAliasInput("");
        setFeedback("Account alias deleted successfully.");
        router.refresh();
      } else {
        setFeedback(`Failed to delete alias: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleAssignRootMfa() {
    startTransition(async () => {
      const res = await assignRootMFAAction();
      if (res.success && res.serialNumber) {
        setRootMFAEnabled(true);
        setRootSerialNumber(res.serialNumber);
        setRootBase32Seed(res.base32Seed || "");
        setRootSample1(res.sampleCode1 || "");
        setRootSample2(res.sampleCode2 || "");
        setShowRootMfaModal(true);
        setFeedback("Root user MFA successfully configured.");
        router.refresh();
      } else {
        setFeedback(`Failed to configure Root MFA: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleRemoveRootMfa() {
    if (!confirm("Are you sure you want to remove multi-factor authentication for the root user?")) return;
    startTransition(async () => {
      const res = await removeRootMFAAction(rootSerialNumber);
      if (res.success) {
        setRootMFAEnabled(false);
        setRootSerialNumber("");
        setFeedback("Root user MFA removed.");
        router.refresh();
      } else {
        setFeedback(`Failed to remove Root MFA: ${res.error || "Unknown error"}`);
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Account settings</h1>
        <p className="text-[13px] text-[#545b64]">
          View and manage account-level IAM settings, including account alias, sign-in URL, password policies, and resource limits.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-sm border text-[13px] flex items-center justify-between ${
            feedback.includes("Failed")
              ? "bg-[#fdf3f1] border-[#d13212] text-[#d13212]"
              : "bg-[#f2f8fd] border-[#0073bb] text-[#0073bb]"
          }`}
        >
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Account Details & Sign-in URL */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-5">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
          AWS Account details & Sign-in
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
          <div>
            <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
              Account ID
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[14px] font-bold text-[#16191f] bg-[#f2f3f3] px-2.5 py-1 rounded-sm">
                {accountId}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(accountId)}
                className="text-[12px] font-bold text-[#0073bb] hover:underline"
              >
                Copy ID
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
              Account alias
            </label>
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-[#16191f]">
                {activeAlias || <em className="text-[#545b64]">No alias configured</em>}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAliasModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                >
                  {activeAlias ? "Edit alias" : "Create alias"}
                </button>
                {activeAlias && (
                  <button
                    type="button"
                    onClick={handleDeleteAlias}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 border border-[#d5dbdb] rounded-sm text-[12px] font-bold text-[#d13212] bg-white hover:bg-[#fdf3f1] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    Delete alias
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
              IAM users sign-in URL
            </label>
            <div className="flex items-center gap-2 max-w-xl">
              <input
                type="text"
                readOnly
                value={signInUrl}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[12px] bg-[#fafafa] text-[#16191f]"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(signInUrl)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                {copied ? "Copied" : "Copy URL"}
              </button>
            </div>
            <p className="text-[11px] text-[#545b64] mt-1">
              Direct link for IAM users to sign in to the AWS Management Console for this account.
            </p>
          </div>
        </div>
      </div>

      {/* Root User MFA Section */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eaeded] pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Root user multi-factor authentication (MFA)
            </h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Secure root account credentials against unauthorized console access with hardware or virtual MFA.
            </p>
          </div>
          {rootMFAEnabled ? (
            <button
              type="button"
              onClick={handleRemoveRootMfa}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 border border-[#d5dbdb] rounded-sm text-[12px] font-bold text-[#d13212] bg-white hover:bg-[#fdf3f1] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50"
            >
              Remove root MFA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAssignRootMfa}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
            >
              Assign root MFA
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 text-[13px]">
          <div>
            <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">Status</span>
            {rootMFAEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#fdf3f1] text-[#d13212]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d13212]" />
                Not assigned
              </span>
            )}
          </div>
          {rootMFAEnabled && rootSerialNumber && (
            <div>
              <span className="text-[11px] font-bold text-[#545b64] uppercase block mb-1">MFA Serial number</span>
              <span className="font-mono text-[12px] text-[#16191f] bg-[#f2f3f3] px-2 py-0.5 rounded-sm">
                {rootSerialNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Password Policy Guidelines */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
          Password policy
        </h2>
        <p className="text-[12px] text-[#545b64]">
          AWS IAM enforces account password rules to ensure credentials satisfy minimum security standards.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="font-bold text-[#16191f]">Minimum length</div>
            <div className="text-[12px] text-[#545b64] mt-1">8 characters minimum</div>
          </div>
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="font-bold text-[#16191f]">Character types</div>
            <div className="text-[12px] text-[#545b64] mt-1">Requires uppercase, lowercase, numbers, and symbols</div>
          </div>
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="font-bold text-[#16191f]">Password reuse</div>
            <div className="text-[12px] text-[#545b64] mt-1">Prevents reuse of last 5 passwords</div>
          </div>
        </div>
      </div>

      {/* IAM Resource Limits and Quotas */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-3">
          IAM resource quotas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="text-[11px] font-bold text-[#545b64] uppercase">Users quota</div>
            <div className="text-[20px] font-bold text-[#16191f] mt-1">
              {summary.UsersQuota || 5000}
            </div>
            <div className="text-[11px] text-[#545b64]">{summary.Users || 0} currently active</div>
          </div>
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="text-[11px] font-bold text-[#545b64] uppercase">Roles quota</div>
            <div className="text-[20px] font-bold text-[#16191f] mt-1">
              {summary.RolesQuota || 1000}
            </div>
            <div className="text-[11px] text-[#545b64]">{summary.Roles || 0} currently active</div>
          </div>
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="text-[11px] font-bold text-[#545b64] uppercase">Groups quota</div>
            <div className="text-[20px] font-bold text-[#16191f] mt-1">
              {summary.GroupsQuota || 300}
            </div>
            <div className="text-[11px] text-[#545b64]">{summary.Groups || 0} currently active</div>
          </div>
          <div className="p-3 border border-[#eaeded] rounded-sm bg-[#fafafa]">
            <div className="text-[11px] font-bold text-[#545b64] uppercase">Policies quota</div>
            <div className="text-[20px] font-bold text-[#16191f] mt-1">
              {summary.PoliciesQuota || 1500}
            </div>
            <div className="text-[11px] text-[#545b64]">Customer managed</div>
          </div>
        </div>
      </div>

      {/* Account Alias Modal */}
      {showAliasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveAlias}
            className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                {activeAlias ? "Edit account alias" : "Create account alias"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAliasModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Account alias <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. acme-corp"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f]"
              />
              <p className="text-[11px] text-[#545b64] mt-1">
                Must contain lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAliasModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!aliasInput.trim() || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Saving..." : "Save alias"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Root MFA Success Modal */}
      {showRootMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">
                Root user MFA enabled
              </h3>
              <button
                type="button"
                onClick={() => setShowRootMfaModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="p-3 bg-[#e6f4ea] border border-[#a2dca0] text-[#137333] rounded-sm text-[12px] font-medium">
                Root user multi-factor authentication device has been registered and activated.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#545b64] uppercase mb-1">
                  MFA Serial number
                </label>
                <div className="font-mono text-[12px] text-[#16191f] bg-[#f2f3f3] p-2 rounded-sm break-all">
                  {rootSerialNumber}
                </div>
              </div>

              {rootBase32Seed && (
                <div>
                  <label className="block text-[11px] font-bold text-[#545b64] uppercase mb-1">
                    Secret key (Base32)
                  </label>
                  <div className="font-mono text-[12px] text-[#16191f] bg-[#f2f3f3] p-2 rounded-sm break-all">
                    {rootBase32Seed}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#eaeded] flex justify-end">
              <button
                type="button"
                onClick={() => setShowRootMfaModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
