import { listTablesAction } from "./actions";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DynamoDBPage() {
  const { tables, totalItemCount, totalSizeBytes, error } = await listTablesAction();

  return (
    <DashboardClient
      tables={tables}
      totalItemCount={totalItemCount}
      totalSizeBytes={totalSizeBytes}
      error={error}
    />
  );
}
