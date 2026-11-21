"use client";

import React, { useState, useTransition } from "react";
import { ResourceTagMapping, TagItem } from "../types";
import {
  searchResources,
  fetchTagValues,
  tagResourcesAction,
  untagResourcesAction,
} from "../actions";

const ALL_REGIONS = [
  { id: "us-east-1", name: "US East (N. Virginia)" },
  { id: "us-east-2", name: "US East (Ohio)" },
  { id: "us-west-1", name: "US West (N. California)" },
  { id: "us-west-2", name: "US West (Oregon)" },
  { id: "eu-west-1", name: "Europe (Ireland)" },
  { id: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
];

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
  { id: "AWS::RAM::ResourceShare", label: "AWS RAM Resource Share (AWS::RAM::ResourceShare)" },
  { id: "AWS::ServiceQuotas::ServiceQuota", label: "AWS Service Quotas Quota (AWS::ServiceQuotas::ServiceQuota)" },
];

interface TagEditorClientProps {
  initialResources: ResourceTagMapping[];
  initialTagKeys: string[];
}

export function TagEditorClient({
  initialResources,
  initialTagKeys,
}: TagEditorClientProps) {
  const [resources, setResources] = useState<ResourceTagMapping[]>(initialResources);
  const [tagKeys, setTagKeys] = useState<string[]>(initialTagKeys);

  // Criteria state
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["us-east-1"]);
  const [allRegionsChecked, setAllRegionsChecked] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["AWS::AllSupported"]);
  const [allTypesChecked, setAllTypesChecked] = useState(true);

  const [tagCriteria, setTagCriteria] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  // Selection & UI state
  const [selectedArns, setSelectedArns] = useState<Set<string>>(new Set());
  const [tableFilter, setTableFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Manage tags modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [tagsToAdd, setTagsToAdd] = useState<TagItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [tagsToRemove, setTagsToRemove] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  // Suggested values for criteria
  const [keyValuesMap, setKeyValuesMap] = useState<{ [key: string]: string[] }>({});

  const handleKeyBlur = async (key: string) => {
    if (key.trim() && !keyValuesMap[key]) {
      const res = await fetchTagValues(key.trim());
      if (res.success && res.data) {
        setKeyValuesMap((prev) => ({ ...prev, [key]: res.data }));
      }
    }
  };

  const handleSearch = () => {
    startTransition(async () => {
      setBanner(null);
      const regions = allRegionsChecked ? ["All"] : selectedRegions;
      const resourceTypes = allTypesChecked
        ? []
        : selectedTypes.filter((t) => t !== "AWS::AllSupported");
      const tagFilters = tagCriteria
        .filter((tc) => tc.key.trim().length > 0)
        .map((tc) => ({ key: tc.key.trim(), value: tc.value.trim() }));

      const res = await searchResources({
        regions,
        resourceTypes,
        tagFilters,
      });

      if (res.success) {
        setResources(res.data);
        setSelectedArns(new Set());
      } else {
        setBanner({ type: "error", message: res.error || "Failed to search tagged resources." });
      }
    });
  };

  const handleReset = () => {
    setSelectedRegions(["us-east-1"]);
    setAllRegionsChecked(false);
    setSelectedTypes(["AWS::AllSupported"]);
    setAllTypesChecked(true);
    setTagCriteria([{ key: "", value: "" }]);
    setTableFilter("");
  };

  // Filter results locally
  const filteredResources = resources.filter((r) => {
    const term = tableFilter.toLowerCase();
    return (
      r.resourceName.toLowerCase().includes(term) ||
      r.resourceArn.toLowerCase().includes(term) ||
      r.resourceType.toLowerCase().includes(term) ||
      r.region.toLowerCase().includes(term) ||
      r.tags.some(
        (t) => t.key.toLowerCase().includes(term) || t.value.toLowerCase().includes(term)
      )
    );
  });

  const toggleSelectAll = () => {
    if (selectedArns.size === filteredResources.length && filteredResources.length > 0) {
      setSelectedArns(new Set());
    } else {
      setSelectedArns(new Set(filteredResources.map((r) => r.resourceArn)));
    }
  };

  const toggleSelectArn = (arn: string) => {
    setSelectedArns((prev) => {
      const next = new Set(prev);
      if (next.has(arn)) next.delete(arn);
      else next.add(arn);
      return next;
    });
  };

  // Find distinct existing tag keys on selected resources
  const selectedResourcesList = resources.filter((r) => selectedArns.has(r.resourceArn));
  const distinctExistingKeys = Array.from(
    new Set(selectedResourcesList.flatMap((r) => r.tags.map((t) => t.key)))
  );

  const handleAddTagToApply = () => {
    if (!newKey.trim()) return;
    setTagsToAdd((prev) => [
      ...prev.filter((t) => t.key !== newKey.trim()),
      { key: newKey.trim(), value: newValue.trim() },
    ]);
    setNewKey("");
    setNewValue("");
  };

  const handleRemoveTagToApply = (key: string) => {
    setTagsToAdd((prev) => prev.filter((t) => t.key !== key));
  };

  const handleApplyTagChanges = async () => {
    setApplying(true);
    setBanner(null);
    try {
      const arnList = Array.from(selectedArns);

      // Apply tags
      if (tagsToAdd.length > 0) {
        const tagMap: { [key: string]: string } = {};
        tagsToAdd.forEach((t) => {
          tagMap[t.key] = t.value;
        });
        const res = await tagResourcesAction(arnList, tagMap);
        if (!res.success) {
          throw new Error(res.error || "Failed to apply tags");
        }
      }

      // Untag
      if (tagsToRemove.size > 0) {
        const untagRes = await untagResourcesAction(arnList, Array.from(tagsToRemove));
        if (!untagRes.success) {
          throw new Error(untagRes.error || "Failed to remove tags");
        }
      }

      setBanner({
        type: "success",
        message: `Successfully updated tags on ${arnList.length} resource(s).`,
      });

      // Close modals
      setIsConfirmOpen(false);
      setIsManageModalOpen(false);
      setTagsToAdd([]);
      setTagsToRemove(new Set());

      // Refresh search results
      handleSearch();
    } catch (err: any) {
      setBanner({
        type: "error",
        message: err.message || "An error occurred while updating tags.",
      });
      setIsConfirmOpen(false);
    } finally {
      setApplying(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Resource Name", "Resource Type", "Region", "Resource ARN", "Tags"];
    const rows = filteredResources.map((r) => [
      `"${r.resourceName}"`,
      `"${r.resourceType}"`,
      `"${r.region}"`,
      `"${r.resourceArn}"`,
      `"${r.tags.map((t) => `${t.key}=${t.value}`).join("; ")}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tag-editor-resources-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto text-[#16191f]">
      {/* Banner */}
      {banner && (
        <div
          className={`mb-4 p-4 rounded text-sm flex items-start justify-between border ${
            banner.type === "success"
              ? "bg-[#f2fcf3] border-[#037f0c] text-[#037f0c]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <div>{banner.message}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#eaeded] mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#16191f]">Tag Editor</h1>
          <p className="text-xs text-[#545b64] mt-1">
            Find resources and manage their tags in one place across all supported AWS services and Regions.
          </p>
        </div>
      </div>

      {/* Find Resources Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm mb-6 p-5">
        <h2 className="text-sm font-bold text-[#16191f] mb-4 pb-2 border-b border-[#eaeded]">
          Find resources to tag
        </h2>

        {/* Regions Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-[#16191f] mb-1">Regions</label>
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-[#16191f] cursor-pointer">
              <input
                type="checkbox"
                checked={allRegionsChecked}
                onChange={(e) => {
                  setAllRegionsChecked(e.target.checked);
                  if (e.target.checked) setSelectedRegions(["All"]);
                  else setSelectedRegions(["us-east-1"]);
                }}
                className="accent-[#ec7211]"
              />
              <span className="font-semibold">All Regions</span>
            </label>
          </div>
          {!allRegionsChecked && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-[#fafafa] border border-[#eaeded] rounded max-h-36 overflow-y-auto">
              {ALL_REGIONS.map((r) => {
                const checked = selectedRegions.includes(r.id);
                return (
                  <label key={r.id} className="flex items-center gap-1.5 text-xs text-[#16191f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedRegions((prev) =>
                          prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                        );
                      }}
                      className="accent-[#ec7211]"
                    />
                    <span>{r.name} ({r.id})</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Resource Types Selector */}
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
              <span className="font-semibold">All resource types</span>
            </label>
          </div>
          {!allTypesChecked && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#fafafa] border border-[#eaeded] rounded max-h-44 overflow-y-auto">
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
        <div className="mb-6">
          <label className="block text-xs font-bold text-[#16191f] mb-1">Tags (optional filter)</label>
          <p className="text-[11px] text-[#545b64] mb-3">
            Filter resources by tag keys and values. Leave empty to find all resources matching the regions and types above.
          </p>

          <div className="space-y-2">
            {tagCriteria.map((tc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tag key (e.g. Environment)"
                  list={`keys-list-${idx}`}
                  value={tc.key}
                  onChange={(e) => {
                    const newKeyVal = e.target.value;
                    setTagCriteria((prev) => {
                      const next = [...prev];
                      next[idx].key = newKeyVal;
                      return next;
                    });
                  }}
                  onBlur={() => handleKeyBlur(tc.key)}
                  className="border border-[#aab7b8] rounded px-3 text-xs w-60 focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
                <datalist id={`keys-list-${idx}`}>
                  {tagKeys.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>

                <input
                  type="text"
                  placeholder="Tag value (optional)"
                  list={`vals-list-${idx}`}
                  value={tc.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTagCriteria((prev) => {
                      const next = [...prev];
                      next[idx].value = val;
                      return next;
                    });
                  }}
                  className="border border-[#aab7b8] rounded px-3 text-xs w-60 focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
                <datalist id={`vals-list-${idx}`}>
                  {(keyValuesMap[tc.key] || []).map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>

                {tagCriteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTagCriteria((prev) => prev.filter((_, i) => i !== idx));
                    }}
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
            onClick={() => setTagCriteria((prev) => [...prev, { key: "", value: "" }])}
            className="mt-3 px-3 text-xs font-semibold text-[#0073bb] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Add tag
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#eaeded]">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSearch}
            className="px-5 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {isPending ? "Searching..." : "Search resources"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        {/* Results Toolbar */}
        <div className="p-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#16191f]">
              Resources ({filteredResources.length})
            </span>
            <input
              type="text"
              placeholder="Filter resources"
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 text-xs w-64 focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedArns.size === 0}
              onClick={() => setIsManageModalOpen(true)}
              className={`px-3 text-xs font-semibold rounded border ${
                selectedArns.size > 0
                  ? "bg-[#ec7211] text-white border-[#ec7211] hover:bg-[#eb5f07]"
                  : "bg-[#f2f3f3] border-[#eaeded] text-[#aab7b8] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Manage tags of selected resources ({selectedArns.size})
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Export to CSV
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Resources Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#f8f9fa] text-[#545b64] font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedArns.size === filteredResources.length && filteredResources.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="accent-[#ec7211]"
                  />
                </th>
                <th className="py-2.5 px-3">Resource name / ID</th>
                <th className="py-2.5 px-3">Resource type</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Existing tags</th>
                <th className="py-2.5 px-3">Resource ARN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#545b64]">
                    <div className="font-semibold text-sm mb-1">No resources found</div>
                    <div className="text-xs text-[#545b64]">
                      No resources match the specified search criteria. Try modifying your region, resource type, or tag filters.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  const isChecked = selectedArns.has(res.resourceArn);
                  return (
                    <tr
                      key={res.resourceArn}
                      onClick={() => toggleSelectArn(res.resourceArn)}
                      className={`hover:bg-[#fbfbfb] cursor-pointer transition-colors ${
                        isChecked ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectArn(res.resourceArn)}
                          className="accent-[#ec7211]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#16191f]">
                        {res.resourceName}
                      </td>
                      <td className="py-2.5 px-3 text-[#545b64]">{res.resourceType}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{res.region}</td>
                      <td className="py-2.5 px-3">
                        {res.tags.length === 0 ? (
                          <span className="text-[#aab7b8]">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {res.tags.map((t) => (
                              <span
                                key={t.key}
                                className="inline-block px-1.5 py-0.5 text-[10px] bg-[#f2f3f3] text-[#16191f] border border-[#eaeded] rounded"
                                title={`${t.key}=${t.value}`}
                              >
                                <strong>{t.key}:</strong> {t.value || '""'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td
                        className="py-2.5 px-3 font-mono text-[11px] text-[#545b64] truncate max-w-sm"
                        title={res.resourceArn}
                      >
                        {res.resourceArn}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Manage Tags */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 text-[#16191f] max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold mb-1">
              Manage tags of selected resources ({selectedArns.size} resources)
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Apply new tags, edit existing tag values, or remove tags from all selected resources at once.
            </p>

            {/* Selected resources preview list */}
            <div className="mb-4 p-3 bg-[#fafafa] border border-[#eaeded] rounded max-h-32 overflow-y-auto">
              <span className="text-[11px] font-bold text-[#545b64] block mb-1">Selected resources:</span>
              <ul className="text-xs text-[#16191f] space-y-1">
                {selectedResourcesList.map((r) => (
                  <li key={r.resourceArn} className="font-mono text-[11px] truncate" title={r.resourceArn}>
                    • {r.resourceName} ({r.resourceType})
                  </li>
                ))}
              </ul>
            </div>

            {/* Section: Tags to add or update */}
            <div className="mb-5 pb-4 border-b border-[#eaeded]">
              <h3 className="text-xs font-bold text-[#16191f] mb-1">Tags to add or update</h3>
              <p className="text-[11px] text-[#545b64] mb-3">
                These tags will be applied to all selected resources. If a tag key already exists on a resource, its value will be updated.
              </p>

              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Tag key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="border border-[#aab7b8] rounded px-3 text-xs w-48 focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
                <input
                  type="text"
                  placeholder="Tag value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="border border-[#aab7b8] rounded px-3 text-xs w-48 focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                />
                <button
                  type="button"
                  onClick={handleAddTagToApply}
                  className="px-3 text-xs font-semibold text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Add tag
                </button>
              </div>

              {tagsToAdd.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-[#f9f9f9] border border-[#eaeded] rounded">
                  {tagsToAdd.map((t) => (
                    <span
                      key={t.key}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-[#f2f8fd] text-[#0073bb] border border-[#a4c6eb] rounded"
                    >
                      <span>
                        <strong>{t.key}:</strong> {t.value || '""'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTagToApply(t.key)}
                        className="text-[#d13212] font-bold text-xs hover:opacity-80"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Section: Tags to remove */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-[#16191f] mb-1">Tags to remove</h3>
              <p className="text-[11px] text-[#545b64] mb-3">
                Select existing tag keys to remove from all selected resources.
              </p>

              {distinctExistingKeys.length === 0 ? (
                <div className="text-xs text-[#545b64] italic">
                  No existing tags found on the selected resources.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-[#fafafa] border border-[#eaeded] rounded max-h-36 overflow-y-auto">
                  {distinctExistingKeys.map((key) => {
                    const isChecked = tagsToRemove.has(key);
                    return (
                      <label key={key} className="flex items-center gap-1.5 text-xs text-[#16191f] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setTagsToRemove((prev) => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              return next;
                            });
                          }}
                          className="accent-[#ec7211]"
                        />
                        <span className="font-mono text-[11px]">{key}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={tagsToAdd.length === 0 && tagsToRemove.size === 0}
                onClick={() => setIsConfirmOpen(true)}
                className={`px-4 text-xs font-semibold rounded text-white ${
                  tagsToAdd.length > 0 || tagsToRemove.size > 0
                    ? "bg-[#ec7211] hover:bg-[#eb5f07]"
                    : "bg-[#aab7b8] cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Review and apply tag changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-2xl max-w-lg w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">Review and apply tag changes</h2>
            <p className="text-xs text-[#545b64] mb-4">
              You are about to apply tag changes to{" "}
              <strong className="text-[#16191f]">{selectedArns.size} selected resource(s)</strong>. This action
              updates tags across all selected resources simultaneously.
            </p>

            <div className="space-y-3 mb-6 p-4 bg-[#fafafa] border border-[#eaeded] rounded text-xs">
              <div>
                <span className="font-bold text-[#16191f] block mb-1">
                  Tags to add or update ({tagsToAdd.length}):
                </span>
                {tagsToAdd.length === 0 ? (
                  <span className="text-[#545b64] italic">None</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {tagsToAdd.map((t) => (
                      <span
                        key={t.key}
                        className="px-2 py-0.5 bg-[#f2fcf3] text-[#037f0c] border border-[#a1dfa5] rounded text-[11px]"
                      >
                        {t.key} = {t.value || '""'}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-[#16191f] block mb-1">
                  Tags to remove ({tagsToRemove.size}):
                </span>
                {tagsToRemove.size === 0 ? (
                  <span className="text-[#545b64] italic">None</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(tagsToRemove).map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 bg-[#fdf3f2] text-[#d13212] border border-[#f3b5a8] rounded text-[11px]"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={applying}
                onClick={() => setIsConfirmOpen(false)}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Back
              </button>
              <button
                type="button"
                disabled={applying}
                onClick={handleApplyTagChanges}
                className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {applying ? "Applying..." : "Apply changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
