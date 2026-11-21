/**
 * src/app/kms/actions.ts – Server Actions for AWS Key Management Service (KMS).
 * 100% backed by the live AWS emulator client (@aws-sdk/client-kms). Zero dummy data.
 */

"use server";

import { revalidatePath } from "next/cache";
import { kms, iam, sts } from "@/lib/aws";
import {
  ListKeysCommand,
  ListAliasesCommand,
  DescribeKeyCommand,
  CreateKeyCommand,
  CreateAliasCommand,
  DeleteAliasCommand,
  UpdateAliasCommand,
  UpdateKeyDescriptionCommand,
  EnableKeyCommand,
  DisableKeyCommand,
  ScheduleKeyDeletionCommand,
  CancelKeyDeletionCommand,
  EnableKeyRotationCommand,
  DisableKeyRotationCommand,
  GetKeyRotationStatusCommand,
  GetKeyPolicyCommand,
  PutKeyPolicyCommand,
  ListResourceTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
  DescribeCustomKeyStoresCommand,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
  KeyUsageType,
  KeySpec,
} from "@aws-sdk/client-kms";
import { ListUsersCommand, ListRolesCommand } from "@aws-sdk/client-iam";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  KMSKeySummary,
  KMSKeyDetail,
  CustomKeyStoreItem,
  IAMPrincipal,
  CreateKeyInput,
} from "./types";
import { formatKmsDate } from "./dateUtils";

/**
 * Fetch Customer Managed Keys (CMKs).
 */
