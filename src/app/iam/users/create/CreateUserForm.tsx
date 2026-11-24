/**
 * src/app/iam/users/create/CreateUserForm.tsx – AWS Replica Add User Wizard.
 * Allows entering username, joining user groups, attaching policies directly,
 * and generating programmatic access keys.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithDetails } from "../../actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface PolicyOption {
  name: string;
  arn: string;
}

interface GroupOption {
  name: string;
}

interface Props {
  policies: PolicyOption[];
  groups: GroupOption[];
}

export function CreateUserForm({ policies, groups }: Props) {
  const [userName, setUserName] = useState("");
  const [enableConsole, setEnableConsole] = useState(true);
  const [generateAccessKey, setGenerateAccessKey] = useState(false);

  // Permissions mode: "groups" | "policies"
  const [permissionMode, setPermissionMode] = useState<"groups" | "policies">("groups");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  const [groupSearch, setGroupSearch] = useState("");
  const [policySearch, setPolicySearch] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdAccessKey, setCreatedAccessKey] = useState<{
    accessKeyId: string;
    secretAccessKey: string;
  } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const router = useRouter();

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(policySearch.toLowerCase())
  );

  function toggleGroup(name: string) {
    setSelectedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  }

  function togglePolicy(arn: string) {
    setSelectedPolicies((prev) =>
      prev.includes(arn) ? prev.filter((a) => a !== arn) : [...prev, arn]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim()) {
      setError("User name is required.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await createUserWithDetails({
        userName: userName.trim(),
        groupNames: selectedGroups,
        policyArns: selectedPolicies,
        generateAccessKey,
      });

      if (res.success) {
        if (res.accessKey) {
          setCreatedAccessKey({
            accessKeyId: res.accessKey.accessKeyId,
            secretAccessKey: res.accessKey.secretAccessKey,
          });
        } else {
          router.push("/iam/users");
        }
      } else {
        setError(res.error || "Failed to create user.");
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-[900px]">
        {error && (
          <EmulatorOfflineBanner error={error} className="mb-4" />
        )}

        {/* Step 1: User details */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Specify user details</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Specify the user name and select access options.
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#16191f] mb-1">
              User name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. dev-user"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-hidden focus:border-[#0073bb]"
            />
            <p className="text-[11px] text-[#545b64] mt-1">
              Can include alphanumeric characters, and: +=,.@-
            </p>
          </div>

          <div className="pt-3 border-t border-[#eaeded] space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={enableConsole}
                onChange={(e) => setEnableConsole(e.target.checked)}
                className="accent-[#0073bb] mt-0.5"
              />
              <div>
                <span className="text-[13px] font-bold text-[#16191f]">
                  Provide user access to the AWS Management Console
                </span>
                <p className="text-[11px] text-[#545b64]">
                  Allows the user to sign in using the AWS Console sign-in URL.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={generateAccessKey}
                onChange={(e) => setGenerateAccessKey(e.target.checked)}
                className="accent-[#0073bb] mt-0.5"
              />
              <div>
                <span className="text-[13px] font-bold text-[#16191f]">
                  Generate an access key for programmatic access
                </span>
                <p className="text-[11px] text-[#545b64]">
                  Creates an access key ID and secret access key for AWS CLI and SDK calls.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: Set permissions */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Set permissions</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Add the user to user groups or attach permissions policies directly.
            </p>
          </div>

          <div className="flex gap-4 border-b border-[#eaeded] pb-3">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#16191f]">
              <input
                type="radio"
                name="permissionMode"
                checked={permissionMode === "groups"}
                onChange={() => setPermissionMode("groups")}
                className="accent-[#0073bb]"
              />
              <span>Add user to group ({selectedGroups.length} selected)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-[#16191f]">
              <input
                type="radio"
                name="permissionMode"
                checked={permissionMode === "policies"}
                onChange={() => setPermissionMode("policies")}
                className="accent-[#0073bb]"
              />
              <span>Attach policies directly ({selectedPolicies.length} selected)</span>
            </label>
          </div>

          {permissionMode === "groups" ? (
            <div className="border border-[#eaeded] rounded-sm">
              <div className="p-2.5 bg-[#fafafa] border-b border-[#eaeded] flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#16191f]">
                  User groups ({groups.length})
                </span>
                <input
                  type="text"
                  placeholder="Filter groups..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="w-56 px-2.5 py-1 border border-[#aab7b8] rounded-sm text-[12px] bg-white text-[#16191f]"
                />
              </div>

              <div className="max-h-[220px] overflow-y-auto divide-y divide-[#eaeded]">
                {filteredGroups.length === 0 ? (
                  <div className="p-6 text-center text-[#545b64] text-[12px]">
                    No user groups found. You can create groups in IAM &gt; User groups.
                  </div>
                ) : (
                  filteredGroups.map((g) => {
                    const isChecked = selectedGroups.includes(g.name);
                    return (
                      <label
                        key={g.name}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                          isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGroup(g.name)}
                          className="accent-[#0073bb]"
                        />
                        <span className="text-[13px] font-semibold text-[#16191f]">{g.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="border border-[#eaeded] rounded-sm">
              <div className="p-2.5 bg-[#fafafa] border-b border-[#eaeded] flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#16191f]">
                  Managed policies ({policies.length})
                </span>
                <input
                  type="text"
                  placeholder="Filter policies..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="w-56 px-2.5 py-1 border border-[#aab7b8] rounded-sm text-[12px] bg-white text-[#16191f]"
                />
              </div>

              <div className="max-h-[240px] overflow-y-auto divide-y divide-[#eaeded]">
                {filteredPolicies.length === 0 ? (
                  <div className="p-6 text-center text-[#545b64] text-[12px]">
                    No policies found.
                  </div>
                ) : (
                  filteredPolicies.map((p) => {
                    const isChecked = selectedPolicies.includes(p.arn);
                    return (
                      <label
                        key={p.arn}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                          isChecked ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePolicy(p.arn)}
                          className="accent-[#0073bb]"
                        />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-[#0073bb]">{p.name}</span>
                          <span className="text-[11px] font-mono text-[#545b64] truncate max-w-lg">
                            {p.arn}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
          <Link
            href="/iam/users"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!userName.trim() || isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
          >
            {isPending ? "Creating user..." : "Create user"}
          </button>
        </div>
      </form>

      {/* Generated Access Key Modal */}
      {createdAccessKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">User & Access key created</h3>
            </div>

            <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[12px] text-[#d13212]">
              <strong>Important:</strong> Save your secret access key now. This is the only time it will be shown.
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                  Access key ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdAccessKey.accessKeyId}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[12px] bg-[#fafafa]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdAccessKey.accessKeyId);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Secret access key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="text-[11px] font-bold text-[#0073bb] hover:underline"
                  >
                    {showSecretKey ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    readOnly
                    value={createdAccessKey.secretAccessKey}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[12px] bg-[#fafafa]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdAccessKey.secretAccessKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    {copiedKey ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => router.push("/iam/users")}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
              >
                Return to Users list
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
