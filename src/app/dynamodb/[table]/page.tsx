/**
 * DynamoDB Table Explorer page – Server component.
 * Fetches table metadata and items, passes to TableDetail component.
 */

import ServiceLayout from "@/components/ServiceLayout";
import { dynamodb } from "@/lib/aws";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { scanTable } from "../actions";
import { TableDetail, TableMeta, KeySchemaEntry } from "./TableDetail";

const dynamoNav = [
  { label: "Tables", href: "/dynamodb" },
];

interface PageProps {
  params: Promise<{ table: string }>;
}

export default async function TablePage({ params }: PageProps) {
  const resolvedParams = await params;
  const tableName = decodeURIComponent(resolvedParams.table);

  let tableMeta: TableMeta | null = null;
  let items: any[] = [];
  let error: string | null = null;

  try {
    const descRes = await dynamodb.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    const t = descRes.Table;

    if (!t) {
      error = `Table "${tableName}" not found.`;
    } else {
      const keySchema: KeySchemaEntry[] = (t.KeySchema ?? []).map((k) => {
        const attrDef = t.AttributeDefinitions?.find(
          (a) => a.AttributeName === k.AttributeName
        );
        return {
          AttributeName: k.AttributeName ?? "",
          KeyType: (k.KeyType as "HASH" | "RANGE") ?? "HASH",
          AttributeType: attrDef?.AttributeType ?? "S",
        };
      });

      tableMeta = {
        name: tableName,
        arn: t.TableArn ?? `arn:aws:dynamodb:us-east-1:000000000000:table/${tableName}`,
        status: t.TableStatus ?? "ACTIVE",
        billingMode: t.BillingModeSummary?.BillingMode ?? "PAY_PER_REQUEST",
        itemCount: t.ItemCount ?? 0,
        sizeBytes: t.TableSizeBytes ?? 0,
        creationDateTime: t.CreationDateTime
          ? new Date(t.CreationDateTime).toLocaleString()
          : "—",
        keySchema,
      };

      const scanRes = await scanTable(tableName);
      if (scanRes.error) {
        error = scanRes.error;
      } else {
        items = scanRes.items;
      }
    }
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <ServiceLayout serviceName="DynamoDB" serviceColor="#3B82F6" navItems={dynamoNav}>
      {error ? (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          Error: {error}
        </div>
      ) : tableMeta ? (
        <TableDetail tableMeta={tableMeta} initialItems={items} />
      ) : (
        <div className="text-[13px] text-[#545b64]">Table not found.</div>
      )}
    </ServiceLayout>
  );
}