export async function fetchCustomerManagedKeys(): Promise<{
  keys: KMSKeySummary[];
  success: boolean;
  error?: string;
}> {
  try {
    const [keysRes, aliasesRes] = await Promise.all([
      kms.send(new ListKeysCommand({})),
      kms.send(new ListAliasesCommand({})),
    ]);

    const rawKeys = keysRes.Keys || [];
    const rawAliases = aliasesRes.Aliases || [];

    const aliasMap: Record<string, string[]> = {};
    for (const a of rawAliases) {
      if (a.TargetKeyId && a.AliasName) {
        if (!aliasMap[a.TargetKeyId]) aliasMap[a.TargetKeyId] = [];
        aliasMap[a.TargetKeyId].push(a.AliasName);
      }
    }

    const keySummaries: KMSKeySummary[] = [];

    for (const k of rawKeys) {
      if (!k.KeyId) continue;
      try {
        const desc = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        const meta = desc.KeyMetadata;
        if (!meta) continue;

        const isCustomer = meta.KeyManager === "CUSTOMER" || !meta.KeyManager;

        if (isCustomer) {
          keySummaries.push({
            keyId: meta.KeyId || k.KeyId,
            arn: meta.Arn || "",
            aliases: aliasMap[meta.KeyId || k.KeyId] || [],
            description: meta.Description || "",
            keyState: meta.KeyState || "Enabled",
            enabled: meta.Enabled ?? true,
            creationDate: formatKmsDate(meta.CreationDate),
            keyUsage: meta.KeyUsage || "ENCRYPT_DECRYPT",
            keySpec: meta.KeySpec || meta.CustomerMasterKeySpec || "SYMMETRIC_DEFAULT",
            keyManager: "CUSTOMER",
            origin: meta.Origin || "AWS_KMS",
            deletionDate: meta.DeletionDate ? formatKmsDate(meta.DeletionDate) : undefined,
            multiRegion: meta.MultiRegion ?? false,
            encryptionAlgorithms: meta.EncryptionAlgorithms,
            signingAlgorithms: meta.SigningAlgorithms,
            macAlgorithms: meta.MacAlgorithms,
          });
        }
      } catch (e) {
        console.error(`Error describing key ${k.KeyId}:`, e);
      }
    }

    return {
      success: true,
      keys: keySummaries,
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

/**
 * Fetch AWS Managed Keys (keys managed by AWS services).
 */
export async function fetchAWSManagedKeys(): Promise<{
  keys: KMSKeySummary[];
  success: boolean;
  error?: string;
}> {
  try {
    const [keysRes, aliasesRes] = await Promise.all([
      kms.send(new ListKeysCommand({})),
      kms.send(new ListAliasesCommand({})),
    ]);

    const rawKeys = keysRes.Keys || [];
    const rawAliases = aliasesRes.Aliases || [];

    const aliasMap: Record<string, string[]> = {};
    for (const a of rawAliases) {
      if (a.TargetKeyId && a.AliasName) {
        if (!aliasMap[a.TargetKeyId]) aliasMap[a.TargetKeyId] = [];
        aliasMap[a.TargetKeyId].push(a.AliasName);
      }
    }

    const keys: KMSKeySummary[] = [];

    for (const k of rawKeys) {
      if (!k.KeyId) continue;
      try {
        const desc = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        const meta = desc.KeyMetadata;
        if (!meta) continue;

        const isAws = meta.KeyManager === "AWS" || (aliasMap[k.KeyId] && aliasMap[k.KeyId].some(a => a.startsWith("alias/aws/")));

        if (isAws) {
          keys.push({
            keyId: meta.KeyId || k.KeyId,
            arn: meta.Arn || "",
            aliases: aliasMap[meta.KeyId || k.KeyId] || [],
            description: meta.Description || "",
            keyState: meta.KeyState || "Enabled",
            enabled: meta.Enabled ?? true,
            creationDate: formatKmsDate(meta.CreationDate),
            keyUsage: meta.KeyUsage || "ENCRYPT_DECRYPT",
            keySpec: meta.KeySpec || meta.CustomerMasterKeySpec || "SYMMETRIC_DEFAULT",
            keyManager: "AWS",
            origin: meta.Origin || "AWS_KMS",
            deletionDate: meta.DeletionDate ? formatKmsDate(meta.DeletionDate) : undefined,
            multiRegion: meta.MultiRegion ?? false,
            encryptionAlgorithms: meta.EncryptionAlgorithms,
            signingAlgorithms: meta.SigningAlgorithms,
            macAlgorithms: meta.MacAlgorithms,
          });
        }
      } catch (e) {
        console.error(`Error describing AWS key ${k.KeyId}:`, e);
      }
    }

    return {
      success: true,
      keys,
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

/**
 * Fetch full details for a single KMS key.
 */
export async function fetchKeyDetails(keyId: string): Promise<{
  key: KMSKeyDetail | null;
  success: boolean;
  error?: string;
}> {
  try {
    const [descRes, aliasesRes, policyRes, rotationRes, tagsRes] = await Promise.all([
      kms.send(new DescribeKeyCommand({ KeyId: keyId })),
      kms.send(new ListAliasesCommand({ KeyId: keyId })).catch(() => ({ Aliases: [] })),
      kms.send(new GetKeyPolicyCommand({ KeyId: keyId, PolicyName: "default" })).catch(() => ({ Policy: "" })),
      kms.send(new GetKeyRotationStatusCommand({ KeyId: keyId })).catch(() => ({ KeyRotationEnabled: false })),
      kms.send(new ListResourceTagsCommand({ KeyId: keyId })).catch(() => ({ Tags: [] })),
    ]);

    const meta = descRes.KeyMetadata;
    if (!meta) {
      return { success: false, key: null, error: `Key "${keyId}" not found.` };
    }

    const aliases = (aliasesRes.Aliases || [])
      .map((a) => a.AliasName || "")
      .filter(Boolean);

    let formattedPolicy = "";
    if (policyRes.Policy) {
      try {
        formattedPolicy = JSON.stringify(JSON.parse(policyRes.Policy), null, 2);
      } catch {
        formattedPolicy = policyRes.Policy;
      }
    }

    const tags = (tagsRes.Tags || []).map((t) => ({
      key: t.TagKey || "",
      value: t.TagValue || "",
    }));

    return {
      success: true,
      key: {
        keyId: meta.KeyId || keyId,
        arn: meta.Arn || "",
        aliases,
        description: meta.Description || "",
        keyState: meta.KeyState || "Enabled",
        enabled: meta.Enabled ?? true,
        creationDate: formatKmsDate(meta.CreationDate),
        keyUsage: meta.KeyUsage || "ENCRYPT_DECRYPT",
        keySpec: meta.KeySpec || meta.CustomerMasterKeySpec || "SYMMETRIC_DEFAULT",
        keyManager: meta.KeyManager === "AWS" ? "AWS" : "CUSTOMER",
        origin: meta.Origin || "AWS_KMS",
        deletionDate: meta.DeletionDate ? formatKmsDate(meta.DeletionDate) : undefined,
        multiRegion: meta.MultiRegion ?? false,
        keyPolicy: formattedPolicy,
        keyRotationEnabled: rotationRes.KeyRotationEnabled ?? false,
        nextRotationDate: rotationRes.NextRotationDate ? formatKmsDate(rotationRes.NextRotationDate) : undefined,
        rotationPeriodInDays: rotationRes.RotationPeriodInDays,
        tags,
        encryptionAlgorithms: meta.EncryptionAlgorithms,
        signingAlgorithms: meta.SigningAlgorithms,
        macAlgorithms: meta.MacAlgorithms,
        cloudHsmClusterId: meta.CloudHsmClusterId,
        customKeyStoreId: meta.CustomKeyStoreId,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, key: null, error: msg };
  }
}

/**
 * Fetch IAM Users and Roles from the emulator for the Create Key wizard.
 */
export async function fetchIamPrincipalsAction(): Promise<{
  success: boolean;
  principals: IAMPrincipal[];
  accountId: string;
  error?: string;
}> {
  try {
    const [usersRes, rolesRes, identityRes] = await Promise.all([
      iam.send(new ListUsersCommand({ MaxItems: 100 })).catch(() => ({ Users: [] })),
      iam.send(new ListRolesCommand({ MaxItems: 100 })).catch(() => ({ Roles: [] })),
      sts.send(new GetCallerIdentityCommand({})).catch(() => ({ Account: "000000000000" })),
    ]);

    const principals: IAMPrincipal[] = [];

    if (usersRes.Users) {
      for (const u of usersRes.Users) {
        if (u.UserName && u.Arn) {
          principals.push({
            name: u.UserName,
            arn: u.Arn,
            type: "User",
          });
        }
      }
    }

    if (rolesRes.Roles) {
      for (const r of rolesRes.Roles) {
        if (r.RoleName && r.Arn) {
          principals.push({
            name: r.RoleName,
            arn: r.Arn,
            type: "Role",
          });
        }
      }
    }

    return {
      success: true,
      principals,
      accountId: identityRes.Account || "000000000000",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      principals: [],
      accountId: "000000000000",
      error: msg,
    };
  }
}

/**
 * Create a new Customer Managed Key using complete wizard input.
 */
export async function createKeyAction(input: CreateKeyInput): Promise<{
  success: boolean;
  keyId?: string;
  error?: string;
}> {
  try {
    const keyUsage = input.keyUsage as KeyUsageType;
    const keySpec = input.keySpec as KeySpec;
    const description = input.description?.trim() || "";

    const tagParams = input.tags
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ TagKey: t.key.trim(), TagValue: t.value.trim() }));

    const createRes = await kms.send(
      new CreateKeyCommand({
        Description: description,
        KeyUsage: keyUsage,
        KeySpec: keySpec,
        MultiRegion: input.multiRegion,
        Policy: input.customPolicy?.trim() || undefined,
        Tags: tagParams.length > 0 ? tagParams : undefined,
      })
    );

    const newKeyId = createRes.KeyMetadata?.KeyId;
    if (!newKeyId) {
      return { success: false, error: "Failed to retrieve generated Key ID." };
    }

    // Attach Alias if provided
    if (input.alias?.trim()) {
      let aliasName = input.alias.trim();
      if (!aliasName.startsWith("alias/")) {
        aliasName = `alias/${aliasName}`;
      }
      try {
        await kms.send(
          new CreateAliasCommand({
            AliasName: aliasName,
            TargetKeyId: newKeyId,
          })
        );
      } catch (aliasErr) {
        console.error("Failed to attach initial alias:", aliasErr);
      }
    }

    revalidatePath("/kms");
    return { success: true, keyId: newKeyId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Create Alias for a key.
 */
export async function createAliasAction(keyId: string, aliasName: string) {
  try {
    let finalAlias = aliasName.trim();
    if (!finalAlias.startsWith("alias/")) {
      finalAlias = `alias/${finalAlias}`;
    }

    await kms.send(
      new CreateAliasCommand({
        AliasName: finalAlias,
        TargetKeyId: keyId,
      })
    );

    revalidatePath("/kms");
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Delete Alias.
 */
export async function deleteAliasAction(aliasName: string, keyId?: string) {
  try {
    await kms.send(new DeleteAliasCommand({ AliasName: aliasName }));
    revalidatePath("/kms");
    if (keyId) revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update Alias target.
 */
export async function updateAliasAction(aliasName: string, targetKeyId: string) {
  try {
    await kms.send(
      new UpdateAliasCommand({
        AliasName: aliasName,
        TargetKeyId: targetKeyId,
      })
    );
    revalidatePath("/kms");
    revalidatePath(`/kms/keys/${targetKeyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update Key Description.
 */
export async function updateKeyDescriptionAction(keyId: string, description: string) {
  try {
    await kms.send(
      new UpdateKeyDescriptionCommand({
        KeyId: keyId,
        Description: description,
      })
    );
    revalidatePath(`/kms/keys/${keyId}`);
    revalidatePath("/kms");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Enable a disabled key.
 */
export async function enableKeyAction(keyId: string) {
  try {
    await kms.send(new EnableKeyCommand({ KeyId: keyId }));
    revalidatePath("/kms");
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Disable an enabled key.
 */
export async function disableKeyAction(keyId: string) {
  try {
    await kms.send(new DisableKeyCommand({ KeyId: keyId }));
    revalidatePath("/kms");
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Schedule key deletion (7 to 30 days).
 */
export async function scheduleKeyDeletionAction(keyId: string, pendingWindowInDays = 7) {
  try {
    const days = Math.max(7, Math.min(30, pendingWindowInDays));
    const res = await kms.send(
      new ScheduleKeyDeletionCommand({
        KeyId: keyId,
        PendingWindowInDays: days,
      })
    );
    revalidatePath("/kms");
    revalidatePath(`/kms/keys/${keyId}`);
    return {
      success: true,
      deletionDate: res.DeletionDate ? formatKmsDate(res.DeletionDate) : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Cancel scheduled deletion for a key.
 */
export async function cancelKeyDeletionAction(keyId: string) {
  try {
    await kms.send(new CancelKeyDeletionCommand({ KeyId: keyId }));
    revalidatePath("/kms");
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Toggle key rotation.
 */
export async function updateKeyRotationAction(keyId: string, enable: boolean) {
  try {
    if (enable) {
      await kms.send(new EnableKeyRotationCommand({ KeyId: keyId }));
    } else {
      await kms.send(new DisableKeyRotationCommand({ KeyId: keyId }));
    }
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Update key policy.
 */
export async function updateKeyPolicyAction(keyId: string, policyJson: string) {
  try {
    JSON.parse(policyJson);
  } catch {
    return { success: false, error: "Key policy must be valid JSON." };
  }

  try {
    await kms.send(
      new PutKeyPolicyCommand({
        KeyId: keyId,
        PolicyName: "default",
        Policy: policyJson,
      })
    );
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Tag Resource.
 */
export async function tagResourceAction(
  keyId: string,
  tags: Array<{ TagKey: string; TagValue: string }>
) {
  try {
    await kms.send(
      new TagResourceCommand({
        KeyId: keyId,
        Tags: tags,
      })
    );
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Untag Resource.
 */
export async function untagResourceAction(keyId: string, tagKeys: string[]) {
  try {
    await kms.send(
      new UntagResourceCommand({
        KeyId: keyId,
        TagKeys: tagKeys,
      })
    );
    revalidatePath(`/kms/keys/${keyId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch Custom Key Stores.
 */
export async function fetchCustomKeyStoresAction(): Promise<{
  success: boolean;
  customKeyStores: CustomKeyStoreItem[];
  error?: string;
}> {
  try {
    const res = await kms.send(new DescribeCustomKeyStoresCommand({}));
    const rawList = res.CustomKeyStores || [];

    const customKeyStores: CustomKeyStoreItem[] = rawList.map((s) => ({
      customKeyStoreId: s.CustomKeyStoreId,
      customKeyStoreName: s.CustomKeyStoreName,
      cloudHsmClusterId: s.CloudHsmClusterId,
      trustAnchorCertificate: s.TrustAnchorCertificate,
      connectionState: s.ConnectionState as any,
      connectionErrorCode: s.ConnectionErrorCode,
      creationDate: s.CreationDate ? formatKmsDate(s.CreationDate) : undefined,
      customKeyStoreType: s.CustomKeyStoreType as any,
    }));

    return {
      success: true,
      customKeyStores,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      customKeyStores: [],
      error: msg,
    };
  }
}

/**
 * Live cryptographic Encrypt action.
 */
export async function encryptDataAction(
  keyId: string,
  plaintext: string
): Promise<{
  success: boolean;
  ciphertextBase64?: string;
  error?: string;
}> {
  if (!plaintext) return { success: false, error: "Plaintext is required." };

  try {
    const res = await kms.send(
      new EncryptCommand({
        KeyId: keyId,
        Plaintext: Buffer.from(plaintext, "utf-8"),
      })
    );

    const b64 = res.CiphertextBlob
      ? Buffer.from(res.CiphertextBlob).toString("base64")
      : "";
    return { success: true, ciphertextBase64: b64 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Live cryptographic Decrypt action.
 */
export async function decryptDataAction(ciphertextBase64: string): Promise<{
  success: boolean;
  plaintext?: string;
  keyId?: string;
  error?: string;
}> {
  if (!ciphertextBase64) return { success: false, error: "Ciphertext is required." };

  try {
    const res = await kms.send(
      new DecryptCommand({
        CiphertextBlob: Buffer.from(ciphertextBase64, "base64"),
      })
    );

    const plaintext = res.Plaintext
      ? Buffer.from(res.Plaintext).toString("utf-8")
      : "";
    return {
      success: true,
      plaintext,
      keyId: res.KeyId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Live cryptographic GenerateDataKey action.
 */
export async function generateDataKeyAction(
  keyId: string,
  keySpec: "AES_256" | "AES_128" = "AES_256"
): Promise<{
  success: boolean;
  plaintextKeyBase64?: string;
  ciphertextBlobBase64?: string;
  error?: string;
}> {
  try {
    const res = await kms.send(
      new GenerateDataKeyCommand({
        KeyId: keyId,
        KeySpec: keySpec,
      })
    );

    const plaintextKey = res.Plaintext
      ? Buffer.from(res.Plaintext).toString("base64")
      : "";
    const ciphertextBlob = res.CiphertextBlob
      ? Buffer.from(res.CiphertextBlob).toString("base64")
      : "";

    return {
      success: true,
      plaintextKeyBase64: plaintextKey,
      ciphertextBlobBase64: ciphertextBlob,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
