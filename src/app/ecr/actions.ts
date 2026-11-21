"use server";

/**
 * src/app/ecr/actions.ts - Server Actions for Amazon Elastic Container Registry (ECR).
 * Executes against local AWS Emulator via AWS SDK v3 server-side only.
 * Zero emojis, Cloudscape enterprise styling.
 */

import {
  DescribeRepositoriesCommand,
  CreateRepositoryCommand,
  DeleteRepositoryCommand,
  PutImageTagMutabilityCommand,
  PutImageScanningConfigurationCommand,
  DescribeImagesCommand,
  BatchDeleteImageCommand,
  GetRepositoryPolicyCommand,
  SetRepositoryPolicyCommand,
  DeleteRepositoryPolicyCommand,
  GetLifecyclePolicyCommand,
  PutLifecyclePolicyCommand,
  DeleteLifecyclePolicyCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetAuthorizationTokenCommand,
  DescribeRegistryCommand,
  GetRegistryScanningConfigurationCommand,
  PutRegistryScanningConfigurationCommand,
  DescribePullThroughCacheRulesCommand,
  CreatePullThroughCacheRuleCommand,
  DeletePullThroughCacheRuleCommand,
  Repository,
  ImageDetail,
  PullThroughCacheRule,
} from "@aws-sdk/client-ecr";
import { ListKeysCommand, ListAliasesCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { revalidatePath } from "next/cache";
import { ecr, kms } from "@/lib/aws";

// -----------------------------------------------------------------------------
// Data Types
// -----------------------------------------------------------------------------

export interface EcrRepositoryItem {
  repositoryArn?: string;
  registryId?: string;
  repositoryName: string;
  repositoryUri?: string;
  createdAt?: string;
  imageTagMutability?: "MUTABLE" | "IMMUTABLE";
  imageScanningConfiguration?: {
    scanOnPush?: boolean;
  };
  encryptionConfiguration?: {
    encryptionType?: "AES256" | "KMS";
    kmsKey?: string;
  };
  imageCount?: number;
}

export interface EcrImageItem {
  registryId?: string;
  repositoryName: string;
  imageDigest: string;
  imageTags: string[];
  imageSizeInBytes?: number;
  imagePushedAt?: string;
  imageScanStatus?: {
    status?: string;
    description?: string;
  };
  imageScanFindingsSummary?: {
    imageScanCompletedAt?: string;
    vulnerabilitySourceUpdatedAt?: string;
    findingSeverityCounts?: Record<string, number>;
  };
  artifactMediaType?: string;
}

export interface CreateRepositoryInput {
  repositoryName: string;
  imageTagMutability?: "MUTABLE" | "IMMUTABLE";
  scanOnPush?: boolean;
  encryptionType?: "AES256" | "KMS";
  kmsKey?: string;
  tags?: { Key: string; Value: string }[];
}

export interface KmsKeyOption {
  keyId: string;
  keyArn: string;
  alias?: string;
  description?: string;
}

// -----------------------------------------------------------------------------
// Repositories
// -----------------------------------------------------------------------------

export async function listRepositoriesAction(): Promise<{
  success: boolean;
  repositories: EcrRepositoryItem[];
  error?: string;
}> {
  try {
    const res = await ecr.send(new DescribeRepositoriesCommand({}));
    const repos: EcrRepositoryItem[] = (res.repositories || []).map((r: Repository) => ({
      repositoryArn: r.repositoryArn,
      registryId: r.registryId,
      repositoryName: r.repositoryName || "unnamed",
      repositoryUri: r.repositoryUri,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      imageTagMutability: (r.imageTagMutability as "MUTABLE" | "IMMUTABLE") || "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: r.imageScanningConfiguration?.scanOnPush ?? false,
      },
      encryptionConfiguration: {
        encryptionType: (r.encryptionConfiguration?.encryptionType as "AES256" | "KMS") || "AES256",
        kmsKey: r.encryptionConfiguration?.kmsKey,
      },
    }));

    // Fetch image counts in parallel
    await Promise.all(
      repos.map(async (repo) => {
        try {
          const imgRes = await ecr.send(
            new DescribeImagesCommand({ repositoryName: repo.repositoryName })
          );
          repo.imageCount = imgRes.imageDetails?.length || 0;
        } catch {
          repo.imageCount = 0;
        }
      })
    );

    return { success: true, repositories: repos };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, repositories: [], error: msg };
  }
}

