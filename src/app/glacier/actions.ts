"use server";

import { revalidatePath } from "next/cache";
import { glacier } from "@/lib/aws";
import {
  ListVaultsCommand,
  DescribeVaultCommand,
  CreateVaultCommand,
  DeleteVaultCommand,
  UploadArchiveCommand,
  DeleteArchiveCommand,
  InitiateJobCommand,
  ListJobsCommand,
  DescribeJobCommand,
  GetJobOutputCommand,
} from "@aws-sdk/client-glacier";
import { GlacierVaultSummary, GlacierJob, GlacierArchive } from "./types";

/**
 * List all Glacier vaults in the region
 */
export async function listVaultsAction(): Promise<{
  success: boolean;
  vaults: GlacierVaultSummary[];
  error?: string;
}> {
  try {
    const res = await glacier.send(new ListVaultsCommand({ accountId: "-" }));
    const vaults: GlacierVaultSummary[] = (res.VaultList || []).map((v) => ({
      VaultARN: v.VaultARN || "",
      VaultName: v.VaultName || "",
      CreationDate: v.CreationDate || new Date().toISOString(),
      LastInventoryDate: v.LastInventoryDate,
      NumberOfArchives: Number(v.NumberOfArchives || 0),
      SizeInBytes: Number(v.SizeInBytes || 0),
    }));

    return { success: true, vaults };
  } catch (err: any) {
    return {
      success: false,
      vaults: [],
      error: err.message || "Failed to list Glacier vaults",
    };
  }
}

/**
 * Describe a single vault
 */
export async function describeVaultAction(vaultName: string): Promise<{
  success: boolean;
  vault?: GlacierVaultSummary;
  error?: string;
}> {
  try {
    const res = await glacier.send(
      new DescribeVaultCommand({ accountId: "-", vaultName })
    );
    const vault: GlacierVaultSummary = {
      VaultARN: res.VaultARN || "",
      VaultName: res.VaultName || vaultName,
      CreationDate: res.CreationDate || new Date().toISOString(),
      LastInventoryDate: res.LastInventoryDate,
      NumberOfArchives: Number(res.NumberOfArchives || 0),
      SizeInBytes: Number(res.SizeInBytes || 0),
    };
    return { success: true, vault };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to describe vault ${vaultName}`,
    };
  }
}

/**
 * Create a new Glacier vault
 */
export async function createVaultAction(vaultName: string): Promise<{
  success: boolean;
  location?: string;
  error?: string;
}> {
  try {
    const res = await glacier.send(
      new CreateVaultCommand({ accountId: "-", vaultName })
    );
    revalidatePath("/glacier");
    return { success: true, location: res.location };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to create vault ${vaultName}`,
    };
  }
}

/**
 * Delete a Glacier vault (vault must be empty)
 */
export async function deleteVaultAction(vaultName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await glacier.send(new DeleteVaultCommand({ accountId: "-", vaultName }));
    revalidatePath("/glacier");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to delete vault ${vaultName}`,
    };
  }
}

/**
 * Upload an archive to a vault
 */
export async function uploadArchiveAction(formData: FormData): Promise<{
  success: boolean;
  archiveId?: string;
  checksum?: string;
  location?: string;
  error?: string;
}> {
  try {
    const vaultName = formData.get("vaultName") as string;
    const description = (formData.get("description") as string) || undefined;
    const file = formData.get("file") as File | null;

    if (!vaultName) {
      return { success: false, error: "Vault name is required" };
    }
    if (!file) {
      return { success: false, error: "A file payload is required" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res = await glacier.send(
      new UploadArchiveCommand({
        accountId: "-",
        vaultName,
        archiveDescription: description,
        body: buffer,
      })
    );

    revalidatePath(`/glacier/vaults/${vaultName}`);
    revalidatePath("/glacier");

    return {
      success: true,
      archiveId: res.archiveId,
      checksum: res.checksum,
      location: res.location,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to upload archive",
    };
  }
}

/**
 * Delete an archive from a vault
 */
export async function deleteArchiveAction(
  vaultName: string,
  archiveId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await glacier.send(
      new DeleteArchiveCommand({ accountId: "-", vaultName, archiveId })
    );
    revalidatePath(`/glacier/vaults/${vaultName}`);
    revalidatePath("/glacier");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to delete archive ${archiveId}`,
    };
  }
}

/**
 * Initiate a Glacier job (inventory-retrieval or archive-retrieval)
 */
