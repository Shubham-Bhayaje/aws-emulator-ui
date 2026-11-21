"use server";

import { dynamodb, kms, lambda, s3 } from "@/lib/aws";
import {
  ListTablesCommand,
  DescribeTableCommand,
  CreateTableCommand,
  UpdateTableCommand,
  DeleteTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  ScanCommand,
  QueryCommand,
  DescribeTimeToLiveCommand,
  UpdateTimeToLiveCommand,
  DescribeContinuousBackupsCommand,
  UpdateContinuousBackupsCommand,
  CreateBackupCommand,
  ListBackupsCommand,
  DeleteBackupCommand,
  RestoreTableFromBackupCommand,
  ListTagsOfResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ScalarAttributeType,
  KeyType,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { ListAliasesCommand, ListKeysCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import {
  TableSummary,
  TableDetail,
  KeySchemaElement,
  AttributeDefinition,
  GlobalSecondaryIndexSummary,
  LocalSecondaryIndexSummary,
  BackupSummary,
  ScannedItem,
  KmsKeyOption,
  LambdaFunctionOption,
  S3BucketOption,
} from "./types";
import { unmarshalAttribute, marshalAttribute, plainToAttributeValue } from "./dynamo-utils";

function formatAttributeType(type?: string): string {
  switch (type) {
    case "S":
      return "String";
    case "N":
      return "Number";
    case "B":
      return "Binary";
    default:
      return type || "Unknown";
  }
}

// 1. List all DynamoDB tables
export async function listTablesAction(): Promise<{
  tables: TableSummary[];
  totalItemCount: number;
  totalSizeBytes: number;
  error?: string;
}> {
  try {
    const listRes = await dynamodb.send(new ListTablesCommand({}));
    const tableNames = listRes.TableNames ?? [];

    let totalItemCount = 0;
    let totalSizeBytes = 0;

    const tables: TableSummary[] = await Promise.all(
      tableNames.map(async (name) => {
        try {
          const descRes = await dynamodb.send(
            new DescribeTableCommand({ TableName: name })
          );
          const t = descRes.Table;

          const partitionKeyDef = t?.KeySchema?.find((k) => k.KeyType === "HASH");
          const sortKeyDef = t?.KeySchema?.find((k) => k.KeyType === "RANGE");

          const pAttr = t?.AttributeDefinitions?.find(
            (a) => a.AttributeName === partitionKeyDef?.AttributeName
          );
          const sAttr = t?.AttributeDefinitions?.find(
            (a) => a.AttributeName === sortKeyDef?.AttributeName
          );

          const itemCount = t?.ItemCount ?? 0;
          const sizeBytes = t?.TableSizeBytes ?? 0;
          totalItemCount += itemCount;
          totalSizeBytes += sizeBytes;

          return {
            name,
            arn: t?.TableArn || `arn:aws:dynamodb:us-east-1:000000000000:table/${name}`,
            status: t?.TableStatus || "ACTIVE",
            partitionKey: partitionKeyDef?.AttributeName || "id",
            partitionKeyType: formatAttributeType(pAttr?.AttributeType),
            sortKey: sortKeyDef?.AttributeName,
            sortKeyType: sAttr ? formatAttributeType(sAttr.AttributeType) : undefined,
            itemCount,
            sizeBytes,
            creationDateTime: t?.CreationDateTime
              ? new Date(t.CreationDateTime).toISOString()
              : undefined,
            billingMode: t?.BillingModeSummary?.BillingMode === "PAY_PER_REQUEST" ? "PAY_PER_REQUEST" : "PROVISIONED",
            readCapacityUnits: t?.ProvisionedThroughput?.ReadCapacityUnits,
            writeCapacityUnits: t?.ProvisionedThroughput?.WriteCapacityUnits,
            deletionProtection: t?.DeletionProtectionEnabled,
          };
        } catch {
          return {
            name,
            arn: `arn:aws:dynamodb:us-east-1:000000000000:table/${name}`,
            status: "UNKNOWN",
            partitionKey: "id",
            partitionKeyType: "String",
            itemCount: 0,
            sizeBytes: 0,
            billingMode: "PAY_PER_REQUEST",
          };
        }
      })
    );

    return { tables, totalItemCount, totalSizeBytes };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { tables: [], totalItemCount: 0, totalSizeBytes: 0, error: msg };
  }
}

// 2. Get full details for a single table
export async function getTableDetailAction(tableName: string): Promise<{
  table?: TableDetail;
  error?: string;
}> {
  try {
    const descRes = await dynamodb.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    const t = descRes.Table;
    if (!t) {
      return { error: `Table '${tableName}' not found.` };
    }

    const partitionKeyDef = t.KeySchema?.find((k) => k.KeyType === "HASH");
    const sortKeyDef = t.KeySchema?.find((k) => k.KeyType === "RANGE");

    const pAttr = t.AttributeDefinitions?.find(
      (a) => a.AttributeName === partitionKeyDef?.AttributeName
    );
    const sAttr = t.AttributeDefinitions?.find(
      (a) => a.AttributeName === sortKeyDef?.AttributeName
    );

    // Fetch TTL
    let timeToLive: TableDetail["timeToLive"];
    try {
      const ttlRes = await dynamodb.send(
        new DescribeTimeToLiveCommand({ TableName: tableName })
      );
      if (ttlRes.TimeToLiveDescription) {
        timeToLive = {
          TimeToLiveStatus: (ttlRes.TimeToLiveDescription.TimeToLiveStatus as any) || "DISABLED",
          AttributeName: ttlRes.TimeToLiveDescription.AttributeName,
        };
      }
    } catch { /* ignore */ }

    // Fetch Continuous Backups (PITR)
    let continuousBackups: TableDetail["continuousBackups"];
    try {
      const pitrRes = await dynamodb.send(
        new DescribeContinuousBackupsCommand({ TableName: tableName })
      );
      if (pitrRes.ContinuousBackupsDescription) {
        continuousBackups = {
          ContinuousBackupsStatus: (pitrRes.ContinuousBackupsDescription.ContinuousBackupsStatus as any) || "DISABLED",
          PointInTimeRecoveryStatus: pitrRes.ContinuousBackupsDescription.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus as any,
          EarliestRestorableDateTime: pitrRes.ContinuousBackupsDescription.PointInTimeRecoveryDescription?.EarliestRestorableDateTime?.toISOString(),
          LatestRestorableDateTime: pitrRes.ContinuousBackupsDescription.PointInTimeRecoveryDescription?.LatestRestorableDateTime?.toISOString(),
        };
      }
    } catch { /* ignore */ }

    // Fetch Tags
    let tags: { Key: string; Value: string }[] = [];
    try {
      if (t.TableArn) {
        const tagRes = await dynamodb.send(
          new ListTagsOfResourceCommand({ ResourceArn: t.TableArn })
        );
        tags = (tagRes.Tags || []).map((tg) => ({ Key: tg.Key || "", Value: tg.Value || "" }));
      }
    } catch { /* ignore */ }

    const keySchema: KeySchemaElement[] = (t.KeySchema || []).map((k) => {
      const attr = t.AttributeDefinitions?.find((a) => a.AttributeName === k.AttributeName);
      return {
        AttributeName: k.AttributeName || "",
        KeyType: (k.KeyType as "HASH" | "RANGE") || "HASH",
        AttributeType: formatAttributeType(attr?.AttributeType),
      };
    });

    const attributeDefinitions: AttributeDefinition[] = (t.AttributeDefinitions || []).map((a) => ({
      AttributeName: a.AttributeName || "",
      AttributeType: (a.AttributeType as "S" | "N" | "B") || "S",
    }));

    const globalSecondaryIndexes: GlobalSecondaryIndexSummary[] = (t.GlobalSecondaryIndexes || []).map((g) => ({
      IndexName: g.IndexName || "",
      KeySchema: (g.KeySchema || []).map((k) => ({
        AttributeName: k.AttributeName || "",
        KeyType: (k.KeyType as "HASH" | "RANGE") || "HASH",
      })),
      ProjectionType: (g.Projection?.ProjectionType as any) || "ALL",
      NonKeyAttributes: g.Projection?.NonKeyAttributes,
      IndexStatus: (g.IndexStatus as any) || "ACTIVE",
      ItemCount: g.ItemCount,
      IndexSizeBytes: g.IndexSizeBytes,
      ProvisionedThroughput: g.ProvisionedThroughput ? {
        ReadCapacityUnits: g.ProvisionedThroughput.ReadCapacityUnits || 0,
        WriteCapacityUnits: g.ProvisionedThroughput.WriteCapacityUnits || 0,
      } : undefined,
    }));

    const localSecondaryIndexes: LocalSecondaryIndexSummary[] = (t.LocalSecondaryIndexes || []).map((l) => ({
      IndexName: l.IndexName || "",
      KeySchema: (l.KeySchema || []).map((k) => ({
        AttributeName: k.AttributeName || "",
        KeyType: (k.KeyType as "HASH" | "RANGE") || "HASH",
      })),
      ProjectionType: (l.Projection?.ProjectionType as any) || "ALL",
      NonKeyAttributes: l.Projection?.NonKeyAttributes,
      ItemCount: l.ItemCount,
      IndexSizeBytes: l.IndexSizeBytes,
    }));

    const table: TableDetail = {
      name: tableName,
      arn: t.TableArn || `arn:aws:dynamodb:us-east-1:000000000000:table/${tableName}`,
      status: t.TableStatus || "ACTIVE",
      partitionKey: partitionKeyDef?.AttributeName || "id",
      partitionKeyType: formatAttributeType(pAttr?.AttributeType),
      sortKey: sortKeyDef?.AttributeName,
      sortKeyType: sAttr ? formatAttributeType(sAttr.AttributeType) : undefined,
      itemCount: t.ItemCount ?? 0,
      sizeBytes: t.TableSizeBytes ?? 0,
      creationDateTime: t.CreationDateTime ? new Date(t.CreationDateTime).toISOString() : undefined,
      billingMode: t.BillingModeSummary?.BillingMode === "PAY_PER_REQUEST" ? "PAY_PER_REQUEST" : "PROVISIONED",
      readCapacityUnits: t.ProvisionedThroughput?.ReadCapacityUnits,
      writeCapacityUnits: t.ProvisionedThroughput?.WriteCapacityUnits,
      deletionProtection: t.DeletionProtectionEnabled,
      keySchema,
      attributeDefinitions,
      globalSecondaryIndexes,
      localSecondaryIndexes,
      sseDescription: t.SSEDescription ? {
        Status: t.SSEDescription.Status,
        SSEType: t.SSEDescription.SSEType as any,
        KMSMasterKeyArn: t.SSEDescription.KMSMasterKeyArn,
      } : undefined,
      timeToLive,
      continuousBackups,
      streamSpecification: t.StreamSpecification ? {
        StreamEnabled: t.StreamSpecification.StreamEnabled || false,
        StreamViewType: t.StreamSpecification.StreamViewType as any,
        LatestStreamArn: t.LatestStreamArn,
      } : undefined,
      tags,
    };

    return { table };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// 3. Create a new DynamoDB table
export async function createTableAction(input: {
  tableName: string;
  partitionKeyName: string;
  partitionKeyType: "S" | "N" | "B";
  hasSortKey?: boolean;
  sortKeyName?: string;
  sortKeyType?: "S" | "N" | "B";
  billingMode?: "PAY_PER_REQUEST" | "PROVISIONED";
  readCapacityUnits?: number;
  writeCapacityUnits?: number;
  deletionProtection?: boolean;
  sseType?: "DEFAULT" | "KMS";
  kmsMasterKeyId?: string;
  tags?: { Key: string; Value: string }[];
}): Promise<{ success: boolean; tableName?: string; error?: string }> {
  const {
    tableName,
    partitionKeyName,
    partitionKeyType,
    hasSortKey,
    sortKeyName,
    sortKeyType,
    billingMode = "PAY_PER_REQUEST",
    readCapacityUnits = 5,
    writeCapacityUnits = 5,
    deletionProtection = false,
    sseType = "DEFAULT",
    kmsMasterKeyId,
    tags = [],
  } = input;

  if (!tableName?.trim()) {
    return { success: false, error: "Table name is required." };
  }
  if (!partitionKeyName?.trim()) {
    return { success: false, error: "Partition key name is required." };
  }
  if (hasSortKey && !sortKeyName?.trim()) {
    return { success: false, error: "Sort key name is required when sort key is enabled." };
  }

  const attributeDefinitions = [
    {
      AttributeName: partitionKeyName.trim(),
      AttributeType: partitionKeyType as ScalarAttributeType,
    },
  ];

  const keySchema = [
    {
      AttributeName: partitionKeyName.trim(),
      KeyType: "HASH" as KeyType,
    },
  ];

  if (hasSortKey && sortKeyName?.trim()) {
    attributeDefinitions.push({
      AttributeName: sortKeyName.trim(),
      AttributeType: (sortKeyType || "S") as ScalarAttributeType,
    });
    keySchema.push({
      AttributeName: sortKeyName.trim(),
      KeyType: "RANGE" as KeyType,
    });
  }

  try {
    await dynamodb.send(
      new CreateTableCommand({
        TableName: tableName.trim(),
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        BillingMode: billingMode,
        ...(billingMode === "PROVISIONED"
          ? {
              ProvisionedThroughput: {
                ReadCapacityUnits: readCapacityUnits,
                WriteCapacityUnits: writeCapacityUnits,
              },
            }
          : {}),
        DeletionProtectionEnabled: deletionProtection,
        ...(sseType === "KMS"
          ? {
              SSESpecification: {
                Enabled: true,
                SSEType: "KMS",
                KMSMasterKeyId: kmsMasterKeyId || undefined,
              },
            }
          : {}),
        ...(tags.length > 0
          ? {
              Tags: tags.map((t) => ({ Key: t.Key.trim(), Value: t.Value.trim() })),
            }
          : {}),
      })
    );

    revalidatePath("/dynamodb");
    revalidatePath("/dynamodb/tables");
    return { success: true, tableName: tableName.trim() };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 4. Update Table (Capacity, Deletion Protection, Streams)
export async function updateTableAction(input: {
  tableName: string;
  billingMode?: "PAY_PER_REQUEST" | "PROVISIONED";
  readCapacityUnits?: number;
  writeCapacityUnits?: number;
  deletionProtection?: boolean;
  streamEnabled?: boolean;
  streamViewType?: "NEW_IMAGE" | "OLD_IMAGE" | "NEW_AND_OLD_IMAGES" | "KEYS_ONLY";
}): Promise<{ success: boolean; error?: string }> {
  const {
    tableName,
    billingMode,
    readCapacityUnits,
    writeCapacityUnits,
    deletionProtection,
    streamEnabled,
    streamViewType,
  } = input;

  try {
    const cmdInput: any = { TableName: tableName };

    if (billingMode) {
      cmdInput.BillingMode = billingMode;
      if (billingMode === "PROVISIONED") {
        cmdInput.ProvisionedThroughput = {
          ReadCapacityUnits: readCapacityUnits || 5,
          WriteCapacityUnits: writeCapacityUnits || 5,
        };
      }
    } else if (readCapacityUnits !== undefined && writeCapacityUnits !== undefined) {
      cmdInput.ProvisionedThroughput = {
        ReadCapacityUnits: readCapacityUnits,
        WriteCapacityUnits: writeCapacityUnits,
      };
    }

    if (deletionProtection !== undefined) {
      cmdInput.DeletionProtectionEnabled = deletionProtection;
    }

    if (streamEnabled !== undefined) {
      cmdInput.StreamSpecification = {
        StreamEnabled: streamEnabled,
        ...(streamEnabled ? { StreamViewType: streamViewType || "NEW_AND_OLD_IMAGES" } : {}),
      };
    }

    await dynamodb.send(new UpdateTableCommand(cmdInput));
    revalidatePath("/dynamodb");
    revalidatePath("/dynamodb/tables");
    revalidatePath(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 5. Delete a DynamoDB table
export async function deleteTableAction(tableName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dynamodb.send(new DeleteTableCommand({ TableName: tableName }));
    revalidatePath("/dynamodb");
    revalidatePath("/dynamodb/tables");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 6. Scan Table Items
export async function scanTableAction(input: {
  tableName: string;
  limit?: number;
  filterExpression?: string;
  filterValues?: Record<string, any>;
}): Promise<{
  items: ScannedItem[];
  count: number;
  scannedCount: number;
  error?: string;
}> {
  const { tableName, limit = 50, filterExpression, filterValues } = input;

  try {
    const cmdInput: any = {
      TableName: tableName,
      Limit: limit,
    };

    if (filterExpression?.trim() && filterValues && Object.keys(filterValues).length > 0) {
      cmdInput.FilterExpression = filterExpression.trim();
      const expressionAttributeValues: Record<string, AttributeValue> = {};
      for (const [k, v] of Object.entries(filterValues)) {
        expressionAttributeValues[k] = plainToAttributeValue(v);
      }
      cmdInput.ExpressionAttributeValues = expressionAttributeValues;
    }

    const res = await dynamodb.send(new ScanCommand(cmdInput));
    const rawItems = res.Items || [];

    const items: ScannedItem[] = rawItems.map((raw) => {
      const parsed: ScannedItem = {};
      for (const [k, v] of Object.entries(raw)) {
        parsed[k] = unmarshalAttribute(v);
      }
      return parsed;
    });

    return {
      items,
      count: res.Count || 0,
      scannedCount: res.ScannedCount || 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { items: [], count: 0, scannedCount: 0, error: msg };
  }
}

// 7. Query Table Items
export async function queryTableAction(input: {
  tableName: string;
  indexName?: string;
  keyConditionExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues: Record<string, any>;
  limit?: number;
}): Promise<{
  items: ScannedItem[];
  count: number;
  error?: string;
}> {
  const {
    tableName,
    indexName,
    keyConditionExpression,
    expressionAttributeNames,
    expressionAttributeValues,
    limit = 50,
  } = input;

  try {
    const exprValues: Record<string, AttributeValue> = {};
    for (const [k, v] of Object.entries(expressionAttributeValues)) {
      exprValues[k] = plainToAttributeValue(v);
    }

    const cmdInput: any = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: exprValues,
      Limit: limit,
      ...(indexName ? { IndexName: indexName } : {}),
      ...(expressionAttributeNames ? { ExpressionAttributeNames: expressionAttributeNames } : {}),
    };

    const res = await dynamodb.send(new QueryCommand(cmdInput));
    const rawItems = res.Items || [];

    const items: ScannedItem[] = rawItems.map((raw) => {
      const parsed: ScannedItem = {};
      for (const [k, v] of Object.entries(raw)) {
        parsed[k] = unmarshalAttribute(v);
      }
      return parsed;
    });

    return { items, count: res.Count || 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { items: [], count: 0, error: msg };
  }
}

// 8. Put Item (Form attributes or plain JSON)
export async function putItemAction(
  tableName: string,
  payload: { name: string; type: string; value: string }[] | Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const item: Record<string, AttributeValue> = {};

    if (Array.isArray(payload)) {
      for (const attr of payload) {
        const name = attr.name.trim();
        if (!name) continue;
        item[name] = marshalAttribute(attr.type, attr.value);
      }
    } else {
      for (const [k, v] of Object.entries(payload)) {
        if (!k.trim()) continue;
        item[k.trim()] = plainToAttributeValue(v);
      }
    }

    if (Object.keys(item).length === 0) {
      return { success: false, error: "Item cannot be empty." };
    }

    await dynamodb.send(
      new PutItemCommand({
        TableName: tableName,
        Item: item,
      })
    );

    revalidatePath(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
    revalidatePath("/dynamodb/explore");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 9. Delete Item given primary key
export async function deleteItemAction(
  tableName: string,
  keyAttributes: { name: string; type: string; value: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const key: Record<string, AttributeValue> = {};
    for (const k of keyAttributes) {
      key[k.name.trim()] = marshalAttribute(k.type, k.value);
    }

    await dynamodb.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: key,
      })
    );

    revalidatePath(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
    revalidatePath("/dynamodb/explore");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 10. Update Time to Live (TTL)
export async function updateTimeToLiveAction(
  tableName: string,
  enabled: boolean,
  attributeName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dynamodb.send(
      new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: {
          Enabled: enabled,
          AttributeName: attributeName?.trim() || "ttl",
        },
      })
    );

    revalidatePath(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 11. Update Continuous Backups (Point-in-Time Recovery - PITR)
export async function updateContinuousBackupsAction(
  tableName: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await dynamodb.send(
      new UpdateContinuousBackupsCommand({
        TableName: tableName,
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: enabled,
        },
      })
    );

    revalidatePath(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 12. Create Backup
export async function createBackupAction(
  tableName: string,
  backupName: string
): Promise<{ success: boolean; backupArn?: string; error?: string }> {
  if (!backupName?.trim()) {
    return { success: false, error: "Backup name is required." };
  }

  try {
    const res = await dynamodb.send(
      new CreateBackupCommand({
        TableName: tableName,
        BackupName: backupName.trim(),
      })
    );

    revalidatePath(`/dynamodb/tables/${encodeURIComponent(tableName)}`);
    revalidatePath("/dynamodb/backups");
    return {
      success: true,
      backupArn: res.BackupDetails?.BackupArn,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 13. List Backups
export async function listBackupsAction(tableName?: string): Promise<{
  backups: BackupSummary[];
  error?: string;
}> {
  try {
    const res = await dynamodb.send(
      new ListBackupsCommand({
        ...(tableName ? { TableName: tableName } : {}),
      })
    );

    const backups: BackupSummary[] = (res.BackupSummaries || []).map((b) => ({
      BackupArn: b.BackupArn || "",
      BackupName: b.BackupName || "",
      BackupSizeBytes: b.BackupSizeBytes || 0,
      BackupStatus: (b.BackupStatus as any) || "AVAILABLE",
      BackupType: (b.BackupType as any) || "USER",
      BackupCreationDateTime: b.BackupCreationDateTime ? new Date(b.BackupCreationDateTime).toISOString() : new Date().toISOString(),
      TableName: b.TableName || "",
      TableArn: b.TableArn || "",
      TableId: b.TableId,
    }));

    return { backups };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { backups: [], error: msg };
  }
}

// 14. Delete Backup
export async function deleteBackupAction(backupArn: string): Promise<{ success: boolean; error?: string }> {
  try {
    await dynamodb.send(new DeleteBackupCommand({ BackupArn: backupArn }));
    revalidatePath("/dynamodb/backups");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 15. Restore Table from Backup
export async function restoreTableFromBackupAction(
  targetTableName: string,
  backupArn: string
): Promise<{ success: boolean; error?: string }> {
  if (!targetTableName?.trim()) {
    return { success: false, error: "Target table name is required." };
  }

  try {
    await dynamodb.send(
      new RestoreTableFromBackupCommand({
        TargetTableName: targetTableName.trim(),
        BackupArn: backupArn,
      })
    );

    revalidatePath("/dynamodb");
    revalidatePath("/dynamodb/tables");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 16. Tag Resource
export async function tagResourceAction(
  resourceArn: string,
  tags: { Key: string; Value: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await dynamodb.send(
      new TagResourceCommand({
        ResourceArn: resourceArn,
        Tags: tags.map((t) => ({ Key: t.Key.trim(), Value: t.Value.trim() })),
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 17. Untag Resource
export async function untagResourceAction(
  resourceArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await dynamodb.send(
      new UntagResourceCommand({
        ResourceArn: resourceArn,
        TagKeys: tagKeys,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 18. Fetch real KMS keys for table encryption dropdown
export async function getKmsKeysAction(): Promise<KmsKeyOption[]> {
  try {
    const keysRes = await kms.send(new ListKeysCommand({ Limit: 100 }));
    const aliasesRes = await kms.send(new ListAliasesCommand({ Limit: 100 }));

    const aliasMap = new Map<string, string>();
    for (const a of aliasesRes.Aliases || []) {
      if (a.TargetKeyId && a.AliasName) {
        aliasMap.set(a.TargetKeyId, a.AliasName);
      }
    }

    const keyOptions: KmsKeyOption[] = [];
    for (const k of keysRes.Keys || []) {
      if (!k.KeyId) continue;
      try {
        const descRes = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        const meta = descRes.KeyMetadata;
        if (meta && meta.Enabled && meta.KeyState === "Enabled") {
          keyOptions.push({
            KeyId: meta.KeyId || k.KeyId,
            Arn: meta.Arn || k.KeyArn || "",
            AliasName: aliasMap.get(k.KeyId),
            Description: meta.Description,
          });
        }
      } catch { /* skip inaccessible keys */ }
    }
    return keyOptions;
  } catch {
    return [];
  }
}

// 19. Fetch real Lambda functions for Streams trigger selector
export async function getLambdaFunctionsAction(): Promise<LambdaFunctionOption[]> {
  try {
    const res = await lambda.send(new ListFunctionsCommand({}));
    return (res.Functions || []).map((f) => ({
      FunctionName: f.FunctionName || "",
      FunctionArn: f.FunctionArn || "",
      Runtime: f.Runtime,
      Handler: f.Handler,
    }));
  } catch {
    return [];
  }
}

// 20. Fetch real S3 Buckets for S3 export selector
export async function getS3BucketsAction(): Promise<S3BucketOption[]> {
  try {
    const res = await s3.send(new ListBucketsCommand({}));
    return (res.Buckets || []).map((b) => ({
      Name: b.Name || "",
      CreationDate: b.CreationDate ? new Date(b.CreationDate).toISOString() : undefined,
    }));
  } catch {
    return [];
  }
}
