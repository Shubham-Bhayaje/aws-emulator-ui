"use server";

import { revalidatePath } from "next/cache";
import { sns, kms, sqs, lambda } from "@/lib/aws";
import {
  ListTopicsCommand,
  GetTopicAttributesCommand,
  SetTopicAttributesCommand,
  CreateTopicCommand,
  DeleteTopicCommand,
  PublishCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  ListSubscriptionsCommand,
  ListSubscriptionsByTopicCommand,
  GetSubscriptionAttributesCommand,
  SetSubscriptionAttributesCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-sns";
import { ListKeysCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { ListQueuesCommand, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { ListFunctionsCommand } from "@aws-sdk/client-lambda";
import {
  TopicSummary,
  TopicDetail,
  SubscriptionSummary,
  SubscriptionDetail,
  KmsKeyOption,
  SqsQueueOption,
  LambdaFunctionOption,
  MessageAttribute,
} from "./types";

/**
 * List all SNS topics in the region with metrics and attributes
 */
export async function listTopicsAction(): Promise<{
  success: boolean;
  topics: TopicSummary[];
  error?: string;
}> {
  try {
    const res = await sns.send(new ListTopicsCommand({}));
    const rawTopics = res.Topics || [];

    const topics: TopicSummary[] = await Promise.all(
      rawTopics.map(async (t) => {
        const arn = t.TopicArn || "";
        const name = arn.split(":").pop() || "";
        const isFifo = name.endsWith(".fifo");

        let displayName: string | undefined = undefined;
        let subscriptionsConfirmed = 0;
        let subscriptionsPending = 0;
        let subscriptionsDeleted = 0;

        try {
          const attrsRes = await sns.send(new GetTopicAttributesCommand({ TopicArn: arn }));
          const attrs = attrsRes.Attributes || {};
          displayName = attrs.DisplayName;
          subscriptionsConfirmed = parseInt(attrs.SubscriptionsConfirmed || "0", 10);
          subscriptionsPending = parseInt(attrs.SubscriptionsPending || "0", 10);
          subscriptionsDeleted = parseInt(attrs.SubscriptionsDeleted || "0", 10);
        } catch {
          // Keep defaults
        }

        return {
          arn,
          name,
          type: isFifo ? "FIFO" : "Standard",
          displayName,
          subscriptionsConfirmed,
          subscriptionsPending,
          subscriptionsDeleted,
        };
      })
    );

    return { success: true, topics };
  } catch (err: unknown) {
    return {
      success: false,
      topics: [],
      error: err instanceof Error ? err.message : "Failed to list SNS topics",
    };
  }
}

/**
 * Get detailed topic configuration, attributes, and tags
 */
export async function getTopicDetailsAction(topicArn: string): Promise<{
  success: boolean;
  topic?: TopicDetail;
  error?: string;
}> {
  try {
    const attrsRes = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
    const attrs = attrsRes.Attributes || {};
    const name = topicArn.split(":").pop() || "";
    const isFifo = name.endsWith(".fifo") || attrs.FifoTopic === "true";

    let tags: Record<string, string> = {};
    try {
      const tagsRes = await sns.send(new ListTagsForResourceCommand({ ResourceArn: topicArn }));
      for (const t of tagsRes.Tags || []) {
        if (t.Key) tags[t.Key] = t.Value || "";
      }
    } catch {
      // Tags might not be supported or empty
    }

    const topic: TopicDetail = {
      arn: topicArn,
      name,
      type: isFifo ? "FIFO" : "Standard",
      displayName: attrs.DisplayName || "",
      owner: attrs.Owner || "",
      policy: attrs.Policy,
      deliveryPolicy: attrs.DeliveryPolicy,
      effectiveDeliveryPolicy: attrs.EffectiveDeliveryPolicy,
      kmsMasterKeyId: attrs.KmsMasterKeyId,
      contentBasedDeduplication: attrs.ContentBasedDeduplication === "true",
      subscriptionsConfirmed: parseInt(attrs.SubscriptionsConfirmed || "0", 10),
      subscriptionsPending: parseInt(attrs.SubscriptionsPending || "0", 10),
      subscriptionsDeleted: parseInt(attrs.SubscriptionsDeleted || "0", 10),
      tags,
    };

    return { success: true, topic };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : `Failed to get topic details for ${topicArn}`,
    };
  }
}

/**
 * Create a new Amazon SNS topic (Standard or FIFO)
 */
export async function createTopicAction(input: {
  name: string;
  type: "Standard" | "FIFO";
  displayName?: string;
  kmsMasterKeyId?: string;
  contentBasedDeduplication?: boolean;
  policy?: string;
  deliveryPolicy?: string;
  tags?: Record<string, string>;
}): Promise<{
  success: boolean;
  topicArn?: string;
  error?: string;
}> {
  try {
    let finalName = input.name.trim();
    if (input.type === "FIFO" && !finalName.endsWith(".fifo")) {
      finalName = `${finalName}.fifo`;
    }

    const attributes: Record<string, string> = {};
    if (input.type === "FIFO") {
      attributes.FifoTopic = "true";
      if (input.contentBasedDeduplication) {
        attributes.ContentBasedDeduplication = "true";
      }
    }

    if (input.displayName && input.displayName.trim()) {
      attributes.DisplayName = input.displayName.trim();
    }

    if (input.kmsMasterKeyId && input.kmsMasterKeyId.trim()) {
      attributes.KmsMasterKeyId = input.kmsMasterKeyId.trim();
    }

    if (input.policy && input.policy.trim()) {
      attributes.Policy = input.policy.trim();
    }

    if (input.deliveryPolicy && input.deliveryPolicy.trim()) {
      attributes.DeliveryPolicy = input.deliveryPolicy.trim();
    }

    const tagsList = input.tags
      ? Object.entries(input.tags).map(([Key, Value]) => ({ Key, Value }))
      : undefined;

    const res = await sns.send(
      new CreateTopicCommand({
        Name: finalName,
        Attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        Tags: tagsList && tagsList.length > 0 ? tagsList : undefined,
      })
    );

    revalidatePath("/sns");
    return { success: true, topicArn: res.TopicArn };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create SNS topic",
    };
  }
}

/**
 * Update topic attributes (DisplayName, Policy, DeliveryPolicy, KMS, etc.)
 */
export async function updateTopicAttributesAction(
  topicArn: string,
  attributes: Record<string, string>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    for (const [key, value] of Object.entries(attributes)) {
      await sns.send(
        new SetTopicAttributesCommand({
          TopicArn: topicArn,
          AttributeName: key,
          AttributeValue: value,
        })
      );
    }

    revalidatePath("/sns");
    revalidatePath(`/sns/topics/${encodeURIComponent(topicArn)}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update topic attributes",
    };
  }
}

/**
 * Delete an SNS topic
 */
export async function deleteTopicAction(topicArn: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sns.send(new DeleteTopicCommand({ TopicArn: topicArn }));
    revalidatePath("/sns");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete SNS topic",
    };
  }
}

/**
 * Publish a message to an SNS topic
 */
export async function publishMessageAction(input: {
  topicArn: string;
  message: string;
  subject?: string;
  messageStructure?: string;
  messageGroupId?: string;
  messageDeduplicationId?: string;
  messageAttributes?: MessageAttribute[];
}): Promise<{
  success: boolean;
  messageId?: string;
  sequenceNumber?: string;
  error?: string;
}> {
  try {
    const attrsMap: Record<string, { DataType: string; StringValue?: string }> = {};
    if (input.messageAttributes) {
      for (const a of input.messageAttributes) {
        if (a.name && a.value) {
          attrsMap[a.name] = {
            DataType: a.type,
            StringValue: a.value,
          };
        }
      }
    }

    const res = await sns.send(
      new PublishCommand({
        TopicArn: input.topicArn,
        Message: input.message,
        Subject: input.subject && input.subject.trim() ? input.subject.trim() : undefined,
        MessageStructure: input.messageStructure,
        MessageGroupId: input.messageGroupId && input.messageGroupId.trim() ? input.messageGroupId.trim() : undefined,
        MessageDeduplicationId:
          input.messageDeduplicationId && input.messageDeduplicationId.trim()
            ? input.messageDeduplicationId.trim()
            : undefined,
        MessageAttributes: Object.keys(attrsMap).length > 0 ? attrsMap : undefined,
      })
    );

    return {
      success: true,
      messageId: res.MessageId,
      sequenceNumber: res.SequenceNumber,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to publish message",
    };
  }
}

/**
 * List all subscriptions across the AWS account
 */
export async function listSubscriptionsAction(): Promise<{
  success: boolean;
  subscriptions: SubscriptionSummary[];
  error?: string;
}> {
  try {
    const res = await sns.send(new ListSubscriptionsCommand({}));
    const rawSubs = res.Subscriptions || [];

    const subscriptions: SubscriptionSummary[] = rawSubs.map((s) => {
      const arn = s.SubscriptionArn || "";
      const isPending = arn === "PendingConfirmation";
      return {
        arn,
        protocol: s.Protocol || "",
        endpoint: s.Endpoint || "",
        topicArn: s.TopicArn || "",
        topicName: (s.TopicArn || "").split(":").pop() || "",
        status: isPending ? "PendingConfirmation" : "Confirmed",
        owner: s.Owner || "",
      };
    });

    return { success: true, subscriptions };
  } catch (err: unknown) {
    return {
      success: false,
      subscriptions: [],
      error: err instanceof Error ? err.message : "Failed to list subscriptions",
    };
  }
}

/**
 * List subscriptions for a specific topic
 */
export async function listSubscriptionsByTopicAction(topicArn: string): Promise<{
  success: boolean;
  subscriptions: SubscriptionSummary[];
  error?: string;
}> {
  try {
    const res = await sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
    const rawSubs = res.Subscriptions || [];

    const subscriptions: SubscriptionSummary[] = rawSubs.map((s) => {
      const arn = s.SubscriptionArn || "";
      const isPending = arn === "PendingConfirmation";
      return {
        arn,
        protocol: s.Protocol || "",
        endpoint: s.Endpoint || "",
        topicArn: s.TopicArn || topicArn,
        topicName: topicArn.split(":").pop() || "",
        status: isPending ? "PendingConfirmation" : "Confirmed",
        owner: s.Owner || "",
      };
    });

    return { success: true, subscriptions };
  } catch (err: unknown) {
    return {
      success: false,
      subscriptions: [],
      error: err instanceof Error ? err.message : "Failed to list topic subscriptions",
    };
  }
}

/**
 * Get detailed subscription configuration
 */
export async function getSubscriptionDetailsAction(subscriptionArn: string): Promise<{
  success: boolean;
  subscription?: SubscriptionDetail;
  error?: string;
}> {
  try {
    if (subscriptionArn === "PendingConfirmation") {
      return {
        success: false,
        error: "Subscription is pending confirmation and attributes cannot be queried yet.",
      };
    }

    const res = await sns.send(
      new GetSubscriptionAttributesCommand({ SubscriptionArn: subscriptionArn })
    );
    const attrs = res.Attributes || {};

    let redrivePolicy: { deadLetterTargetArn?: string } | undefined = undefined;
    if (attrs.RedrivePolicy) {
      try {
        redrivePolicy = JSON.parse(attrs.RedrivePolicy);
      } catch {
        // Ignore json parse error
      }
    }

    const subscription: SubscriptionDetail = {
      arn: subscriptionArn,
      protocol: attrs.Protocol || "",
      endpoint: attrs.Endpoint || "",
      topicArn: attrs.TopicArn || "",
      owner: attrs.Owner || "",
      status: attrs.PendingConfirmation === "true" ? "PendingConfirmation" : "Confirmed",
      rawMessageDelivery: attrs.RawMessageDelivery === "true",
      filterPolicy: attrs.FilterPolicy,
      filterPolicyScope: attrs.FilterPolicyScope as "MessageAttributes" | "MessageBody" | undefined,
      redrivePolicy,
      confirmationWasAuthenticated: attrs.ConfirmationWasAuthenticated === "true",
      subscriptionPrincipal: attrs.SubscriptionPrincipal,
    };

    return { success: true, subscription };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : `Failed to get subscription details for ${subscriptionArn}`,
    };
  }
}

/**
 * Create a new subscription to an SNS topic
 */
export async function createSubscriptionAction(input: {
  topicArn: string;
  protocol: string;
  endpoint: string;
  rawMessageDelivery?: boolean;
  filterPolicy?: string;
  filterPolicyScope?: "MessageAttributes" | "MessageBody";
  deadLetterTargetArn?: string;
}): Promise<{
  success: boolean;
  subscriptionArn?: string;
  error?: string;
}> {
  try {
    const attributes: Record<string, string> = {};

    if (input.rawMessageDelivery !== undefined) {
      attributes.RawMessageDelivery = input.rawMessageDelivery ? "true" : "false";
    }

    if (input.filterPolicy && input.filterPolicy.trim()) {
      attributes.FilterPolicy = input.filterPolicy.trim();
    }

    if (input.filterPolicyScope) {
      attributes.FilterPolicyScope = input.filterPolicyScope;
    }

    if (input.deadLetterTargetArn && input.deadLetterTargetArn.trim()) {
      attributes.RedrivePolicy = JSON.stringify({
        deadLetterTargetArn: input.deadLetterTargetArn.trim(),
      });
    }

    const res = await sns.send(
      new SubscribeCommand({
        TopicArn: input.topicArn,
        Protocol: input.protocol,
        Endpoint: input.endpoint,
        Attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        ReturnSubscriptionArn: true,
      })
    );

    revalidatePath("/sns/subscriptions");
    revalidatePath(`/sns/topics/${encodeURIComponent(input.topicArn)}`);
    return { success: true, subscriptionArn: res.SubscriptionArn };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create subscription",
    };
  }
}

/**
 * Set an attribute on an existing subscription
 */
export async function setSubscriptionAttributesAction(
  subscriptionArn: string,
  attributeName: string,
  attributeValue: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sns.send(
      new SetSubscriptionAttributesCommand({
        SubscriptionArn: subscriptionArn,
        AttributeName: attributeName,
        AttributeValue: attributeValue,
      })
    );

    revalidatePath("/sns/subscriptions");
    revalidatePath(`/sns/subscriptions/${encodeURIComponent(subscriptionArn)}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update subscription attribute",
    };
  }
}

