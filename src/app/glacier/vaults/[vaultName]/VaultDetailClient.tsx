"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GlacierVaultSummary,
  GlacierJob,
  GlacierArchive,
} from "../../types";
import {
  deleteVaultAction,
  uploadArchiveAction,
  deleteArchiveAction,
  initiateJobAction,
  getJobOutputAction,
} from "../../actions";

interface VaultDetailClientProps {
  vault: GlacierVaultSummary;
  initialJobs: GlacierJob[];
  initialArchives?: GlacierArchive[];
}

export default function VaultDetailClient({
  vault: initialVault,
  initialJobs,
  initialArchives = [],
}: VaultDetailClientProps) {
  const router = useRouter();
  const [vault, setVault] = useState<GlacierVaultSummary>(initialVault);
  const [jobs, setJobs] = useState<GlacierJob[]>(initialJobs);
  const [archives, setArchives] = useState<GlacierArchive[]>(initialArchives);
  const [activeTab, setActiveTab] = useState<
    "overview" | "archives" | "jobs" | "permissions" | "notifications" | "vaultlock" | "tags"
  >("overview");

  // Status banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inventoryJobModalOpen, setInventoryJobModalOpen] = useState(false);
  const [archiveJobModalOpen, setArchiveJobModalOpen] = useState(false);
  const [targetArchiveId, setTargetArchiveId] = useState("");
  const [deleteArchiveModalOpen, setDeleteArchiveModalOpen] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState<GlacierArchive | null>(null);
  const [deleteVaultModalOpen, setDeleteVaultModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const [jobOutputContent, setJobOutputContent] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isInitiatingJob, setIsInitiatingJob] = useState(false);
  const [isDeletingArchive, setIsDeletingArchive] = useState(false);
  const [isDeletingVault, setIsDeletingVault] = useState(false);
  const [isLoadingOutput, setIsLoadingOutput] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  // Job Parameter State
  const [jobDescription, setJobDescription] = useState("");
  const [retrievalTier, setRetrievalTier] = useState<"Standard" | "Expedited" | "Bulk">("Standard");

  // Format Helpers
  function formatBytes(bytes?: number): string {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function formatDate(isoString?: string): string {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return isoString;
    }
  }

  // Action: Upload Archive
  async function handleUploadArchive(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("vaultName", vault.VaultName);
    formData.append("description", uploadDescription);
    formData.append("file", uploadFile);

    const res = await uploadArchiveAction(formData);
    setIsUploading(false);

    if (res.success && res.archiveId) {
      setSuccessMessage(
        `Archive uploaded successfully. Archive ID: ${res.archiveId}`
      );
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription("");

      // Update local archive list optimistically
      const newArchive: GlacierArchive = {
        ArchiveId: res.archiveId,
        ArchiveDescription: uploadDescription || undefined,
        CreationDate: new Date().toISOString(),
        Size: uploadFile.size,
        SHA256TreeHash: res.checksum || "",
      };
      setArchives((prev) => [newArchive, ...prev]);
      setVault((prev) => ({
        ...prev,
        NumberOfArchives: prev.NumberOfArchives + 1,
        SizeInBytes: prev.SizeInBytes + uploadFile.size,
      }));
    } else {
      setErrorMessage(res.error || "Failed to upload archive.");
    }
  }

  // Action: Initiate Inventory Retrieval
  async function handleInitiateInventory() {
    setIsInitiatingJob(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await initiateJobAction(vault.VaultName, {
      Type: "inventory-retrieval",
      Description: jobDescription || undefined,
      Tier: retrievalTier,
    });

    setIsInitiatingJob(false);

    if (res.success && res.jobId) {
      setSuccessMessage(
        `Inventory retrieval job initiated successfully. Job ID: ${res.jobId}`
      );
      setInventoryJobModalOpen(false);
      setJobDescription("");

      const newJob: GlacierJob = {
        JobId: res.jobId,
        JobDescription: jobDescription,
        Action: "InventoryRetrieval",
        VaultARN: vault.VaultARN,
        CreationDate: new Date().toISOString(),
        Completed: false,
        StatusCode: "InProgress",
        Tier: retrievalTier,
      };
      setJobs((prev) => [newJob, ...prev]);
      setActiveTab("jobs");
    } else {
      setErrorMessage(res.error || "Failed to initiate inventory retrieval.");
    }
  }

  // Action: Initiate Archive Retrieval
  async function handleInitiateArchiveRetrieval() {
    if (!targetArchiveId.trim()) return;

    setIsInitiatingJob(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await initiateJobAction(vault.VaultName, {
      Type: "archive-retrieval",
      ArchiveId: targetArchiveId.trim(),
      Description: jobDescription || undefined,
      Tier: retrievalTier,
    });

    setIsInitiatingJob(false);

    if (res.success && res.jobId) {
      setSuccessMessage(
        `Archive retrieval job initiated successfully. Job ID: ${res.jobId}`
      );
      setArchiveJobModalOpen(false);
      setTargetArchiveId("");
      setJobDescription("");

      const newJob: GlacierJob = {
        JobId: res.jobId,
        JobDescription: jobDescription,
        Action: "ArchiveRetrieval",
        ArchiveId: targetArchiveId.trim(),
        VaultARN: vault.VaultARN,
        CreationDate: new Date().toISOString(),
        Completed: false,
        StatusCode: "InProgress",
        Tier: retrievalTier,
      };
      setJobs((prev) => [newJob, ...prev]);
      setActiveTab("jobs");
    } else {
      setErrorMessage(res.error || "Failed to initiate archive retrieval.");
    }
  }

  // Action: Delete Archive
  async function handleDeleteArchiveConfirm() {
    if (!archiveToDelete) return;

    setIsDeletingArchive(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await deleteArchiveAction(vault.VaultName, archiveToDelete.ArchiveId);
    setIsDeletingArchive(false);

    if (res.success) {
      setSuccessMessage(`Archive was successfully deleted from the vault.`);
      setArchives((prev) => prev.filter((a) => a.ArchiveId !== archiveToDelete.ArchiveId));
      setVault((prev) => ({
        ...prev,
        NumberOfArchives: Math.max(0, prev.NumberOfArchives - 1),
        SizeInBytes: Math.max(0, prev.SizeInBytes - archiveToDelete.Size),
      }));
      setDeleteArchiveModalOpen(false);
      setArchiveToDelete(null);
    } else {
      setErrorMessage(res.error || "Failed to delete archive.");
    }
  }

  // Action: Delete Vault
  async function handleDeleteVaultConfirm() {
    setIsDeletingVault(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await deleteVaultAction(vault.VaultName);
    setIsDeletingVault(false);

    if (res.success) {
      router.push("/glacier");
    } else {
      setErrorMessage(res.error || "Failed to delete vault.");
    }
  }

  // Action: View/Download Job Output
  async function handleViewJobOutput(jobId: string) {
    setSelectedJobId(jobId);
    setIsLoadingOutput(true);
    setErrorMessage(null);

    const res = await getJobOutputAction(vault.VaultName, jobId);
    setIsLoadingOutput(false);

    if (res.success) {
      setJobOutputContent(res.bodyString || "No output returned.");
      setOutputModalOpen(true);

      // If output contained an archive list, populate archives state
      if (res.archives && res.archives.length > 0) {
        setArchives(res.archives);
      }
    } else {
      setErrorMessage(res.error || "Failed to retrieve job output.");
    }
  }

  const tabs = [
    { id: "overview", label: "Vault details" },
    { id: "archives", label: `Archives (${archives.length || vault.NumberOfArchives})` },
    { id: "jobs", label: `Jobs (${jobs.length})` },
    { id: "permissions", label: "Permissions" },
    { id: "notifications", label: "Notifications" },
    { id: "vaultlock", label: "Vault Lock" },
    { id: "tags", label: "Tags" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#545b64]">
        <Link href="/glacier" className="hover:text-[#0073bb]">
          Vaults
        </Link>
        <span>/</span>
        <span className="text-[#16191f] font-medium">{vault.VaultName}</span>
      </div>

      {/* Header Summary & Action Buttons */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[#16191f]">{vault.VaultName}</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f2f8f0] text-[#1d8102] border border-[#1d8102]/30">
                Active
              </span>
            </div>
            <p className="font-mono text-[12px] text-[#545b64] mt-1 select-all">
              {vault.VaultARN}
            </p>
          </div>

          {/* Quick Actions (Strict 32px height) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setUploadModalOpen(true)}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
            >
              Upload archive
            </button>

            <button
              onClick={() => {
                setJobDescription("");
                setRetrievalTier("Standard");
                setInventoryJobModalOpen(true);
              }}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
            >
              Initiate inventory retrieval
            </button>

            <button
              onClick={() => {
                setTargetArchiveId("");
                setJobDescription("");
                setRetrievalTier("Standard");
                setArchiveJobModalOpen(true);
              }}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
            >
              Initiate archive retrieval
            </button>

            <button
              onClick={() => {
                setDeleteConfirmInput("");
                setDeleteVaultModalOpen(true);
              }}
              style={{
                height: "32px",
                minHeight: "32px",
                maxHeight: "32px",
                whiteSpace: "nowrap",
              }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2] transition-colors"
            >
              Delete vault
            </button>
          </div>
        </div>

        {/* Header Properties Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#eaeded] text-[13px]">
          <div>
            <div className="text-[12px] text-[#545b64]">Creation date</div>
            <div className="font-medium text-[#16191f] mt-0.5">
              {formatDate(vault.CreationDate)}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64]">Last inventory date</div>
            <div className="font-medium text-[#16191f] mt-0.5">
              {formatDate(vault.LastInventoryDate)}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64]">Archives</div>
            <div className="font-medium text-[#16191f] mt-0.5">
              {vault.NumberOfArchives.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#545b64]">Vault size</div>
            <div className="font-medium text-[#16191f] mt-0.5">
              {formatBytes(vault.SizeInBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 text-[13px] text-[#1d8102] flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[#1d8102] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#fdf3f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#d13212] hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Container */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-[#eaeded] flex overflow-x-auto bg-[#fafafa]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-[#ec7211] text-[#ec7211] bg-white"
                  : "border-transparent text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: Vault Details (Overview) */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f] mb-3">General configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">Vault name</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">{vault.VaultName}</div>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">AWS Region</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">us-east-1</div>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">Vault ARN</div>
                    <div className="font-mono text-[11px] text-[#16191f] mt-0.5 break-all select-all">
                      {vault.VaultARN}
                    </div>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">Creation date</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">
                      {formatDate(vault.CreationDate)}
                    </div>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">Number of archives</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">
                      {vault.NumberOfArchives.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#fafafa] p-3 rounded border border-[#eaeded]">
                    <div className="text-[12px] text-[#545b64]">Total size</div>
                    <div className="font-semibold text-[#16191f] mt-0.5">
                      {formatBytes(vault.SizeInBytes)} ({vault.SizeInBytes.toLocaleString()} bytes)
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[16px] font-bold text-[#16191f] mb-2">Vault Inventory</h3>
                <p className="text-[13px] text-[#545b64] leading-relaxed">
                  In Amazon S3 Glacier, vault inventory lists are generated asynchronously. Amazon S3
                  Glacier prepares an inventory list approximately once a day. You can initiate a job to
                  retrieve the most up-to-date inventory list using the{" "}
                  <strong className="text-[#16191f]">Initiate inventory retrieval</strong> action.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Archives */}
          {activeTab === "archives" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Archives</h3>
                  <p className="text-[13px] text-[#545b64]">
                    Archives uploaded to this vault or populated from completed inventory jobs.
                  </p>
                </div>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-3.5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
                >
                  Upload archive
                </button>
              </div>

              <div className="overflow-x-auto border border-[#eaeded] rounded">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="py-2.5 px-4">Archive ID</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Creation date</th>
                      <th className="py-2.5 px-4 text-right">Size</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {archives.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-[#545b64]">
                          No archives available in the local inventory view. Upload an archive or
                          initiate an inventory retrieval job to populate the inventory.
                        </td>
                      </tr>
                    ) : (
                      archives.map((a) => (
                        <tr key={a.ArchiveId} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#16191f] select-all max-w-xs truncate">
                            {a.ArchiveId}
                          </td>
                          <td className="py-2.5 px-4 text-[#545b64]">
                            {a.ArchiveDescription || "-"}
                          </td>
                          <td className="py-2.5 px-4 text-[#16191f]">
                            {formatDate(a.CreationDate)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-[#16191f]">
                            {formatBytes(a.Size)}
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setTargetArchiveId(a.ArchiveId);
                                setJobDescription(`Retrieval for archive ${a.ArchiveId.slice(0, 10)}`);
                                setArchiveJobModalOpen(true);
                              }}
                              className="text-[#0073bb] hover:underline font-semibold text-[12px]"
                            >
                              Retrieve
                            </button>
                            <button
                              onClick={() => {
                                setArchiveToDelete(a);
                                setDeleteArchiveModalOpen(true);
                              }}
                              className="text-[#d13212] hover:underline font-semibold text-[12px]"
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
          )}

          {/* TAB 3: Jobs */}
          {activeTab === "jobs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#16191f]">Jobs</h3>
                  <p className="text-[13px] text-[#545b64]">
                    Inventory retrieval and archive retrieval jobs initiated in this vault.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setJobDescription("");
                      setInventoryJobModalOpen(true);
                    }}
                    style={{
                      height: "32px",
                      minHeight: "32px",
                      maxHeight: "32px",
                      whiteSpace: "nowrap",
                    }}
                    className="inline-flex items-center justify-center font-bold text-[13px] px-3 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
                  >
                    New inventory job
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#eaeded] rounded">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="py-2.5 px-4">Job ID</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Tier</th>
                      <th className="py-2.5 px-4">Initiated</th>
                      <th className="py-2.5 px-4">Completed</th>
                      <th className="py-2.5 px-4 text-right">Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 px-4 text-center text-[#545b64]">
                          No jobs initiated for this vault. Initiate an inventory or archive
                          retrieval job using the buttons above.
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.JobId} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#16191f] select-all max-w-xs truncate">
                            {job.JobId}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#16191f]">
                            {job.Action}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                job.StatusCode === "Succeeded"
                                  ? "bg-[#f2f8f0] text-[#1d8102] border-[#1d8102]/30"
                                  : job.StatusCode === "Failed"
                                  ? "bg-[#fdf3f2] text-[#d13212] border-[#d13212]/30"
                                  : "bg-[#e9f3f4] text-[#0073bb] border-[#0073bb]/30"
                              }`}
                            >
                              {job.StatusCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#545b64]">{job.Tier || "Standard"}</td>
                          <td className="py-2.5 px-4 text-[#16191f]">{formatDate(job.CreationDate)}</td>
                          <td className="py-2.5 px-4 text-[#545b64]">
                            {formatDate(job.CompletionDate)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => handleViewJobOutput(job.JobId)}
                              disabled={isLoadingOutput}
                              className="text-[#0073bb] hover:underline font-semibold text-[12px]"
                            >
                              {isLoadingOutput && selectedJobId === job.JobId
                                ? "Loading..."
                                : "Get output"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Permissions */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Vault permissions</h3>
                <p className="text-[13px] text-[#545b64]">
                  Manage resource-based access policies to control who can access this vault.
                </p>
              </div>

              <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
                <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> In the local
                emulator, the <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">SetVaultAccessPolicy</code>,{" "}
                <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">GetVaultAccessPolicy</code>, and{" "}
                <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">DeleteVaultAccessPolicy</code>{" "}
                APIs return <code className="font-mono">NotImplemented</code>. The policy view is displayed
                for learning console navigation.
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 font-mono text-[12px] text-[#16191f] overflow-x-auto">
                <pre>
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DefaultVaultPolicy",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::000000000000:root"
      },
      "Action": "glacier:*",
      "Resource": "${vault.VaultARN}"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Event notifications</h3>
                <p className="text-[13px] text-[#545b64]">
                  Configure Amazon Simple Notification Service (Amazon SNS) to publish messages when
                  retrieval jobs complete.
                </p>
              </div>

              <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
                <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> In the local
                emulator, the <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">SetVaultNotifications</code>{" "}
                and <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">GetVaultNotifications</code>{" "}
                APIs return <code className="font-mono">NotImplemented</code>.
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-[13px] text-[#545b64] space-y-2">
                <div className="font-semibold text-[#16191f]">Notification status:</div>
                <p>No SNS notifications are currently registered for this vault.</p>
              </div>
            </div>
          )}

          {/* TAB 6: Vault Lock */}
          {activeTab === "vaultlock" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Vault Lock</h3>
                <p className="text-[13px] text-[#545b64]">
                  S3 Glacier Vault Lock allows you to easily deploy and enforce compliance controls
                  for individual S3 Glacier vaults with a Vault Lock policy (WORM compliance). Once
                  locked, the policy becomes immutable.
                </p>
              </div>

              <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
                <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> The{" "}
                <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">InitiateVaultLock</code>,{" "}
                <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">GetVaultLock</code>, and{" "}
                <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">CompleteVaultLock</code>{" "}
                APIs return <code className="font-mono">NotImplemented</code> in this emulator.
              </div>

              <div className="bg-[#fafafa] border border-[#eaeded] rounded p-4 text-[13px] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#545b64]">Lock status:</span>
                  <span className="font-semibold text-[#16191f]">Unlocked (Not configured)</span>
                </div>
                <p className="text-[#545b64]">
                  A Vault Lock policy has not been initiated for this vault.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: Tags */}
          {activeTab === "tags" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">Tags</h3>
                <p className="text-[13px] text-[#545b64]">
                  Tags are key-value pairs that help you organize and identify your AWS resources.
                </p>
              </div>

              <div className="bg-[#f2f8f8] border-l-4 border-[#0073bb] p-3 text-[12px] text-[#545b64]">
                <span className="font-semibold text-[#0073bb]">Emulator Notice:</span> Tagging APIs
                (<code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">AddTagsToVault</code> and{" "}
                <code className="bg-[#e9f3f4] px-1 py-0.5 rounded font-mono">ListTagsForVault</code>)
                return <code className="font-mono">NotImplemented</code> in this emulator.
              </div>

              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                      <th className="py-2.5 px-4">Key</th>
                      <th className="py-2.5 px-4">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={2} className="py-6 px-4 text-center text-[#545b64]">
                        No tags associated with this vault.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Upload Archive */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Upload archive</h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadArchive} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Archive file <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-[#aab7b8] rounded p-2 text-[13px] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Archive description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Database Backup"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={isUploading}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  style={{
                    height: "32px",
                    minHeight: "32px",
                    maxHeight: "32px",
                    whiteSpace: "nowrap",
                  }}
                  className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                    isUploading || !uploadFile
                      ? "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                      : "bg-[#ec7211] hover:bg-[#eb5f07]"
                  }`}
                >
                  {isUploading ? "Uploading..." : "Upload archive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Initiate Inventory Retrieval */}
      {inventoryJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Initiate inventory retrieval</h2>
              <button
                onClick={() => setInventoryJobModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Initiates an asynchronous job to retrieve the inventory of vault{" "}
              <strong className="text-[#16191f]">{vault.VaultName}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Job description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Daily inventory snapshot"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Retrieval tier
                </label>
                <select
                  value={retrievalTier}
                  onChange={(e) => setRetrievalTier(e.target.value as any)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211] bg-white"
                >
                  <option value="Standard">Standard (Typically completes in 3-5 hours)</option>
                  <option value="Expedited">Expedited (Typically completes in 1-5 minutes)</option>
                  <option value="Bulk">Bulk (Typically completes in 5-12 hours)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setInventoryJobModalOpen(false)}
                disabled={isInitiatingJob}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateInventory}
                disabled={isInitiatingJob}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                {isInitiatingJob ? "Initiating..." : "Initiate job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Initiate Archive Retrieval */}
      {archiveJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Initiate archive retrieval</h2>
              <button
                onClick={() => setArchiveJobModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Initiates an asynchronous job to stage an archive for download from vault{" "}
              <strong className="text-[#16191f]">{vault.VaultName}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Archive ID <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Paste 64-character Archive ID"
                  value={targetArchiveId}
                  onChange={(e) => setTargetArchiveId(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Job description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Retrieval for legal review"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#16191f] mb-1">
                  Retrieval tier
                </label>
                <select
                  value={retrievalTier}
                  onChange={(e) => setRetrievalTier(e.target.value as any)}
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211] bg-white"
                >
                  <option value="Standard">Standard (Typically completes in 3-5 hours)</option>
                  <option value="Expedited">Expedited (Typically completes in 1-5 minutes)</option>
                  <option value="Bulk">Bulk (Typically completes in 5-12 hours)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setArchiveJobModalOpen(false)}
                disabled={isInitiatingJob}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateArchiveRetrieval}
                disabled={isInitiatingJob || !targetArchiveId.trim()}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                  isInitiatingJob || !targetArchiveId.trim()
                    ? "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                    : "bg-[#ec7211] hover:bg-[#eb5f07]"
                }`}
              >
                {isInitiatingJob ? "Initiating..." : "Initiate job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Archive */}
      {deleteArchiveModalOpen && archiveToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Delete archive</h2>
              <button
                onClick={() => setDeleteArchiveModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete this archive permanently? This action cannot be
              undone.
            </p>

            <div className="bg-[#fafafa] border border-[#eaeded] rounded p-3 text-[12px] space-y-1">
              <div>
                <span className="text-[#545b64]">Archive ID:</span>
                <p className="font-mono text-[11px] text-[#16191f] break-all select-all">
                  {archiveToDelete.ArchiveId}
                </p>
              </div>
              <div>
                <span className="text-[#545b64]">Size:</span>{" "}
                <span className="font-semibold text-[#16191f]">
                  {formatBytes(archiveToDelete.Size)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setDeleteArchiveModalOpen(false)}
                disabled={isDeletingArchive}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArchiveConfirm}
                disabled={isDeletingArchive}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#d13212] text-white hover:bg-[#a82a0f] transition-colors"
              >
                {isDeletingArchive ? "Deleting..." : "Delete archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Vault */}
      {deleteVaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-[18px] font-bold text-[#16191f]">Delete vault</h2>
              <button
                onClick={() => setDeleteVaultModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-[#545b64]">
              Are you sure you want to delete vault{" "}
              <strong className="text-[#16191f]">{vault.VaultName}</strong>?
            </p>

            <div className="bg-[#fdf3f2] border-l-4 border-[#d13212] p-3 text-[12px] text-[#545b64] space-y-1">
              <div className="font-bold text-[#d13212]">Constraint reminder</div>
              <p>
                In Amazon S3 Glacier, a vault must be empty of archives before it can be deleted. If
                the vault still contains archives, deletion will be rejected.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#16191f]">
                To confirm deletion, type <code className="bg-[#f2f3f3] px-1 py-0.5 rounded font-mono font-normal text-[#16191f]">{vault.VaultName}</code> below:
              </label>
              <input
                type="text"
                placeholder={vault.VaultName}
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setDeleteVaultModalOpen(false)}
                disabled={isDeletingVault}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVaultConfirm}
                disabled={isDeletingVault || deleteConfirmInput !== vault.VaultName}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className={`inline-flex items-center justify-center font-bold text-[13px] px-4 rounded text-white transition-colors ${
                  deleteConfirmInput === vault.VaultName && !isDeletingVault
                    ? "bg-[#d13212] hover:bg-[#a82a0f]"
                    : "bg-[#d5dbdb] text-[#879596] cursor-not-allowed"
                }`}
              >
                {isDeletingVault ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: View Job Output */}
      {outputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-[#16191f]">Job output</h2>
                <p className="font-mono text-[11px] text-[#545b64] mt-0.5 select-all">
                  Job ID: {selectedJobId}
                </p>
              </div>
              <button
                onClick={() => setOutputModalOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-[#1e1e1e] text-[#d4d4d4] rounded p-4 font-mono text-[12px] max-h-96 overflow-y-auto">
              <pre>{jobOutputContent}</pre>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#eaeded]">
              <button
                onClick={() => setOutputModalOpen(false)}
                style={{
                  height: "32px",
                  minHeight: "32px",
                  maxHeight: "32px",
                  whiteSpace: "nowrap",
                }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded border border-[#545b64] text-[#16191f] bg-white hover:bg-[#fafafa] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
