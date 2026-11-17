/**
 * DynamoDB server actions – create/delete tables, put/delete/scan items.
 */

"use server";

import { dynamodb } from "@/lib/aws";
import {
  CreateTableCommand,
  DeleteTableCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
  ScalarAttributeType,
  KeyType,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { marshalAttribute, unmarshalAttribute } from "./dynamo-utils";
import { getActiveIdentity } from "@/lib/identity";
import { assertPermission } from "@/lib/permissions";

// Create a new DynamoDB table
export async function createTable(formData: FormData) {
  const tableName = (formData.get("tableName") as string)?.trim();
  const partitionKeyName = (formData.get("partitionKeyName") as string)?.trim();
  const partitionKeyType = (formData.get("partitionKeyType") as string) || "S";
  const hasSortKey = formData.get("hasSortKey") === "true";
  const sortKeyName = (formData.get("sortKeyName") as string)?.trim();
  const sortKeyType = (formData.get("sortKeyType") as string) || "S";
  const billingMode = (formData.get("billingMode") as string) || "PAY_PER_REQUEST";

  if (!tableName) {
    return { error: "Table name is required." };
  }
  if (!partitionKeyName) {
    return { error: "Partition key name is required." };
  }
  if (hasSortKey && !sortKeyName) {
    return { error: "Sort key name is required when sort key is enabled." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "dynamodb:CreateTable",
      `arn:aws:dynamodb:us-east-1:000000000000:table/${tableName}`
    );

    const attributeDefinitions = [
      {
        AttributeName: partitionKeyName,
        AttributeType: partitionKeyType as ScalarAttributeType,
      },
    ];

    const keySchema = [
      {
        AttributeName: partitionKeyName,
        KeyType: "HASH" as KeyType,
      },
    ];

    if (hasSortKey && sortKeyName) {
      attributeDefinitions.push({
        AttributeName: sortKeyName,
        AttributeType: sortKeyType as ScalarAttributeType,
      });
      keySchema.push({
        AttributeName: sortKeyName,
        KeyType: "RANGE" as KeyType,
      });
    }

    await dynamodb.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        BillingMode: billingMode as "PAY_PER_REQUEST" | "PROVISIONED",
        ...(billingMode === "PROVISIONED"
          ? {
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            }
          : {}),
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/dynamodb");
  redirect("/dynamodb");
}

// Delete a DynamoDB table
export async function deleteTable(tableName: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "dynamodb:DeleteTable",
      `arn:aws:dynamodb:us-east-1:000000000000:table/${tableName}`
    );

    await dynamodb.send(new DeleteTableCommand({ TableName: tableName }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
  revalidatePath("/dynamodb");
  return { success: true };
}

// Put an item into a table (support key-value attributes list or JSON)
export async function putItem(
  tableName: string,
  attributes: { name: string; type: string; value: string }[]
) {
  if (!attributes || attributes.length === 0) {
    return { error: "Item attributes cannot be empty." };
  }

  const item: Record<string, AttributeValue> = {};
  for (const attr of attributes) {
    const name = attr.name.trim();
    if (!name) continue;
    item[name] = marshalAttribute(attr.type, attr.value);
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "dynamodb:PutItem",
      `arn:aws:dynamodb:us-east-1:000000000000:table/${tableName}`
    );

    await dynamodb.send(
      new PutItemCommand({
        TableName: tableName,
        Item: item,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/dynamodb/${encodeURIComponent(tableName)}`);
  return { success: true };
}

// Delete an item from a table given primary key values
export async function deleteItem(
  tableName: string,
  keys: { name: string; type: string; value: string }[]
) {
  const key: Record<string, AttributeValue> = {};
  for (const k of keys) {
    key[k.name] = marshalAttribute(k.type, k.value);
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "dynamodb:DeleteItem",
      `arn:aws:dynamodb:us-east-1:000000000000:table/${tableName}`
    );

    await dynamodb.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: key,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/dynamodb/${encodeURIComponent(tableName)}`);
  return { success: true };
}

// Scan a table and return all items
export async function scanTable(tableName: string) {
  try {
    const res = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    const rawItems = res.Items ?? [];

    const items = rawItems.map((raw) => {
      const parsed: Record<string, { value: any; type: string }> = {};
      for (const [k, v] of Object.entries(raw)) {
        parsed[k] = unmarshalAttribute(v);
      }
      return parsed;
    });

    return { items, count: res.Count ?? 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg, items: [], count: 0 };
  }
}
