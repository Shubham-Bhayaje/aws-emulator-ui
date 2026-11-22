"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createApplicationAction } from "../../actions";

export default function CreateApplicationClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    setTags([...tags, { key: "", value: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: "key" | "value", val: string) => {
    const updated = [...tags];
    updated[index][field] = val;
    setTags(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Application name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const tagRecord: Record<string, string> = {};
    for (const t of tags) {
      if (t.key.trim()) {
        tagRecord[t.key.trim()] = t.value.trim();
      }
    }

    const res = await createApplicationAction(
      name.trim(),
      description.trim() || undefined,
      Object.keys(tagRecord).length > 0 ? tagRecord : undefined
    );

    setLoading(false);

    if (res.success && res.application) {
      router.push(`/appconfig/applications/${res.application.id}`);
    } else {
      setError(res.error || "Failed to create application.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-[#545b64] flex items-center gap-1.5">
        <Link href="/appconfig/applications" className="hover:text-[#0073bb]">
          Applications
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#16191f]">Create application</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create application</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          An application in AppConfig is a logical unit of code that provides capabilities for your customers.
          For example, an application could be a microservice running on Amazon ECS or an AWS Lambda function.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fdf2f2] border border-[#d13212] rounded text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Application details card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <h2 className="text-[16px] font-bold text-[#16191f]">Application details</h2>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Name <span className="text-[#d13212]">*</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-1.5">
              Enter a unique name for this application.
            </p>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. billing-service"
              className="w-full max-w-md px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Description <span className="text-[12px] font-normal text-[#545b64]">- optional</span>
            </label>
            <p className="text-[12px] text-[#545b64] mb-1.5">
              Enter a description for the application.
            </p>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Handles customer subscription billing and feature tiers"
              className="w-full max-w-lg px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-white text-[#16191f]"
            />
          </div>
        </div>

        {/* Tags card */}
        <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[#16191f]">Tags - optional</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add new tag
            </button>
          </div>

          {tags.length === 0 ? (
            <p className="text-[13px] text-[#545b64] italic">No tags added.</p>
          ) : (
            <div className="space-y-3">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Key"
                    value={tag.key}
                    onChange={(e) => handleTagChange(idx, "key", e.target.value)}
                    className="w-48 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={tag.value}
                    onChange={(e) => handleTagChange(idx, "value", e.target.value)}
                    className="w-48 px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="px-2.5 text-[13px] font-medium text-[#d13212] bg-white border border-[#aab7b8] rounded hover:bg-[#fdf2f2]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/appconfig/applications"
            className="px-4 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded disabled:opacity-40 flex items-center justify-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Creating..." : "Create application"}
          </button>
        </div>
      </form>
    </div>
  );
}
