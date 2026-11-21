"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRepositoryAction, KmsKeyOption } from "../../actions";

interface CreateRepositoryClientProps {
  kmsKeys: KmsKeyOption[];
}

export default function CreateRepositoryClient({ kmsKeys }: CreateRepositoryClientProps) {
  const router = useRouter();

  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [repoName, setRepoName] = useState("");
  const [tagMutability, setTagMutability] = useState<"MUTABLE" | "IMMUTABLE">("MUTABLE");
  const [scanOnPush, setScanOnPush] = useState(false);

  // Encryption
  const [customEncryption, setCustomEncryption] = useState(false);
  const [selectedKmsKey, setSelectedKmsKey] = useState<string>(
    kmsKeys[0]?.keyArn || kmsKeys[0]?.keyId || ""
  );

  // Tags
  const [tags, setTags] = useState<{ Key: string; Value: string }[]>([
    { Key: "", Value: "" },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addTag() {
    setTags([...tags, { Key: "", Value: "" }]);
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function updateTag(index: number, field: "Key" | "Value", val: string) {
    const next = [...tags];
    next[index][field] = val;
    setTags(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = repoName.trim().toLowerCase();
    if (!cleanName) {
      setError("Repository name is required.");
      return;
    }

    // Name format validation
    const nameRegex = /^[a-z0-9]+(?:[._\/-][a-z0-9]+)*$/;
    if (!nameRegex.test(cleanName)) {
      setError(
        "Invalid repository name. Names must start with a letter/digit and contain only lowercase letters, numbers, hyphens, underscores, and forward slashes."
      );
      return;
    }

    setError(null);

    const validTags = tags.filter((t) => t.Key.trim() !== "");

    startTransition(async () => {
      const res = await createRepositoryAction({
        repositoryName: cleanName,
        imageTagMutability: tagMutability,
        scanOnPush,
        encryptionType: customEncryption ? "KMS" : "AES256",
        kmsKey: customEncryption ? selectedKmsKey : undefined,
        tags: validTags,
      });

      if (res.success) {
        router.push("/ecr/repositories");
        router.refresh();
      } else {
        setError(res.error || "Failed to create repository.");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-[1000px]">
      {/* Breadcrumb */}
      <div className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#0073bb]">
          Console Home
        </Link>
        <span>/</span>
        <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
          Amazon ECR
        </Link>
        <span>/</span>
        <Link href="/ecr/repositories" className="hover:text-[#0073bb]">
          Private repositories
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-semibold">Create repository</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Create repository</h1>
        <p className="text-[13px] text-[#545b64]">
          Configure general visibility, tag immutability, vulnerability scanning, and encryption for your container image repository.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[#d13212] text-[13px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: General Settings */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-5">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">General settings</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Specify visibility permissions and a unique name for your container repository.
            </p>
          </div>

          {/* Visibility settings */}
          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Visibility settings
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                onClick={() => setVisibility("private")}
                className={`p-4 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                  visibility === "private"
                    ? "border-[#ec7211] bg-[#fdf8f4]"
                    : "border-[#d5dbdb] bg-white hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="accent-[#ec7211]"
                  />
                  <span className="font-bold text-[#16191f] text-[13px]">Private</span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Repositories are only accessible within your AWS account or to accounts explicitly granted IAM permissions.
                </p>
              </label>

              <label
                onClick={() => setVisibility("public")}
                className={`p-4 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                  visibility === "public"
                    ? "border-[#ec7211] bg-[#fdf8f4]"
                    : "border-[#d5dbdb] bg-white hover:bg-[#fafafa]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="accent-[#ec7211]"
                  />
                  <span className="font-bold text-[#16191f] text-[13px]">Public</span>
                </div>
                <p className="text-[12px] text-[#545b64] mt-2">
                  Repositories are publicly accessible on the Amazon ECR Public Gallery for anyone worldwide to search and pull.
                </p>
              </label>
            </div>
          </div>

          {/* Repository Name */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Repository name
            </label>
            <div className="flex items-center border border-[#aab7b8] rounded-sm overflow-hidden focus-within:border-[#ec7211]">
              <span className="px-3 py-2 bg-[#f2f3f3] text-[#545b64] text-[12px] font-mono border-r border-[#aab7b8] select-none whitespace-nowrap">
                127.0.0.1:9297/
              </span>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="project-a/nginx-web"
                className="w-full px-3 py-2 text-[13px] text-[#16191f] focus:outline-none"
              />
            </div>
            <p className="text-[12px] text-[#545b64]">
              The repository name must start with a letter/number and can only contain lowercase letters, numbers, hyphens, underscores, and forward slashes. Example: <span className="font-mono">team-alpha/auth-service</span>
            </p>
          </div>

          {/* Tag Immutability */}
          <div className="space-y-2 pt-2 border-t border-[#eaeded]">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Tag immutability
            </label>
            <p className="text-[12px] text-[#545b64]">
              Enable tag immutability to prevent image tags from being overwritten by subsequent image pushes using the same tag.
            </p>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagMutability"
                  value="MUTABLE"
                  checked={tagMutability === "MUTABLE"}
                  onChange={() => setTagMutability("MUTABLE")}
                  className="accent-[#ec7211]"
                />
                <span className="text-[13px]">Mutable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tagMutability"
                  value="IMMUTABLE"
                  checked={tagMutability === "IMMUTABLE"}
                  onChange={() => setTagMutability("IMMUTABLE")}
                  className="accent-[#ec7211]"
                />
                <span className="text-[13px]">Immutable</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Image Scan Settings */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">Image scan settings</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Configure automatic vulnerability scanning for container images pushed to this repository.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-bold text-[#16191f]">
              Scan on push
            </label>
            <p className="text-[12px] text-[#545b64]">
              When enabled, each image pushed to the repository is automatically scanned for common software vulnerabilities.
            </p>
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scanOnPush"
                  checked={scanOnPush === false}
                  onChange={() => setScanOnPush(false)}
                  className="accent-[#ec7211]"
                />
                <span className="text-[13px]">Disabled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scanOnPush"
                  checked={scanOnPush === true}
                  onChange={() => setScanOnPush(true)}
                  className="accent-[#ec7211]"
                />
                <span className="text-[13px]">Enabled</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 3: Encryption Settings */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-[#eaeded] pb-3">
            <h2 className="text-[16px] font-bold text-[#16191f]">KMS encryption</h2>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Images in this repository are encrypted at rest using server-side encryption.
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={customEncryption}
              onChange={(e) => setCustomEncryption(e.target.checked)}
              className="mt-0.5 accent-[#ec7211]"
            />
            <div>
              <span className="font-bold text-[13px] text-[#16191f]">
                Customize encryption settings (advanced)
              </span>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                By default, Amazon ECR uses AWS-managed AES-256 encryption. Enable this setting to use AWS Key Management Service (KMS) with Customer Managed Keys.
              </p>
            </div>
          </label>

          {customEncryption && (
            <div className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded-sm space-y-3 mt-3">
              <label className="block text-[13px] font-bold text-[#16191f]">
                KMS key
              </label>
              <p className="text-[12px] text-[#545b64]">
                Select a customer-managed KMS key in your account.
              </p>

              {kmsKeys.length === 0 ? (
                <div className="p-3 bg-white border border-[#d5dbdb] rounded-sm text-[12px] text-[#545b64] flex items-center justify-between">
                  <span>No customer-managed KMS keys found in this Region.</span>
                  <Link
                    href="/kms/keys/create"
                    target="_blank"
                    className="font-bold text-[#0073bb] hover:underline"
                  >
                    Create a KMS key &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={selectedKmsKey}
                    onChange={(e) => setSelectedKmsKey(e.target.value)}
                    className="w-full px-3 py-2 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f] focus:outline-none focus:border-[#ec7211]"
                  >
                    {kmsKeys.map((k) => (
                      <option key={k.keyId} value={k.keyArn}>
                        {k.alias ? `${k.alias} (${k.keyId})` : k.keyId}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#545b64]">
                    Selected key ARN: <span className="font-mono">{selectedKmsKey}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card 4: Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-6 shadow-xs space-y-4">
          <div className="border-b border-[#eaeded] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={addTag}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[12px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
            >
              Add tag
            </button>
          </div>

          <div className="space-y-2">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={t.Key}
                  onChange={(e) => updateTag(idx, "Key", e.target.value)}
                  placeholder="Key (e.g. Environment)"
                  className="w-1/2 px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
                />
                <input
                  type="text"
                  value={t.Value}
                  onChange={(e) => updateTag(idx, "Value", e.target.value)}
                  placeholder="Value (e.g. Production)"
                  className="w-1/2 px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#ec7211]"
                />
                {tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTag(idx)}
                    className="text-[#d13212] hover:text-[#a8250c] text-[13px] font-bold px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/ecr/repositories"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-4 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors flex items-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-5 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] transition-colors shadow-xs disabled:opacity-50"
          >
            {isPending ? "Creating repository..." : "Create repository"}
          </button>
        </div>
      </form>
    </div>
  );
}