export async function initiateJobAction(
  vaultName: string,
  jobParameters: {
    Type: "inventory-retrieval" | "archive-retrieval";
    ArchiveId?: string;
    Description?: string;
    Tier?: "Standard" | "Expedited" | "Bulk";
  }
): Promise<{
  success: boolean;
  jobId?: string;
  location?: string;
  error?: string;
}> {
  try {
    const res = await glacier.send(
      new InitiateJobCommand({
        accountId: "-",
        vaultName,
        jobParameters: {
          Type: jobParameters.Type,
          ArchiveId: jobParameters.ArchiveId,
          Description: jobParameters.Description,
          Tier: jobParameters.Tier || "Standard",
        },
      })
    );

    revalidatePath(`/glacier/vaults/${vaultName}`);
    return {
      success: true,
      jobId: res.jobId,
      location: res.location,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to initiate Glacier job",
    };
  }
}

/**
 * List jobs for a vault
 */
export async function listJobsAction(vaultName: string): Promise<{
  success: boolean;
  jobs: GlacierJob[];
  error?: string;
}> {
  try {
    const res = await glacier.send(
      new ListJobsCommand({ accountId: "-", vaultName })
    );
    const jobs: GlacierJob[] = (res.JobList || []).map((j) => ({
      JobId: j.JobId || "",
      JobDescription: j.JobDescription,
      Action: (j.Action as any) || "InventoryRetrieval",
      ArchiveId: j.ArchiveId,
      VaultARN: j.VaultARN || "",
      CreationDate: j.CreationDate || new Date().toISOString(),
      Completed: Boolean(j.Completed),
      StatusCode: (j.StatusCode as any) || "InProgress",
      StatusMessage: j.StatusMessage,
      ArchiveSizeInBytes: j.ArchiveSizeInBytes ? Number(j.ArchiveSizeInBytes) : undefined,
      InventorySizeInBytes: j.InventorySizeInBytes ? Number(j.InventorySizeInBytes) : undefined,
      CompletionDate: j.CompletionDate,
      Tier: j.Tier,
      ArchiveSHA256TreeHash: j.ArchiveSHA256TreeHash,
      RetrievalByteRange: j.RetrievalByteRange,
      SHA256TreeHash: j.SHA256TreeHash,
    }));

    return { success: true, jobs };
  } catch (err: any) {
    return {
      success: false,
      jobs: [],
      error: err.message || `Failed to list jobs for vault ${vaultName}`,
    };
  }
}

/**
 * Describe a specific job
 */
export async function describeJobAction(
  vaultName: string,
  jobId: string
): Promise<{
  success: boolean;
  job?: GlacierJob;
  error?: string;
}> {
  try {
    const j = await glacier.send(
      new DescribeJobCommand({ accountId: "-", vaultName, jobId })
    );
    const job: GlacierJob = {
      JobId: j.JobId || jobId,
      JobDescription: j.JobDescription,
      Action: (j.Action as any) || "InventoryRetrieval",
      ArchiveId: j.ArchiveId,
      VaultARN: j.VaultARN || "",
      CreationDate: j.CreationDate || new Date().toISOString(),
      Completed: Boolean(j.Completed),
      StatusCode: (j.StatusCode as any) || "InProgress",
      StatusMessage: j.StatusMessage,
      ArchiveSizeInBytes: j.ArchiveSizeInBytes ? Number(j.ArchiveSizeInBytes) : undefined,
      InventorySizeInBytes: j.InventorySizeInBytes ? Number(j.InventorySizeInBytes) : undefined,
      CompletionDate: j.CompletionDate,
      Tier: j.Tier,
      ArchiveSHA256TreeHash: j.ArchiveSHA256TreeHash,
      RetrievalByteRange: j.RetrievalByteRange,
      SHA256TreeHash: j.SHA256TreeHash,
    };
    return { success: true, job };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to describe job ${jobId}`,
    };
  }
}

/**
 * Get the output of a completed job
 */
export async function getJobOutputAction(
  vaultName: string,
  jobId: string
): Promise<{
  success: boolean;
  contentType?: string;
  checksum?: string;
  bodyString?: string;
  archives?: GlacierArchive[];
  error?: string;
}> {
  try {
    const res = await glacier.send(
      new GetJobOutputCommand({ accountId: "-", vaultName, jobId })
    );

    let bodyString = "";
    if (res.body) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of res.body as any) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      bodyString = Buffer.concat(chunks).toString("utf-8");
    }

    let archives: GlacierArchive[] | undefined = undefined;
    try {
      const parsed = JSON.parse(bodyString);
      if (parsed && Array.isArray(parsed.ArchiveList)) {
        archives = parsed.ArchiveList.map((a: any) => ({
          ArchiveId: a.ArchiveId,
          ArchiveDescription: a.ArchiveDescription,
          CreationDate: a.CreationDate,
          Size: Number(a.Size || 0),
          SHA256TreeHash: a.SHA256TreeHash,
        }));
      }
    } catch {
      // Not JSON or archive content
    }

    return {
      success: true,
      contentType: res.contentType,
      checksum: res.checksum,
      bodyString,
      archives,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to retrieve output for job ${jobId}`,
    };
  }
}
