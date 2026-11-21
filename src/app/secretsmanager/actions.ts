/**
 * src/app/secretsmanager/actions.ts – Server Actions for AWS Secrets Manager.
 * 100% server-side AWS SDK v3 execution against local AWS emulator.
 */

"use server";

import { revalidatePath } from "next/cache";
import { secretsManager, kms } from "@/lib/aws";
import {
  ListSecretsCommand,
  DescribeSecretCommand,
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  RestoreSecretCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetResourcePolicyCommand,
  PutResourcePolicyCommand,
  DeleteResourcePolicyCommand,
  ListSecretVersionIdsCommand,
  RotateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { ListKeysCommand, ListAliasesCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import {
  SecretSummary,
  SecretDetail,
  SecretVersionItem,
  CreateSecretInput,
  KmsKeyOption,
} from "./types";
import { formatSmDate, calculateDaysRemaining } from "./dateUtils";

/**
 * Fetch all secrets in the current Region.
 */
export async function fetchSecretsAction(includeDeleted: boolean = true): Promise<{
  success: boolean;
  secrets: SecretSummary[];
  error?: string;
}> {
  try {
    const res = await secretsManager.send(
      new ListSecretsCommand({
        IncludePlannedDeletion: includeDeleted,
      })
    );

    const rawList = res.SecretList || [];
    const summaries: SecretSummary[] = [];

    for (const s of rawList) {
      if (!s.Name && !s.ARN) continue;
      const arn = s.ARN || "";
      const name = s.Name || arn.split(":").pop()?.split("-")[0] || "Unnamed";
      const isDeleted = Boolean(s.DeletedDate);
      const daysLeft = isDeleted ? calculateDaysRemaining(s.DeletedDate) : undefined;

      summaries.push({
        arn,
        name,
        description: s.Description,
        kmsKeyId: s.KmsKeyId,
        rotationEnabled: Boolean(s.RotationEnabled),
        rotationLambdaArn: s.RotationLambdaARN,
        rotationRules: s.RotationRules
          ? { automaticallyAfterDays: s.RotationRules.AutomaticallyAfterDays }
          : undefined,
        lastRotatedDate: s.LastRotatedDate ? formatSmDate(s.LastRotatedDate) : undefined,
        lastChangedDate: s.LastChangedDate ? formatSmDate(s.LastChangedDate) : undefined,
        lastAccessedDate: s.LastAccessedDate ? formatSmDate(s.LastAccessedDate) : undefined,
        deletedDate: s.DeletedDate ? formatSmDate(s.DeletedDate) : undefined,
        tags: (s.Tags || []).map((t) => ({ key: t.Key || "", value: t.Value || "" })),
        secretVersionsToStages: s.SecretVersionsToStages as Record<string, string[]> | undefined,
        createdDate: s.CreatedDate ? formatSmDate(s.CreatedDate) : undefined,
        status: isDeleted ? "ScheduledForDeletion" : "Active",
        daysUntilDeletion: daysLeft,
      });
    }

    return {
      success: true,
      secrets: summaries,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      secrets: [],
      error: msg,
    };
  }
}

/**
 * Fetch full details for a secret.
 */
export async function fetchSecretDetailAction(secretId: string): Promise<{
  success: boolean;
  secret: SecretDetail | null;
  versions: SecretVersionItem[];
  error?: string;
}> {
  try {
    const [desc, policyRes, versionsRes] = await Promise.all([
      secretsManager.send(new DescribeSecretCommand({ SecretId: secretId })),
      secretsManager.send(new GetResourcePolicyCommand({ SecretId: secretId })).catch(() => ({
        ResourcePolicy: undefined,
      })),
      secretsManager.send(new ListSecretVersionIdsCommand({ SecretId: secretId })).catch(() => ({
        Versions: [],
      })),
    ]);

    const isDeleted = Boolean(desc.DeletedDate);
    const daysLeft = isDeleted ? calculateDaysRemaining(desc.DeletedDate) : undefined;

    const detail: SecretDetail = {
      arn: desc.ARN || "",
      name: desc.Name || secretId,
      description: desc.Description,
      kmsKeyId: desc.KmsKeyId,
      rotationEnabled: Boolean(desc.RotationEnabled),
      rotationLambdaArn: desc.RotationLambdaARN,
      rotationRules: desc.RotationRules
        ? { automaticallyAfterDays: desc.RotationRules.AutomaticallyAfterDays }
        : undefined,
      lastRotatedDate: desc.LastRotatedDate ? formatSmDate(desc.LastRotatedDate) : undefined,
      lastChangedDate: desc.LastChangedDate ? formatSmDate(desc.LastChangedDate) : undefined,
      lastAccessedDate: desc.LastAccessedDate ? formatSmDate(desc.LastAccessedDate) : undefined,
      deletedDate: desc.DeletedDate ? formatSmDate(desc.DeletedDate) : undefined,
      tags: (desc.Tags || []).map((t) => ({ key: t.Key || "", value: t.Value || "" })),
      secretVersionsToStages: desc.VersionIdsToStages as Record<string, string[]> | undefined,
      createdDate: desc.CreatedDate ? formatSmDate(desc.CreatedDate) : undefined,
      status: isDeleted ? "ScheduledForDeletion" : "Active",
      daysUntilDeletion: daysLeft,
      resourcePolicy: policyRes.ResourcePolicy,
      primaryRegion: desc.PrimaryRegion,
    };

    const versions: SecretVersionItem[] = (versionsRes.Versions || []).map((v) => ({
      versionId: v.VersionId || "",
      versionStages: v.VersionStages || [],
      createdDate: v.CreatedDate ? formatSmDate(v.CreatedDate) : undefined,
      lastAccessedDate: v.LastAccessedDate ? formatSmDate(v.LastAccessedDate) : undefined,
    }));

    return {
      success: true,
      secret: detail,
      versions,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      secret: null,
      versions: [],
      error: msg,
    };
  }
}

/**
 * Retrieve secret value.
 */
export async function getSecretValueAction(
  secretId: string,
  versionId?: string
): Promise<{
  success: boolean;
  secretString?: string;
  versionId?: string;
  versionStages?: string[];
  error?: string;
}> {
  try {
    const res = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: secretId,
        VersionId: versionId,
      })
    );

    return {
      success: true,
      secretString: res.SecretString,
      versionId: res.VersionId,
      versionStages: res.VersionStages,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Store a new secret.
 */
export async function createSecretAction(input: CreateSecretInput): Promise<{
  success: boolean;
  arn?: string;
  name?: string;
  versionId?: string;
  error?: string;
}> {
  try {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Secret name is required." };
    }

    const tagList = (input.tags || [])
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    const res = await secretsManager.send(
      new CreateSecretCommand({
        Name: trimmedName,
        Description: input.description?.trim() || undefined,
        SecretString: input.secretString,
        KmsKeyId: input.kmsKeyId && input.kmsKeyId !== "default" ? input.kmsKeyId : undefined,
        Tags: tagList.length > 0 ? tagList : undefined,
      })
    );

    if (input.rotationEnabled && input.rotationDays) {
      try {
        await secretsManager.send(
          new RotateSecretCommand({
            SecretId: res.Name || trimmedName,
            RotationLambdaARN: input.rotationLambdaArn?.trim() || undefined,
            RotationRules: {
              AutomaticallyAfterDays: input.rotationDays,
            },
          })
        );
      } catch {
        // Emulator notice if rotation Lambda is not attached
      }
    }

    revalidatePath("/secretsmanager");
    return {
      success: true,
      arn: res.ARN,
      name: res.Name,
      versionId: res.VersionId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Update secret value (creates a new version).
 */
export async function putSecretValueAction(
  secretId: string,
  secretString: string
): Promise<{
  success: boolean;
  versionId?: string;
  error?: string;
}> {
  try {
    const res = await secretsManager.send(
      new PutSecretValueCommand({
        SecretId: secretId,
        SecretString: secretString,
      })
    );

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return {
      success: true,
      versionId: res.VersionId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Update secret metadata (description and KMS key).
 */
export async function updateSecretAction(
  secretId: string,
  description?: string,
  kmsKeyId?: string
): Promise<{
  success: boolean;
  arn?: string;
  name?: string;
  error?: string;
}> {
  try {
    const res = await secretsManager.send(
      new UpdateSecretCommand({
        SecretId: secretId,
        Description: description !== undefined ? description.trim() : undefined,
        KmsKeyId: kmsKeyId && kmsKeyId !== "default" ? kmsKeyId : undefined,
      })
    );

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return {
      success: true,
      arn: res.ARN,
      name: res.Name,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Delete a secret (either scheduled recovery or force delete).
 */
export async function deleteSecretAction(
  secretId: string,
  recoveryWindowInDays: number = 7,
  forceDelete: boolean = false
): Promise<{
  success: boolean;
  deletionDate?: string;
  error?: string;
}> {
  try {
    const res = await secretsManager.send(
      new DeleteSecretCommand({
        SecretId: secretId,
        RecoveryWindowInDays: forceDelete ? undefined : recoveryWindowInDays,
        ForceDeleteWithoutRecovery: forceDelete,
      })
    );

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return {
      success: true,
      deletionDate: res.DeletionDate ? formatSmDate(res.DeletionDate) : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Restore a secret scheduled for deletion.
 */
export async function restoreSecretAction(secretId: string): Promise<{
  success: boolean;
  name?: string;
  error?: string;
}> {
  try {
    const res = await secretsManager.send(
      new RestoreSecretCommand({
        SecretId: secretId,
      })
    );

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return {
      success: true,
      name: res.Name,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Add or update tags on a secret.
 */
export async function addTagsAction(
  secretId: string,
  tags: { key: string; value: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const tagList = tags
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    if (tagList.length > 0) {
      await secretsManager.send(
        new TagResourceCommand({
          SecretId: secretId,
          Tags: tagList,
        })
      );
    }

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove tags from a secret.
 */
export async function removeTagsAction(
  secretId: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = tagKeys.map((k) => k.trim()).filter(Boolean);
    if (keys.length > 0) {
      await secretsManager.send(
        new UntagResourceCommand({
          SecretId: secretId,
          TagKeys: keys,
        })
      );
    }

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Attach or update resource policy.
 */
export async function putResourcePolicyAction(
  secretId: string,
  resourcePolicy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await secretsManager.send(
      new PutResourcePolicyCommand({
        SecretId: secretId,
        ResourcePolicy: resourcePolicy,
      })
    );

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Delete attached resource policy.
 */
export async function deleteResourcePolicyAction(
  secretId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await secretsManager.send(
      new DeleteResourcePolicyCommand({
        SecretId: secretId,
      })
    );

    revalidatePath("/secretsmanager");
    revalidatePath(`/secretsmanager/${secretId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch live KMS keys from the KMS service to populate encryption key dropdowns.
 */
export async function fetchKmsKeysAction(): Promise<{
  success: boolean;
  keys: KmsKeyOption[];
  error?: string;
}> {
  try {
    const [keyList, aliasList] = await Promise.all([
      kms.send(new ListKeysCommand({})),
      kms.send(new ListAliasesCommand({})),
    ]);

    const aliasMap = new Map<string, string>();
    for (const a of aliasList.Aliases || []) {
      if (a.TargetKeyId && a.AliasName) {
        aliasMap.set(a.TargetKeyId, a.AliasName);
      }
    }

    const options: KmsKeyOption[] = [];
    const keys = keyList.Keys || [];

    for (const k of keys.slice(0, 20)) {
      if (!k.KeyId) continue;
      const alias = aliasMap.get(k.KeyId);
      options.push({
        keyId: k.KeyId,
        keyArn: k.KeyArn || k.KeyId,
        alias,
      });
    }

    return {
      success: true,
      keys: options,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      keys: [],
      error: msg,
    };
  }
}
