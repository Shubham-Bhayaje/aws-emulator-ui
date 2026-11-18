/**
 * src/components/ec2/LaunchTemplatesClient.tsx – Launch Templates Management.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import {
  createLiveLaunchTemplate,
  deleteLiveLaunchTemplate,
  fetchLiveLaunchTemplates,
} from "@/app/ec2/actions";

interface TemplateItem {
  id: string;
  name: string;
  defaultVersion: number;
  latestVersion: number;
  createTime: string;
  createdBy: string;
}

interface Props {
  initialTemplates: TemplateItem[];
  isLive: boolean;
}

export default function LaunchTemplatesClient({ initialTemplates, isLive }: Props) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Form
  const [templateName, setTemplateName] = useState("");
  const [amiId, setAmiId] = useState("ami-0c7217cdde317cfec");
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!templateName.trim()) return;

    startTransition(async () => {
      const res = await createLiveLaunchTemplate({
        name: templateName.trim(),
        imageId: amiId.trim(),
        instanceType,
      });

      if (res.success) {
        const fresh = await fetchLiveLaunchTemplates();
        setTemplates(fresh.templates);
        setShowCreateModal(false);
        setTemplateName("");
      } else {
        alert("Failed to create launch template: " + res.error);
      }
    });
  }

  function handleDelete() {
    if (!selectedTemplateId) return;
    const targetId = selectedTemplateId;
    setShowDeleteModal(false);
    setSelectedTemplateId(null);

    setTemplates(templates.filter((t) => t.id !== targetId));

    startTransition(async () => {
      await deleteLiveLaunchTemplate(targetId);
      const fresh = await fetchLiveLaunchTemplates();
      setTemplates(fresh.templates);
    });
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Live Badge */}
      <div className="flex items-center justify-between bg-white border border-[#d5dbdb] px-4 py-2.5 rounded-sm awsui-shadow">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? "bg-[#1d8102]" : "bg-[#ec7211]"
              }`}
            />
            <span className="text-[12px] font-semibold text-[#16191f]">
              {isLive ? "Launch Templates Connected (AWS Emulator)" : "Mock Mode"}
            </span>
          </div>
          <span className="text-[#95a5a6] text-[12px]">|</span>
          <span className="text-[12px] font-mono text-[#545b64]">Region: us-east-1</span>
        </div>
      </div>

      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-[#16191f]">Launch Templates</h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Specify instance configuration parameters to save and reuse when launching EC2 instances.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07]"
          >
            Create launch template
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter launch templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Template name</th>
                <th className="py-2.5 px-3">Template ID</th>
                <th className="py-2.5 px-3">Default version</th>
                <th className="py-2.5 px-3">Latest version</th>
                <th className="py-2.5 px-3">Created by</th>
                <th className="py-2.5 px-3">Creation time</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#545b64]">
                    No launch templates found in region us-east-1 on the emulator.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[#f2f8fd]">
                    <td className="py-3 px-4 font-semibold text-[#0073bb]">{t.name}</td>
                    <td className="py-3 px-3 font-mono text-[12px]">{t.id}</td>
                    <td className="py-3 px-3 font-mono text-[12px]">v{t.defaultVersion}</td>
                    <td className="py-3 px-3 font-mono text-[12px]">v{t.latestVersion}</td>
                    <td className="py-3 px-3 text-[12px] text-[#545b64] truncate max-w-xs">{t.createdBy}</td>
                    <td className="py-3 px-3 text-[12px] text-[#545b64]">{t.createTime}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-[#d13212] hover:underline text-[12px]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">Create launch template</h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Launch template name <span className="text-[#d13212]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. web-server-template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                AMI ID
              </label>
              <input
                type="text"
                value={amiId}
                onChange={(e) => setAmiId(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded font-mono text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance type
              </label>
              <select
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white font-mono"
              >
                <option value="t3.nano">t3.nano (2 vCPU, 0.5 GiB)</option>
                <option value="t3.micro">t3.micro (2 vCPU, 1.0 GiB)</option>
                <option value="t3.small">t3.small (2 vCPU, 2.0 GiB)</option>
                <option value="t3.medium">t3.medium (2 vCPU, 4.0 GiB)</option>
                <option value="m5.large">m5.large (2 vCPU, 8.0 GiB)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded text-[13px] font-medium hover:bg-[#eb5f07]"
              >
                {isPending ? "Creating..." : "Create launch template"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete launch template</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete launch template{" "}
              <strong className="text-[#16191f] font-mono">{selectedTemplateId}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded text-[13px] font-medium hover:bg-[#b02008]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
