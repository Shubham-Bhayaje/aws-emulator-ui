"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGroupAction, searchResources } from "../actions";
import { ResourceTagMapping } from "../types";

const COMMON_RESOURCE_TYPES = [
  { id: "AWS::AllSupported", label: "All supported resource types" },
  { id: "AWS::EC2::Instance", label: "Amazon EC2 Instance (AWS::EC2::Instance)" },
  { id: "AWS::EC2::Volume", label: "Amazon EC2 Volume (AWS::EC2::Volume)" },
  { id: "AWS::EC2::SecurityGroup", label: "Amazon EC2 Security Group (AWS::EC2::SecurityGroup)" },
  { id: "AWS::S3::Bucket", label: "Amazon S3 Bucket (AWS::S3::Bucket)" },
  { id: "AWS::Lambda::Function", label: "AWS Lambda Function (AWS::Lambda::Function)" },
  { id: "AWS::DynamoDB::Table", label: "Amazon DynamoDB Table (AWS::DynamoDB::Table)" },
  { id: "AWS::KMS::Key", label: "AWS KMS Key (AWS::KMS::Key)" },
  { id: "AWS::SQS::Queue", label: "Amazon SQS Queue (AWS::SQS::Queue)" },
  { id: "AWS::SNS::Topic", label: "Amazon SNS Topic (AWS::SNS::Topic)" },
  { id: "AWS::IAM::Role", label: "AWS IAM Role (AWS::IAM::Role)" },
];

interface CreateGroupWizardProps {
  initialTagKeys: string[];
}

