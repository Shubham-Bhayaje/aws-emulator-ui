/**
 * src/app/systems-manager/parameter-store/actions.ts – Server Actions for SSM Parameter Store.
 * 100% backed by the live AWS emulator client (@aws-sdk/client-ssm & @aws-sdk/client-kms).
 */

"use server";

import { revalidatePath } from "next/cache";
import { ssm, kms } from "@/lib/aws";
import {
  SSMClient,
  DescribeParametersCommand,
  GetParameterCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  DeleteParametersCommand,
  GetParameterHistoryCommand,
  LabelParameterVersionCommand,
  ListTagsForResourceCommand,
  AddTagsToResourceCommand,
  RemoveTagsFromResourceCommand,
} from "@aws-sdk/client-ssm";
import { KMSClient, ListKeysCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import {
  SSMParameterSummary,
  SSMParameterDetail,
  SSMParameterHistoryItem,
  PutParameterInput,
  KmsKeyOption,
} from "./types";
import { formatSsmDate } from "./dateUtils";

const ENDPOINT = "https://127.0.0.1:9297";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

function getSsmClient(): SSMClient {
  if (ssm && typeof (ssm as any).send === "function") return ssm;
  return new SSMClient({ endpoint: ENDPOINT, region: DEFAULT_REGION });
}

function getKmsClient(): KMSClient {
  if (kms && typeof (kms as any).send === "function") return kms;
  return new KMSClient({ endpoint: ENDPOINT, region: DEFAULT_REGION });
}

/**
 * Fetch list of all parameters.
 */
export async function describeParametersAction(): Promise<{
  success: boolean;
  parameters: SSMParameterSummary[];
  error?: string;
}> {
  try {
    const res = await getSsmClient().send(new DescribeParametersCommand({}));
    const rawList = res.Parameters || [];

    const summaries: SSMParameterSummary[] = rawList.map((p) => ({
      name: p.Name || "",
      type: (p.Type as any) || "String",
      keyId: p.KeyId,
      lastModifiedDate: p.LastModifiedDate ? formatSsmDate(p.LastModifiedDate) : undefined,
      lastModifiedUser: p.LastModifiedUser,
      description: p.Description,
      version: p.Version ?? 1,
      tier: (p.Tier as any) || "Standard",
      dataType: p.DataType || "text",
    }));

    return {
      success: true,
      parameters: summaries,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      parameters: [],
      error: msg,
    };
  }
}

/**
 * Fetch detailed parameter information including decrypted value and tags.
 */
export async function getParameterDetailAction(
  name: string,
  withDecryption: boolean = true
): Promise<{
  success: boolean;
  parameter: SSMParameterDetail | null;
  error?: string;
}> {
  try {
    const [getRes, descRes, tagsRes] = await Promise.all([
      getSsmClient().send(new GetParameterCommand({ Name: name, WithDecryption: withDecryption })),
      getSsmClient().send(
        new DescribeParametersCommand({
          ParameterFilters: [{ Key: "Name", Values: [name] }],
        })
      ).catch(() => ({ Parameters: [] })),
      getSsmClient().send(
        new ListTagsForResourceCommand({
          ResourceType: "Parameter",
          ResourceId: name,
        })
      ).catch(() => ({ TagList: [] })),
    ]);

    const p = getRes.Parameter;
    if (!p) {
      return { success: false, parameter: null, error: `Parameter "${name}" not found.` };
    }

    const descMeta = (descRes.Parameters || []).find((d) => d.Name === name);

    const tags = (tagsRes.TagList || []).map((t) => ({
      key: t.Key || "",
      value: t.Value || "",
    }));

    const detail: SSMParameterDetail = {
      name: p.Name || name,
      arn: p.ARN || `arn:aws:ssm:us-east-1:000000000000:parameter${name.startsWith("/") ? name : `/${name}`}`,
      type: (p.Type as any) || "String",
      value: p.Value || "",
      version: p.Version ?? 1,
      keyId: descMeta?.KeyId,
      tier: (descMeta?.Tier as any) || "Standard",
      dataType: p.DataType || descMeta?.DataType || "text",
      description: descMeta?.Description,
      lastModifiedDate: p.LastModifiedDate ? formatSsmDate(p.LastModifiedDate) : undefined,
      lastModifiedUser: descMeta?.LastModifiedUser,
      labels: [],
      tags,
    };

    return {
      success: true,
      parameter: detail,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      parameter: null,
      error: msg,
    };
  }
}

/**
 * Fetch raw parameter value with or without decryption.
 */
export async function getParameterValueAction(
  name: string,
  withDecryption: boolean
): Promise<{
  success: boolean;
  value?: string;
  error?: string;
}> {
  try {
    const res = await getSsmClient().send(
      new GetParameterCommand({
        Name: name,
        WithDecryption: withDecryption,
      })
    );

    return {
      success: true,
      value: res.Parameter?.Value,
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
 * Create or overwrite a parameter.
 */
export async function putParameterAction(input: PutParameterInput): Promise<{
  success: boolean;
  version?: number;
  tier?: string;
  error?: string;
}> {
  try {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Parameter name is required." };
    }

    const tagList = (input.tags || [])
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    const res = await getSsmClient().send(
      new PutParameterCommand({
        Name: trimmedName,
        Description: input.description?.trim() || undefined,
        Value: input.value,
        Type: input.type,
        KeyId: input.type === "SecureString" && input.keyId && input.keyId !== "default"
          ? input.keyId
          : undefined,
        Overwrite: Boolean(input.overwrite),
        Tier: input.tier || "Standard",
        DataType: input.dataType || "text",
        Tags: tagList.length > 0 && !input.overwrite ? tagList : undefined,
      })
    );

    // If updating and tags provided, call AddTagsToResource
    if (input.overwrite && tagList.length > 0) {
      await getSsmClient().send(
        new AddTagsToResourceCommand({
          ResourceType: "Parameter",
          ResourceId: trimmedName,
          Tags: tagList,
        })
      );
    }

    revalidatePath("/systems-manager/parameter-store");
    return {
      success: true,
      version: res.Version,
      tier: res.Tier,
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
 * Fetch chronological version history of a parameter.
 */
export async function getParameterHistoryAction(name: string): Promise<{
  success: boolean;
  history: SSMParameterHistoryItem[];
  error?: string;
}> {
  try {
    const res = await getSsmClient().send(
      new GetParameterHistoryCommand({
        Name: name,
        WithDecryption: true,
      })
    );

    const raw = res.Parameters || [];
    const history: SSMParameterHistoryItem[] = raw.map((h) => ({
      name: h.Name || name,
      type: (h.Type as any) || "String",
      keyId: h.KeyId,
      lastModifiedDate: h.LastModifiedDate ? formatSsmDate(h.LastModifiedDate) : undefined,
      lastModifiedUser: h.LastModifiedUser,
      description: h.Description,
      value: h.Value || "",
      version: h.Version ?? 1,
      labels: h.Labels || [],
      tier: h.Tier || "Standard",
      dataType: h.DataType || "text",
    }));

    return {
      success: true,
      history,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      history: [],
      error: msg,
    };
  }
}

/**
 * Assign staging labels to a specific parameter version.
 */
export async function labelParameterVersionAction(
  name: string,
  version: number,
  labels: string[]
): Promise<{
  success: boolean;
  parameterVersion?: number;
  invalidLabels?: string[];
  error?: string;
}> {
  try {
    const cleanLabels = labels.map((l) => l.trim()).filter(Boolean);
    const res = await getSsmClient().send(
      new LabelParameterVersionCommand({
        Name: name,
        ParameterVersion: version,
        Labels: cleanLabels,
      })
    );

    revalidatePath(`/systems-manager/parameter-store`);
    return {
      success: true,
      parameterVersion: res.ParameterVersion,
      invalidLabels: res.InvalidLabels || [],
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
 * Delete a single parameter.
 */
export async function deleteParameterAction(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await getSsmClient().send(new DeleteParameterCommand({ Name: name }));
    revalidatePath("/systems-manager/parameter-store");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Bulk delete multiple parameters.
 */
export async function deleteParametersAction(names: string[]): Promise<{
  success: boolean;
  deletedParameters?: string[];
  invalidParameters?: string[];
  error?: string;
}> {
  try {
    const res = await getSsmClient().send(new DeleteParametersCommand({ Names: names }));
    revalidatePath("/systems-manager/parameter-store");
    return {
      success: true,
      deletedParameters: res.DeletedParameters || [],
      invalidParameters: res.InvalidParameters || [],
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
 * Add or update tags on a parameter.
 */
export async function addTagsToParameterAction(
  name: string,
  tags: { key: string; value: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const tagList = tags
      .filter((t) => t.key.trim().length > 0)
      .map((t) => ({ Key: t.key.trim(), Value: t.value.trim() }));

    if (tagList.length > 0) {
      await getSsmClient().send(
        new AddTagsToResourceCommand({
          ResourceType: "Parameter",
          ResourceId: name,
          Tags: tagList,
        })
      );
    }

    revalidatePath("/systems-manager/parameter-store");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove tags from a parameter.
 */
export async function removeTagsFromParameterAction(
  name: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = tagKeys.map((k) => k.trim()).filter(Boolean);
    if (keys.length > 0) {
      await getSsmClient().send(
        new RemoveTagsFromResourceCommand({
          ResourceType: "Parameter",
          ResourceId: name,
          TagKeys: keys,
        })
      );
    }

    revalidatePath("/systems-manager/parameter-store");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch live KMS keys to populate SecureString encryption key dropdowns.
 */
export async function fetchKmsKeysAction(): Promise<{
  success: boolean;
  keys: KmsKeyOption[];
  error?: string;
}> {
  try {
    const [keyList, aliasList] = await Promise.all([
      getKmsClient().send(new ListKeysCommand({})),
      getKmsClient().send(new ListAliasesCommand({})),
    ]);

    const aliasMap = new Map<string, string>();
    for (const a of aliasList.Aliases || []) {
      if (a.TargetKeyId && a.AliasName) {
        aliasMap.set(a.TargetKeyId, a.AliasName);
      }
    }

    const options: KmsKeyOption[] = [];
    for (const k of (keyList.Keys || []).slice(0, 20)) {
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
