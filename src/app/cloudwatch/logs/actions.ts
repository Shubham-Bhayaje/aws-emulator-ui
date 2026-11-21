"use server";

import { cloudwatchLogs, kms, iam, kinesis, lambda } from "@/lib/aws";
import {
  DescribeLogGroupsCommand,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutRetentionPolicyCommand,
  DeleteRetentionPolicyCommand,
  DescribeLogStreamsCommand,
  CreateLogStreamCommand,
  DeleteLogStreamCommand,
  GetLogEventsCommand,
  PutLogEventsCommand,
  FilterLogEventsCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  DescribeMetricFiltersCommand,
  PutMetricFilterCommand,
  DeleteMetricFilterCommand,
  DescribeSubscriptionFiltersCommand,
  PutSubscriptionFilterCommand,
  DeleteSubscriptionFilterCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { ListKeysCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { ListRolesCommand } from "@aws-sdk/client-iam";
import { ListStreamsCommand, DescribeStreamSummaryCommand } from "@aws-sdk/client-kinesis";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { revalidatePath } from "next/cache";
import {
  LogGroupSummary,
  LogStreamSummary,
  LogEventItem,
  FilteredLogEventItem,
  MetricFilterSummary,
  SubscriptionFilterSummary,
  KmsKeyOption,
  IamRoleOption,
  KinesisStreamOption,
  LambdaFunctionOption,
} from "./types";

export async function listLogGroupsAction(prefix?: string): Promise<{
  logGroups: LogGroupSummary[];
  error?: string;
}> {
  try {
    const res = await cloudwatchLogs.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: prefix?.trim() || undefined,
      })
    );

    const logGroups: LogGroupSummary[] = (res.logGroups || []).map((lg) => ({
      logGroupName: lg.logGroupName || "",
      logGroupArn: lg.arn || lg.logGroupArn,
      creationTime: lg.creationTime || Date.now(),
      retentionInDays: lg.retentionInDays,
      metricFilterCount: lg.metricFilterCount || 0,
      storedBytes: lg.storedBytes || 0,
      kmsKeyId: lg.kmsKeyId,
      logGroupClass: lg.logGroupClass || "STANDARD",
      dataProtectionStatus: lg.dataProtectionStatus || "DISABLED",
      inheritedProperties: lg.inheritedProperties || [],
    }));

    return { logGroups };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list log groups";
    return { logGroups: [], error: message };
  }
}

export async function createLogGroupAction(data: {
  logGroupName: string;
  logGroupClass?: string;
  retentionInDays?: number;
  kmsKeyId?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmedName = data.logGroupName.trim();
    if (!trimmedName) {
      return { success: false, error: "Log group name is required." };
    }

    await cloudwatchLogs.send(
      new CreateLogGroupCommand({
        logGroupName: trimmedName,
        logGroupClass: data.logGroupClass || "STANDARD",
        kmsKeyId: data.kmsKeyId?.trim() || undefined,
        tags: data.tags && Object.keys(data.tags).length > 0 ? data.tags : undefined,
      })
    );

    if (data.retentionInDays && data.retentionInDays > 0) {
      try {
        await cloudwatchLogs.send(
          new PutRetentionPolicyCommand({
            logGroupName: trimmedName,
            retentionInDays: data.retentionInDays,
          })
        );
      } catch (retentionErr) {
        console.warn("Failed to set initial retention policy:", retentionErr);
      }
    }

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create log group";
    return { success: false, error: message };
  }
}

