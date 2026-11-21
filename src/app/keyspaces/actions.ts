"use server";

import { keyspaces, kms } from "@/lib/aws";
import {
  ListKeyspacesCommand,
  GetKeyspaceCommand,
  CreateKeyspaceCommand,
  DeleteKeyspaceCommand,
  ListTablesCommand,
  GetTableCommand,
  CreateTableCommand,
  UpdateTableCommand,
  DeleteTableCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-keyspaces";
import { ListAliasesCommand, ListKeysCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { revalidatePath } from "next/cache";
import {
  KeyspaceSummary,
  KeyspaceDetail,
  TableSummary,
  TableDetail,
  SchemaDefinition,
  CapacitySpecification,
  EncryptionSpecification,
  PointInTimeRecovery,
  ColumnDefinition,
  KmsKeyOption,
} from "./types";

/**
 * List all Amazon Keyspaces in the region
 */
export async function listKeyspacesAction(): Promise<{
  keyspaces: KeyspaceSummary[];
  error?: string;
}> {
  try {
    const res = await keyspaces.send(new ListKeyspacesCommand({}));
    const rawKeyspaces = res.keyspaces || [];

    const list: KeyspaceSummary[] = rawKeyspaces.map((k) => {
      const name = k.keyspaceName || "";
      const isSystem = name.startsWith("system") || name.startsWith("system_");
      return {
        keyspaceName: name,
        resourceArn: k.resourceArn || "",
        replicationStrategy: k.replicationStrategy || "SINGLE_REGION",
        replicationRegions: k.replicationRegions,
        isSystem,
      };
    });

    // Sort: user keyspaces first, then system keyspaces
    list.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return 1;
      if (!a.isSystem && b.isSystem) return -1;
      return a.keyspaceName.localeCompare(b.keyspaceName);
    });

    return { keyspaces: list };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to list keyspaces";
    return { keyspaces: [], error: errorMsg };
  }
}

/**
 * Get details for a specific keyspace including tables
 */
export async function getKeyspaceAction(keyspaceName: string): Promise<{
  keyspace?: KeyspaceDetail;
  tables?: TableSummary[];
  error?: string;
}> {
  try {
    const [detailRes, tablesRes] = await Promise.all([
      keyspaces.send(new GetKeyspaceCommand({ keyspaceName })),
      keyspaces.send(new ListTablesCommand({ keyspaceName })).catch(() => ({ tables: [] })),
    ]);

    const arn = detailRes.resourceArn || "";
    let tags: Record<string, string> = {};
    if (arn) {
      try {
        const tagRes = await keyspaces.send(new ListTagsForResourceCommand({ resourceArn: arn }));
        for (const t of tagRes.tags || []) {
          if (t.key) tags[t.key] = t.value || "";
        }
      } catch { /* ignore tag fetch errors */ }
    }

    const tables: TableSummary[] = (tablesRes.tables || []).map((t) => ({
      keyspaceName: t.keyspaceName || keyspaceName,
      tableName: t.tableName || "",
      resourceArn: t.resourceArn || "",
    }));

    const isSystem = keyspaceName.startsWith("system") || keyspaceName.startsWith("system_");

    const detail: KeyspaceDetail = {
      keyspaceName: detailRes.keyspaceName || keyspaceName,
      resourceArn: arn,
      replicationStrategy: detailRes.replicationStrategy || "SINGLE_REGION",
      replicationRegions: detailRes.replicationRegions,
      tablesCount: tables.length,
      tags,
      isSystem,
    };

    return { keyspace: detail, tables };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to get keyspace details";
    return { error: errorMsg };
  }
}

/**
 * Create a new keyspace
 */
