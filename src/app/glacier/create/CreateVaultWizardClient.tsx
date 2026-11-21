"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createVaultAction } from "../actions";

interface CreateVaultWizardClientProps {
  snsTopics?: Array<{ arn: string; name: string }>;
}

export default function CreateVaultWizardClient({
  snsTopics = [],
}: CreateVaultWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [vaultName, setVaultName] = useState("");
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [snsTopicArn, setSnsTopicArn] = useState("");
  const [notifyArchiveRetrieval, setNotifyArchiveRetrieval] = useState(true);
  const [notifyInventoryRetrieval, setNotifyInventoryRetrieval] = useState(true);
  const [enableAccessPolicy, setEnableAccessPolicy] = useState(false);
  const [accessPolicyJson, setAccessPolicyJson] = useState(
    JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "GrantCrossAccountAccess",
            Effect: "Allow",
            Principal: { AWS: "*" },
            Action: "glacier:DescribeVault",
            Resource: "*",
          },
        ],
      },
      null,
      2
    )
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation
  const isValidVaultName =
    vaultName.length >= 1 &&
    vaultName.length <= 255 &&
    /^[a-zA-Z0-9_.-]+$/.test(vaultName);

  const steps = [
    { number: 1, title: "Vault settings" },
    { number: 2, title: "Event notifications" },
    { number: 3, title: "Permissions" },
    { number: 4, title: "Review and create" },
  ];

  async function handleCreateVault() {
    if (!isValidVaultName) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createVaultAction(vaultName.trim());
    setIsSubmitting(false);

    if (res.success) {
      router.push(`/glacier/vaults/${encodeURIComponent(vaultName.trim())}`);
    } else {
      setErrorMessage(res.error || "Failed to create vault.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#545b64] mb-2">
          <Link href="/glacier" className="hover:text-[#0073bb]">
            Vaults
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-medium">Create vault</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create vault</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          A vault is a container for storing archives. Vault names must be unique within an AWS
          account and Region.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    currentStep === step.number
                      ? "bg-[#ec7211] text-white"
                      : currentStep > step.number
                      ? "bg-[#1d8102] text-white"
                      : "bg-[#eaeded] text-[#545b64]"
                  }`}
                >
                  {currentStep > step.number ? "✓" : step.number}
                </div>
                <div className="text-[13px] font-semibold text-[#16191f] hidden sm:block">
                  {step.title}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 ${
                    currentStep > idx + 1 ? "bg-[#1d8102]" : "bg-[#eaeded]"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#d13212] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Vault Settings */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">Step 1: Vault settings</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Specify a name for the vault and select the AWS Region.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                Vault name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="my-glacier-vault"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
              <div className="text-[11px] text-[#545b64] mt-1 space-y-0.5">
                <p>Vault names must be between 1 and 255 characters long.</p>
                <p>Allowed characters: lowercase and uppercase letters, numbers, hyphens (-), underscores (_), and periods (.).</p>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                AWS Region
              </label>
              <div className="border border-[#eaeded] bg-[#f8f9fa] rounded px-3 py-1.5 text-[13px] text-[#545b64] font-medium">
                us-east-1 (US East (N. Virginia))
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Event Notifications */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">Step 2: Event notifications</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Configure Amazon SNS notifications when long-running jobs (such as inventory or archive
              retrievals) complete.
            </p>
          </div>

          <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
            <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> Vault event
            notification configuration is visible in the console, but the underlying
            <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono ml-1">SetVaultNotifications</code>
            API is scaffolded in this emulator. Notifications can be configured without blocking
            vault creation.
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableNotifications}
                onChange={(e) => setEnableNotifications(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Enable event notifications
              </span>
            </label>

            {enableNotifications && (
              <div className="pl-6 space-y-4 border-l-2 border-[#eaeded] max-w-xl">
                <div>
                  <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                    SNS Topic
                  </label>
                  {snsTopics.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={snsTopicArn}
                        onChange={(e) => setSnsTopicArn(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] bg-white"
                      >
                        <option value="">-- Choose existing SNS topic or enter below --</option>
                        {snsTopics.map((t) => (
                          <option key={t.arn} value={t.arn}>
                            {t.name} ({t.arn})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or enter custom SNS Topic ARN"
                        value={snsTopicArn}
                        onChange={(e) => setSnsTopicArn(e.target.value)}
                        className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="arn:aws:sns:us-east-1:000000000000:my-glacier-notifications"
                      value={snsTopicArn}
                      onChange={(e) => setSnsTopicArn(e.target.value)}
                      className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                    />
                  )}
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Enter or select the Amazon Resource Name (ARN) of the Amazon SNS topic to publish events to.
                  </p>
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-[#16191f] mb-2">
                    Events to trigger notifications:
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyArchiveRetrieval}
                        onChange={(e) => setNotifyArchiveRetrieval(e.target.checked)}
                        className="text-[#ec7211] focus:ring-[#ec7211] rounded"
                      />
                      <span className="text-[13px] text-[#16191f]">
                        ArchiveRetrievalCompleted (notifies when an archive retrieval job is ready)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyInventoryRetrieval}
                        onChange={(e) => setNotifyInventoryRetrieval(e.target.checked)}
                        className="text-[#ec7211] focus:ring-[#ec7211] rounded"
                      />
                      <span className="text-[13px] text-[#16191f]">
                        InventoryRetrievalCompleted (notifies when an inventory retrieval job is ready)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Permissions & Access Policy */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">Step 3: Permissions</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Set a resource-based access policy on the vault to manage cross-account permissions.
            </p>
          </div>

          <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
            <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> Vault resource
            policies are visible in the console, but the underlying
            <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono ml-1">SetVaultAccessPolicy</code>
            API is scaffolded in this emulator. Custom policies can be drafted without blocking vault
            creation.
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAccessPolicy}
                onChange={(e) => setEnableAccessPolicy(e.target.checked)}
                className="text-[#ec7211] focus:ring-[#ec7211] rounded"
              />
              <span className="text-[13px] font-semibold text-[#16191f]">
                Define vault access policy
              </span>
            </label>

            {enableAccessPolicy && (
              <div className="pl-6 space-y-2 border-l-2 border-[#eaeded]">
                <label className="block text-[13px] font-semibold text-[#16191f]">
                  Policy document (JSON)
                </label>
                <textarea
                  rows={8}
                  value={accessPolicyJson}
                  onChange={(e) => setAccessPolicyJson(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[12px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Review and Create */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">Step 4: Review and create</h2>
            <p className="text-[13px] text-[#545b64] mt-0.5">
              Review your configuration settings before creating the Glacier vault.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#16191f]">Vault settings</h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-[12px] text-[#0073bb] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="text-[#545b64]">Vault name:</div>
                <div className="font-semibold text-[#16191f]">{vaultName}</div>
                <div className="text-[#545b64]">AWS Region:</div>
                <div className="text-[#16191f]">us-east-1</div>
              </div>
            </div>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#16191f]">Event notifications</h3>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-[12px] text-[#0073bb] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="text-[13px] text-[#545b64]">
                {enableNotifications ? (
                  <div className="space-y-1">
                    <div>
                      <strong>SNS Topic:</strong>{" "}
                      <span className="font-mono text-[12px]">{snsTopicArn || "None specified"}</span>
                    </div>
                    <div>
                      <strong>Events:</strong>{" "}
                      {[
                        notifyArchiveRetrieval && "ArchiveRetrievalCompleted",
                        notifyInventoryRetrieval && "InventoryRetrievalCompleted",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                ) : (
                  "Disabled"
                )}
              </div>
            </div>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#16191f]">Permissions</h3>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-[12px] text-[#0073bb] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
              <div className="text-[13px] text-[#545b64]">
                {enableAccessPolicy ? "Custom resource policy defined" : "Default permissions (private)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/glacier"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
        >
          Cancel
        </Link>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
            >
              Previous
            </button>
          )}

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={currentStep === 1 && !isValidVaultName}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                currentStep === 1 && !isValidVaultName
                  ? "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                  : "bg-[#ec7211] hover:bg-[#eb5f07]"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateVault}
              disabled={isSubmitting || !isValidVaultName}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className={`inline-flex items-center justify-center font-bold text-[13px] px-5 rounded text-white transition-colors ${
                isSubmitting || !isValidVaultName
                  ? "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                  : "bg-[#ec7211] hover:bg-[#eb5f07]"
              }`}
            >
              {isSubmitting ? "Creating vault..." : "Create vault"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
