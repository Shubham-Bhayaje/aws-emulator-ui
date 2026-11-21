import { listTablesAction } from "../actions";
import TablesClient from "./TablesClient";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const { tables, totalItemCount, totalSizeBytes, error } = await listTablesAction();

  return (
    <TablesClient
      tables={tables}
      totalItemCount={totalItemCount}
      totalSizeBytes={totalSizeBytes}
      error={error}
    />
  );
}