export async function createKeyspaceAction(input: {
  keyspaceName: string;
  replicationStrategy?: "SINGLE_REGION" | "MULTI_REGION";
  replicationRegions?: string[];
  tags?: Record<string, string>;
}): Promise<{
  success: boolean;
  arn?: string;
  error?: string;
}> {
  try {
    const tagsArray = input.tags
      ? Object.entries(input.tags).map(([key, value]) => ({ key, value }))
      : undefined;

    const res = await keyspaces.send(
      new CreateKeyspaceCommand({
        keyspaceName: input.keyspaceName.trim(),
        replicationSpecification: input.replicationStrategy
          ? {
              replicationStrategy: input.replicationStrategy,
              regionList: input.replicationRegions,
            }
          : undefined,
        tags: tagsArray,
      })
    );

    revalidatePath("/keyspaces");
    return { success: true, arn: res.resourceArn };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create keyspace";
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a keyspace
 */
export async function deleteKeyspaceAction(keyspaceName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await keyspaces.send(new DeleteKeyspaceCommand({ keyspaceName }));
    revalidatePath("/keyspaces");
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete keyspace";
    return { success: false, error: errorMsg };
  }
}

/**
 * List tables in a keyspace
 */
export async function listTablesAction(keyspaceName: string): Promise<{
  tables: TableSummary[];
  error?: string;
}> {
  try {
    const res = await keyspaces.send(new ListTablesCommand({ keyspaceName }));
    const tables: TableSummary[] = (res.tables || []).map((t) => ({
      keyspaceName: t.keyspaceName || keyspaceName,
      tableName: t.tableName || "",
      resourceArn: t.resourceArn || "",
    }));
    return { tables };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to list tables";
    return { tables: [], error: errorMsg };
  }
}

/**
 * Get details for a table in a keyspace
 */
export async function getTableAction(
  keyspaceName: string,
  tableName: string
): Promise<{
  table?: TableDetail;
  error?: string;
}> {
  try {
    const res = await keyspaces.send(new GetTableCommand({ keyspaceName, tableName }));
    const arn = res.resourceArn || "";

    let tags: Record<string, string> = {};
    if (arn) {
      try {
        const tagRes = await keyspaces.send(new ListTagsForResourceCommand({ resourceArn: arn }));
        for (const t of tagRes.tags || []) {
          if (t.key) tags[t.key] = t.value || "";
        }
      } catch { /* ignore */ }
    }

    const schema: SchemaDefinition = {
      allColumns: (res.schemaDefinition?.allColumns || []).map((c) => ({
        name: c.name || "",
        type: c.type || "text",
      })),
      partitionKeys: (res.schemaDefinition?.partitionKeys || []).map((k) => ({
        name: k.name || "",
      })),
      clusteringKeys: (res.schemaDefinition?.clusteringKeys || []).map((k) => ({
        name: k.name || "",
        orderBy: (k.orderBy as "ASC" | "DESC") || "ASC",
      })),
      staticColumns: (res.schemaDefinition?.staticColumns || []).map((s) => ({
        name: s.name || "",
      })),
    };

    const capacity: CapacitySpecification = {
      throughputMode: res.capacitySpecification?.throughputMode || "PAY_PER_REQUEST",
      readCapacityUnits: res.capacitySpecification?.readCapacityUnits,
      writeCapacityUnits: res.capacitySpecification?.writeCapacityUnits,
      lastUpdateToPayPerRequestTimestamp: res.capacitySpecification?.lastUpdateToPayPerRequestTimestamp?.toISOString(),
    };

    const encryption: EncryptionSpecification = {
      type: res.encryptionSpecification?.type || "AWS_OWNED_KMS_KEY",
      kmsKeyIdentifier: res.encryptionSpecification?.kmsKeyIdentifier,
    };

    const pitr: PointInTimeRecovery = {
      status: res.pointInTimeRecovery?.status || "DISABLED",
      earliestRestorableTimestamp: res.pointInTimeRecovery?.earliestRestorableTimestamp?.toISOString(),
    };

    const detail: TableDetail = {
      keyspaceName: res.keyspaceName || keyspaceName,
      tableName: res.tableName || tableName,
      resourceArn: arn,
      creationTimestamp: res.creationTimestamp?.toISOString(),
      status: res.status || "ACTIVE",
      schemaDefinition: schema,
      capacitySpecification: capacity,
      encryptionSpecification: encryption,
      pointInTimeRecovery: pitr,
      defaultTimeToLive: res.defaultTimeToLive || 0,
      comment: { message: res.comment?.message },
      tags,
    };

    return { table: detail };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to get table details";
    return { error: errorMsg };
  }
}

/**
 * Create a new Cassandra table in a keyspace
 */
export async function createTableAction(input: {
  keyspaceName: string;
  tableName: string;
  schemaDefinition: SchemaDefinition;
  capacitySpecification?: {
    throughputMode: "PAY_PER_REQUEST" | "PROVISIONED";
    readCapacityUnits?: number;
    writeCapacityUnits?: number;
  };
  encryptionSpecification?: {
    type: "AWS_OWNED_KMS_KEY" | "CUSTOMER_MANAGED_KMS_KEY";
    kmsKeyIdentifier?: string;
  };
  pointInTimeRecovery?: {
    status: "ENABLED" | "DISABLED";
  };
  defaultTimeToLive?: number;
  comment?: string;
  tags?: Record<string, string>;
}): Promise<{
  success: boolean;
  arn?: string;
  error?: string;
}> {
  try {
    const tagsArray = input.tags
      ? Object.entries(input.tags).map(([key, value]) => ({ key, value }))
      : undefined;

    const res = await keyspaces.send(
      new CreateTableCommand({
        keyspaceName: input.keyspaceName.trim(),
        tableName: input.tableName.trim(),
        schemaDefinition: {
          allColumns: input.schemaDefinition.allColumns.map((c) => ({
            name: c.name.trim(),
            type: c.type.trim(),
          })),
          partitionKeys: input.schemaDefinition.partitionKeys.map((p) => ({
            name: p.name.trim(),
          })),
          clusteringKeys: input.schemaDefinition.clusteringKeys.map((ck) => ({
            name: ck.name.trim(),
            orderBy: ck.orderBy,
          })),
        },
        capacitySpecification: input.capacitySpecification
          ? {
              throughputMode: input.capacitySpecification.throughputMode,
              readCapacityUnits: input.capacitySpecification.readCapacityUnits,
              writeCapacityUnits: input.capacitySpecification.writeCapacityUnits,
            }
          : undefined,
        encryptionSpecification: input.encryptionSpecification
          ? {
              type: input.encryptionSpecification.type,
              kmsKeyIdentifier: input.encryptionSpecification.kmsKeyIdentifier,
            }
          : undefined,
        pointInTimeRecovery: input.pointInTimeRecovery
          ? {
              status: input.pointInTimeRecovery.status,
            }
          : undefined,
        defaultTimeToLive: input.defaultTimeToLive,
        comment: input.comment ? { message: input.comment } : undefined,
        tags: tagsArray,
      })
    );

    revalidatePath(`/keyspaces/${input.keyspaceName}`);
    return { success: true, arn: res.resourceArn };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create table";
    return { success: false, error: errorMsg };
  }
}

/**
 * Update table capacity, TTL, or PITR settings
 */
export async function updateTableAction(input: {
  keyspaceName: string;
  tableName: string;
  addColumns?: ColumnDefinition[];
  capacitySpecification?: {
    throughputMode: "PAY_PER_REQUEST" | "PROVISIONED";
    readCapacityUnits?: number;
    writeCapacityUnits?: number;
  };
  encryptionSpecification?: {
    type: "AWS_OWNED_KMS_KEY" | "CUSTOMER_MANAGED_KMS_KEY";
    kmsKeyIdentifier?: string;
  };
  pointInTimeRecovery?: {
    status: "ENABLED" | "DISABLED";
  };
  defaultTimeToLive?: number;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await keyspaces.send(
      new UpdateTableCommand({
        keyspaceName: input.keyspaceName,
        tableName: input.tableName,
        addColumns: input.addColumns?.map((c) => ({
          name: c.name.trim(),
          type: c.type.trim(),
        })),
        capacitySpecification: input.capacitySpecification
          ? {
              throughputMode: input.capacitySpecification.throughputMode,
              readCapacityUnits: input.capacitySpecification.readCapacityUnits,
              writeCapacityUnits: input.capacitySpecification.writeCapacityUnits,
            }
          : undefined,
        encryptionSpecification: input.encryptionSpecification
          ? {
              type: input.encryptionSpecification.type,
              kmsKeyIdentifier: input.encryptionSpecification.kmsKeyIdentifier,
            }
          : undefined,
        pointInTimeRecovery: input.pointInTimeRecovery
          ? {
              status: input.pointInTimeRecovery.status,
            }
          : undefined,
        defaultTimeToLive: input.defaultTimeToLive,
      })
    );

    revalidatePath(`/keyspaces/${input.keyspaceName}/tables/${input.tableName}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update table";
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete a table from a keyspace
 */
export async function deleteTableAction(
  keyspaceName: string,
  tableName: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await keyspaces.send(new DeleteTableCommand({ keyspaceName, tableName }));
    revalidatePath(`/keyspaces/${keyspaceName}`);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete table";
    return { success: false, error: errorMsg };
  }
}

/**
 * Retrieve real KMS Customer Managed Keys for table encryption dropdown
 */
export async function getKmsKeysAction(): Promise<KmsKeyOption[]> {
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

    const keyList = keysRes.Keys || [];
    const result: KmsKeyOption[] = [];
    for (const k of keyList) {
      try {
        const desc = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        if (desc.KeyMetadata?.KeyManager === "CUSTOMER") {
          result.push({
            KeyId: k.KeyId || "",
            KeyArn: desc.KeyMetadata.Arn || "",
            AliasName: aliasMap.get(k.KeyId || ""),
          });
        }
      } catch {
        // ignore individual key lookup failure
      }
    }

    return result;
  } catch {
    return [];
  }
}