/**
 * Delete a subscription (Unsubscribe)
 */
export async function unsubscribeAction(subscriptionArn: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sns.send(new UnsubscribeCommand({ SubscriptionArn: subscriptionArn }));
    revalidatePath("/sns/subscriptions");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to unsubscribe",
    };
  }
}

/**
 * Add or update tags on an SNS topic
 */
export async function tagTopicAction(
  topicArn: string,
  tags: Record<string, string>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tagsList = Object.entries(tags).map(([Key, Value]) => ({ Key, Value }));
    await sns.send(
      new TagResourceCommand({
        ResourceArn: topicArn,
        Tags: tagsList,
      })
    );

    revalidatePath(`/sns/topics/${encodeURIComponent(topicArn)}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to tag topic",
    };
  }
}

/**
 * Remove tags from an SNS topic
 */
export async function untagTopicAction(
  topicArn: string,
  tagKeys: string[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sns.send(
      new UntagResourceCommand({
        ResourceArn: topicArn,
        TagKeys: tagKeys,
      })
    );

    revalidatePath(`/sns/topics/${encodeURIComponent(topicArn)}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove tags from topic",
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
 * Fetch SQS queues for subscription endpoint dropdown
 */
export async function getSqsQueuesAction(): Promise<SqsQueueOption[]> {
  try {
    const res = await sqs.send(new ListQueuesCommand({}));
    const urls = res.QueueUrls || [];

    const queues: SqsQueueOption[] = await Promise.all(
      urls.map(async (url) => {
        const name = url.split("/").pop() || "";
        const isFifo = name.endsWith(".fifo");
        let arn = `arn:aws:sqs:us-east-1:000000000000:${name}`;

        try {
          const attrRes = await sqs.send(
            new GetQueueAttributesCommand({
              QueueUrl: url,
              AttributeNames: ["QueueArn"],
            })
          );
          if (attrRes.Attributes?.QueueArn) {
            arn = attrRes.Attributes.QueueArn;
          }
        } catch {
          // fallback
        }

        return { name, url, arn, isFifo };
      })
    );

    return queues;
  } catch {
    return [];
  }
}

/**
 * Fetch Lambda functions for subscription endpoint dropdown
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
