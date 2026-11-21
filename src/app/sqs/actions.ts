"use server";

import { revalidatePath } from "next/cache";
import { sqs, kms, lambda } from "@/lib/aws";
import {
  ListQueuesCommand,
  GetQueueUrlCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
  CreateQueueCommand,
  DeleteQueueCommand,
  PurgeQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  TagQueueCommand,
  UntagQueueCommand,
  ListQueueTagsCommand,
  StartMessageMoveTaskCommand,
} from "@aws-sdk/client-sqs";
import { ListKeysCommand, ListAliasesCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";
import {
  QueueSummary,
  SQSMessageItem,
  KmsKeyOption,
  LambdaFunctionOption,
} from "./types";

/**
 * List all queues in the account and region with comprehensive attributes
 */
export async function listQueuesAction(): Promise<{
  success: boolean;
  queues: QueueSummary[];
  error?: string;
}> {
  try {
    const res = await sqs.send(new ListQueuesCommand({}));
    const urls = res.QueueUrls || [];

    const queues = await Promise.all(
      urls.map(async (url) => {
        const name = url.split("/").pop() || url;
        let arn = `arn:aws:sqs:us-east-1:000000000000:${name}`;
        let type: "Standard" | "FIFO" = name.endsWith(".fifo") ? "FIFO" : "Standard";
        let created = "—";
        let messagesAvailable = 0;
        let messagesInFlight = 0;
        let messagesDelayed = 0;
        let visibilityTimeout = 30;
        let retentionPeriod = 345600;
        let delaySeconds = 0;
        let maxMessageSize = 262144;
        let receiveWaitTime = 0;
        let serverSideEncryption: string | undefined = undefined;
        let kmsMasterKeyId: string | undefined = undefined;

        try {
          const attrsRes = await sqs.send(
            new GetQueueAttributesCommand({
              QueueUrl: url,
              AttributeNames: ["All"],
            })
          );
          const attrs = attrsRes.Attributes || {};
          if (attrs.QueueArn) arn = attrs.QueueArn;
          if (attrs.FifoQueue === "true") type = "FIFO";
          if (attrs.CreatedTimestamp) {
            created = new Date(parseInt(attrs.CreatedTimestamp) * 1000).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }
          messagesAvailable = parseInt(attrs.ApproximateNumberOfMessages || "0", 10);
          messagesInFlight = parseInt(attrs.ApproximateNumberOfMessagesNotVisible || "0", 10);
          messagesDelayed = parseInt(attrs.ApproximateNumberOfMessagesDelayed || "0", 10);
          visibilityTimeout = parseInt(attrs.VisibilityTimeout || "30", 10);
          retentionPeriod = parseInt(attrs.MessageRetentionPeriod || "345600", 10);
          delaySeconds = parseInt(attrs.DelaySeconds || "0", 10);
          maxMessageSize = parseInt(attrs.MaximumMessageSize || "262144", 10);
          receiveWaitTime = parseInt(attrs.ReceiveMessageWaitTimeSeconds || "0", 10);
          if (attrs.KmsMasterKeyId) {
            serverSideEncryption = "SSE-KMS";
            kmsMasterKeyId = attrs.KmsMasterKeyId;
          } else if (attrs.SqsManagedSseEnabled === "true") {
            serverSideEncryption = "SSE-SQS";
          }
        } catch {
          // Fall back to defaults
        }

        return {
          url,
          name,
          arn,
          type,
          created,
          messagesAvailable,
          messagesInFlight,
          messagesDelayed,
          visibilityTimeout,
          retentionPeriod,
          delaySeconds,
          maxMessageSize,
          receiveWaitTime,
          serverSideEncryption,
          kmsMasterKeyId,
        };
      })
    );

    return { success: true, queues };
  } catch (err: any) {
    return {
      success: false,
      queues: [],
      error: err.message || "Failed to list SQS queues",
    };
  }
}

/**
 * Get detailed queue information including attributes, tags, and policy
 */
export async function getQueueDetailsAction(queueName: string): Promise<{
  success: boolean;
  url?: string;
  name?: string;
  arn?: string;
  attributes?: Record<string, string>;
  tags?: Record<string, string>;
  error?: string;
}> {
  try {
    const urlRes = await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }));
    const queueUrl = urlRes.QueueUrl;
    if (!queueUrl) {
      return { success: false, error: `Queue ${queueName} not found` };
    }

    const attrsRes = await sqs.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ["All"],
      })
    );
    const attributes = attrsRes.Attributes || {};

    let tags: Record<string, string> = {};
    try {
      const tagsRes = await sqs.send(new ListQueueTagsCommand({ QueueUrl: queueUrl }));
      tags = tagsRes.Tags || {};
    } catch {
      // Tags might not be set
    }

    return {
      success: true,
      url: queueUrl,
      name: queueName,
      arn: attributes.QueueArn || `arn:aws:sqs:us-east-1:000000000000:${queueName}`,
      attributes,
      tags,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || `Failed to fetch queue details for ${queueName}`,
    };
  }
}

/**
 * Create a new SQS queue (Standard or FIFO)
 */
