/**
 * DynamoDB Tables list page – Server component listing all tables.
 * Fetches metadata using DescribeTable for each table.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { dynamodb } from "@/lib/aws";
import { ListTablesCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { TableActions, TableSummary } from "./TableActions";

const dynamoNav = [
  { label: "Tables", href: "/dynamodb" },
];

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

export default async function DynamoDBPage() {
  let tables: TableSummary[] = [];
  let error: string | null = null;

  try {
    const listRes = await dynamodb.send(new ListTablesCommand({}));
    const tableNames = listRes.TableNames ?? [];

    tables = await Promise.all(
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

          return {
            name,
            status: t?.TableStatus ?? "ACTIVE",
            partitionKey: partitionKeyDef?.AttributeName ?? "id",
            partitionKeyType: formatAttributeType(pAttr?.AttributeType),
            sortKey: sortKeyDef?.AttributeName,
            sortKeyType: sAttr ? formatAttributeType(sAttr.AttributeType) : undefined,
            itemCount: t?.ItemCount ?? 0,
            sizeBytes: t?.TableSizeBytes ?? 0,
            creationDateTime: t?.CreationDateTime
              ? new Date(t.CreationDateTime).toLocaleString()
              : undefined,
          };
        } catch {
          return {
            name,
            status: "UNKNOWN",
            partitionKey: "id",
            partitionKeyType: "String",
            itemCount: 0,
            sizeBytes: 0,
          };
        }
      })
    );
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="DynamoDB" serviceColor="#3B82F6" navItems={dynamoNav}>
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f] mb-1">Tables</h1>
        <p className="text-[13px] text-[#545b64] mb-4">
          Amazon DynamoDB is a fully managed NoSQL database service that provides fast and
          predictable performance with seamless scalability.
        </p>

        {error ? (
          <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
            Error: {error}
          </div>
        ) : (
          <TableActions tables={tables} />
        )}
      </div>
    </ServiceLayout>
  );
}