export async function deleteLogGroupAction(logGroupName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await cloudwatchLogs.send(
      new DeleteLogGroupCommand({
        logGroupName,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete log group";
    return { success: false, error: message };
  }
}

export async function putRetentionPolicyAction(
  logGroupName: string,
  retentionInDays: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudwatchLogs.send(
      new PutRetentionPolicyCommand({
        logGroupName,
        retentionInDays,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update retention policy";
    return { success: false, error: message };
  }
}

export async function deleteRetentionPolicyAction(logGroupName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await cloudwatchLogs.send(
      new DeleteRetentionPolicyCommand({
        logGroupName,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete retention policy";
    return { success: false, error: message };
  }
}

export async function getLogGroupDetailAction(logGroupName: string): Promise<{
  logGroup?: LogGroupSummary;
  metricFilters: MetricFilterSummary[];
  subscriptionFilters: SubscriptionFilterSummary[];
  tags: Record<string, string>;
  error?: string;
}> {
  try {
    const res = await cloudwatchLogs.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      })
    );

    const match = (res.logGroups || []).find((lg) => lg.logGroupName === logGroupName);
    if (!match) {
      return {
        metricFilters: [],
        subscriptionFilters: [],
        tags: {},
        error: `Log group '${logGroupName}' not found.`,
      };
    }

    const logGroup: LogGroupSummary = {
      logGroupName: match.logGroupName || "",
      logGroupArn: match.arn || match.logGroupArn,
      creationTime: match.creationTime || Date.now(),
      retentionInDays: match.retentionInDays,
      metricFilterCount: match.metricFilterCount || 0,
      storedBytes: match.storedBytes || 0,
      kmsKeyId: match.kmsKeyId,
      logGroupClass: match.logGroupClass || "STANDARD",
      dataProtectionStatus: match.dataProtectionStatus || "DISABLED",
      inheritedProperties: match.inheritedProperties || [],
    };

    let metricFilters: MetricFilterSummary[] = [];
    try {
      const mfRes = await cloudwatchLogs.send(
        new DescribeMetricFiltersCommand({ logGroupName })
      );
      metricFilters = (mfRes.metricFilters || []).map((mf) => ({
        filterName: mf.filterName || "",
        filterPattern: mf.filterPattern || "",
        creationTime: mf.creationTime,
        logGroupName: mf.logGroupName || logGroupName,
        metricTransformations: (mf.metricTransformations || []).map((mt) => ({
          metricName: mt.metricName || "",
          metricNamespace: mt.metricNamespace || "",
          metricValue: mt.metricValue || "1",
          defaultValue: mt.defaultValue,
          unit: mt.unit,
          dimensions: mt.dimensions || {},
        })),
      }));
    } catch {
      // Ignore if metric filters not available
    }

    let subscriptionFilters: SubscriptionFilterSummary[] = [];
    try {
      const sfRes = await cloudwatchLogs.send(
        new DescribeSubscriptionFiltersCommand({ logGroupName })
      );
      subscriptionFilters = (sfRes.subscriptionFilters || []).map((sf) => ({
        filterName: sf.filterName || "",
        logGroupName: sf.logGroupName || logGroupName,
        filterPattern: sf.filterPattern || "",
        destinationArn: sf.destinationArn || "",
        roleArn: sf.roleArn,
        distribution: sf.distribution as "Random" | "ByLogStream" | undefined,
        creationTime: sf.creationTime,
      }));
    } catch {
      // Ignore if subscription filters not available
    }

    let tags: Record<string, string> = {};
    if (logGroup.logGroupArn) {
      try {
        const cleanArn = logGroup.logGroupArn.replace(/:\*$/, "");
        const tagRes = await cloudwatchLogs.send(
          new ListTagsForResourceCommand({ resourceArn: cleanArn })
        );
        tags = (tagRes.tags as Record<string, string>) || {};
      } catch {
        // Fallback or ignore
      }
    }

    return { logGroup, metricFilters, subscriptionFilters, tags };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load log group details";
    return {
      metricFilters: [],
      subscriptionFilters: [],
      tags: {},
      error: message,
    };
  }
}

export async function listLogStreamsAction(
  logGroupName: string,
  prefix?: string
): Promise<{ logStreams: LogStreamSummary[]; error?: string }> {
  try {
    let res;
    try {
      res = await cloudwatchLogs.send(
        new DescribeLogStreamsCommand({
          logGroupName,
          logStreamNamePrefix: prefix?.trim() || undefined,
          orderBy: "LastEventTime",
          descending: true,
        })
      );
    } catch {
      // If ordering by LastEventTime is not supported, fallback to default order
      res = await cloudwatchLogs.send(
        new DescribeLogStreamsCommand({
          logGroupName,
          logStreamNamePrefix: prefix?.trim() || undefined,
        })
      );
    }

    const logStreams: LogStreamSummary[] = (res.logStreams || []).map((ls) => ({
      logStreamName: ls.logStreamName || "",
      arn: ls.arn,
      creationTime: ls.creationTime || Date.now(),
      firstEventTimestamp: ls.firstEventTimestamp,
      lastEventTimestamp: ls.lastEventTimestamp,
      lastIngestionTime: ls.lastIngestionTime,
      storedBytes: ls.storedBytes || 0,
    }));

    return { logStreams };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list log streams";
    return { logStreams: [], error: message };
  }
}

export async function createLogStreamAction(
  logGroupName: string,
  logStreamName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = logStreamName.trim();
    if (!trimmed) {
      return { success: false, error: "Log stream name is required." };
    }

    await cloudwatchLogs.send(
      new CreateLogStreamCommand({
        logGroupName,
        logStreamName: trimmed,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create log stream";
    return { success: false, error: message };
  }
}

export async function deleteLogStreamAction(
  logGroupName: string,
  logStreamName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudwatchLogs.send(
      new DeleteLogStreamCommand({
        logGroupName,
        logStreamName,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete log stream";
    return { success: false, error: message };
  }
}

export async function getLogEventsAction(
  logGroupName: string,
  logStreamName: string,
  options?: { limit?: number; startFromHead?: boolean; nextToken?: string }
): Promise<{
  events: LogEventItem[];
  nextForwardToken?: string;
  nextBackwardToken?: string;
  error?: string;
}> {
  try {
    const res = await cloudwatchLogs.send(
      new GetLogEventsCommand({
        logGroupName,
        logStreamName,
        limit: options?.limit || 100,
        startFromHead: options?.startFromHead ?? false,
        nextToken: options?.nextToken,
      })
    );

    const events: LogEventItem[] = (res.events || []).map((e) => ({
      timestamp: e.timestamp || Date.now(),
      message: e.message || "",
      ingestionTime: e.ingestionTime,
    }));

    return {
      events,
      nextForwardToken: res.nextForwardToken,
      nextBackwardToken: res.nextBackwardToken,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve log events";
    return { events: [], error: message };
  }
}

export async function putLogEventsAction(
  logGroupName: string,
  logStreamName: string,
  events: Array<{ timestamp?: number; message: string }>
): Promise<{ success: boolean; nextSequenceToken?: string; error?: string }> {
  try {
    if (!events || events.length === 0) {
      return { success: false, error: "At least one log event is required." };
    }

    const formattedEvents = events.map((e) => ({
      timestamp: e.timestamp || Date.now(),
      message: e.message,
    }));

    // Events must be sorted by timestamp ascending in CloudWatch Logs
    formattedEvents.sort((a, b) => a.timestamp - b.timestamp);

    const res = await cloudwatchLogs.send(
      new PutLogEventsCommand({
        logGroupName,
        logStreamName,
        logEvents: formattedEvents,
      })
    );

    return { success: true, nextSequenceToken: res.nextSequenceToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to put log events";
    return { success: false, error: message };
  }
}

export async function filterLogEventsAction(
  logGroupName: string,
  options?: {
    logStreamNames?: string[];
    filterPattern?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }
): Promise<{
  events: FilteredLogEventItem[];
  searchedStreams: string[];
  nextToken?: string;
  error?: string;
}> {
  try {
    const res = await cloudwatchLogs.send(
      new FilterLogEventsCommand({
        logGroupName,
        logStreamNames: options?.logStreamNames && options.logStreamNames.length > 0 ? options.logStreamNames : undefined,
        filterPattern: options?.filterPattern?.trim() || undefined,
        startTime: options?.startTime,
        endTime: options?.endTime,
        limit: options?.limit || 100,
      })
    );

    const events: FilteredLogEventItem[] = (res.events || []).map((e) => ({
      eventId: e.eventId,
      logStreamName: e.logStreamName,
      timestamp: e.timestamp || Date.now(),
      message: e.message || "",
      ingestionTime: e.ingestionTime,
    }));

    return {
      events,
      searchedStreams: (res.searchedLogStreams || []).map((s) => s.logStreamName || "").filter(Boolean),
      nextToken: res.nextToken,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to filter log events";
    return { events: [], searchedStreams: [], error: message };
  }
}

export async function putMetricFilterAction(data: {
  logGroupName: string;
  filterName: string;
  filterPattern: string;
  metricName: string;
  metricNamespace: string;
  metricValue: string;
  defaultValue?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudwatchLogs.send(
      new PutMetricFilterCommand({
        logGroupName: data.logGroupName,
        filterName: data.filterName.trim(),
        filterPattern: data.filterPattern.trim(),
        metricTransformations: [
          {
            metricName: data.metricName.trim(),
            metricNamespace: data.metricNamespace.trim(),
            metricValue: data.metricValue.trim() || "1",
            defaultValue: data.defaultValue,
          },
        ],
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create metric filter";
    return { success: false, error: message };
  }
}

export async function deleteMetricFilterAction(
  logGroupName: string,
  filterName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudwatchLogs.send(
      new DeleteMetricFilterCommand({
        logGroupName,
        filterName,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete metric filter";
    return { success: false, error: message };
  }
}

export async function putSubscriptionFilterAction(data: {
  logGroupName: string;
  filterName: string;
  filterPattern: string;
  destinationArn: string;
  roleArn?: string;
  distribution?: "Random" | "ByLogStream";
}): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudwatchLogs.send(
      new PutSubscriptionFilterCommand({
        logGroupName: data.logGroupName,
        filterName: data.filterName.trim(),
        filterPattern: data.filterPattern.trim(),
        destinationArn: data.destinationArn.trim(),
        roleArn: data.roleArn?.trim() || undefined,
        distribution: data.distribution || "ByLogStream",
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create subscription filter";
    return { success: false, error: message };
  }
}

export async function deleteSubscriptionFilterAction(
  logGroupName: string,
  filterName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudwatchLogs.send(
      new DeleteSubscriptionFilterCommand({
        logGroupName,
        filterName,
      })
    );

    revalidatePath("/cloudwatch/logs");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete subscription filter";
    return { success: false, error: message };
  }
}

export async function tagResourceAction(
  resourceArn: string,
  tags: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanArn = resourceArn.replace(/:\*$/, "");
    await cloudwatchLogs.send(
      new TagResourceCommand({
        resourceArn: cleanArn,
        tags,
      })
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to tag resource";
    return { success: false, error: message };
  }
}

export async function untagResourceAction(
  resourceArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanArn = resourceArn.replace(/:\*$/, "");
    await cloudwatchLogs.send(
      new UntagResourceCommand({
        resourceArn: cleanArn,
        tagKeys,
      })
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to untag resource";
    return { success: false, error: message };
  }
}

// --- Related Resources Loaders (Real SDK integrations) ---

export async function getKmsKeysAction(): Promise<KmsKeyOption[]> {
  try {
    const listRes = await kms.send(new ListKeysCommand({}));
    const aliasRes = await kms.send(new ListAliasesCommand({}));

    const aliasMap = new Map<string, string>();
    for (const a of aliasRes.Aliases || []) {
      if (a.TargetKeyId && a.AliasName) {
        aliasMap.set(a.TargetKeyId, a.AliasName);
      }
    }

    const options: KmsKeyOption[] = [];
    for (const k of listRes.Keys || []) {
      if (k.KeyId && k.KeyArn) {
        options.push({
          keyId: k.KeyId,
          arn: k.KeyArn,
          aliasName: aliasMap.get(k.KeyId),
        });
      }
    }

    return options;
  } catch {
    return [];
  }
}

export async function getIamRolesAction(): Promise<IamRoleOption[]> {
  try {
    const res = await iam.send(new ListRolesCommand({}));
    return (res.Roles || []).map((r) => ({
      roleName: r.RoleName || "",
      arn: r.Arn || "",
    }));
  } catch {
    return [];
  }
}

export async function getKinesisStreamsAction(): Promise<KinesisStreamOption[]> {
  try {
    const res = await kinesis.send(new ListStreamsCommand({}));
    const streams: KinesisStreamOption[] = [];

    for (const name of res.StreamNames || []) {
      try {
        const desc = await kinesis.send(
          new DescribeStreamSummaryCommand({ StreamName: name })
        );
        if (desc.StreamDescriptionSummary?.StreamARN) {
          streams.push({
            streamName: name,
            streamArn: desc.StreamDescriptionSummary.StreamARN,
          });
        }
      } catch {
        streams.push({
          streamName: name,
          streamArn: `arn:aws:kinesis:us-east-1:000000000000:stream/${name}`,
        });
      }
    }

    return streams;
  } catch {
    return [];
  }
}

export async function getLambdaFunctionsAction(): Promise<LambdaFunctionOption[]> {
  try {
    const res = await lambda.send(new ListFunctionsCommand({}));
    return (res.Functions || []).map((f) => ({
      functionName: f.FunctionName || "",
      functionArn: f.FunctionArn || "",
    }));
  } catch {
    return [];
  }
}