export async function createQueueAction(params: {
  queueName: string;
  isFifo: boolean;
  visibilityTimeout?: number;
  messageRetentionPeriod?: number;
  delaySeconds?: number;
  maximumMessageSize?: number;
  receiveMessageWaitTimeSeconds?: number;
  contentBasedDeduplication?: boolean;
  deduplicationScope?: "queue" | "messageGroup";
  fifoThroughputLimit?: "perQueue" | "perMessageGroupId";
  encryptionType?: "SSE-SQS" | "SSE-KMS" | "NONE";
  kmsMasterKeyId?: string;
  kmsDataKeyReusePeriodSeconds?: number;
  accessPolicyJson?: string;
  deadLetterQueueArn?: string;
  maxReceiveCount?: number;
  tags?: Record<string, string>;
}): Promise<{
  success: boolean;
  queueUrl?: string;
  error?: string;
}> {
  try {
    const {
      queueName,
      isFifo,
      visibilityTimeout = 30,
      messageRetentionPeriod = 345600,
      delaySeconds = 0,
      maximumMessageSize = 262144,
      receiveMessageWaitTimeSeconds = 0,
      contentBasedDeduplication = false,
      deduplicationScope,
      fifoThroughputLimit,
      encryptionType = "SSE-SQS",
      kmsMasterKeyId,
      kmsDataKeyReusePeriodSeconds = 300,
      accessPolicyJson,
      deadLetterQueueArn,
      maxReceiveCount = 5,
      tags,
    } = params;

    let finalName = queueName.trim();
    if (isFifo && !finalName.endsWith(".fifo")) {
      finalName += ".fifo";
    }

    const attributes: Record<string, string> = {
      VisibilityTimeout: String(visibilityTimeout),
      MessageRetentionPeriod: String(messageRetentionPeriod),
      DelaySeconds: String(delaySeconds),
      MaximumMessageSize: String(maximumMessageSize),
      ReceiveMessageWaitTimeSeconds: String(receiveMessageWaitTimeSeconds),
    };

    if (isFifo) {
      attributes.FifoQueue = "true";
      if (contentBasedDeduplication) {
        attributes.ContentBasedDeduplication = "true";
      }
      if (deduplicationScope) {
        attributes.DeduplicationScope = deduplicationScope;
      }
      if (fifoThroughputLimit) {
        attributes.FifoThroughputLimit = fifoThroughputLimit;
      }
    }

    if (encryptionType === "SSE-KMS" && kmsMasterKeyId) {
      attributes.KmsMasterKeyId = kmsMasterKeyId;
      attributes.KmsDataKeyReusePeriodSeconds = String(kmsDataKeyReusePeriodSeconds);
    } else if (encryptionType === "SSE-SQS") {
      attributes.SqsManagedSseEnabled = "true";
    }

    if (accessPolicyJson && accessPolicyJson.trim()) {
      attributes.Policy = accessPolicyJson.trim();
    }

    if (deadLetterQueueArn && deadLetterQueueArn.trim()) {
      attributes.RedrivePolicy = JSON.stringify({
        deadLetterTargetArn: deadLetterQueueArn.trim(),
        maxReceiveCount: Number(maxReceiveCount),
      });
    }

    const res = await sqs.send(
      new CreateQueueCommand({
        QueueName: finalName,
        Attributes: attributes,
        tags: tags && Object.keys(tags).length > 0 ? tags : undefined,
      })
    );

    revalidatePath("/sqs");
    return { success: true, queueUrl: res.QueueUrl };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create SQS queue",
    };
  }
}

/**
 * Update queue attributes and tags
 */
export async function updateQueueAttributesAction(
  queueUrl: string,
  attributes: Record<string, string>,
  tags?: Record<string, string>,
  removedTagKeys?: string[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (Object.keys(attributes).length > 0) {
      await sqs.send(
        new SetQueueAttributesCommand({
          QueueUrl: queueUrl,
          Attributes: attributes,
        })
      );
    }

    if (tags && Object.keys(tags).length > 0) {
      await sqs.send(
        new TagQueueCommand({
          QueueUrl: queueUrl,
          Tags: tags,
        })
      );
    }

    if (removedTagKeys && removedTagKeys.length > 0) {
      await sqs.send(
        new UntagQueueCommand({
          QueueUrl: queueUrl,
          TagKeys: removedTagKeys,
        })
      );
    }

    revalidatePath("/sqs");
    const name = queueUrl.split("/").pop();
    if (name) revalidatePath(`/sqs/${name}`);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to update queue attributes",
    };
  }
}

/**
 * Delete one or more queues
 */
export async function deleteQueuesAction(queueUrls: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    for (const url of queueUrls) {
      await sqs.send(new DeleteQueueCommand({ QueueUrl: url }));
    }
    revalidatePath("/sqs");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to delete queue(s)",
    };
  }
}

/**
 * Purge one or more queues
 */
export async function purgeQueuesAction(queueUrls: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    for (const url of queueUrls) {
      await sqs.send(new PurgeQueueCommand({ QueueUrl: url }));
    }
    revalidatePath("/sqs");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to purge queue(s)",
    };
  }
}

