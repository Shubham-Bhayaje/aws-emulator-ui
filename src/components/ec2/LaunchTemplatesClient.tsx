/**
 * src/components/ec2/LaunchTemplatesClient.tsx – Authentic AWS EC2 Launch Templates Management.
 * Comprehensive Cloudscape console with versioning, drawer inspection, live Docker container launch,
 * and live AWS Emulator integration.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteLiveLaunchTemplate,
  fetchLiveLaunchTemplates,
  fetchLiveLaunchTemplateVersions,
  createLiveLaunchTemplateVersion,
  setDefaultLaunchTemplateVersion,
  launchInstanceFromTemplate,
  LaunchTemplateVersionModel,
} from "@/app/ec2/actions";

export interface TemplateItem {
  id: string;
  name: string;
  defaultVersion: number;
  latestVersion: number;
  createTime: string;
  createdBy: string;
  tags?: Record<string, string>;
}

interface Props {
  initialTemplates: TemplateItem[];
  isLive: boolean;
}

export default function LaunchTemplatesClient({ initialTemplates, isLive }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialTemplates[0]?.id || null
  );

  // Bottom drawer
  const [activeBottomTab, setActiveBottomTab] = useState<"details" | "versions" | "contents">("details");
  const [versions, setVersions] = useState<LaunchTemplateVersionModel[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Modals & dropdowns
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [showSetDefaultModal, setShowSetDefaultModal] = useState(false);

  // Form states
  const [launchInstanceName, setLaunchInstanceName] = useState("");
  const [selectedLaunchVersion, setSelectedLaunchVersion] = useState<string>("$Default");
  const [newVersionDesc, setNewVersionDesc] = useState("");
  const [newVersionType, setNewVersionType] = useState("t3.small");
  const [newVersionAmi, setNewVersionAmi] = useState("ami-0c7217cdde317cfec");
  const [targetDefaultVersion, setTargetDefaultVersion] = useState<number>(1);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  // Fetch live versions whenever selected template changes
  useEffect(() => {
    if (!selectedTemplateId) {
      setVersions([]);
      return;
    }
    setLoadingVersions(true);
    fetchLiveLaunchTemplateVersions(selectedTemplateId).then((res) => {
      if (res.isLive) {
        setVersions(res.versions);
      }
      setLoadingVersions(false);
    });
  }, [selectedTemplateId]);

  async function refreshTemplates() {
    startTransition(async () => {
      const fresh = await fetchLiveLaunchTemplates();
      setTemplates(fresh.templates);
      setFeedback("Refreshed launch templates from AWS Emulator.");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleDelete() {
    if (!selectedTemplateId) return;
    const targetId = selectedTemplateId;
    setShowDeleteModal(false);

    startTransition(async () => {
      const res = await deleteLiveLaunchTemplate(targetId);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== targetId));
        setSelectedTemplateId(null);
        setFeedback(`Deleted launch template ${targetId}.`);
      } else {
        setFeedback(`Error: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleLaunchInstance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;

    startTransition(async () => {
      const res = await launchInstanceFromTemplate({
        templateId: selectedTemplateId,
        version: selectedLaunchVersion === "$Default" ? undefined : selectedLaunchVersion,
        instanceName: launchInstanceName.trim() || undefined,
      });

      if (res.success) {
        setShowLaunchModal(false);
        router.push("/ec2/instances");
      } else {
        setFeedback(`Launch failed: ${res.error}`);
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  }

  function handleCreateVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;

    startTransition(async () => {
      const res = await createLiveLaunchTemplateVersion({
        templateId: selectedTemplateId,
        versionDescription: newVersionDesc.trim() || undefined,
        instanceType: newVersionType,
        imageId: newVersionAmi,
      });

      if (res.success) {
        setShowNewVersionModal(false);
        setNewVersionDesc("");
        // Reload templates and versions
        const fresh = await fetchLiveLaunchTemplates();
        setTemplates(fresh.templates);
        const freshVersions = await fetchLiveLaunchTemplateVersions(selectedTemplateId);
        setVersions(freshVersions.versions);
        setFeedback(`Created launch template version v${res.versionNumber}.`);
      } else {
        setFeedback(`Version creation failed: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  function handleSetDefaultVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;

    startTransition(async () => {
      const res = await setDefaultLaunchTemplateVersion(selectedTemplateId, targetDefaultVersion);
      if (res.success) {
        setShowSetDefaultModal(false);
        const fresh = await fetchLiveLaunchTemplates();
        setTemplates(fresh.templates);
        const freshVersions = await fetchLiveLaunchTemplateVersions(selectedTemplateId);
        setVersions(freshVersions.versions);
        setFeedback(`Set default version to v${targetDefaultVersion}.`);
      } else {
        setFeedback(`Failed to set default version: ${res.error}`);
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
  );

  const defaultVersionObj = versions.find((v) => v.isDefault) || versions[0] || null;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Live Badge & Feedback */}
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
        {feedback && <span className="text-[12px] text-[#0073bb] font-medium">{feedback}</span>}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#eaeded] rounded-sm awsui-shadow">
        {/* Card Header & Action Toolbar */}
        <div className="p-4 border-b border-[#eaeded] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-[18px] font-bold text-[#16191f]">
              Launch Templates ({templates.length})
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Specify instance configuration parameters to save and reuse when launching EC2 instances or configuring Auto Scaling groups.
            </p>
          </div>

          <div className="flex items-center gap-2 relative flex-shrink-0 self-start md:self-center">
            {/* Launch Instance from Template button */}
            <button
              onClick={() => {
                if (selectedTemplate) {
                  setLaunchInstanceName(`${selectedTemplate.name}-instance`);
                  setSelectedLaunchVersion("$Default");
                  setShowLaunchModal(true);
                }
              }}
              disabled={!selectedTemplate}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              Launch instance from template
            </button>

            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                disabled={!selectedTemplate}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-3.5 border border-[#aab7b8] hover:border-[#16191f] rounded-sm text-[13px] font-bold text-[#16191f] disabled:border-[#eaeded] disabled:bg-[#f2f3f3] disabled:text-[#aab7b8] disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Actions</span>
                <span className="text-[10px]">▼</span>
              </button>

              {showActionsDropdown && selectedTemplate && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white border border-[#d5dbdb] rounded-sm shadow-lg z-30 py-1 text-[13px]"
                  onMouseLeave={() => setShowActionsDropdown(false)}
                >
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setNewVersionDesc(`Version based on v${selectedTemplate.latestVersion}`);
                      setShowNewVersionModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f2f8fd] text-[#16191f]"
                  >
                    Modify template (Create new version)
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setTargetDefaultVersion(selectedTemplate.defaultVersion);
                      setShowSetDefaultModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f2f8fd] text-[#16191f]"
                  >
                    Set default version
                  </button>
                  <div className="border-t border-[#eaeded] my-1" />
                  <button
                    onClick={() => {
                      setShowActionsDropdown(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#fdf3f1] text-[#d13212]"
                  >
                    Delete template
                  </button>
                </div>
              )}
            </div>

            {/* Create Launch Template Link Button */}
            <Link
              href="/ec2/launch-templates/create"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3.5 bg-white border border-[#aab7b8] hover:border-[#16191f] text-[#16191f] rounded-sm text-[13px] font-bold whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              Create launch template
            </Link>

            {/* Refresh Button */}
            <button
              onClick={refreshTemplates}
              disabled={isPending}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="h-[32px] px-3 bg-white border border-[#aab7b8] hover:border-[#16191f] rounded-sm text-[#16191f] whitespace-nowrap inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh templates"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa]">
          <input
            type="text"
            placeholder="Filter launch templates by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-4">Template name</th>
                <th className="py-2.5 px-3">Template ID</th>
                <th className="py-2.5 px-3">Default version</th>
                <th className="py-2.5 px-3">Latest version</th>
                <th className="py-2.5 px-3">Created by</th>
                <th className="py-2.5 px-3">Creation time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#545b64]">
                    No launch templates found in region us-east-1.
                    <div className="mt-2">
                      <Link
                        href="/ec2/launch-templates/create"
                        className="text-[#0073bb] hover:underline font-semibold"
                      >
                        Create your first launch template &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isSelected = selectedTemplateId === t.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fbfbfb]"
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="radio"
                          name="selectedTemplate"
                          checked={isSelected}
                          onChange={() => setSelectedTemplateId(t.id)}
                          className="text-[#ec7211] focus:ring-[#ec7211]"
                        />
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0073bb]">
                        {t.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px] text-[#545b64]">
                        {t.id}
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px]">
                        <span className="px-2 py-0.5 bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf] rounded text-[11px] font-semibold">
                          v{t.defaultVersion}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[12px]">
                        v{t.latestVersion}
                      </td>
                      <td className="py-3 px-3 text-[12px] text-[#545b64] truncate max-w-xs">
                        {t.createdBy}
                      </td>
                      <td className="py-3 px-3 text-[12px] text-[#545b64]">
                        {t.createTime}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Sliding Drawer for Selected Template */}
      {selectedTemplate && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow">
          <div className="border-b border-[#eaeded] px-4 pt-3 flex items-center justify-between">
            <div className="flex gap-4 text-[13px]">
              {(["details", "versions", "contents"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveBottomTab(tab)}
                  className={`pb-2.5 font-medium border-b-2 capitalize transition-colors ${
                    activeBottomTab === tab
                      ? "border-[#ec7211] text-[#ec7211]"
                      : "border-transparent text-[#545b64] hover:text-[#16191f]"
                  }`}
                >
                  {tab === "details"
                    ? "Template details"
                    : tab === "versions"
                    ? `Versions (${versions.length})`
                    : "Launch template contents"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 text-[13px]">
            {activeBottomTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Launch Template ID
                    </span>
                    <span className="font-mono text-[#16191f]">{selectedTemplate.id}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Launch Template Name
                    </span>
                    <span className="font-semibold text-[#16191f]">{selectedTemplate.name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Default Version
                    </span>
                    <span className="font-mono text-[#16191f]">v{selectedTemplate.defaultVersion}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Latest Version
                    </span>
                    <span className="font-mono text-[#16191f]">v{selectedTemplate.latestVersion}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Created By
                    </span>
                    <span className="text-[#545b64] font-mono text-[12px]">{selectedTemplate.createdBy}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Creation Time
                    </span>
                    <span className="text-[#16191f]">{selectedTemplate.createTime}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Resource ARN
                    </span>
                    <span className="font-mono text-[11px] text-[#545b64] break-all">
                      arn:aws:ec2:us-east-1:000000000000:launch-template/{selectedTemplate.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Tags
                    </span>
                    <span className="text-[#545b64]">
                      {Object.keys(selectedTemplate.tags || {}).length === 0
                        ? "No tags"
                        : Object.entries(selectedTemplate.tags || {})
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeBottomTab === "versions" && (
              <div className="space-y-4">
                {loadingVersions ? (
                  <div className="py-6 text-center text-[#545b64]">Loading versions from emulator...</div>
                ) : (
                  <div className="overflow-x-auto border border-[#eaeded] rounded-sm">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Version</th>
                          <th className="py-2 px-3">Description</th>
                          <th className="py-2 px-3">Default</th>
                          <th className="py-2 px-3">AMI ID</th>
                          <th className="py-2 px-3">Instance Type</th>
                          <th className="py-2 px-3">Creation Time</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded]">
                        {versions.map((v) => (
                          <tr key={v.versionNumber} className="hover:bg-[#fbfbfb]">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#16191f]">
                              v{v.versionNumber}
                            </td>
                            <td className="py-2.5 px-3 text-[#545b64]">
                              {v.versionDescription}
                            </td>
                            <td className="py-2.5 px-3">
                              {v.isDefault ? (
                                <span className="px-2 py-0.5 bg-[#f2f8f0] text-[#1d8102] border border-[#b8dfaf] rounded text-[10px] font-semibold">
                                  Default
                                </span>
                              ) : (
                                <span className="text-[#879596]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#0073bb]">
                              {v.data.imageId || "—"}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {v.data.instanceType || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-[#545b64]">
                              {v.createTime}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-2">
                              {!v.isDefault && (
                                <button
                                  onClick={() => {
                                    setTargetDefaultVersion(v.versionNumber);
                                    setShowSetDefaultModal(true);
                                  }}
                                  className="text-[#0073bb] hover:underline"
                                >
                                  Set as default
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setLaunchInstanceName(`${selectedTemplate.name}-v${v.versionNumber}`);
                                  setSelectedLaunchVersion(String(v.versionNumber));
                                  setShowLaunchModal(true);
                                }}
                                className="text-[#ec7211] font-medium hover:underline"
                              >
                                Launch
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeBottomTab === "contents" && defaultVersionObj && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Amazon Machine Image (AMI)
                    </span>
                    <span className="font-mono text-[#16191f]">
                      {defaultVersionObj.data.imageId || "ami-0c7217cdde317cfec"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Instance Type
                    </span>
                    <span className="font-mono text-[#16191f]">
                      {defaultVersionObj.data.instanceType || "t3.micro"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Key Pair
                    </span>
                    <span className="text-[#16191f]">
                      {defaultVersionObj.data.keyName || "None"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Security Groups
                    </span>
                    <span className="font-mono text-[#16191f]">
                      {defaultVersionObj.data.securityGroupIds?.length
                        ? defaultVersionObj.data.securityGroupIds.join(", ")
                        : "Default VPC Security Group"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Root Volume
                    </span>
                    <span className="text-[#16191f]">
                      {defaultVersionObj.data.volumeSize || 8} GiB ({defaultVersionObj.data.volumeType || "gp3"}) • Delete on termination: {defaultVersionObj.data.deleteOnTermination ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      Detailed Monitoring
                    </span>
                    <span className="text-[#16191f]">
                      {defaultVersionObj.data.monitoring ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#545b64] uppercase font-bold block">
                      User Data Script
                    </span>
                    {defaultVersionObj.data.userData ? (
                      <pre className="bg-[#fafafa] border border-[#eaeded] p-2 rounded text-[11px] font-mono text-[#16191f] max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {defaultVersionObj.data.userData}
                      </pre>
                    ) : (
                      <span className="text-[#545b64]">No user data specified</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Launch Instance from Template */}
      {showLaunchModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleLaunchInstance}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-lg p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">
              Launch instance from template
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Template: <strong className="text-[#16191f]">{selectedTemplate.name}</strong> ({selectedTemplate.id})
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance Name
              </label>
              <input
                type="text"
                required
                value={launchInstanceName}
                onChange={(e) => setLaunchInstanceName(e.target.value)}
                placeholder="e.g. production-web-server"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Template Version
              </label>
              <select
                value={selectedLaunchVersion}
                onChange={(e) => setSelectedLaunchVersion(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
              >
                <option value="$Default">Default version (v{selectedTemplate.defaultVersion})</option>
                <option value="$Latest">Latest version (v{selectedTemplate.latestVersion})</option>
                {versions.map((v) => (
                  <option key={v.versionNumber} value={String(v.versionNumber)}>
                    v{v.versionNumber} — {v.versionDescription}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#f2f8fd] border border-[#bce2f5] rounded-sm text-[12px] text-[#0073bb]">
              Launching this instance will automatically create a dedicated Amazon Linux 2023 Docker container on your system with web terminal access.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !launchInstanceName.trim()}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Launching instance..." : "Launch instance"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Modify Template (Create New Version) */}
      {showNewVersionModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateVersion}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-lg p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">
              Modify template (Create new version)
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Template: <strong className="text-[#16191f]">{selectedTemplate.name}</strong> ({selectedTemplate.id}). New version will be v{selectedTemplate.latestVersion + 1}.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Version description
              </label>
              <input
                type="text"
                value={newVersionDesc}
                onChange={(e) => setNewVersionDesc(e.target.value)}
                placeholder="e.g. Upgrade to t3.small for higher workload"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Instance Type
              </label>
              <select
                value={newVersionType}
                onChange={(e) => setNewVersionType(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
              >
                <option value="t3.nano">t3.nano (2 vCPU, 0.5 GiB)</option>
                <option value="t3.micro">t3.micro (2 vCPU, 1.0 GiB)</option>
                <option value="t3.small">t3.small (2 vCPU, 2.0 GiB)</option>
                <option value="t3.medium">t3.medium (2 vCPU, 4.0 GiB)</option>
                <option value="m5.large">m5.large (2 vCPU, 8.0 GiB)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                AMI ID
              </label>
              <input
                type="text"
                value={newVersionAmi}
                onChange={(e) => setNewVersionAmi(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[13px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowNewVersionModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#0073bb] text-white rounded-sm text-[13px] font-medium hover:bg-[#005a9e] disabled:opacity-50"
              >
                {isPending ? "Creating version..." : "Create version"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 3: Set Default Version */}
      {showSetDefaultModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSetDefaultVersion}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">
              Set default version
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Select which version of <strong className="text-[#16191f]">{selectedTemplate.name}</strong> will be the default version for instance and Auto Scaling launches.
            </p>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Default version
              </label>
              <select
                value={targetDefaultVersion}
                onChange={(e) => setTargetDefaultVersion(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white font-mono"
              >
                {versions.map((v) => (
                  <option key={v.versionNumber} value={v.versionNumber}>
                    v{v.versionNumber} {v.isDefault ? "(Current Default)" : ""} — {v.versionDescription}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowSetDefaultModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save default version"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 4: Delete Template Confirmation */}
      {showDeleteModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-[#d13212]">
              Delete launch template?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete launch template{" "}
              <strong className="text-[#16191f] font-mono">{selectedTemplate.name}</strong> ({selectedTemplate.id})? All {selectedTemplate.latestVersion} version(s) will be permanently deleted. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded-sm text-[13px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded-sm text-[13px] font-medium hover:bg-[#b02008] disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete launch template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