export async function describeRepositoryAction(repositoryName: string): Promise<{
  success: boolean;
  repository?: EcrRepositoryItem;
  error?: string;
}> {
  try {
    const res = await ecr.send(
      new DescribeRepositoriesCommand({ repositoryNames: [repositoryName] })
    );
    const r = res.repositories?.[0];
    if (!r) {
      return { success: false, error: `Repository '${repositoryName}' not found.` };
    }

    const item: EcrRepositoryItem = {
      repositoryArn: r.repositoryArn,
      registryId: r.registryId,
      repositoryName: r.repositoryName || repositoryName,
      repositoryUri: r.repositoryUri,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      imageTagMutability: (r.imageTagMutability as "MUTABLE" | "IMMUTABLE") || "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: r.imageScanningConfiguration?.scanOnPush ?? false,
      },
      encryptionConfiguration: {
        encryptionType: (r.encryptionConfiguration?.encryptionType as "AES256" | "KMS") || "AES256",
        kmsKey: r.encryptionConfiguration?.kmsKey,
      },
    };

    return { success: true, repository: item };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function createRepositoryAction(input: CreateRepositoryInput): Promise<{
  success: boolean;
  repository?: EcrRepositoryItem;
  error?: string;
}> {
  try {
    const cleanName = input.repositoryName.trim().toLowerCase();
    if (!cleanName) {
      return { success: false, error: "Repository name is required." };
    }

    // AWS ECR validation: alphanumeric, hyphens, underscores, slashes
    const nameRegex = /^[a-z0-9]+(?:[._\/-][a-z0-9]+)*$/;
    if (!nameRegex.test(cleanName)) {
      return {
        success: false,
        error:
          "Invalid repository name. Must start with a letter/digit and can only contain lowercase letters, numbers, hyphens, underscores, and forward slashes.",
      };
    }

    const cmdInput: Record<string, unknown> = {
      repositoryName: cleanName,
      imageTagMutability: input.imageTagMutability || "MUTABLE",
      imageScanningConfiguration: {
        scanOnPush: input.scanOnPush ?? false,
      },
    };

    if (input.encryptionType === "KMS") {
      cmdInput.encryptionConfiguration = {
        encryptionType: "KMS",
        kmsKey: input.kmsKey || undefined,
      };
    }

    if (input.tags && input.tags.length > 0) {
      cmdInput.tags = input.tags.filter((t) => t.Key.trim() !== "");
    }

    const res = await ecr.send(new CreateRepositoryCommand(cmdInput));
    const r = res.repository;

    revalidatePath("/ecr");
    revalidatePath("/ecr/repositories");

    return {
      success: true,
      repository: r
        ? {
            repositoryArn: r.repositoryArn,
            registryId: r.registryId,
            repositoryName: r.repositoryName || cleanName,
            repositoryUri: r.repositoryUri,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
            imageTagMutability: (r.imageTagMutability as "MUTABLE" | "IMMUTABLE") || "MUTABLE",
            imageScanningConfiguration: {
              scanOnPush: r.imageScanningConfiguration?.scanOnPush ?? false,
            },
            encryptionConfiguration: {
              encryptionType:
                (r.encryptionConfiguration?.encryptionType as "AES256" | "KMS") || "AES256",
              kmsKey: r.encryptionConfiguration?.kmsKey,
            },
          }
        : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteRepositoryAction(
  repositoryName: string,
  force: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(
      new DeleteRepositoryCommand({
        repositoryName,
        force,
      })
    );
    revalidatePath("/ecr");
    revalidatePath("/ecr/repositories");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function updateRepositorySettingsAction(
  repositoryName: string,
  tagMutability: "MUTABLE" | "IMMUTABLE",
  scanOnPush: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all([
      ecr.send(
        new PutImageTagMutabilityCommand({
          repositoryName,
          imageTagMutability: tagMutability,
        })
      ),
      ecr.send(
        new PutImageScanningConfigurationCommand({
          repositoryName,
          imageScanningConfiguration: { scanOnPush },
        })
      ),
    ]);

    revalidatePath("/ecr");
    revalidatePath("/ecr/repositories");
    revalidatePath(`/ecr/repositories/${encodeURIComponent(repositoryName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Images
// -----------------------------------------------------------------------------

export async function describeImagesAction(repositoryName: string): Promise<{
  success: boolean;
  images: EcrImageItem[];
  error?: string;
}> {
  try {
    const res = await ecr.send(new DescribeImagesCommand({ repositoryName }));
    const images: EcrImageItem[] = (res.imageDetails || []).map((img: ImageDetail) => ({
      registryId: img.registryId,
      repositoryName: img.repositoryName || repositoryName,
      imageDigest: img.imageDigest || "",
      imageTags: img.imageTags || [],
      imageSizeInBytes: img.imageSizeInBytes,
      imagePushedAt: img.imagePushedAt ? new Date(img.imagePushedAt).toISOString() : undefined,
      imageScanStatus: img.imageScanStatus
        ? {
            status: img.imageScanStatus.status,
            description: img.imageScanStatus.description,
          }
        : undefined,
      imageScanFindingsSummary: img.imageScanFindingsSummary
        ? {
            imageScanCompletedAt: img.imageScanFindingsSummary.imageScanCompletedAt
              ? new Date(img.imageScanFindingsSummary.imageScanCompletedAt).toISOString()
              : undefined,
            vulnerabilitySourceUpdatedAt: img.imageScanFindingsSummary.vulnerabilitySourceUpdatedAt
              ? new Date(img.imageScanFindingsSummary.vulnerabilitySourceUpdatedAt).toISOString()
              : undefined,
            findingSeverityCounts: img.imageScanFindingsSummary.findingSeverityCounts,
          }
        : undefined,
      artifactMediaType: img.artifactMediaType,
    }));

    return { success: true, images };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, images: [], error: msg };
  }
}

export async function batchDeleteImageAction(
  repositoryName: string,
  imageIds: { imageTag?: string; imageDigest?: string }[]
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const res = await ecr.send(
      new BatchDeleteImageCommand({
        repositoryName,
        imageIds,
      })
    );

    revalidatePath(`/ecr/repositories/${encodeURIComponent(repositoryName)}`);
    return { success: true, deletedCount: res.imageIds?.length || 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Permissions / Repository Policy
// -----------------------------------------------------------------------------

export async function getRepositoryPolicyAction(repositoryName: string): Promise<{
  success: boolean;
  policyText?: string;
  error?: string;
}> {
  try {
    const res = await ecr.send(new GetRepositoryPolicyCommand({ repositoryName }));
    return { success: true, policyText: res.policyText };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("RepositoryPolicyNotFoundException") || msg.includes("does not have a policy")) {
      return { success: true, policyText: "" };
    }
    return { success: false, error: msg };
  }
}

export async function setRepositoryPolicyAction(
  repositoryName: string,
  policyText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate JSON
    JSON.parse(policyText);
    await ecr.send(
      new SetRepositoryPolicyCommand({
        repositoryName,
        policyText,
      })
    );

    revalidatePath(`/ecr/repositories/${encodeURIComponent(repositoryName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteRepositoryPolicyAction(
  repositoryName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(new DeleteRepositoryPolicyCommand({ repositoryName }));
    revalidatePath(`/ecr/repositories/${encodeURIComponent(repositoryName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Lifecycle Policy
// -----------------------------------------------------------------------------

export async function getLifecyclePolicyAction(repositoryName: string): Promise<{
  success: boolean;
  lifecyclePolicyText?: string;
  lastEvaluatedAt?: string;
  error?: string;
}> {
  try {
    const res = await ecr.send(new GetLifecyclePolicyCommand({ repositoryName }));
    return {
      success: true,
      lifecyclePolicyText: res.lifecyclePolicyText,
      lastEvaluatedAt: res.lastEvaluatedAt ? new Date(res.lastEvaluatedAt).toISOString() : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("LifecyclePolicyNotFoundException") || msg.includes("does not have a lifecycle policy")) {
      return { success: true, lifecyclePolicyText: "" };
    }
    return { success: false, error: msg };
  }
}

export async function putLifecyclePolicyAction(
  repositoryName: string,
  lifecyclePolicyText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    JSON.parse(lifecyclePolicyText);
    await ecr.send(
      new PutLifecyclePolicyCommand({
        repositoryName,
        lifecyclePolicyText,
      })
    );

    revalidatePath(`/ecr/repositories/${encodeURIComponent(repositoryName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deleteLifecyclePolicyAction(
  repositoryName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(new DeleteLifecyclePolicyCommand({ repositoryName }));
    revalidatePath(`/ecr/repositories/${encodeURIComponent(repositoryName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

export async function listTagsForResourceAction(resourceArn: string): Promise<{
  success: boolean;
  tags: { Key: string; Value: string }[];
  error?: string;
}> {
  try {
    const res = await ecr.send(new ListTagsForResourceCommand({ resourceArn }));
    return {
      success: true,
      tags: (res.tags || []).map((t) => ({ Key: t.Key || "", Value: t.Value || "" })),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, tags: [], error: msg };
  }
}

export async function tagResourceAction(
  resourceArn: string,
  tags: { Key: string; Value: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(
      new TagResourceCommand({
        resourceArn,
        tags: tags.map((t) => ({ Key: t.Key, Value: t.Value })),
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function untagResourceAction(
  resourceArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(
      new UntagResourceCommand({
        resourceArn,
        tagKeys,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Authorization Token & Push Commands Helper
// -----------------------------------------------------------------------------

export async function getAuthorizationTokenAction(): Promise<{
  success: boolean;
  proxyEndpoint?: string;
  authorizationToken?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const res = await ecr.send(new GetAuthorizationTokenCommand({}));
    const authData = res.authorizationData?.[0];
    return {
      success: true,
      proxyEndpoint: authData?.proxyEndpoint,
      authorizationToken: authData?.authorizationToken,
      expiresAt: authData?.expiresAt ? new Date(authData.expiresAt).toISOString() : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// Registry Settings: Scanning, Replication, Pull-Through Cache
// -----------------------------------------------------------------------------

export interface RegistrySettingsResponse {
  registryId: string;
  scanType: "BASIC" | "ENHANCED";
  rules: { filter: string; frequency: string }[];
  replicationRules: {
    destinations: { region: string; registryId: string }[];
    repositoryFilters?: { filter: string; filterType: string }[];
  }[];
  pullThroughCacheRules: {
    ecrRepositoryPrefix: string;
    upstreamRegistryUrl: string;
    createdAt?: string;
    registryId?: string;
  }[];
}

export async function getRegistrySettingsAction(): Promise<{
  success: boolean;
  settings?: RegistrySettingsResponse;
  error?: string;
}> {
  try {
    const [scanRes, regRes, ptcRes] = await Promise.all([
      ecr.send(new GetRegistryScanningConfigurationCommand({})).catch(() => ({})),
      ecr.send(new DescribeRegistryCommand({})).catch(() => ({})),
      ecr.send(new DescribePullThroughCacheRulesCommand({})).catch(() => ({})),
    ]);

    const scanType =
      (scanRes.scanningConfiguration?.scanType as "BASIC" | "ENHANCED") || "BASIC";
    const rules = (scanRes.scanningConfiguration?.rules || []).map((r) => ({
      filter: r.repositoryFilters?.[0]?.filter || "*",
      frequency: r.scanFrequency || "SCAN_ON_PUSH",
    }));

    const replicationRules = (regRes.replicationConfiguration?.rules || []).map((r) => ({
      destinations: (r.destinations || []).map((d) => ({
        region: d.region || "",
        registryId: d.registryId || "",
      })),
      repositoryFilters: (r.repositoryFilters || []).map((rf) => ({
        filter: rf.filter || "",
        filterType: rf.filterType || "PREFIX_MATCH",
      })),
    }));

    const pullThroughCacheRules = (ptcRes.pullThroughCacheRules || []).map(
      (p: PullThroughCacheRule) => ({
        ecrRepositoryPrefix: p.ecrRepositoryPrefix || "",
        upstreamRegistryUrl: p.upstreamRegistryUrl || "",
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
        registryId: p.registryId,
      })
    );

    return {
      success: true,
      settings: {
        registryId: regRes.registryId || "000000000000",
        scanType,
        rules,
        replicationRules,
        pullThroughCacheRules,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function putRegistryScanningConfigurationAction(
  scanType: "BASIC" | "ENHANCED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(new PutRegistryScanningConfigurationCommand({ scanType }));
    revalidatePath("/ecr/registry-settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function createPullThroughCacheRuleAction(
  ecrRepositoryPrefix: string,
  upstreamRegistryUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(
      new CreatePullThroughCacheRuleCommand({
        ecrRepositoryPrefix,
        upstreamRegistryUrl,
      })
    );
    revalidatePath("/ecr/registry-settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export async function deletePullThroughCacheRuleAction(
  ecrRepositoryPrefix: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ecr.send(
      new DeletePullThroughCacheRuleCommand({
        ecrRepositoryPrefix,
      })
    );
    revalidatePath("/ecr/registry-settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -----------------------------------------------------------------------------
// KMS Keys Dropdown Loader (Real Integration with Built KMS Service)
// -----------------------------------------------------------------------------

export async function listKmsKeysAction(): Promise<{
  success: boolean;
  keys: KmsKeyOption[];
  error?: string;
}> {
  try {
    const [keysRes, aliasesRes] = await Promise.all([
      kms.send(new ListKeysCommand({})),
      kms.send(new ListAliasesCommand({})),
    ]);

    const aliasMap = new Map<string, string>();
    for (const a of aliasesRes.Aliases || []) {
      if (a.TargetKeyId && a.AliasName) {
        aliasMap.set(a.TargetKeyId, a.AliasName);
      }
    }

    const keyList: KmsKeyOption[] = [];
    for (const k of keysRes.Keys || []) {
      if (!k.KeyId) continue;
      const alias = aliasMap.get(k.KeyId);
      // Fetch metadata
      let desc = "";
      try {
        const dRes = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        desc = dRes.KeyMetadata?.Description || "";
      } catch {
        // Continue
      }

      keyList.push({
        keyId: k.KeyId,
        keyArn: k.KeyArn || `arn:aws:kms:us-east-1:000000000000:key/${k.KeyId}`,
        alias,
        description: desc,
      });
    }

    return { success: true, keys: keyList };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, keys: [], error: msg };
  }
}
