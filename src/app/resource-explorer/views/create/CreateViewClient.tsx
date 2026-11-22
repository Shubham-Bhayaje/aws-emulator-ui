"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createViewAction } from "../../actions";

export default function CreateViewClient() {
  const router = useRouter();

  const [viewName, setViewName] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CUSTOM">("ALL");
  const [filterString, setFilterString] = useState("");
  const [includeTags, setIncludeTags] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  // Tags
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);

  // Submission
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    if (tags.length < 50) {
      setTags([...tags, { key: "", value: "" }]);
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const updateTag = (idx: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[idx][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewName.trim()) {
      setError("View name is required.");
      return;
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(viewName.trim())) {
      setError(
        "View name can only contain letters, numbers, hyphens (-), and underscores (_)."
      );
      return;
    }

    if (filterType === "CUSTOM" && !filterString.trim()) {
      setError("Please specify a filter query expression or choose 'Include all resources'.");
      return;
    }

    setLoading(true);
    setError(null);

    const tagMap: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagMap[t.key.trim()] = t.value.trim();
      }
    }

    try {
      const res = await createViewAction({
        viewName: viewName.trim(),
        filterString: filterType === "CUSTOM" ? filterString.trim() : undefined,
        includeTags,
        isDefault,
        tags: Object.keys(tagMap).length > 0 ? tagMap : undefined,
      });

      if (res.success) {
        router.push("/resource-explorer/views");
        router.refresh();
      } else {
        setError(res.error || "Failed to create view.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/resource-explorer" className="hover:underline">
          AWS Resource Explorer
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <Link href="/resource-explorer/views" className="hover:underline">
          Views
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Create view</span>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-[#eaeded]">
        <h1 className="text-[24px] font-bold text-[#16191f]">Create view</h1>
        <p className="text-[14px] text-[#545b64] mt-1">
          A view defines the subset of your AWS resources that are searchable and the optional resource attributes included in search results.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-[13px] text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: View details */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">View details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              View name <span className="text-red-600">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-2">
              The name must be 1 to 101 characters and can include letters, numbers, hyphens (-), and underscores (_).
            </p>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="e.g. production-resources or s3-storage"
              required
              maxLength={101}
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>
        </div>

        {/* Step 2: Resource filter */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Resource filter</h2>
          <p className="text-[12px] text-[#545b64]">
            Specify which indexed resources this view will include.
          </p>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="filterType"
                value="ALL"
                checked={filterType === "ALL"}
                onChange={() => setFilterType("ALL")}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Include all resources
                </span>
                <p className="text-[12px] text-[#545b64]">
                  All indexed resources in your account are searchable using this view.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="filterType"
                value="CUSTOM"
                checked={filterType === "CUSTOM"}
                onChange={() => setFilterType("CUSTOM")}
                className="mt-1 accent-[#ec7211]"
              />
              <div>
                <span className="text-[13px] font-medium text-[#16191f]">
                  Include only resources that match a specified filter
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Filter resources based on services, Regions, resource types, or tags.
                </p>
              </div>
            </label>

            {filterType === "CUSTOM" && (
              <div className="ml-6 pl-4 border-l-2 border-[#d5dbdb] space-y-3 pt-2">
                <div>
                  <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                    Filter query expression <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={filterString}
                    onChange={(e) => setFilterString(e.target.value)}
                    placeholder="e.g. service:s3 region:us-east-1"
                    className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  />
                </div>
                <div className="p-3 bg-gray-50 border border-[#eaeded] rounded text-[12px] text-[#545b64] space-y-1">
                  <span className="font-semibold text-[#16191f] block">Filter expression cheat sheet:</span>
                  <div><code className="text-[#16191f] font-mono">service:s3</code> - Filters by service name</div>
                  <div><code className="text-[#16191f] font-mono">region:us-east-1</code> - Filters by AWS Region</div>
                  <div><code className="text-[#16191f] font-mono">resourcetype:sns:topic</code> - Filters by specific resource type</div>
                  <div><code className="text-[#16191f] font-mono">tag:env=prod</code> - Filters by resource tag key and value</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Optional resource attributes */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Optional resource attributes</h2>
          <p className="text-[12px] text-[#545b64]">
            Specify whether additional metadata, such as tags, should be returned with search results when using this view.
          </p>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includeTags}
              onChange={(e) => setIncludeTags(e.target.checked)}
              className="mt-1 accent-[#ec7211]"
            />
            <div>
              <span className="text-[13px] font-medium text-[#16191f]">
                Include tags in search results
              </span>
              <p className="text-[12px] text-[#545b64]">
                When checked, resource tags are indexed and returned in query results.
              </p>
            </div>
          </label>
        </div>

        {/* Step 4: Default view */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Default view setting</h2>
          <p className="text-[12px] text-[#545b64]">
            You can make this view the default view for the AWS Region.
          </p>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="mt-1 accent-[#ec7211]"
            />
            <div>
              <span className="text-[13px] font-medium text-[#16191f]">
                Set as the default view for this AWS Region
              </span>
              <p className="text-[12px] text-[#545b64]">
                The default view is automatically used by the Resource search page when no specific view is requested.
              </p>
            </div>
          </label>
        </div>

        {/* Step 5: Tags */}
        <div className="bg-white border border-[#d5dbdb] rounded p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags - optional</h2>
              <p className="text-[12px] text-[#545b64]">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add new tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-12 gap-2 text-[12px] font-semibold text-[#545b64]">
                <div className="col-span-5">Key</div>
                <div className="col-span-6">Value</div>
                <div className="col-span-1"></div>
              </div>
              {tags.map((tag, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Key"
                      value={tag.key}
                      onChange={(e) => updateTag(idx, "key", e.target.value)}
                      className="w-full px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Value"
                      value={tag.value}
                      onChange={(e) => updateTag(idx, "value", e.target.value)}
                      className="w-full px-3 py-1 text-[13px] border border-[#d5dbdb] rounded focus:outline-none focus:border-[#ec7211]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="text-[12px] text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/resource-explorer/views"
            className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa] inline-flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm disabled:opacity-60"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create view"}
          </button>
        </div>
      </form>
    </div>
  );
}
