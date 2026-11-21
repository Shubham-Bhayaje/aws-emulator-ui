/**
 * src/app/kms/keys/create/CreateKeyForm.tsx – AWS KMS Key Creation Multi-step Wizard.
 * Zero emojis, Cloudscape enterprise standard, strict 32px button height standard.
 */

"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createKeyAction } from "../../actions";
import { IAMPrincipal } from "../../types";

interface TagItem {
  key: string;
  value: string;
}

interface CreateKeyFormProps {
  initialPrincipals: IAMPrincipal[];
  accountId: string;
}

export function CreateKeyForm({ initialPrincipals, accountId }: CreateKeyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard step (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Configure key
  const [keyType, setKeyType] = useState<"SYMMETRIC" | "ASYMMETRIC" | "HMAC">("SYMMETRIC");
  const [keyUsage, setKeyUsage] = useState<"ENCRYPT_DECRYPT" | "SIGN_VERIFY" | "GENERATE_VERIFY_MAC">("ENCRYPT_DECRYPT");
  const [keySpec, setKeySpec] = useState("SYMMETRIC_DEFAULT");
  const [multiRegion, setMultiRegion] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Step 2: Add labels
  const [alias, setAlias] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagKeyInput, setTagKeyInput] = useState("");
  const [tagValInput, setTagValInput] = useState("");

  // Step 3: Define key administrative permissions
  const [adminPrincipals, setAdminPrincipals] = useState<string[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [allowAdminDelete, setAllowAdminDelete] = useState(true);

  // Step 4: Define key usage permissions
  const [usagePrincipals, setUsagePrincipals] = useState<string[]>([]);
  const [usageSearch, setUsageSearch] = useState("");
  const [otherAccounts, setOtherAccounts] = useState("");

  // Step 5: Review and edit key policy
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState("");

  // Status/Errors
  const [error, setError] = useState<string | null>(null);

  // Handle keyType changes to update default usage & spec
  const handleKeyTypeChange = (newType: "SYMMETRIC" | "ASYMMETRIC" | "HMAC") => {
    setKeyType(newType);
    if (newType === "SYMMETRIC") {
      setKeyUsage("ENCRYPT_DECRYPT");
      setKeySpec("SYMMETRIC_DEFAULT");
    } else if (newType === "ASYMMETRIC") {
      setKeyUsage("SIGN_VERIFY");
      setKeySpec("RSA_2048");
    } else if (newType === "HMAC") {
      setKeyUsage("GENERATE_VERIFY_MAC");
      setKeySpec("HMAC_256");
    }
  };

  const handleKeyUsageChange = (newUsage: "ENCRYPT_DECRYPT" | "SIGN_VERIFY") => {
    setKeyUsage(newUsage);
    if (newUsage === "SIGN_VERIFY") {
      setKeySpec("RSA_2048");
    } else {
      setKeySpec("RSA_2048");
    }
  };

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

  // Filter principals
  const filteredAdminPrincipals = useMemo(() => {
    const term = adminSearch.toLowerCase();
    return initialPrincipals.filter(
      (p) => p.name.toLowerCase().includes(term) || p.arn.toLowerCase().includes(term)
    );
  }, [initialPrincipals, adminSearch]);

  const filteredUsagePrincipals = useMemo(() => {
    const term = usageSearch.toLowerCase();
    return initialPrincipals.filter(
      (p) => p.name.toLowerCase().includes(term) || p.arn.toLowerCase().includes(term)
    );
  }, [initialPrincipals, usageSearch]);

  const toggleAdminPrincipal = (arn: string) => {
    setAdminPrincipals((prev) =>
      prev.includes(arn) ? prev.filter((a) => a !== arn) : [...prev, arn]
    );
  };

  const toggleUsagePrincipal = (arn: string) => {
    setUsagePrincipals((prev) =>
      prev.includes(arn) ? prev.filter((a) => a !== arn) : [...prev, arn]
    );
  };

  // Compute default policy JSON
  const generatedPolicy = useMemo(() => {
    const rootArn = `arn:aws:iam::${accountId}:root`;
    const adminList = adminPrincipals.length > 0 ? adminPrincipals : [rootArn];
    const userList = usagePrincipals.length > 0 ? usagePrincipals : [rootArn];

    const statements: any[] = [
      {
        Sid: "Enable IAM User Permissions",
        Effect: "Allow",
        Principal: {
          AWS: rootArn,
        },
        Action: "kms:*",
        Resource: "*",
      },
      {
        Sid: "Allow access for Key Administrators",
        Effect: "Allow",
        Principal: {
          AWS: adminList.length === 1 ? adminList[0] : adminList,
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
          AWS: userList.length === 1 ? userList[0] : userList,
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
      {
        Sid: "Allow attachment of persistent resources",
        Effect: "Allow",
        Principal: {
          AWS: userList.length === 1 ? userList[0] : userList,
        },
        Action: [
          "kms:CreateGrant",
          "kms:ListGrants",
          "kms:RevokeGrant",
        ],
        Resource: "*",
        Condition: {
          Bool: {
            "kms:GrantIsForAWSResource": "true",
          },
        },
      },
    ];

    if (otherAccounts.trim()) {
      const extraAccts = otherAccounts
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .map((a) => `arn:aws:iam::${a}:root`);

      if (extraAccts.length > 0) {
        statements.push({
          Sid: "Allow external account usage",
          Effect: "Allow",
          Principal: {
            AWS: extraAccts.length === 1 ? extraAccts[0] : extraAccts,
          },
          Action: [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:DescribeKey",
          ],
          Resource: "*",
        });
      }
    }

    return JSON.stringify(
      {
        Version: "2012-10-17",
        Id: "key-consolepolicy-3",
        Statement: statements,
      },
      null,
      2
    );
  }, [accountId, adminPrincipals, usagePrincipals, allowAdminDelete, otherAccounts]);

  const activePolicy = isEditingPolicy ? editedPolicy : generatedPolicy;

  // Validation before proceeding
  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 2) {
      if (!alias.trim()) {
        setError("Alias is required.");
        return false;
      }
      if (alias.trim().length > 256) {
        setError("Alias name cannot exceed 256 characters.");
        return false;
      }
      // Check invalid characters
      const testName = alias.replace(/^alias\//, "");
      if (!/^[a-zA-Z0-9/_-]+$/.test(testName)) {
        setError("Alias can only contain alphanumeric characters, forward slashes, underscores, and dashes.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4 && !isEditingPolicy) {
        setEditedPolicy(generatedPolicy);
      }
      setCurrentStep((prev) => Math.min(5, prev + 1));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = () => {
    setError(null);
    startTransition(async () => {
      const res = await createKeyAction({
        keyType,
        keyUsage,
        keySpec,
        multiRegion,
        alias,
        description,
        tags,
        adminPrincipals,
        allowAdminDelete,
        usagePrincipals,
        customPolicy: activePolicy,
      });

      if (res.success && res.keyId) {
        router.push(`/kms/keys/${encodeURIComponent(res.keyId)}`);
      } else {
        setError(res.error || "Failed to create KMS key.");
      }
    });
  };

  const stepsList = [
    { number: 1, title: "Configure key" },
    { number: 2, title: "Add labels" },
    { number: 3, title: "Define key administrative permissions" },
    { number: 4, title: "Define key usage permissions" },
    { number: 5, title: "Review and edit key policy" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/kms" className="text-[#0972d3] hover:underline">
            Customer managed keys
          </Link>{" "}
          &gt; Create key
        </div>
        <h1 className="text-[20px] font-bold text-[#16191f]">Create key</h1>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {stepsList.map((s, index) => {
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;

            return (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      isActive
                        ? "bg-[#ec7211] text-white"
                        : isCompleted
                        ? "bg-[#1d8102] text-white"
                        : "bg-[#eaeded] text-[#545b64]"
                    }`}
                  >
                    {isCompleted ? "✓" : s.number}
                  </div>
                  <span
                    className={`text-[12px] hidden md:inline ${
                      isActive ? "font-bold text-[#16191f]" : "text-[#545b64]"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {index < stepsList.length - 1 && (
                  <div className="flex-1 h-0.5 bg-[#eaeded] mx-4 hidden md:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="text-[#545b64] font-bold text-sm ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Configure key */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Key type</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Choose the cryptographic type of the KMS key.
            </p>
            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="keyType"
                  checked={keyType === "SYMMETRIC"}
                  onChange={() => handleKeyTypeChange("SYMMETRIC")}
                  className="mt-1 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">Symmetric</div>
                  <div className="text-[12px] text-[#545b64]">
                    A single key used for both encryption and decryption. This is the default and recommended for most AWS service integrations.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="keyType"
                  checked={keyType === "ASYMMETRIC"}
                  onChange={() => handleKeyTypeChange("ASYMMETRIC")}
                  className="mt-1 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">Asymmetric</div>
                  <div className="text-[12px] text-[#545b64]">
                    A mathematically related public and private key pair for signing and verification, or encryption and decryption.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                <input
                  type="radio"
                  name="keyType"
                  checked={keyType === "HMAC"}
                  onChange={() => handleKeyTypeChange("HMAC")}
                  className="mt-1 text-[#ec7211] focus:ring-0"
                />
                <div>
                  <div className="font-semibold text-[13px] text-[#16191f]">HMAC</div>
                  <div className="text-[12px] text-[#545b64]">
                    A symmetric key used to generate and verify hash-based message authentication codes (HMAC).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Key usage */}
          {keyType === "ASYMMETRIC" && (
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Key usage</h2>
              <p className="text-[13px] text-[#545b64] mt-1">
                Choose whether the asymmetric key pair will be used for signing and verification or encryption and decryption.
              </p>
              <div className="mt-3 space-y-3">
                <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="keyUsage"
                    checked={keyUsage === "SIGN_VERIFY"}
                    onChange={() => handleKeyUsageChange("SIGN_VERIFY")}
                    className="mt-1 text-[#ec7211] focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-[13px] text-[#16191f]">Sign and verify</div>
                    <div className="text-[12px] text-[#545b64]">
                      Generates digital signatures with the private key and verifies signatures with the public key.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-[#eaeded] rounded cursor-pointer hover:bg-[#fafafa]">
                  <input
                    type="radio"
                    name="keyUsage"
                    checked={keyUsage === "ENCRYPT_DECRYPT"}
                    onChange={() => handleKeyUsageChange("ENCRYPT_DECRYPT")}
                    className="mt-1 text-[#ec7211] focus:ring-0"
                  />
                  <div>
                    <div className="font-semibold text-[13px] text-[#16191f]">Encrypt and decrypt</div>
                    <div className="text-[12px] text-[#545b64]">
                      Encrypts data with the public key and decrypts data with the private key.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Key spec */}
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Key spec</h2>
            <p className="text-[13px] text-[#545b64] mt-1">
              Select the cryptographic algorithm and key length.
            </p>
            <div className="mt-2">
              <select
                value={keySpec}
                onChange={(e) => setKeySpec(e.target.value)}
                className="w-full max-w-md border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] bg-white focus:outline-none focus:border-[#ec7211]"
              >
                {keyType === "SYMMETRIC" && (
                  <option value="SYMMETRIC_DEFAULT">SYMMETRIC_DEFAULT (AES-256-GCM)</option>
                )}

                {keyType === "ASYMMETRIC" && keyUsage === "SIGN_VERIFY" && (
                  <>
                    <option value="RSA_2048">RSA_2048</option>
                    <option value="RSA_3072">RSA_3072</option>
                    <option value="RSA_4096">RSA_4096</option>
                    <option value="ECC_NIST_P256">ECC_NIST_P256 (ECDSA)</option>
                    <option value="ECC_NIST_P384">ECC_NIST_P384 (ECDSA)</option>
                    <option value="ECC_NIST_P521">ECC_NIST_P521 (ECDSA)</option>
                    <option value="ECC_SECG_P256K1">ECC_SECG_P256K1</option>
                  </>
                )}

                {keyType === "ASYMMETRIC" && keyUsage === "ENCRYPT_DECRYPT" && (
                  <>
                    <option value="RSA_2048">RSA_2048</option>
                    <option value="RSA_3072">RSA_3072</option>
                    <option value="RSA_4096">RSA_4096</option>
                  </>
                )}

                {keyType === "HMAC" && (
                  <>
                    <option value="HMAC_256">HMAC_256 (32 bytes)</option>
                    <option value="HMAC_384">HMAC_384 (48 bytes)</option>
                    <option value="HMAC_512">HMAC_512 (64 bytes)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Advanced options */}
          <div className="border-t border-[#eaeded] pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[13px] font-semibold text-[#0972d3] hover:underline flex items-center gap-1"
            >
              <span>{showAdvanced ? "▼" : "▶"}</span> Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-4 text-[13px]">
                <div>
                  <div className="font-semibold text-[#16191f]">Key material origin</div>
                  <div className="text-[#545b64] text-[12px] mt-0.5">
                    KMS (recommended) – AWS KMS creates and manages the key material.
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-[#16191f]">Regionality</div>
                  <label className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={multiRegion}
                      onChange={(e) => setMultiRegion(e.target.checked)}
                      className="text-[#ec7211] focus:ring-0"
                    />
                    <span className="text-[#16191f]">
                      Multi-Region key (replicate this KMS key into other AWS Regions)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Add labels */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6 text-[13px]">
          <div>
            <label className="block font-semibold text-[#16191f]">
              Alias <span className="text-[#d13212]">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              A friendly display name for the KMS key. The prefix &quot;alias/&quot; will be automatically added if omitted.
            </p>
            <input
              type="text"
              placeholder="alias/my-application-key"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="mt-2 w-full max-w-lg border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#16191f]">Description</label>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              An optional description explaining the purpose of this key.
            </p>
            <textarea
              rows={3}
              placeholder="Encrypts application customer records and database exports"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full max-w-lg border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          {/* Tags */}
          <div className="border-t border-[#eaeded] pt-4">
            <h3 className="font-semibold text-[#16191f]">Tags</h3>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Key-value pairs to help categorize and track costs for this KMS key.
            </p>

            <div className="mt-3 flex gap-2 max-w-lg">
              <input
                type="text"
                placeholder="Key (e.g. Environment)"
                value={tagKeyInput}
                onChange={(e) => setTagKeyInput(e.target.value)}
                className="flex-1 border border-[#aab7b8] rounded px-3 py-1 focus:outline-none focus:border-[#ec7211]"
              />
              <input
                type="text"
                placeholder="Value (e.g. Production)"
                value={tagValInput}
                onChange={(e) => setTagValInput(e.target.value)}
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
        </div>
      )}

      {/* STEP 3: Define key administrative permissions */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4 text-[13px]">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Define key administrative permissions</h2>
            <p className="text-[#545b64] mt-1">
              Select the IAM users and roles that can administer this KMS key through the KMS API. Key administrators can view, enable, disable, and rotate this key.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <input
              type="text"
              placeholder="Filter IAM users and roles"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="w-[300px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
            <span className="text-[12px] text-[#545b64]">
              {adminPrincipals.length} selected
            </span>
          </div>

          <div className="border border-[#eaeded] rounded overflow-hidden max-h-60 overflow-y-auto">
            {filteredAdminPrincipals.length === 0 ? (
              <div className="p-6 text-center text-[#545b64]">
                No IAM users or roles found.{" "}
                <Link href="/iam/users" className="text-[#0972d3] hover:underline">
                  Create an IAM user
                </Link>{" "}
                or{" "}
                <Link href="/iam/roles" className="text-[#0972d3] hover:underline">
                  create an IAM role
                </Link>
                .
              </div>
            ) : (
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3 w-10"></th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">ARN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredAdminPrincipals.map((p) => {
                    const isChecked = adminPrincipals.includes(p.arn);
                    return (
                      <tr
                        key={p.arn}
                        onClick={() => toggleAdminPrincipal(p.arn)}
                        className={`hover:bg-[#f2f8fd] cursor-pointer ${isChecked ? "bg-[#ebf4fa]" : ""}`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAdminPrincipal(p.arn)}
                            className="text-[#ec7211] focus:ring-0"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#16191f]">{p.name}</td>
                        <td className="py-2 px-3 text-[#545b64]">{p.type}</td>
                        <td className="py-2 px-3 font-mono text-[#545b64]">{p.arn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Key deletion permission */}
          <div className="border-t border-[#eaeded] pt-4">
            <h3 className="font-semibold text-[#16191f]">Key deletion</h3>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAdminDelete}
                onChange={(e) => setAllowAdminDelete(e.target.checked)}
                className="text-[#ec7211] focus:ring-0"
              />
              <span className="text-[#16191f]">
                Allow key administrators to delete this key
              </span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 4: Define key usage permissions */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4 text-[13px]">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Define key usage permissions</h2>
            <p className="text-[#545b64] mt-1">
              Select the IAM users and roles that can use this KMS key for cryptographic operations.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <input
              type="text"
              placeholder="Filter IAM users and roles"
              value={usageSearch}
              onChange={(e) => setUsageSearch(e.target.value)}
              className="w-[300px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] focus:outline-none focus:border-[#ec7211]"
            />
            <span className="text-[12px] text-[#545b64]">
              {usagePrincipals.length} selected
            </span>
          </div>

          <div className="border border-[#eaeded] rounded overflow-hidden max-h-60 overflow-y-auto">
            {filteredUsagePrincipals.length === 0 ? (
              <div className="p-6 text-center text-[#545b64]">
                No IAM users or roles found.{" "}
                <Link href="/iam/users" className="text-[#0972d3] hover:underline">
                  Create an IAM user
                </Link>{" "}
                or{" "}
                <Link href="/iam/roles" className="text-[#0972d3] hover:underline">
                  create an IAM role
                </Link>
                .
              </div>
            ) : (
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#f8f9fa] border-b border-[#eaeded] text-[#545b64] uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3 w-10"></th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">ARN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeded]">
                  {filteredUsagePrincipals.map((p) => {
                    const isChecked = usagePrincipals.includes(p.arn);
                    return (
                      <tr
                        key={p.arn}
                        onClick={() => toggleUsagePrincipal(p.arn)}
                        className={`hover:bg-[#f2f8fd] cursor-pointer ${isChecked ? "bg-[#ebf4fa]" : ""}`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleUsagePrincipal(p.arn)}
                            className="text-[#ec7211] focus:ring-0"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-[#16191f]">{p.name}</td>
                        <td className="py-2 px-3 text-[#545b64]">{p.type}</td>
                        <td className="py-2 px-3 font-mono text-[#545b64]">{p.arn}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Other AWS Accounts */}
          <div className="border-t border-[#eaeded] pt-4">
            <h3 className="font-semibold text-[#16191f]">Other AWS accounts</h3>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Specify 12-digit AWS account IDs separated by commas to allow external accounts to use this key.
            </p>
            <input
              type="text"
              placeholder="e.g. 111122223333, 444455556666"
              value={otherAccounts}
              onChange={(e) => setOtherAccounts(e.target.value)}
              className="mt-2 w-full max-w-lg border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>
      )}

      {/* STEP 5: Review and edit key policy */}
      {currentStep === 5 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-6 text-[13px]">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Review and edit key policy</h2>
            <p className="text-[#545b64] mt-1">
              Review your configuration and inspect the generated key policy document.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#eaeded] rounded p-4 bg-[#fafafa]">
              <div className="font-bold text-[#16191f] mb-2">Key configuration</div>
              <div className="space-y-1 text-[12px] text-[#545b64]">
                <div>
                  Key type: <strong className="text-[#16191f]">{keyType}</strong>
                </div>
                <div>
                  Key usage: <strong className="text-[#16191f]">{keyUsage}</strong>
                </div>
                <div>
                  Key spec: <strong className="text-[#16191f]">{keySpec}</strong>
                </div>
                <div>
                  Regionality:{" "}
                  <strong className="text-[#16191f]">
                    {multiRegion ? "Multi-Region key" : "Single-Region key"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="border border-[#eaeded] rounded p-4 bg-[#fafafa]">
              <div className="font-bold text-[#16191f] mb-2">Labels &amp; Permissions</div>
              <div className="space-y-1 text-[12px] text-[#545b64]">
                <div>
                  Alias: <strong className="text-[#16191f]">{alias}</strong>
                </div>
                <div>
                  Description: <strong className="text-[#16191f]">{description || "—"}</strong>
                </div>
                <div>
                  Key administrators:{" "}
                  <strong className="text-[#16191f]">
                    {adminPrincipals.length > 0 ? `${adminPrincipals.length} selected` : "Account root"}
                  </strong>
                </div>
                <div>
                  Key users:{" "}
                  <strong className="text-[#16191f]">
                    {usagePrincipals.length > 0 ? `${usagePrincipals.length} selected` : "Account root"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Key Policy Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#16191f]">Key policy</h3>
              <button
                type="button"
                onClick={() => {
                  if (!isEditingPolicy) setEditedPolicy(generatedPolicy);
                  setIsEditingPolicy(!isEditingPolicy);
                }}
                className="text-[12px] font-semibold text-[#0972d3] hover:underline"
              >
                {isEditingPolicy ? "Revert to generated policy" : "Edit policy JSON"}
              </button>
            </div>

            {isEditingPolicy ? (
              <textarea
                rows={14}
                value={editedPolicy}
                onChange={(e) => setEditedPolicy(e.target.value)}
                className="w-full font-mono text-[12px] border border-[#aab7b8] rounded p-3 bg-white focus:outline-none focus:border-[#ec7211]"
              />
            ) : (
              <pre className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded font-mono text-[12px] text-[#16191f] overflow-x-auto max-h-72">
                {generatedPolicy}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
        <Link
          href="/kms"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
        >
          Cancel
        </Link>

        {currentStep > 1 && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleBack}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
          >
            Previous
          </button>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-4 rounded shadow-sm transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={handleFinish}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-6 rounded shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Creating key..." : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
