import { listDatabasesAction } from "../actions";
import DatabasesClient from "./DatabasesClient";

export const dynamic = "force-dynamic";

export default async function TimestreamDatabasesPage() {
  const data = await listDatabasesAction();

  return (
    <DatabasesClient
      initialDatabases={data.databases}
      totalTables={data.totalTables}
      defaultKmsCount={data.defaultKmsCount}
      customerKmsCount={data.customerKmsCount}
      error={data.error}
    />
  );
}