/**
 * Send a message to an SQS queue with delay, FIFO parameters, and attributes
 */
export async function sendMessageAction(params: {
  queueUrl: string;
  messageBody: string;
  delaySeconds?: number;
  messageGroupId?: string;
  messageDeduplicationId?: string;
  messageAttributes?: Record<string, { DataType: string; StringValue: string }>;
}): Promise<{
  success: boolean;
  messageId?: string;
  md5OfMessageBody?: string;
  sequenceNumber?: string;
  error?: string;
}> {
  try {
    const {
      queueUrl,
      messageBody,
      delaySeconds = 0,
      messageGroupId,
      messageDeduplicationId,
      messageAttributes,
    } = params;

    if (!messageBody || !messageBody.trim()) {
      return { success: false, error: "Message body cannot be empty" };
    }

    const res = await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        DelaySeconds: delaySeconds > 0 ? delaySeconds : undefined,
        MessageGroupId: messageGroupId || undefined,
        MessageDeduplicationId: messageDeduplicationId || undefined,
        MessageAttributes:
          messageAttributes && Object.keys(messageAttributes).length > 0
            ? messageAttributes
            : undefined,
      })
    );

    const name = queueUrl.split("/").pop();
    if (name) revalidatePath(`/sqs/${name}`);

    return {
      success: true,
      messageId: res.MessageId,
      md5OfMessageBody: res.MD5OfMessageBody,
      sequenceNumber: res.SequenceNumber,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to send message",
    };
  }
}

/**
 * Receive messages from an SQS queue
 */
export async function receiveMessagesAction(
  queueUrl: string,
  maxNumberOfMessages = 10,
  waitTimeSeconds = 1
): Promise<{
  success: boolean;
  messages: SQSMessageItem[];
  error?: string;
}> {
  try {
    const res = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(10, Math.max(1, maxNumberOfMessages)),
        WaitTimeSeconds: Math.min(20, Math.max(0, waitTimeSeconds)),
        AttributeNames: ["All"],
        MessageAttributeNames: ["All"],
      })
    );

    const messages: SQSMessageItem[] = (res.Messages || []).map((m) => ({
      messageId: m.MessageId || "",
      body: m.Body || "",
      receiptHandle: m.ReceiptHandle || "",
      sentTimestamp: m.Attributes?.SentTimestamp
        ? new Date(parseInt(m.Attributes.SentTimestamp, 10)).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        : "—",
      approximateReceiveCount: m.Attributes?.ApproximateReceiveCount
        ? parseInt(m.Attributes.ApproximateReceiveCount, 10)
        : undefined,
      approximateFirstReceiveTimestamp: m.Attributes?.ApproximateFirstReceiveTimestamp
        ? new Date(parseInt(m.Attributes.ApproximateFirstReceiveTimestamp, 10)).toLocaleString()
        : undefined,
      md5OfBody: m.MD5OfBody,
      messageGroupId: m.Attributes?.MessageGroupId,
      messageDeduplicationId: m.Attributes?.MessageDeduplicationId,
      sequenceNumber: m.Attributes?.SequenceNumber,
      attributes: m.Attributes,
      messageAttributes: m.MessageAttributes,
    }));

    return { success: true, messages };
  } catch (err: any) {
    return {
      success: false,
      messages: [],
      error: err.message || "Failed to receive messages",
    };
  }
}

/**
 * Delete a message from a queue using its receipt handle
 */
export async function deleteMessageAction(
  queueUrl: string,
  receiptHandle: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      })
    );
    const name = queueUrl.split("/").pop();
    if (name) revalidatePath(`/sqs/${name}`);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to delete message",
    };
  }
}

/**
 * Start a dead-letter queue message redrive task
 */
export async function startMessageMoveTaskAction(
  sourceArn: string,
  destinationArn?: string
): Promise<{
  success: boolean;
  taskHandle?: string;
  error?: string;
}> {
  try {
    const res = await sqs.send(
      new StartMessageMoveTaskCommand({
        SourceArn: sourceArn,
        DestinationArn: destinationArn || undefined,
      })
    );
    return { success: true, taskHandle: res.TaskHandle };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to start message move task",
    };
  }
}

/**
 * Fetch KMS customer managed keys for encryption dropdown
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

    const options: KmsKeyOption[] = [];
    for (const k of keysRes.Keys || []) {
      if (k.KeyId && k.KeyArn) {
        options.push({
          keyId: k.KeyId,
          keyArn: k.KeyArn,
          alias: aliasMap.get(k.KeyId),
        });
      }
    }
    return options;
  } catch {
    return [];
  }
}

/**
 * Fetch Lambda functions for Lambda triggers tab
 */
export async function getLambdaFunctionsAction(): Promise<LambdaFunctionOption[]> {
  try {
    const res = await lambda.send(new ListFunctionsCommand({}));
    return (res.Functions || []).map((f) => ({
      functionName: f.FunctionName || "",
      functionArn: f.FunctionArn || "",
      runtime: f.Runtime,
    }));
  } catch {
    return [];
  }
}
