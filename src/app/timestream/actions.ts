"use server";

import { timestreamWrite, kms } from "@/lib/aws";
import {
  ListDatabasesCommand,
  CreateDatabaseCommand,
  DescribeDatabaseCommand,
  DeleteDatabaseCommand,
  ListTablesCommand,
  CreateTableCommand,
  DescribeTableCommand,
  DeleteTableCommand,
  WriteRecordsCommand,
  _Record as TimestreamRecord,
} from "@aws-sdk/client-timestream-write";
import { ListKeysCommand, DescribeKeyCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { revalidatePath } from "next/cache";
import { DatabaseSummary, TableSummary, KmsKeyOption, RecordInput } from "./types";

// 1. List Databases
export async function listDatabasesAction(): Promise<{
  databases: DatabaseSummary[];
  totalTables: number;
  defaultKmsCount: number;
  customerKmsCount: number;
  error?: string;
}> {
  try {
    const res = await timestreamWrite.send(new ListDatabasesCommand({}));
    const raw = res.Databases || [];

    let totalTables = 0;
    let defaultKmsCount = 0;
    let customerKmsCount = 0;

    const databases: DatabaseSummary[] = raw.map((db) => {
      const tableCount = db.TableCount || 0;
      totalTables += tableCount;
      const kmsId = db.KmsKeyId || "";
      if (kmsId.includes("alias/aws/timestream") || !kmsId) {
        defaultKmsCount++;
      } else {
        customerKmsCount++;
      }

      return {
        Arn: db.Arn || `arn:aws:timestream:us-east-1:000000000000:database/${db.DatabaseName}`,
        DatabaseName: db.DatabaseName || "",
        TableCount: tableCount,
        KmsKeyId: db.KmsKeyId || "arn:aws:kms:us-east-1:000000000000:alias/aws/timestream",
        CreationTime: db.CreationTime ? new Date(db.CreationTime).toISOString() : undefined,
        LastUpdatedTime: db.LastUpdatedTime ? new Date(db.LastUpdatedTime).toISOString() : undefined,
      };
    });

    return {
      databases,
      totalTables,
      defaultKmsCount,
      customerKmsCount,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      databases: [],
      totalTables: 0,
      defaultKmsCount: 0,
      customerKmsCount: 0,
      error: msg,
    };
  }
}

// 2. Describe Database
export async function describeDatabaseAction(databaseName: string): Promise<{
  database?: DatabaseSummary;
  error?: string;
}> {
  try {
    const res = await timestreamWrite.send(
      new DescribeDatabaseCommand({ DatabaseName: databaseName })
    );
    const db = res.Database;
    if (!db) {
      return { error: `Database '${databaseName}' not found.` };
    }

    return {
      database: {
        Arn: db.Arn || `arn:aws:timestream:us-east-1:000000000000:database/${db.DatabaseName}`,
        DatabaseName: db.DatabaseName || databaseName,
        TableCount: db.TableCount || 0,
        KmsKeyId: db.KmsKeyId || "arn:aws:kms:us-east-1:000000000000:alias/aws/timestream",
        CreationTime: db.CreationTime ? new Date(db.CreationTime).toISOString() : undefined,
        LastUpdatedTime: db.LastUpdatedTime ? new Date(db.LastUpdatedTime).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// 3. Create Database
export async function createDatabaseAction(input: {
  databaseName: string;
  kmsKeyId?: string;
  tags?: { Key: string; Value: string }[];
}): Promise<{ success: boolean; database?: DatabaseSummary; error?: string }> {
  try {
    const name = input.databaseName.trim();
    if (!name) {
      return { success: false, error: "Database name is required." };
    }

    const res = await timestreamWrite.send(
      new CreateDatabaseCommand({
        DatabaseName: name,
        KmsKeyId: input.kmsKeyId?.trim() || undefined,
        Tags: input.tags?.filter((t) => t.Key.trim() && t.Value.trim()),
      })
    );

    const db = res.Database;
    revalidatePath("/timestream");
    revalidatePath("/timestream/databases");

    return {
      success: true,
      database: db
        ? {
            Arn: db.Arn || `arn:aws:timestream:us-east-1:000000000000:database/${db.DatabaseName}`,
            DatabaseName: db.DatabaseName || name,
            TableCount: db.TableCount || 0,
            KmsKeyId: db.KmsKeyId || "arn:aws:kms:us-east-1:000000000000:alias/aws/timestream",
            CreationTime: db.CreationTime ? new Date(db.CreationTime).toISOString() : undefined,
            LastUpdatedTime: db.LastUpdatedTime ? new Date(db.LastUpdatedTime).toISOString() : undefined,
          }
        : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 4. Delete Database
export async function deleteDatabaseAction(
  databaseName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await timestreamWrite.send(
      new DeleteDatabaseCommand({ DatabaseName: databaseName })
    );
    revalidatePath("/timestream");
    revalidatePath("/timestream/databases");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 5. List Tables in Database
export async function listTablesAction(databaseName: string): Promise<{
  tables: TableSummary[];
  error?: string;
}> {
  try {
    const res = await timestreamWrite.send(
      new ListTablesCommand({ DatabaseName: databaseName })
    );
    const raw = res.Tables || [];

    const tables: TableSummary[] = raw.map((t) => ({
      Arn: t.Arn || `arn:aws:timestream:us-east-1:000000000000:database/${databaseName}/table/${t.TableName}`,
      TableName: t.TableName || "",
      DatabaseName: t.DatabaseName || databaseName,
      TableStatus: (t.TableStatus as any) || "ACTIVE",
      RetentionProperties: t.RetentionProperties
        ? {
            MemoryStoreRetentionPeriodInHours: t.RetentionProperties.MemoryStoreRetentionPeriodInHours || 24,
            MagneticStoreRetentionPeriodInDays: t.RetentionProperties.MagneticStoreRetentionPeriodInDays || 365,
          }
        : undefined,
      MagneticStoreWriteProperties: t.MagneticStoreWriteProperties
        ? {
            EnableMagneticStoreWrites: t.MagneticStoreWriteProperties.EnableMagneticStoreWrites,
          }
        : undefined,
      CreationTime: t.CreationTime ? new Date(t.CreationTime).toISOString() : undefined,
      LastUpdatedTime: t.LastUpdatedTime ? new Date(t.LastUpdatedTime).toISOString() : undefined,
    }));

    return { tables };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { tables: [], error: msg };
  }
}

// 6. Describe Table
export async function describeTableAction(
  databaseName: string,
  tableName: string
): Promise<{ table?: TableSummary; error?: string }> {
  try {
    const res = await timestreamWrite.send(
      new DescribeTableCommand({
        DatabaseName: databaseName,
        TableName: tableName,
      })
    );
    const t = res.Table;
    if (!t) {
      return { error: `Table '${tableName}' not found in database '${databaseName}'.` };
    }

    return {
      table: {
        Arn: t.Arn || `arn:aws:timestream:us-east-1:000000000000:database/${databaseName}/table/${tableName}`,
        TableName: t.TableName || tableName,
        DatabaseName: t.DatabaseName || databaseName,
        TableStatus: (t.TableStatus as any) || "ACTIVE",
        RetentionProperties: t.RetentionProperties
          ? {
              MemoryStoreRetentionPeriodInHours: t.RetentionProperties.MemoryStoreRetentionPeriodInHours || 24,
              MagneticStoreRetentionPeriodInDays: t.RetentionProperties.MagneticStoreRetentionPeriodInDays || 365,
            }
          : undefined,
        MagneticStoreWriteProperties: t.MagneticStoreWriteProperties
          ? {
              EnableMagneticStoreWrites: t.MagneticStoreWriteProperties.EnableMagneticStoreWrites,
            }
          : undefined,
        CreationTime: t.CreationTime ? new Date(t.CreationTime).toISOString() : undefined,
        LastUpdatedTime: t.LastUpdatedTime ? new Date(t.LastUpdatedTime).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// 7. Create Table
export async function createTableAction(input: {
  databaseName: string;
  tableName: string;
  memoryStoreRetentionPeriodInHours: number;
  magneticStoreRetentionPeriodInDays: number;
  enableMagneticStoreWrites?: boolean;
  tags?: { Key: string; Value: string }[];
}): Promise<{ success: boolean; table?: TableSummary; error?: string }> {
  try {
    const dbName = input.databaseName.trim();
    const tblName = input.tableName.trim();
    if (!dbName || !tblName) {
      return { success: false, error: "Database name and table name are required." };
    }

    const res = await timestreamWrite.send(
      new CreateTableCommand({
        DatabaseName: dbName,
        TableName: tblName,
        RetentionProperties: {
          MemoryStoreRetentionPeriodInHours: input.memoryStoreRetentionPeriodInHours,
          MagneticStoreRetentionPeriodInDays: input.magneticStoreRetentionPeriodInDays,
        },
        MagneticStoreWriteProperties: input.enableMagneticStoreWrites
          ? { EnableMagneticStoreWrites: true }
          : undefined,
        Tags: input.tags?.filter((t) => t.Key.trim() && t.Value.trim()),
      })
    );

    revalidatePath(`/timestream/databases/${encodeURIComponent(dbName)}`);
    return {
      success: true,
      table: res.Table
        ? {
            Arn: res.Table.Arn || `arn:aws:timestream:us-east-1:000000000000:database/${dbName}/table/${tblName}`,
            TableName: tblName,
            DatabaseName: dbName,
            TableStatus: (res.Table.TableStatus as any) || "ACTIVE",
          }
        : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 8. Delete Table
export async function deleteTableAction(
  databaseName: string,
  tableName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await timestreamWrite.send(
      new DeleteTableCommand({
        DatabaseName: databaseName,
        TableName: tableName,
      })
    );
    revalidatePath(`/timestream/databases/${encodeURIComponent(databaseName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 9. Write Records (Live Data Ingestion)
export async function writeRecordsAction(input: {
  databaseName: string;
  tableName: string;
  records: RecordInput[];
}): Promise<{
  success: boolean;
  recordsIngested?: { Total: number; MemoryStore: number; MagneticStore: number };
  error?: string;
}> {
  try {
    const dbName = input.databaseName.trim();
    const tblName = input.tableName.trim();
    if (!dbName || !tblName) {
      return { success: false, error: "Database name and table name are required." };
    }

    if (!input.records || input.records.length === 0) {
      return { success: false, error: "At least one record is required." };
    }

    const formattedRecords: TimestreamRecord[] = input.records.map((r) => ({
      MeasureName: r.MeasureName.trim(),
      MeasureValue: r.MeasureValue.trim(),
      MeasureValueType: r.MeasureValueType,
      Time: r.Time?.trim() || String(Date.now()),
      TimeUnit: r.TimeUnit || "MILLISECONDS",
      Dimensions: (r.Dimensions || []).map((d) => ({
        Name: d.Name.trim(),
        Value: d.Value.trim(),
        DimensionValueType: "VARCHAR",
      })),
    }));

    const res = await timestreamWrite.send(
      new WriteRecordsCommand({
        DatabaseName: dbName,
        TableName: tblName,
        Records: formattedRecords,
      })
    );

    return {
      success: true,
      recordsIngested: {
        Total: res.RecordsIngested?.Total || formattedRecords.length,
        MemoryStore: res.RecordsIngested?.MemoryStore || formattedRecords.length,
        MagneticStore: res.RecordsIngested?.MagneticStore || 0,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 10. Fetch Customer KMS Keys for encryption dropdown
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

    const result: KmsKeyOption[] = [];
    for (const k of keysRes.Keys || []) {
      if (!k.KeyId) continue;
      try {
        const desc = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        const meta = desc.KeyMetadata;
        if (!meta) continue;

        // Only include ENABLED symmetric keys
        if (meta.KeyState === "Enabled" && meta.KeyManager === "CUSTOMER") {
          result.push({
            KeyId: meta.KeyId || k.KeyId,
            KeyArn: meta.Arn || k.KeyArn || "",
            AliasName: aliasMap.get(k.KeyId),
            Description: meta.Description,
          });
        }
      } catch {
        // Skip inaccessible keys
      }
    }

    return result;
  } catch {
    return [];
  }
}
