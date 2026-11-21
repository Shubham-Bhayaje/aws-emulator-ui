"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResourceGroupItem, GroupResourceItem } from "../types";
import { deleteGroupAction } from "../actions";

interface GroupDetailClientProps {
  group: ResourceGroupItem;
  resources: GroupResourceItem[];
}

export function GroupDetailClient({ group, resources }: GroupDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"resources" | "query" | "tags">("resources");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setErrorBanner(null);
    try {
      const res = await deleteGroupAction(group.name);
      if (res.success) {
        router.push("/resource-groups");
      } else {
        setErrorBanner(res.error || "Failed to delete group.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "An unexpected error occurred.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  let parsedQuery = null;
  try {
    if (group.query) {
      parsedQuery = JSON.parse(group.query);
    }
  } catch {
    // raw string
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto text-[#16191f]">
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-3">
        <Link href="/resource-groups" className="text-[#0073bb] hover:underline">
          Resource Groups
        </Link>{" "}
        / <span className="text-[#16191f] font-semibold">{group.name}</span>
      </div>

      {/* Error banner */}
      {errorBanner && (
        <div className="mb-4 p-4 rounded text-sm border bg-[#fdf3f2] border-[#d13212] text-[#d13212]">
          {errorBanner}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#eaeded] mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#16191f]">{group.name}</h1>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-[#f2f8fd] text-[#0073bb] border border-[#a4c6eb] rounded">
              Tag-based
            </span>
          </div>
          <p className="text-xs font-mono text-[#545b64] mt-1 select-all">{group.groupArn}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 text-xs font-semibold rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete group
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5 mb-6">
        <h2 className="text-sm font-bold text-[#16191f] mb-4 pb-2 border-b border-[#eaeded]">
          Group overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="text-[#545b64] block mb-1">Group name</span>
            <span className="font-semibold text-[#16191f]">{group.name}</span>
          </div>
          <div>
            <span className="text-[#545b64] block mb-1">Description</span>
            <span className="text-[#16191f]">{group.description || "-"}</span>
          </div>
          <div>
            <span className="text-[#545b64] block mb-1">Group type</span>
            <span className="text-[#16191f]">Tag-based</span>
          </div>
          <div>
            <span className="text-[#545b64] block mb-1">Resources in group</span>
            <span className="font-semibold text-[#16191f] text-sm">{resources.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#eaeded] mb-5">
        <nav className="flex space-x-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "resources"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Resources in group ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("query")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "query"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Group query
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tags")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "tags"
                ? "border-[#ec7211] text-[#ec7211]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Group tags (0)
          </button>
        </nav>
      </div>

      {/* Tab 1: Resources in group */}
      {activeTab === "resources" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm">
          <div className="p-3 border-b border-[#eaeded] bg-[#fafafa] flex items-center justify-between">
            <span className="text-xs font-bold text-[#16191f]">
              Resources in group ({resources.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#eaeded] bg-[#f8f9fa] text-[#545b64] font-semibold">
                  <th className="py-2.5 px-3">Resource name / ID</th>
                  <th className="py-2.5 px-3">Resource type</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Resource ARN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#545b64]">
                      <div className="font-semibold text-sm mb-1">No resources in this group</div>
                      <div className="text-xs text-[#545b64]">
                        No resources in your account currently match the query criteria specified for this group.
                      </div>
                    </td>
                  </tr>
                ) : (
                  resources.map((res) => (
                    <tr key={res.arn} className="hover:bg-[#fbfbfb]">
                      <td className="py-2.5 px-3 font-semibold text-[#16191f]">{res.name}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{res.type}</td>
                      <td className="py-2.5 px-3 text-[#545b64]">{res.region}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-[#f2fcf3] text-[#037f0c] border border-[#a1dfa5] rounded">
                          {res.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#545b64] truncate max-w-sm" title={res.arn}>
                        {res.arn}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Group query */}
      {activeTab === "query" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#eaeded]">
            <div>
              <h3 className="text-xs font-bold text-[#16191f]">Resource query criteria</h3>
              <p className="text-[11px] text-[#545b64]">
                The query criteria defines which resources belong to this group dynamically.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-[#f2f3f3] px-2 py-0.5 border border-[#eaeded] rounded">
              {group.queryType || "TAG_FILTERS_1_0"}
            </span>
          </div>

          <pre className="p-4 bg-[#16191f] text-[#f2f3f3] font-mono text-xs rounded overflow-x-auto">
            {parsedQuery ? JSON.stringify(parsedQuery, null, 2) : group.query || "No query defined"}
          </pre>
        </div>
      )}

      {/* Tab 3: Group tags */}
      {activeTab === "tags" && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <h3 className="text-xs font-bold text-[#16191f] mb-2">Group tags</h3>
          <p className="text-xs text-[#545b64] mb-4">
            Tags are key-value pairs that help you organize and identify your resource group.
          </p>
          <div className="p-6 text-center text-xs text-[#545b64] border border-[#eaeded] rounded bg-[#fafafa]">
            No tags attached to this resource group.
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded border border-[#eaeded] shadow-lg max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">Delete resource group</h2>
            <p className="text-xs text-[#545b64] mb-4">
              Are you sure you want to delete the resource group{" "}
              <strong className="text-[#16191f]">{group.name}</strong>? This action cannot be undone. The resources
              in this group will not be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 text-xs font-semibold text-white bg-[#d13212] rounded hover:bg-[#b02a0f]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