export function CreateGroupWizard({ initialTagKeys }: CreateGroupWizardProps) {
  const router = useRouter();

  // Step 1: Group type
  const [groupType, setGroupType] = useState<"tag" | "cloudformation">("tag");

  // Step 2: Grouping criteria
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["AWS::AllSupported"]);
  const [allTypesChecked, setAllTypesChecked] = useState(true);
  const [tagFilters, setTagFilters] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  // Preview state
  const [previewResources, setPreviewResources] = useState<ResourceTagMapping[] | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Step 3: Group details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handlePreview = async () => {
    setPreviewing(true);
    setErrorBanner(null);
    try {
      const types = allTypesChecked ? [] : selectedTypes.filter((t) => t !== "AWS::AllSupported");
      const tags = tagFilters
        .filter((tf) => tf.key.trim().length > 0)
        .map((tf) => ({ key: tf.key.trim(), value: tf.value.trim() }));

      const res = await searchResources({
        regions: ["All"],
        resourceTypes: types,
        tagFilters: tags,
      });

      if (res.success) {
        setPreviewResources(res.data);
      } else {
        setErrorBanner(res.error || "Failed to preview matching resources.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "An unexpected error occurred while previewing.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Group name is required.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(trimmedName)) {
      setNameError(
        "Group name can contain up to 128 letters, numbers, hyphens, and underscores."
      );
      return;
    }
    setNameError("");

    setSubmitting(true);
    try {
      const types = allTypesChecked ? [] : selectedTypes.filter((t) => t !== "AWS::AllSupported");
      const tags = tagFilters
        .filter((tf) => tf.key.trim().length > 0)
        .map((tf) => ({
          key: tf.key.trim(),
          values: tf.value.trim() ? [tf.value.trim()] : [],
        }));

      const res = await createGroupAction({
        name: trimmedName,
        description: description.trim(),
        resourceTypes: types,
        tagFilters: tags,
      });

      if (res.success) {
        router.push("/resource-groups");
      } else {
        setErrorBanner(res.error || "Failed to create resource group.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-[#16191f]">
      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded] mb-6">
        <div className="text-xs text-[#545b64] mb-1">
          <Link href="/resource-groups" className="text-[#0073bb] hover:underline">
            Resource Groups
          </Link>{" "}
          / Create Resource Group
        </div>
        <h1 className="text-xl font-bold text-[#16191f]">Create Resource Group</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Group resources based on criteria such as tags or AWS CloudFormation stacks.
        </p>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="mb-4 p-4 rounded text-sm border bg-[#fdf3f2] border-[#d13212] text-[#d13212]">
          {errorBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Group type */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <h2 className="text-sm font-bold text-[#16191f] mb-3 pb-2 border-b border-[#eaeded]">
            Step 1: Group type
          </h2>
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="groupType"
                value="tag"
                checked={groupType === "tag"}
                onChange={() => setGroupType("tag")}
                className="mt-0.5 accent-[#ec7211]"
              />
              <div>
                <span className="text-xs font-bold text-[#16191f] block">Tag-based (Recommended)</span>
                <span className="text-[11px] text-[#545b64]">
                  Group resources based on resource types and tags across your account.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="groupType"
                value="cloudformation"
                checked={groupType === "cloudformation"}
                onChange={() => setGroupType("cloudformation")}
                className="mt-0.5 accent-[#ec7211]"
              />
              <div>
                <span className="text-xs font-bold text-[#16191f] block">
                  AWS CloudFormation stack-based
                </span>
                <span className="text-[11px] text-[#545b64]">
                  Group resources contained in an AWS CloudFormation stack.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Step 2: Grouping criteria */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <h2 className="text-sm font-bold text-[#16191f] mb-3 pb-2 border-b border-[#eaeded]">
            Step 2: Grouping criteria
          </h2>

          {groupType === "cloudformation" ? (
            <div className="p-4 bg-[#f8f9fa] border border-[#eaeded] rounded text-xs text-[#545b64]">
              CloudFormation stack query filtering is active for this group. Specify stack identifiers and optional
              resource types below.
            </div>
          ) : (
            <div>
              {/* Resource Types */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-[#16191f] mb-1">Resource types</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-1.5 text-xs text-[#16191f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allTypesChecked}
                      onChange={(e) => {
                        setAllTypesChecked(e.target.checked);
                        if (e.target.checked) setSelectedTypes(["AWS::AllSupported"]);
                        else setSelectedTypes([]);
                      }}
                      className="accent-[#ec7211]"
                    />
                    <span className="font-semibold">All supported resource types</span>
                  </label>
                </div>
                {!allTypesChecked && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#fafafa] border border-[#eaeded] rounded max-h-40 overflow-y-auto">
                    {COMMON_RESOURCE_TYPES.filter((t) => t.id !== "AWS::AllSupported").map((t) => {
                      const checked = selectedTypes.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-1.5 text-xs text-[#16191f] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedTypes((prev) =>
                                prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                              );
                            }}
                            className="accent-[#ec7211]"
                          />
                          <span>{t.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tag Filters */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#16191f] mb-1">Tags</label>
                <p className="text-[11px] text-[#545b64] mb-3">
                  Specify tag keys and optional values. Resources matching all tag criteria will be included in the group.
                </p>

                <div className="space-y-2">
                  {tagFilters.map((tf, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tag key (e.g. Environment)"
                        list="tag-keys-wizard"
                        value={tf.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTagFilters((prev) => {
                            const next = [...prev];
                            next[idx].key = val;
                            return next;
                          });
                        }}
                        className="border border-[#aab7b8] rounded px-3 text-xs w-56 focus:outline-none focus:border-[#ec7211]"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      />
                      <datalist id="tag-keys-wizard">
                        {initialTagKeys.map((k) => (
                          <option key={k} value={k} />
                        ))}
                      </datalist>

                      <input
                        type="text"
                        placeholder="Tag value (optional)"
                        value={tf.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTagFilters((prev) => {
                            const next = [...prev];
                            next[idx].value = val;
                            return next;
                          });
                        }}
                        className="border border-[#aab7b8] rounded px-3 text-xs w-56 focus:outline-none focus:border-[#ec7211]"
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                      />

                      {tagFilters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTagFilters((prev) => prev.filter((_, i) => i !== idx))}
                          className="px-2 text-xs font-semibold text-[#d13212] hover:underline"
                          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setTagFilters((prev) => [...prev, { key: "", value: "" }])}
                  className="mt-3 px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add tag
                </button>
              </div>

              {/* Preview Button */}
              <div className="pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  disabled={previewing}
                  onClick={handlePreview}
                  className="px-4 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {previewing ? "Previewing..." : "Preview group resources"}
                </button>
              </div>

              {/* Preview Results Table */}
              {previewResources !== null && (
                <div className="mt-4 border border-[#eaeded] rounded">
                  <div className="p-2.5 bg-[#fafafa] border-b border-[#eaeded] text-xs font-bold text-[#16191f]">
                    Preview matching resources ({previewResources.length})
                  </div>
                  {previewResources.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#545b64]">
                      No resources match the specified criteria in this account.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#f8f9fa] text-[#545b64] border-b border-[#eaeded]">
                            <th className="p-2">Name</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">ARN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eaeded]">
                          {previewResources.map((r) => (
                            <tr key={r.resourceArn} className="hover:bg-[#fafafa]">
                              <td className="p-2 font-semibold">{r.resourceName}</td>
                              <td className="p-2 text-[#545b64]">{r.resourceType}</td>
                              <td className="p-2 font-mono text-[11px] text-[#545b64] truncate max-w-xs" title={r.resourceArn}>
                                {r.resourceArn}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Group details */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <h2 className="text-sm font-bold text-[#16191f] mb-3 pb-2 border-b border-[#eaeded]">
            Step 3: Group details
          </h2>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-[#16191f] mb-1">
                Group name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                placeholder="my-resource-group"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                className={`border rounded px-3 text-xs w-full focus:outline-none ${
                  nameError ? "border-[#d13212]" : "border-[#aab7b8] focus:border-[#ec7211]"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              />
              {nameError ? (
                <p className="text-[11px] text-[#d13212] mt-1">{nameError}</p>
              ) : (
                <p className="text-[11px] text-[#545b64] mt-1">
                  1 to 128 alphanumeric characters, hyphens, and underscores.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16191f] mb-1">
                Group description <span className="text-[#545b64] font-normal">- optional</span>
              </label>
              <textarea
                rows={3}
                placeholder="Description of the resource group"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-[#aab7b8] rounded p-2 text-xs w-full focus:outline-none focus:border-[#ec7211]"
              />
              <p className="text-[11px] text-[#545b64] mt-0.5">Up to 512 characters.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/resource-groups"
            className="px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {submitting ? "Creating..." : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}
