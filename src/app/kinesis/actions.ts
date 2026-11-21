"use server";

import { kinesis, kms } from "@/lib/aws";
import {
  ListStreamsCommand,
  DescribeStreamCommand,
  DescribeStreamSummaryCommand,
  CreateStreamCommand,
  DeleteStreamCommand,
  UpdateStreamModeCommand,
  UpdateShardCountCommand,
  IncreaseStreamRetentionPeriodCommand,
  DecreaseStreamRetentionPeriodCommand,
  StartStreamEncryptionCommand,
  StopStreamEncryptionCommand,
  ListShardsCommand,
  PutRecordCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
  RegisterStreamConsumerCommand,
  ListStreamConsumersCommand,
  DeregisterStreamConsumerCommand,
  ListTagsForStreamCommand,
  AddTagsToStreamCommand,
  RemoveTagsFromStreamCommand,
  EnableEnhancedMonitoringCommand,
  DisableEnhancedMonitoringCommand,
  ShardFilterType,
} from "@aws-sdk/client-kinesis";
import { ListAliasesCommand, ListKeysCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { revalidatePath } from "next/cache";
import {
  StreamSummaryItem,
  StreamDetail,
  ShardItem,
  ConsumerItem,
  RecordItem,
  KmsKeyOption,
} from "./types";

// 1. List all Kinesis data streams
export async function listStreamsAction(): Promise<{
  streams: StreamSummaryItem[];
  totalShards: number;
  onDemandCount: number;
  encryptedCount: number;
  error?: string;
}> {
  try {
    const listRes = await kinesis.send(new ListStreamsCommand({}));
    const streamNames = listRes.StreamNames || [];

    let totalShards = 0;
    let onDemandCount = 0;
    let encryptedCount = 0;

    const streams: StreamSummaryItem[] = await Promise.all(
      streamNames.map(async (name) => {
        try {
          const descSummary = await kinesis.send(
            new DescribeStreamSummaryCommand({ StreamName: name })
          );
          const s = descSummary.StreamDescriptionSummary;
          const mode = s?.StreamModeDetails?.StreamMode === "ON_DEMAND" ? "ON_DEMAND" : "PROVISIONED";
          const shards = s?.OpenShardCount || 0;
          const isEncrypted = s?.EncryptionType === "KMS";

          if (mode === "ON_DEMAND") onDemandCount++;
          else totalShards += shards;
          if (isEncrypted) encryptedCount++;

          return {
            StreamName: name,
            StreamARN: s?.StreamARN || `arn:aws:kinesis:us-east-1:000000000000:stream/${name}`,
            StreamStatus: s?.StreamStatus || "ACTIVE",
            StreamMode: mode,
            OpenShardCount: shards,
            RetentionPeriodHours: s?.RetentionPeriodHours || 24,
            EncryptionType: s?.EncryptionType || "NONE",
            KeyId: s?.KeyId,
            StreamCreationTimestamp: s?.StreamCreationTimestamp
              ? new Date(s.StreamCreationTimestamp).toISOString()
              : undefined,
            ConsumerCount: s?.ConsumerCount || 0,
          };
        } catch {
          return {
            StreamName: name,
            StreamARN: `arn:aws:kinesis:us-east-1:000000000000:stream/${name}`,
            StreamStatus: "ACTIVE",
            StreamMode: "PROVISIONED" as const,
            OpenShardCount: 1,
            RetentionPeriodHours: 24,
            EncryptionType: "NONE",
          };
        }
      })
    );

    return { streams, totalShards, onDemandCount, encryptedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { streams: [], totalShards: 0, onDemandCount: 0, encryptedCount: 0, error: msg };
  }
}

// 2. Get full details of a single stream
export async function getStreamDetailAction(streamName: string): Promise<{
  stream?: StreamDetail;
  shards: ShardItem[];
  consumers: ConsumerItem[];
  error?: string;
}> {
  try {
    const summaryRes = await kinesis.send(
      new DescribeStreamSummaryCommand({ StreamName: streamName })
    );
    const s = summaryRes.StreamDescriptionSummary;
    if (!s) {
      return { shards: [], consumers: [], error: `Stream '${streamName}' not found.` };
    }

    // List Shards
    let shards: ShardItem[] = [];
    try {
      const shardsRes = await kinesis.send(new ListShardsCommand({ StreamName: streamName }));
      shards = (shardsRes.Shards || []).map((sh) => ({
        ShardId: sh.ShardId || "",
        StartingHashKey: sh.HashKeyRange?.StartingHashKey || "0",
        EndingHashKey: sh.HashKeyRange?.EndingHashKey || "0",
        StartingSequenceNumber: sh.SequenceNumberRange?.StartingSequenceNumber || "0",
        EndingSequenceNumber: sh.SequenceNumberRange?.EndingSequenceNumber,
        ParentShardId: sh.ParentShardId,
        AdjacentParentShardId: sh.AdjacentParentShardId,
      }));
    } catch {
      // Fallback to describe stream if list-shards encounters any issue
      try {
        const descRes = await kinesis.send(new DescribeStreamCommand({ StreamName: streamName }));
        shards = (descRes.StreamDescription?.Shards || []).map((sh) => ({
          ShardId: sh.ShardId || "",
          StartingHashKey: sh.HashKeyRange?.StartingHashKey || "0",
          EndingHashKey: sh.HashKeyRange?.EndingHashKey || "0",
          StartingSequenceNumber: sh.SequenceNumberRange?.StartingSequenceNumber || "0",
          EndingSequenceNumber: sh.SequenceNumberRange?.EndingSequenceNumber,
          ParentShardId: sh.ParentShardId,
          AdjacentParentShardId: sh.AdjacentParentShardId,
        }));
      } catch {
        /* ignore */
      }
    }

    // List Consumers
    let consumers: ConsumerItem[] = [];
    if (s.StreamARN) {
      try {
        const consumersRes = await kinesis.send(
          new ListStreamConsumersCommand({ StreamARN: s.StreamARN })
        );
        consumers = (consumersRes.Consumers || []).map((c) => ({
          ConsumerName: c.ConsumerName || "",
          ConsumerARN: c.ConsumerARN || "",
          ConsumerStatus: c.ConsumerStatus || "ACTIVE",
          ConsumerCreationTimestamp: c.ConsumerCreationTimestamp
            ? new Date(c.ConsumerCreationTimestamp).toISOString()
            : undefined,
        }));
      } catch {
        /* ignore */
      }
    }

    // List Tags
    let tags: { Key: string; Value: string }[] = [];
    try {
      const tagRes = await kinesis.send(new ListTagsForStreamCommand({ StreamName: streamName }));
      tags = (tagRes.Tags || []).map((t) => ({ Key: t.Key || "", Value: t.Value || "" }));
    } catch {
      /* ignore */
    }

    const enhancedMonitoringMetrics: string[] = [];
    if (s.EnhancedMonitoring) {
      for (const em of s.EnhancedMonitoring) {
        if (em.ShardLevelMetrics) {
          enhancedMonitoringMetrics.push(...em.ShardLevelMetrics);
        }
      }
    }

    const stream: StreamDetail = {
      StreamName: streamName,
      StreamARN: s.StreamARN || `arn:aws:kinesis:us-east-1:000000000000:stream/${streamName}`,
      StreamStatus: s.StreamStatus || "ACTIVE",
      StreamMode: s.StreamModeDetails?.StreamMode === "ON_DEMAND" ? "ON_DEMAND" : "PROVISIONED",
      OpenShardCount: s.OpenShardCount || 0,
      RetentionPeriodHours: s.RetentionPeriodHours || 24,
      EncryptionType: s.EncryptionType || "NONE",
      KeyId: s.KeyId,
      StreamCreationTimestamp: s.StreamCreationTimestamp
        ? new Date(s.StreamCreationTimestamp).toISOString()
        : undefined,
      ConsumerCount: s.ConsumerCount || 0,
      EnhancedMonitoring: enhancedMonitoringMetrics,
      WarmThroughput: s.WarmThroughput
        ? {
            TargetMiBps: s.WarmThroughput.TargetMiBps,
            CurrentMiBps: s.WarmThroughput.CurrentMiBps,
          }
        : undefined,
      MaxRecordSizeInKiB: s.MaxRecordSizeInKiB,
      Tags: tags,
    };

    return { stream, shards, consumers };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { shards: [], consumers: [], error: msg };
  }
}

// 3. Create a new stream
export async function createStreamAction(input: {
  streamName: string;
  streamMode: "ON_DEMAND" | "PROVISIONED";
  shardCount?: number;
  retentionPeriodHours?: number;
  encryptionType?: "NONE" | "KMS";
  kmsKeyId?: string;
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      streamName,
      streamMode,
      shardCount = 1,
      retentionPeriodHours = 24,
      encryptionType = "NONE",
      kmsKeyId,
      tags = [],
    } = input;

    await kinesis.send(
      new CreateStreamCommand({
        StreamName: streamName,
        ShardCount: streamMode === "PROVISIONED" ? shardCount : undefined,
        StreamModeDetails: { StreamMode: streamMode },
      })
    );

    // Retention if > 24 hours
    if (retentionPeriodHours > 24) {
      try {
        await kinesis.send(
          new IncreaseStreamRetentionPeriodCommand({
            StreamName: streamName,
            RetentionPeriodHours: retentionPeriodHours,
          })
        );
      } catch {
        /* ignore */
      }
    }

    // Encryption if KMS
    if (encryptionType === "KMS") {
      try {
        await kinesis.send(
          new StartStreamEncryptionCommand({
            StreamName: streamName,
            EncryptionType: "KMS",
            KeyId: kmsKeyId || "alias/aws/kinesis",
          })
        );
      } catch {
        /* ignore */
      }
    }

    // Tags
    if (tags.length > 0) {
      const tagMap: Record<string, string> = {};
      tags.forEach((t) => {
        if (t.key.trim()) tagMap[t.key.trim()] = t.value.trim();
      });
      if (Object.keys(tagMap).length > 0) {
        try {
          await kinesis.send(
            new AddTagsToStreamCommand({
              StreamName: streamName,
              Tags: tagMap,
            })
          );
        } catch {
          /* ignore */
        }
      }
    }

    revalidatePath("/kinesis");
    revalidatePath("/kinesis/streams");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 4. Delete stream
export async function deleteStreamAction(
  streamName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await kinesis.send(new DeleteStreamCommand({ StreamName: streamName }));
    revalidatePath("/kinesis");
    revalidatePath("/kinesis/streams");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 5. Update stream mode (PROVISIONED <-> ON_DEMAND)
export async function updateStreamModeAction(
  streamARN: string,
  streamMode: "ON_DEMAND" | "PROVISIONED"
): Promise<{ success: boolean; error?: string }> {
  try {
    await kinesis.send(
      new UpdateStreamModeCommand({
        StreamARN: streamARN,
        StreamModeDetails: { StreamMode: streamMode },
      })
    );
    revalidatePath("/kinesis");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 6. Update shard count
export async function updateShardCountAction(
  streamName: string,
  targetShardCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await kinesis.send(
      new UpdateShardCountCommand({
        StreamName: streamName,
        TargetShardCount: targetShardCount,
        ScalingType: "UNIFORM_SCALING",
      })
    );
    revalidatePath(`/kinesis/streams/${encodeURIComponent(streamName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 7. Update retention period
export async function updateRetentionPeriodAction(
  streamName: string,
  currentHours: number,
  newHours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newHours > currentHours) {
      await kinesis.send(
        new IncreaseStreamRetentionPeriodCommand({
          StreamName: streamName,
          RetentionPeriodHours: newHours,
        })
      );
    } else if (newHours < currentHours) {
      await kinesis.send(
        new DecreaseStreamRetentionPeriodCommand({
          StreamName: streamName,
          RetentionPeriodHours: newHours,
        })
      );
    }
    revalidatePath(`/kinesis/streams/${encodeURIComponent(streamName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 8. Update encryption
export async function updateEncryptionAction(
  streamName: string,
  enable: boolean,
  kmsKeyId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (enable) {
      await kinesis.send(
        new StartStreamEncryptionCommand({
          StreamName: streamName,
          EncryptionType: "KMS",
          KeyId: kmsKeyId || "alias/aws/kinesis",
        })
      );
    } else {
      await kinesis.send(
        new StopStreamEncryptionCommand({
          StreamName: streamName,
          EncryptionType: "KMS",
          KeyId: kmsKeyId || "alias/aws/kinesis",
        })
      );
    }
    revalidatePath(`/kinesis/streams/${encodeURIComponent(streamName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 9. Put single record (Live data ingestion test)
export async function putRecordAction(
  streamName: string,
  partitionKey: string,
  dataString: string
): Promise<{ success: boolean; shardId?: string; sequenceNumber?: string; error?: string }> {
  try {
    const dataBuffer = Buffer.from(dataString, "utf-8");
    const res = await kinesis.send(
      new PutRecordCommand({
        StreamName: streamName,
        PartitionKey: partitionKey,
        Data: dataBuffer,
      })
    );
    revalidatePath(`/kinesis/streams/${encodeURIComponent(streamName)}`);
    return {
      success: true,
      shardId: res.ShardId,
      sequenceNumber: res.SequenceNumber,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 10. Get Records (Data Viewer)
export async function getRecordsAction(input: {
  streamName: string;
  shardId: string;
  iteratorType: "TRIM_HORIZON" | "LATEST" | "AT_SEQUENCE_NUMBER" | "AFTER_SEQUENCE_NUMBER";
  sequenceNumber?: string;
  limit?: number;
}): Promise<{ records: RecordItem[]; nextShardIterator?: string; error?: string }> {
  const { streamName, shardId, iteratorType, sequenceNumber, limit = 25 } = input;
  try {
    const iterRes = await kinesis.send(
      new GetShardIteratorCommand({
        StreamName: streamName,
        ShardId: shardId,
        ShardIteratorType: iteratorType,
        StartingSequenceNumber:
          iteratorType === "AT_SEQUENCE_NUMBER" || iteratorType === "AFTER_SEQUENCE_NUMBER"
            ? sequenceNumber
            : undefined,
      })
    );

    const iterator = iterRes.ShardIterator;
    if (!iterator) {
      return { records: [], error: "No shard iterator returned." };
    }

    const recRes = await kinesis.send(
      new GetRecordsCommand({
        ShardIterator: iterator,
        Limit: limit,
      })
    );

    const records: RecordItem[] = (recRes.Records || []).map((r) => {
      const dataBytes = r.Data ? Buffer.from(r.Data) : Buffer.from("");
      const b64 = dataBytes.toString("base64");
      let dataText = "";
      try {
        dataText = dataBytes.toString("utf-8");
      } catch {
        dataText = b64;
      }

      return {
        SequenceNumber: r.SequenceNumber || "",
        ApproximateArrivalTimestamp: r.ApproximateArrivalTimestamp
          ? new Date(r.ApproximateArrivalTimestamp).toISOString()
          : undefined,
        Data: b64,
        DataText: dataText,
        PartitionKey: r.PartitionKey || "",
        EncryptionType: r.EncryptionType,
      };
    });

    return { records, nextShardIterator: recRes.NextShardIterator };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { records: [], error: msg };
  }
}

// 11. Register stream consumer
export async function registerConsumerAction(
  streamARN: string,
  consumerName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await kinesis.send(
      new RegisterStreamConsumerCommand({
        StreamARN: streamARN,
        ConsumerName: consumerName,
      })
    );
    revalidatePath("/kinesis");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 12. Deregister stream consumer
export async function deregisterConsumerAction(
  streamARN: string,
  consumerName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await kinesis.send(
      new DeregisterStreamConsumerCommand({
        StreamARN: streamARN,
        ConsumerName: consumerName,
      })
    );
    revalidatePath("/kinesis");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 13. Update tags
export async function updateTagsAction(
  streamName: string,
  tagsToAdd: { key: string; value: string }[],
  tagKeysToRemove: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (tagKeysToRemove.length > 0) {
      await kinesis.send(
        new RemoveTagsFromStreamCommand({
          StreamName: streamName,
          TagKeys: tagKeysToRemove,
        })
      );
    }
    if (tagsToAdd.length > 0) {
      const tagMap: Record<string, string> = {};
      tagsToAdd.forEach((t) => {
        if (t.key.trim()) tagMap[t.key.trim()] = t.value.trim();
      });
      if (Object.keys(tagMap).length > 0) {
        await kinesis.send(
          new AddTagsToStreamCommand({
            StreamName: streamName,
            Tags: tagMap,
          })
        );
      }
    }
    revalidatePath(`/kinesis/streams/${encodeURIComponent(streamName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 14. Update Enhanced Monitoring
export async function updateEnhancedMonitoringAction(
  streamName: string,
  metricsToEnable: string[],
  metricsToDisable: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (metricsToEnable.length > 0) {
      await kinesis.send(
        new EnableEnhancedMonitoringCommand({
          StreamName: streamName,
          ShardLevelMetrics: metricsToEnable as any,
        })
      );
    }
    if (metricsToDisable.length > 0) {
      await kinesis.send(
        new DisableEnhancedMonitoringCommand({
          StreamName: streamName,
          ShardLevelMetrics: metricsToDisable as any,
        })
      );
    }
    revalidatePath(`/kinesis/streams/${encodeURIComponent(streamName)}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// 15. Fetch Customer KMS Keys for encryption selection
export async function getKmsKeysAction(): Promise<KmsKeyOption[]> {
  try {
    const aliasesRes = await kms.send(new ListAliasesCommand({}));
    const keysRes = await kms.send(new ListKeysCommand({}));

    const keyList: KmsKeyOption[] = [];
    const aliasMap: Record<string, string> = {};

    for (const a of aliasesRes.Aliases || []) {
      if (a.TargetKeyId && a.AliasName) {
        aliasMap[a.TargetKeyId] = a.AliasName;
      }
    }

    for (const k of keysRes.Keys || []) {
      if (k.KeyId) {
        const alias = aliasMap[k.KeyId];
        let desc = "";
        try {
          const descRes = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
          desc = descRes.KeyMetadata?.Description || "";
        } catch {
          /* ignore */
        }
        keyList.push({
          KeyId: k.KeyId,
          Arn: k.KeyArn || `arn:aws:kms:us-east-1:000000000000:key/${k.KeyId}`,
          AliasName: alias,
          Description: desc,
        });
      }
    }

    return keyList;
  } catch {
    return [];
  }
}
