/**
 * src/app/kms/keys/create/CreateKeyForm.tsx – AWS KMS Key Creation Multi-step Wizard.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createKeyAction } from "../../actions";

interface TagItem {
  key: string;
  value: string;
}

export function CreateKeyForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard step (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Configure key
  const [keyType, setKeyType] = useState<"SYMMETRIC" | "ASYMMETRIC">("SYMMETRIC");
  const [keyUsage, setKeyUsage] = useState<"ENCRYPT_DECRYPT" | "SIGN_VERIFY">("ENCRYPT_DECRYPT");
  const [keySpec, setKeySpec] = useState("SYMMETRIC_DEFAULT");
  const [multiRegion, setMultiRegion] = useState(false);

  // Step 2: Add labels
  const [alias, setAlias] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKeyInput, setTagKeyInput] = useState("");
  const [tagValInput, setTagValInput] = useState("");

  // Step 3: Administrative & usage permissions
  const [allowAdminDelete, setAllowAdminDelete] = useState(true);
  const [adminPrincipal, setAdminPrincipal] = useState("root");

  // Step 4: Key policy review
  const [customPolicy, setCustomPolicy] = useState("");
  const [useCustomPolicy, setUseCustomPolicy] = useState(false);

  // Status/Errors
  const [error, setError] = useState<string | null>(null);

  // Add tag handler
  const handleAddTag = () => {
    if (!tagKeyInput.trim()) return;
    setTags([...tags, { key: tagKeyInput.trim(), value: tagValInput.trim() }]);
    setTagKeyInput("");
    setTagValInput("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Compute default policy JSON
  const defaultPolicyJson = JSON.stringify(
    {
      Version: "2012-10-17",
      Id: "key-consolepolicy-3",
      Statement: [
        {
          Sid: "Enable IAM User Permissions",
          Effect: "Allow",
          Principal: {
            AWS: "arn:aws:iam::123456789012:root",
          },
          Action: "kms:*",
          Resource: "*",
        },
        {
          Sid: "Allow access for Key Administrators",
          Effect: "Allow",
          Principal: {
            AWS: "arn:aws:iam::123456789012:root",
          },
          Action: [
            "kms:Create*",
            "kms:Describe*",
            "kms:Enable*",
            "kms:List*",
            "kms:Put*",
            "kms:Update*",
            "kms:Revoke*",
            "kms:Disable*",
            "kms:Get*",
            ...(allowAdminDelete ? ["kms:Delete*", "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion"] : []),
          ],
          Resource: "*",
        },
        {
          Sid: "Allow use of the key",
          Effect: "Allow",
          Principal: {
            AWS: "arn:aws:iam::123456789012:root",
          },
          Action: [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey",
          ],
          Resource: "*",
        },
      ],
    },
    null,
    2
  );

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const formattedTags = tags.map((t) => ({ TagKey: t.key, TagValue: t.value }));
      const policyToSubmit = useCustomPolicy ? customPolicy : defaultPolicyJson;

      const res = await createKeyAction({
        alias: alias.trim() || undefined,
        description: description.trim() || undefined,
        keyUsage,
        keySpec,
        policy: policyToSubmit,
        tags: formattedTags,
      });

      if (res.success && res.keyId) {
        router.push(`/kms/keys/${encodeURIComponent(res.keyId)}`);
      } else {
        setError(res.error || "Failed to create KMS key.");
      }
    });
  };

  const steps = [
    { num: 1, title: "Configure key" },
    { num: 2, title: "Add labels" },
    { num: 3, title: "Define permissions" },
    { num: 4, title: "Review and create" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Wizard Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1 flex items-center gap-1.5 font-medium">
          <Link href="/kms" className="hover:underline text-[#0972d3]">
            Customer managed keys
          </Link>
          <span>/</span>
          <span>Create key</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f] tracking-tight">Create key</h1>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < currentStep) setCurrentStep(s.num);
              }}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                currentStep === s.num
                  ? "bg-[#f2f8fd] text-[#0972d3] font-bold border-l-4 border-[#0972d3]"
                  : currentStep > s.num
                  ? "text-[#16191f] hover:bg-[#fafafa]"
                  : "text-[#545b64] opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                  currentStep === s.num
                    ? "bg-[#0972d3] text-white"
                    : currentStep > s.num
                    ? "bg-[#1d8102] text-white"
                    : "bg-[#eaeded] text-[#545b64]"
                }`}
              >
                {s.num}
              </div>
              <div className="text-[13px] truncate">
                <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
                  Step {s.num}
                </div>
                <div>{s.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-[#fbeeed] border-l-4 border-[#d13212] p-3 text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* STEP 1: CONFIGURE KEY */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key type
            </h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="keyType"
                  checked={keyType === "SYMMETRIC"}
                  onChange={() => {
                    setKeyType("SYMMETRIC");
                    setKeyUsage("ENCRYPT_DECRYPT");
                    setKeySpec("SYMMETRIC_DEFAULT");
                  }}
                  className="mt-1 text-[#0972d3]"
                />
                <div>
                  <div className="font-bold text-[13px] text-[#16191f]">
                    Symmetric (Recommended)
                  </div>
                  <p className="text-[13px] text-[#545b64] leading-relaxed">
                    Creates a 256-bit symmetric key used for both encryption and decryption
                    (AES-256-GCM). This key type is integrated with all AWS services that support
                    AWS KMS.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="keyType"
                  checked={keyType === "ASYMMETRIC"}
                  onChange={() => {
                    setKeyType("ASYMMETRIC");
                    setKeySpec("RSA_2048");
                  }}
                  className="mt-1 text-[#0972d3]"
                />
                <div>
                  <div className="font-bold text-[13px] text-[#16191f]">Asymmetric</div>
                  <p className="text-[13px] text-[#545b64] leading-relaxed">
                    Creates an asymmetric public and private key pair used for encryption and
                    decryption or signing and verification.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-6">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key usage
            </h2>
            {keyType === "SYMMETRIC" ? (
              <div className="text-[13px] text-[#16191f] bg-[#f8f9fa] p-3 rounded border border-[#eaeded]">
                <div className="font-semibold">Encrypt and decrypt</div>
                <div className="text-[#545b64] text-[12px] mt-0.5">
                  Symmetric keys can only be used for encryption and decryption.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="keyUsage"
                    checked={keyUsage === "ENCRYPT_DECRYPT"}
                    onChange={() => setKeyUsage("ENCRYPT_DECRYPT")}
                    className="mt-1 text-[#0972d3]"
                  />
                  <div>
                    <div className="font-bold text-[13px] text-[#16191f]">Encrypt and decrypt</div>
                    <div className="text-[12px] text-[#545b64]">
                      Used to encrypt and decrypt data using RSA key pairs.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="keyUsage"
                    checked={keyUsage === "SIGN_VERIFY"}
                    onChange={() => setKeyUsage("SIGN_VERIFY")}
                    className="mt-1 text-[#0972d3]"
                  />
                  <div>
                    <div className="font-bold text-[13px] text-[#16191f]">Sign and verify</div>
                    <div className="text-[12px] text-[#545b64]">
                      Used to generate and verify digital signatures.
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {keyType === "ASYMMETRIC" && (
            <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
                Key spec
              </h2>
              <select
                value={keySpec}
                onChange={(e) => setKeySpec(e.target.value)}
                className="w-full max-w-md text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] bg-white"
              >
                <option value="RSA_2048">RSA 2048-bit</option>
                <option value="RSA_3078">RSA 3072-bit</option>
                <option value="RSA_4096">RSA 4096-bit</option>
                <option value="ECC_NIST_P256">ECC NIST P-256</option>
                <option value="ECC_NIST_P384">ECC NIST P-384</option>
                <option value="ECC_NIST_P521">ECC NIST P-521</option>
                <option value="ECC_SECG_P256K1">ECC SECG P-256 K1</option>
              </select>
            </div>
          )}

          {/* Advanced options */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Advanced options
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-[13px] font-semibold text-[#16191f]">Key material origin</div>
                <div className="text-[12px] text-[#545b64]">
                  KMS (AWS Key Management Service generates and manages the key material)
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#16191f]">Regionality</div>
                <label className="flex items-center gap-2 mt-1 cursor-pointer text-[13px]">
                  <input
                    type="checkbox"
                    checked={multiRegion}
                    onChange={(e) => setMultiRegion(e.target.checked)}
                    className="text-[#0972d3] rounded"
                  />
                  <span>Create a multi-Region key that can be replicated to other AWS Regions</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ADD LABELS */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Alias and Description
            </h2>

            <div>
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Alias <span className="text-[#d13212]">*</span>
              </label>
              <div className="flex items-center gap-2 max-w-lg">
                <span className="text-[13px] text-[#545b64] font-mono select-none">alias/</span>
                <input
                  type="text"
                  required
                  placeholder="my-application-key"
                  value={alias.replace(/^alias\//, "")}
                  onChange={(e) => setAlias(`alias/${e.target.value.replace(/^alias\//, "")}`)}
                  className="flex-1 text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
                />
              </div>
              <p className="text-[12px] text-[#545b64] mt-1">
                An alias is a friendly display name for the KMS key. The alias must be unique in this
                account and Region.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                Description (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Key for encrypting customer sensitive data in S3 and RDS"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full max-w-2xl text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3]"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Tags
            </h2>
            <p className="text-[13px] text-[#545b64]">
              A tag is a label that you assign to an AWS resource. Each tag consists of a key and an
              optional value.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Tag key (e.g. Environment)"
                value={tagKeyInput}
                onChange={(e) => setTagKeyInput(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] min-w-[200px]"
              />
              <input
                type="text"
                placeholder="Tag value (e.g. Production)"
                value={tagValInput}
                onChange={(e) => setTagValInput(e.target.value)}
                className="text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0972d3] min-w-[200px]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors"
              >
                Add tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="border border-[#eaeded] rounded overflow-hidden mt-3 max-w-xl">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="p-2.5">Key</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5 w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {tags.map((t, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">{t.key}</td>
                        <td className="p-2.5 text-[#545b64]">{t.value}</td>
                        <td className="p-2.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="text-[#d13212] hover:underline text-[12px]"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: DEFINE PERMISSIONS */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key administrators
            </h2>
            <p className="text-[13px] text-[#545b64]">
              Select the IAM users and roles that can administer this KMS key through the KMS API.
              Key administrators cannot use the key in cryptographic operations unless you also give
              them permissions in the key policy.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="checkbox"
                  checked={allowAdminDelete}
                  onChange={(e) => setAllowAdminDelete(e.target.checked)}
                  className="text-[#0972d3] rounded"
                />
                <span className="font-semibold text-[#16191f]">
                  Allow key administrators to delete this key
                </span>
              </label>
              <p className="text-[12px] text-[#545b64] ml-6">
                If checked, administrators will have permissions to execute ScheduleKeyDeletion and
                CancelKeyDeletion.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key usage permissions
            </h2>
            <p className="text-[13px] text-[#545b64]">
              By default, this key grants full cryptographic operations to the root account
              principal, which enables IAM policies in your account to delegate usage permissions.
            </p>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW AND CREATE */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Key configuration summary
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
              <div>
                <dt className="text-[#545b64]">Key type</dt>
                <dd className="font-semibold text-[#16191f]">{keyType}</dd>
              </div>
              <div>
                <dt className="text-[#545b64]">Key usage</dt>
                <dd className="font-semibold text-[#16191f]">{keyUsage}</dd>
              </div>
              <div>
                <dt className="text-[#545b64]">Key spec</dt>
                <dd className="font-semibold font-mono text-[#16191f]">{keySpec}</dd>
              </div>
              <div>
                <dt className="text-[#545b64]">Alias</dt>
                <dd className="font-semibold font-mono text-[#0972d3]">
                  {alias || "None"}
                </dd>
              </div>
            </dl>
            {description && (
              <div className="text-[13px] pt-2">
                <span className="text-[#545b64]">Description: </span>
                <span className="text-[#16191f]">{description}</span>
              </div>
            )}
          </div>

          {/* Key Policy Preview / Editor */}
          <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h2 className="text-[16px] font-bold text-[#16191f]">Key policy</h2>
              <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#0972d3] font-medium">
                <input
                  type="checkbox"
                  checked={useCustomPolicy}
                  onChange={(e) => {
                    setUseCustomPolicy(e.target.checked);
                    if (e.target.checked && !customPolicy) {
                      setCustomPolicy(defaultPolicyJson);
                    }
                  }}
                  className="rounded text-[#0972d3]"
                />
                <span>Edit policy JSON</span>
              </label>
            </div>

            {useCustomPolicy ? (
              <textarea
                rows={14}
                value={customPolicy}
                onChange={(e) => setCustomPolicy(e.target.value)}
                className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded bg-[#1e293b] text-[#f8fafc] focus:outline-none focus:border-[#0972d3]"
              />
            ) : (
              <pre className="font-mono text-[12px] p-4 bg-[#f8f9fa] border border-[#eaeded] rounded overflow-x-auto text-[#16191f] max-h-96">
                {defaultPolicyJson}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Wizard Footer Navigation Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#eaeded]">
        <div>
          <Link
            href="/kms"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
          >
            Cancel
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#aab7b8] bg-white text-[#16191f] hover:bg-[#f2f8fd] transition-colors shadow-sm"
            >
              Previous
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 2 && !alias.trim()) {
                  setError("Please provide an alias name for the key.");
                  return;
                }
                setError(null);
                setCurrentStep(currentStep + 1);
              }}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? "Creating key..." : "Finish and create key"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
