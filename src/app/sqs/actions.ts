/**
 * SQS server actions – create/delete queues, send/receive/delete messages.
 */

"use server";

import { sqs } from "@/lib/aws";
import {
  CreateQueueCommand,
  DeleteQueueCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
  PurgeQueueCommand,
} from "@aws-sdk/client-sqs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Create a new SQS queue
export async function createQueue(formData: FormData) {
  const name = formData.get("queueName") as string;
  const fifo = formData.get("fifo") === "true";

  if (!name || name.trim().length === 0) {
    return { error: "Queue name is required." };
  }

  const queueName = fifo ? name.trim() + ".fifo" : name.trim();

  try {
    const attrs: Record<string, string> = {};
    if (fifo) attrs["FifoQueue"] = "true";

    await sqs.send(new CreateQueueCommand({
      QueueName: queueName,
      Attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/sqs");
  redirect("/sqs");
}

// Delete a queue
export async function deleteQueue(queueUrl: string) {
  try {
    await sqs.send(new DeleteQueueCommand({ QueueUrl: queueUrl }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath("/sqs");
}

// Purge a queue (delete all messages)
export async function purgeQueue(queueUrl: string) {
  try {
    await sqs.send(new PurgeQueueCommand({ QueueUrl: queueUrl }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath("/sqs");
}

// Send a message to a queue
export async function sendMessage(formData: FormData) {
  const queueUrl = formData.get("queueUrl") as string;
  const body = formData.get("messageBody") as string;

  if (!body || body.trim().length === 0) {
    return { error: "Message body is required." };
  }

  try {
    const result = await sqs.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: body,
    }));
    return { success: true, messageId: result.MessageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// Receive messages from a queue (poll)
export async function receiveMessages(queueUrl: string) {
  try {
    const result = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1,
      AttributeNames: ["All"],
    }));
    return {
      messages: (result.Messages ?? []).map((m) => ({
        messageId: m.MessageId ?? "",
        body: m.Body ?? "",
        receiptHandle: m.ReceiptHandle ?? "",
        sentTimestamp: m.Attributes?.SentTimestamp
          ? new Date(parseInt(m.Attributes.SentTimestamp)).toLocaleString()
          : "—",
      })),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg, messages: [] };
  }
}

// Delete a single message
export async function deleteMessage(queueUrl: string, receiptHandle: string) {
  try {
    await sqs.send(new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

// Get queue attributes
export async function getQueueAttributes(queueUrl: string) {
  try {
    const result = await sqs.send(new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["All"],
    }));
    return { attributes: result.Attributes ?? {} };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg, attributes: {} };
  }
}
